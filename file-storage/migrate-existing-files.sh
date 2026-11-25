#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STORAGE_ROOT="${STORAGE_ROOT:-$REPO_ROOT/storage-data}"

echo "📦 Bắt đầu clone toàn bộ file hiện có sang kho lưu trữ tập trung: $STORAGE_ROOT"
mkdir -p "$STORAGE_ROOT/pofology/cv" \
         "$STORAGE_ROOT/pofology/images" \
         "$STORAGE_ROOT/pofology/figma" \
         "$STORAGE_ROOT/pofology/uploads" \
         "$STORAGE_ROOT/bio-link"

# 1. Nếu container bio-link cũ đang chạy mà từng lưu file bên trong container chưa mount, cứu toàn bộ ra trước
if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q '^bio-link$'; then
  echo "🔍 Kiểm tra & sao lưu file từ container bio-link hiện tại (nếu có)..."
  docker cp bio-link:/app/uploads/. "$STORAGE_ROOT/bio-link/" 2>/dev/null || true
fi

# 2. Clone toàn bộ file đã upload trong bio-link/uploads & ảnh QR mẫu sang storage-data/bio-link
if [ -d "$REPO_ROOT/bio-link/uploads" ]; then
  cp -rn "$REPO_ROOT/bio-link/uploads/." "$STORAGE_ROOT/bio-link/" 2>/dev/null || cp -r "$REPO_ROOT/bio-link/uploads/." "$STORAGE_ROOT/bio-link/"
fi
if [ -d "$REPO_ROOT/bio-link/public/images" ]; then
  cp -rn "$REPO_ROOT/bio-link/public/images/." "$STORAGE_ROOT/bio-link/" 2>/dev/null || cp -r "$REPO_ROOT/bio-link/public/images/." "$STORAGE_ROOT/bio-link/"
fi

# 3. Clone toàn bộ file CV PDF, Avatar, Ảnh dự án & Bài viết của pofology sang storage-data/pofology
if [ -f "$REPO_ROOT/pofology/CVProfile/NguyenTienDatCV.pdf" ]; then
  cp -n "$REPO_ROOT/pofology/CVProfile/NguyenTienDatCV.pdf" "$STORAGE_ROOT/pofology/cv/NguyenTienDatCV.pdf" 2>/dev/null || true
fi
if [ -f "$REPO_ROOT/pofology/public/CV/Nguyen_Tien_Dat_CV.pdf" ]; then
  cp -n "$REPO_ROOT/pofology/public/CV/Nguyen_Tien_Dat_CV.pdf" "$STORAGE_ROOT/pofology/cv/Nguyen_Tien_Dat_CV.pdf" 2>/dev/null || true
fi
if [ -d "$REPO_ROOT/pofology/public/images" ]; then
  cp -rn "$REPO_ROOT/pofology/public/images/." "$STORAGE_ROOT/pofology/images/" 2>/dev/null || cp -r "$REPO_ROOT/pofology/public/images/." "$STORAGE_ROOT/pofology/images/"
fi
if [ -d "$REPO_ROOT/pofology/public/figma" ]; then
  cp -rn "$REPO_ROOT/pofology/public/figma/." "$STORAGE_ROOT/pofology/figma/" 2>/dev/null || cp -r "$REPO_ROOT/pofology/public/figma/." "$STORAGE_ROOT/pofology/figma/"
fi

chmod -R 755 "$STORAGE_ROOT"
echo "✅ Hoàn tất clone dữ liệu sang $STORAGE_ROOT!"
echo "   • Số file Pofology : $(find "$STORAGE_ROOT/pofology" -type f | wc -l)"
echo "   • Số file Bio-Link : $(find "$STORAGE_ROOT/bio-link" -type f | wc -l)"
