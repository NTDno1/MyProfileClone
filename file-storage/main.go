package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"runtime/debug"
	"sort"
	"strings"
	"time"
)

var (
	storageDir = getEnv("STORAGE_DIR", "/storage")
	apiKey     = getEnv("STORAGE_API_KEY", "myprofile_storage_2026_key")
	port       = getEnv("PORT", "3010")
	startedAt  = time.Now()
	safeCharRe = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)
)

type UploadJSONRequest struct {
	Project            string `json:"project"`
	Folder             string `json:"folder"`
	Filename           string `json:"filename"`
	DataURL            string `json:"dataUrl"`
	Base64             string `json:"base64"`
	OverwriteExactName bool   `json:"overwriteExactName"`
	SkipIfExists       bool   `json:"skipIfExists"`
}

type FileItem struct {
	Project   string `json:"project"`
	Name      string `json:"name"`
	RelPath   string `json:"relPath"`
	URL       string `json:"url"`
	SizeBytes int64  `json:"sizeBytes"`
	UpdatedAt string `json:"updatedAt"`
}

type ProjectStat struct {
	Files int     `json:"files"`
	Bytes int64   `json:"bytes"`
	MB    float64 `json:"mb"`
}

func getEnv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func registerMimeTypes() {
	_ = mime.AddExtensionType(".svg", "image/svg+xml")
	_ = mime.AddExtensionType(".webp", "image/webp")
	_ = mime.AddExtensionType(".avif", "image/avif")
	_ = mime.AddExtensionType(".jpg", "image/jpeg")
	_ = mime.AddExtensionType(".jpeg", "image/jpeg")
	_ = mime.AddExtensionType(".png", "image/png")
	_ = mime.AddExtensionType(".gif", "image/gif")
	_ = mime.AddExtensionType(".pdf", "application/pdf")
	_ = mime.AddExtensionType(".woff2", "font/woff2")
	_ = mime.AddExtensionType(".woff", "font/woff")
}

func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Storage-Key")
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func checkAuth(r *http.Request) bool {
	key := strings.TrimSpace(r.Header.Get("X-Storage-Key"))
	if key == "" {
		auth := strings.TrimSpace(r.Header.Get("Authorization"))
		if strings.HasPrefix(auth, "Bearer ") {
			key = strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
		}
	}
	return key != "" && key == apiKey
}

func sanitizeSegment(seg string) string {
	seg = strings.TrimSpace(seg)
	seg = safeCharRe.ReplaceAllString(seg, "_")
	seg = strings.Trim(seg, " .")
	if seg == "" || seg == "." || seg == ".." {
		return ""
	}
	return seg
}

func sanitizeSubPath(raw string) string {
	raw = strings.ReplaceAll(raw, "\\", "/")
	parts := strings.Split(raw, "/")
	var clean []string
	for _, p := range parts {
		s := sanitizeSegment(p)
		if s != "" {
			clean = append(clean, s)
		}
	}
	return strings.Join(clean, "/")
}

func resolveSafePath(rel string) (string, string, error) {
	cleanRel := sanitizeSubPath(rel)
	if cleanRel == "" {
		return "", "", fmt.Errorf("invalid file path")
	}
	absBase, err := filepath.Abs(storageDir)
	if err != nil {
		return "", "", err
	}
	full := filepath.Join(absBase, filepath.FromSlash(cleanRel))
	absFull, err := filepath.Abs(full)
	if err != nil {
		return "", "", err
	}
	if !strings.HasPrefix(absFull, absBase+string(filepath.Separator)) {
		return "", "", fmt.Errorf("path traversal blocked")
	}
	return absFull, cleanRel, nil
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	projects := map[string]*ProjectStat{
		"pofology": {},
		"bio-link": {},
	}
	var totalBytes int64
	var totalFiles int

	_ = filepath.Walk(storageDir, func(p string, info os.FileInfo, err error) error {
		if err != nil || info == nil || info.IsDir() {
			return nil
		}
		rel, relErr := filepath.Rel(storageDir, p)
		if relErr != nil {
			return nil
		}
		relSlash := filepath.ToSlash(rel)
		top := strings.SplitN(relSlash, "/", 2)[0]
		if _, ok := projects[top]; !ok {
			projects[top] = &ProjectStat{}
		}
		projects[top].Files++
		projects[top].Bytes += info.Size()
		totalFiles++
		totalBytes += info.Size()
		return nil
	})

	for _, st := range projects {
		st.MB = float64(int64((float64(st.Bytes)/(1024*1024))*100+0.5)) / 100
	}

	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":           true,
		"service":      "file-storage-alpine-go",
		"uptimeSec":    int64(time.Since(startedAt).Seconds()),
		"ramAllocMB":   float64(int64((float64(mem.Alloc)/(1024*1024))*100+0.5)) / 100,
		"ramSysMB":     float64(int64((float64(mem.Sys)/(1024*1024))*100+0.5)) / 100,
		"totalFiles":   totalFiles,
		"totalBytes":   totalBytes,
		"totalMB":      float64(int64((float64(totalBytes)/(1024*1024))*100+0.5)) / 100,
		"projects":     projects,
	})
}

func handleList(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if !checkAuth(r) {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"success": false, "message": "Unauthorized storage key"})
		return
	}

	filterProject := sanitizeSegment(r.URL.Query().Get("project"))
	walkRoot := storageDir
	if filterProject != "" && filterProject != "all" {
		walkRoot = filepath.Join(storageDir, filterProject)
	}

	items := make([]FileItem, 0, 64)
	_ = filepath.Walk(walkRoot, func(p string, info os.FileInfo, err error) error {
		if err != nil || info == nil || info.IsDir() {
			return nil
		}
		rel, relErr := filepath.Rel(storageDir, p)
		if relErr != nil {
			return nil
		}
		relSlash := filepath.ToSlash(rel)
		parts := strings.SplitN(relSlash, "/", 2)
		proj := parts[0]
		items = append(items, FileItem{
			Project:   proj,
			Name:      info.Name(),
			RelPath:   relSlash,
			URL:       "/media/" + relSlash,
			SizeBytes: info.Size(),
			UpdatedAt: info.ModTime().UTC().Format(time.RFC3339),
		})
		return nil
	})

	sort.Slice(items, func(i, j int) bool {
		return items[i].UpdatedAt > items[j].UpdatedAt
	})

	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"count":   len(items),
		"files":   items,
	})
}

func decodeDataURLOrBase64(dataURL, rawB64 string) ([]byte, string, error) {
	if strings.HasPrefix(dataURL, "data:") {
		commaIdx := strings.IndexByte(dataURL, ',')
		if commaIdx < 0 {
			return nil, "", fmt.Errorf("invalid dataUrl")
		}
		meta := dataURL[5:commaIdx]
		b64Part := dataURL[commaIdx+1:]
		mimePart := strings.Split(meta, ";")[0]
		ext := ""
		switch strings.ToLower(mimePart) {
		case "image/jpeg", "image/jpg":
			ext = "jpg"
		case "image/png":
			ext = "png"
		case "image/webp":
			ext = "webp"
		case "image/gif":
			ext = "gif"
		case "image/svg+xml":
			ext = "svg"
		case "image/avif":
			ext = "avif"
		case "application/pdf":
			ext = "pdf"
		}
		decoded, err := base64.StdEncoding.DecodeString(strings.TrimSpace(b64Part))
		return decoded, ext, err
	}
	if rawB64 != "" {
		decoded, err := base64.StdEncoding.DecodeString(strings.TrimSpace(rawB64))
		return decoded, "", err
	}
	return nil, "", fmt.Errorf("empty file data")
}

func buildFinalRelPath(project, folder, filename, detectedExt string, overwriteExact bool) (string, string) {
	proj := sanitizeSegment(project)
	if proj == "" {
		proj = "shared"
	}
	cleanFolder := sanitizeSubPath(folder)
	rawBase := filepath.Base(strings.ReplaceAll(filename, "\\", "/"))
	ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(rawBase)), ".")
	nameOnly := strings.TrimSuffix(rawBase, filepath.Ext(rawBase))
	nameOnly = sanitizeSegment(nameOnly)
	if nameOnly == "" {
		nameOnly = "file"
	}
	if ext == "jpeg" {
		ext = "jpg"
	}
	if ext == "" && detectedExt != "" {
		ext = detectedExt
	}
	if ext == "" {
		ext = "bin"
	}

	var finalFilename string
	if overwriteExact {
		finalFilename = fmt.Sprintf("%s.%s", nameOnly, ext)
	} else {
		if len(nameOnly) > 36 {
			nameOnly = nameOnly[:36]
		}
		finalFilename = fmt.Sprintf("%s_%d.%s", nameOnly, time.Now().UnixMilli(), ext)
	}

	if cleanFolder != "" {
		return fmt.Sprintf("%s/%s/%s", proj, cleanFolder, finalFilename), finalFilename
	}
	return fmt.Sprintf("%s/%s", proj, finalFilename), finalFilename
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "message": "Method not allowed"})
		return
	}
	if !checkAuth(r) {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"success": false, "message": "Unauthorized storage key"})
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 35<<20) // Max 35MB
	ct := strings.ToLower(r.Header.Get("Content-Type"))

	if strings.HasPrefix(ct, "multipart/form-data") {
		if err := r.ParseMultipartForm(8 << 20); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Invalid multipart form: " + err.Error()})
			return
		}
		defer func() {
			if r.MultipartForm != nil {
				_ = r.MultipartForm.RemoveAll()
			}
		}()

		file, header, err := r.FormFile("file")
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Missing file field"})
			return
		}
		defer file.Close()

		project := r.FormValue("project")
		folder := r.FormValue("folder")
		customName := r.FormValue("filename")
		if customName == "" {
			customName = header.Filename
		}
		overwrite := r.FormValue("overwriteExactName") == "true" || r.FormValue("overwriteExactName") == "1"
		skipIfExists := r.FormValue("skipIfExists") == "true" || r.FormValue("skipIfExists") == "1"

		relCandidate, finalName := buildFinalRelPath(project, folder, customName, "", overwrite)
		absDest, cleanRel, err := resolveSafePath(relCandidate)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": err.Error()})
			return
		}

		if skipIfExists {
			if st, statErr := os.Stat(absDest); statErr == nil && !st.IsDir() {
				writeJSON(w, http.StatusOK, map[string]any{
					"success":  true,
					"skipped":  true,
					"filename": finalName,
					"relPath":  cleanRel,
					"url":      "/media/" + cleanRel,
					"size":     st.Size(),
				})
				return
			}
		}

		if err := os.MkdirAll(filepath.Dir(absDest), 0755); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": err.Error()})
			return
		}

		out, err := os.Create(absDest)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": err.Error()})
			return
		}
		written, copyErr := io.Copy(out, file)
		_ = out.Close()
		if copyErr != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": copyErr.Error()})
			return
		}

		debug.FreeOSMemory()
		writeJSON(w, http.StatusOK, map[string]any{
			"success":  true,
			"filename": finalName,
			"relPath":  cleanRel,
			"url":      "/media/" + cleanRel,
			"size":     written,
		})
		return
	}

	// JSON Base64 / DataURL upload
	var req UploadJSONRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": "Invalid JSON payload: " + err.Error()})
		return
	}

	data, detectedExt, err := decodeDataURLOrBase64(req.DataURL, req.Base64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": err.Error()})
		return
	}

	relCandidate, finalName := buildFinalRelPath(req.Project, req.Folder, req.Filename, detectedExt, req.OverwriteExactName)
	absDest, cleanRel, err := resolveSafePath(relCandidate)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "message": err.Error()})
		return
	}

	if req.SkipIfExists {
		if st, statErr := os.Stat(absDest); statErr == nil && !st.IsDir() {
			writeJSON(w, http.StatusOK, map[string]any{
				"success":  true,
				"skipped":  true,
				"filename": finalName,
				"relPath":  cleanRel,
				"url":      "/media/" + cleanRel,
				"size":     st.Size(),
			})
			return
		}
	}

	if err := os.MkdirAll(filepath.Dir(absDest), 0755); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": err.Error()})
		return
	}

	if err := os.WriteFile(absDest, data, 0644); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": err.Error()})
		return
	}

	size := len(data)
	data = nil
	debug.FreeOSMemory()

	writeJSON(w, http.StatusOK, map[string]any{
		"success":  true,
		"filename": finalName,
		"relPath":  cleanRel,
		"url":      "/media/" + cleanRel,
		"size":     size,
	})
}

func handleFiles(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	rel := strings.TrimPrefix(r.URL.Path, "/files/")
	absPath, cleanRel, err := resolveSafePath(rel)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	if r.Method == http.MethodDelete {
		if !checkAuth(r) {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"success": false, "message": "Unauthorized storage key"})
			return
		}
		if err := os.Remove(absPath); err != nil {
			if os.IsNotExist(err) {
				writeJSON(w, http.StatusNotFound, map[string]any{"success": false, "message": "File not found"})
				return
			}
			writeJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "message": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "deleted": cleanRel})
		return
	}

	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	f, err := os.Open(absPath)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil || stat.IsDir() {
		http.NotFound(w, r)
		return
	}

	etag := fmt.Sprintf(`"%x-%x"`, stat.ModTime().Unix(), stat.Size())
	w.Header().Set("ETag", etag)
	w.Header().Set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")

	if r.URL.Query().Get("download") == "1" {
		dlName := r.URL.Query().Get("filename")
		if dlName == "" {
			dlName = stat.Name()
		} else {
			dlName = sanitizeSegment(dlName)
		}
		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, dlName))
	}

	// Detect Content-Type explicitly for SVG / PDF / common images
	ext := strings.ToLower(filepath.Ext(stat.Name()))
	if ctype := mime.TypeByExtension(ext); ctype != "" {
		w.Header().Set("Content-Type", ctype)
	} else {
		buf := make([]byte, 512)
		n, _ := f.Read(buf)
		w.Header().Set("Content-Type", http.DetectContentType(bytes.TrimRight(buf[:n], "\x00")))
		_, _ = f.Seek(0, io.SeekStart)
	}

	http.ServeContent(w, r, stat.Name(), stat.ModTime(), f)
}

func main() {
	// Tune Go GC aggressively for 1GB RAM VPS (~6-10MB footprint)
	debug.SetGCPercent(30)
	debug.SetMemoryLimit(48 << 20) // Soft cap 48 MiB

	registerMimeTypes()
	_ = os.MkdirAll(filepath.Join(storageDir, "pofology"), 0755)
	_ = os.MkdirAll(filepath.Join(storageDir, "bio-link"), 0755)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/list", handleList)
	mux.HandleFunc("/upload", handleUpload)
	mux.HandleFunc("/files/", handleFiles)

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("📦 Ultra-Light File Storage Server listening on :%s (dir: %s)", port, storageDir)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
