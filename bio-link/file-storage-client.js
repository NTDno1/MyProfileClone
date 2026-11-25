const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const STORAGE_API_KEY = process.env.STORAGE_API_KEY || 'myprofile_storage_2026_key';
const CANDIDATE_URLS = [
  process.env.FILE_SERVER_URL,
  'http://file-storage:3010',
  'http://127.0.0.1:3010',
  'http://host.docker.internal:3010'
].filter(Boolean);

let resolvedServerUrl = process.env.FILE_SERVER_URL || '';
let lastProbeAt = 0;

async function getFileServerUrl() {
  if (resolvedServerUrl && Date.now() - lastProbeAt < 30000) {
    return resolvedServerUrl;
  }
  for (const base of CANDIDATE_URLS) {
    const clean = String(base).replace(/\/$/, '');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch(`${clean}/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        resolvedServerUrl = clean;
        lastProbeAt = Date.now();
        return clean;
      }
    } catch {}
  }
  return (process.env.FILE_SERVER_URL || 'http://127.0.0.1:3010').replace(/\/$/, '');
}

async function uploadToFileStorage({
  project = 'bio-link',
  folder = '',
  filename = 'image.jpg',
  dataUrl = '',
  base64 = '',
  overwriteExactName = false,
  skipIfExists = false
}) {
  const serverUrl = await getFileServerUrl();
  const res = await fetch(`${serverUrl}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Storage-Key': STORAGE_API_KEY
    },
    body: JSON.stringify({
      project,
      folder,
      filename,
      dataUrl,
      base64,
      overwriteExactName,
      skipIfExists
    })
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.message || `File storage error (${res.status})`);
  }
  return json;
}

async function listProjectFiles(project = 'bio-link') {
  const serverUrl = await getFileServerUrl();
  const res = await fetch(`${serverUrl}/list?project=${encodeURIComponent(project)}`, {
    headers: { 'X-Storage-Key': STORAGE_API_KEY }
  });
  return res.json();
}

async function deleteProjectFile(relPath) {
  const serverUrl = await getFileServerUrl();
  const clean = String(relPath || '').replace(/^\/?(media\/|files\/)?/, '');
  const res = await fetch(`${serverUrl}/files/${clean}`, {
    method: 'DELETE',
    headers: { 'X-Storage-Key': STORAGE_API_KEY }
  });
  return res.json();
}

// Đệ quy chuyển đổi toàn bộ link cũ (/uploads/xxx -> /media/bio-link/xxx) trong Config, Sản phẩm & Đơn hàng
function rewriteLegacyBioUrls(input) {
  let changed = false;

  function transform(val) {
    if (typeof val === 'string') {
      let out = val;
      if (out.startsWith('/uploads/')) {
        out = '/media/bio-link/' + out.slice('/uploads/'.length);
      } else if (out.includes('/uploads/girlfriend-')) {
        out = out.replace('/uploads/', '/media/bio-link/');
      } else if (/^https?:\/\/[^/]+\/uploads\//i.test(out)) {
        out = out.replace(/\/uploads\//i, '/media/bio-link/');
      } else if (out === '/images/cute-qr-placeholder.svg') {
        out = '/media/bio-link/cute-qr-placeholder.svg';
      }
      if (out !== val) changed = true;
      return out;
    }
    if (Array.isArray(val)) {
      return val.map(transform);
    }
    if (val && typeof val === 'object' && !(val instanceof Date)) {
      const next = {};
      for (const [k, v] of Object.entries(val)) {
        next[k] = transform(v);
      }
      return next;
    }
    return val;
  }

  const data = transform(input);
  return { data, changed };
}

// Tự động clone toàn bộ file cũ đang nằm ở bio-link/uploads và public/images sang container file-storage
async function cloneExistingBioFilesToContainer({ uploadsDir, publicImagesDir }) {
  const dirsToScan = [uploadsDir, publicImagesDir].filter((d) => d && fs.existsSync(d));
  let syncedCount = 0;

  for (const dir of dirsToScan) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {}

    for (const ent of entries) {
      if (!ent.isFile()) continue;
      const ext = path.extname(ent.name).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.pdf'].includes(ext)) continue;

      try {
        const fullPath = path.join(dir, ent.name);
        const buf = fs.readFileSync(fullPath);
        await uploadToFileStorage({
          project: 'bio-link',
          filename: ent.name,
          base64: buf.toString('base64'),
          overwriteExactName: true,
          skipIfExists: true
        });
        syncedCount++;
      } catch (err) {
        // Nếu container file-storage đang khởi động sau bio-link vài giây thì thử lại ở vòng sau
      }
    }
  }

  if (syncedCount > 0) {
    console.log(`📦 [File-Storage] Đã kiểm tra & đồng bộ ${syncedCount} file có sẵn của Bio-Link sang container lưu trữ mới!`);
  }
}

// Stream trực tiếp file từ container file-storage ra trình duyệt (RAM ~0MB do dùng pipe stream)
function streamFromStorageContainer(remoteRelPath, req, res, fallbackLocalFn) {
  getFileServerUrl()
    .then((serverUrl) => {
      const targetUrl = new URL(`${serverUrl}/files/${remoteRelPath}`);
      if (req.query && req.query.download) {
        targetUrl.searchParams.set('download', String(req.query.download));
      }
      const client = targetUrl.protocol === 'https:' ? https : http;
      const proxyReq = client.request(
        targetUrl,
        {
          method: req.method === 'HEAD' ? 'HEAD' : 'GET',
          headers: req.headers['if-none-match']
            ? { 'If-None-Match': req.headers['if-none-match'] }
            : {}
        },
        (proxyRes) => {
          if (proxyRes.statusCode === 404 && typeof fallbackLocalFn === 'function') {
            proxyRes.resume();
            return fallbackLocalFn();
          }
          const forwardHeaders = ['content-type', 'content-length', 'cache-control', 'etag', 'last-modified', 'content-disposition'];
          for (const h of forwardHeaders) {
            if (proxyRes.headers[h]) {
              res.setHeader(h, proxyRes.headers[h]);
            }
          }
          res.status(proxyRes.statusCode || 200);
          proxyRes.pipe(res);
        }
      );

      proxyReq.on('error', () => {
        if (typeof fallbackLocalFn === 'function') return fallbackLocalFn();
        if (!res.headersSent) res.status(502).end('File storage unavailable');
      });
      proxyReq.end();
    })
    .catch(() => {
      if (typeof fallbackLocalFn === 'function') return fallbackLocalFn();
      if (!res.headersSent) res.status(502).end('File storage unavailable');
    });
}

module.exports = {
  getFileServerUrl,
  uploadToFileStorage,
  listProjectFiles,
  deleteProjectFile,
  rewriteLegacyBioUrls,
  cloneExistingBioFilesToContainer,
  streamFromStorageContainer
};
