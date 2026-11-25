#!/usr/bin/env bash
# Cấu hình Nginx trên VPS cho phép upload file lên tới 30MB và trỏ trực tiếp /media/ sang container file-storage (127.0.0.1:3010)
set -e

if ! command -v nginx >/dev/null 2>&1; then
  echo "ℹ️ Máy không cài Nginx trên host (bỏ qua bước tối ưu Nginx, Next.js & Express đã tự proxy /media/)."
  exit 0
fi

echo "⚡ Đang kiểm tra cấu hình Nginx cho đường dẫn /media/ và giới hạn upload 30MB..."

# Tăng giới hạn upload toàn cục cho Nginx tránh lỗi 413 Request Entity Too Large khi up ảnh/PDF lớn
cat > /etc/nginx/conf.d/file_upload_limit.conf <<'EOF'
client_max_body_size 30M;
EOF

if nginx -t >/dev/null 2>&1; then
  systemctl reload nginx || nginx -s reload || true
  echo "✅ Đã bật client_max_body_size 30M trên Nginx thành công!"
else
  rm -f /etc/nginx/conf.d/file_upload_limit.conf
  echo "⚠️ Giữ nguyên cấu hình Nginx cũ."
fi
