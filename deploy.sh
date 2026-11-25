#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SCRIPT TRIỂN KHAI TỔNG HỢP (DOCKER DEPLOY MANAGER)
# Hỗ trợ 3 chế độ:
#   1) Build & chạy CẢ 2 DỰ ÁN cùng lúc (datnguyentien.online + bio-link/na2hand.com)
#   2) Chỉ build & chạy dự án datnguyentien (pofology - cổng 3000)
#   3) Chỉ build & chạy dự án bio-link (na2hand.com - cổng 3005)
#
# Cách chạy trên VPS:
#   bash deploy.sh        -> Hiển thị menu chọn 1 / 2 / 3
#   bash deploy.sh 1      -> Chạy thẳng lựa chọn 1 (Cả 2 dự án)
#   bash deploy.sh 2      -> Chạy thẳng lựa chọn 2 (datnguyentien)
#   bash deploy.sh 3      -> Chạy thẳng lựa chọn 3 (bio-link)
# ==============================================================================

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_NAME="profile-net"
STORAGE_DIR="$REPO_DIR/storage-data"
STORAGE_API_KEY="${STORAGE_API_KEY:-myprofile_storage_2026_key}"
BACKUP_DIR="/tmp/myprofile_deploy_backup"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()   { echo -e "${RED}[ERR]${NC}  $1"; }

# ------------------------------------------------------------------------------
# Bước 1: Kéo code mới nhất từ GitHub an toàn (tự bảo vệ data/config.json)
# ------------------------------------------------------------------------------
pull_latest_code() {
  log_info "Đang cập nhật mã nguồn mới nhất từ GitHub (nhánh main)..."
  cd "$REPO_DIR"
  mkdir -p "$BACKUP_DIR"

  # Sao lưu dữ liệu runtime của bio-link tránh xung đột khi git pull
  for f in config.json auth.json mongo-settings.json shop-store.json analytics-logs.json; do
    if [ -f "$REPO_DIR/bio-link/data/$f" ]; then
      cp -f "$REPO_DIR/bio-link/data/$f" "$BACKUP_DIR/$f"
    fi
  done

  git checkout -- bio-link/data/config.json 2>/dev/null || true
  git pull origin main

  # Khôi phục lại dữ liệu runtime đã sao lưu
  mkdir -p "$REPO_DIR/bio-link/data" "$REPO_DIR/bio-link/uploads"
  for f in config.json auth.json mongo-settings.json shop-store.json analytics-logs.json; do
    if [ -f "$BACKUP_DIR/$f" ]; then
      cp -f "$BACKUP_DIR/$f" "$REPO_DIR/bio-link/data/$f"
    fi
  done

  log_ok "Đã kéo mã nguồn mới nhất thành công!"
}

# ------------------------------------------------------------------------------
# Bước 2: Đảm bảo mạng Docker `profile-net` & container kho file `file-storage`
# ------------------------------------------------------------------------------
ensure_infra_and_storage() {
  docker network create "$NETWORK_NAME" >/dev/null 2>&1 || true

  if [ ! -d "$STORAGE_DIR/bio-link" ] || [ ! -d "$STORAGE_DIR/pofology" ]; then
    if [ -f "$REPO_DIR/file-storage/migrate-existing-files.sh" ]; then
      log_info "Khởi tạo & đồng bộ file hiện có sang kho lưu trữ tập trung..."
      bash "$REPO_DIR/file-storage/migrate-existing-files.sh"
    fi
  fi

  if docker ps --format '{{.Names}}' | grep -q '^file-storage$'; then
    docker network connect "$NETWORK_NAME" file-storage >/dev/null 2>&1 || true
    log_ok "Container lưu file 'file-storage' đang hoạt động tốt (cổng 3010)."
  elif docker ps -a --format '{{.Names}}' | grep -q '^file-storage$'; then
    log_info "Đang bật lại container 'file-storage'..."
    docker start file-storage >/dev/null
    docker network connect "$NETWORK_NAME" file-storage >/dev/null 2>&1 || true
    log_ok "Đã bật lại 'file-storage' (cổng 3010)."
  else
    log_info "Đang build & khởi chạy container kho lưu file 'file-storage' (~15MB RAM)..."
    cd "$REPO_DIR/file-storage"
    docker build -t file-storage:latest .
    docker rm -f file-storage >/dev/null 2>&1 || true
    docker run -d \
      --name file-storage \
      --restart unless-stopped \
      --network "$NETWORK_NAME" \
      --memory 32m \
      -p 127.0.0.1:3010:3010 \
      -v "$STORAGE_DIR:/storage" \
      -e STORAGE_API_KEY="$STORAGE_API_KEY" \
      file-storage:latest >/dev/null
    log_ok "Đã khởi chạy 'file-storage' tại 127.0.0.1:3010."
  fi
}

# ------------------------------------------------------------------------------
# Hàm kiểm tra HTTP sau khi bật container
# ------------------------------------------------------------------------------
wait_for_http() {
  local name="$1"
  local url="$2"
  local retries=18
  log_info "Đang kiểm tra phản hồi của $name ($url)..."
  for ((i = 1; i <= retries; i++)); do
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
      log_ok "$name đã sẵn sàng phục vụ! (HTTP $code)"
      return 0
    fi
    sleep 1
  done
  log_warn "$name đang khởi động kết nối DB, kiểm tra log bằng: docker logs --tail 30 $name"
}

# ------------------------------------------------------------------------------
# Dự án: datnguyentien.online (pofology -> container `portfolio`, port 3000)
# ------------------------------------------------------------------------------
deploy_datnguyentien() {
  echo ""
  echo "=================================================================="
  log_info "🚀 BẮT ĐẦU BUILD DỰ ÁN: datnguyentien.online (pofology)"
  echo "=================================================================="
  cd "$REPO_DIR/pofology"

  # Build image mới trước khi tắt container cũ để hạn chế tối đa thời gian gián đoạn
  docker build -t portfolio:latest .

  docker rm -f portfolio >/dev/null 2>&1 || true
  docker run -d \
    --name portfolio \
    --restart unless-stopped \
    --network "$NETWORK_NAME" \
    -p 127.0.0.1:3000:3000 \
    -e FILE_SERVER_URL="http://file-storage:3010" \
    -e STORAGE_API_KEY="$STORAGE_API_KEY" \
    portfolio:latest >/dev/null

  wait_for_http "datnguyentien (portfolio)" "http://127.0.0.1:3000"
}

# ------------------------------------------------------------------------------
# Dự án: bio-link / na2hand.com (bio-link -> container `bio-link`, port 3005)
# ------------------------------------------------------------------------------
deploy_biolink() {
  echo ""
  echo "=================================================================="
  log_info "🌸 BẮT ĐẦU BUILD DỰ ÁN: bio-link & Shop (na2hand.com)"
  echo "=================================================================="
  cd "$REPO_DIR/bio-link"

  # Build image mới trước khi tắt container cũ
  docker build -t bio-link:latest .

  docker rm -f bio-link >/dev/null 2>&1 || true
  docker run -d \
    --name bio-link \
    --restart unless-stopped \
    --network "$NETWORK_NAME" \
    -p 127.0.0.1:3005:3005 \
    -v "$REPO_DIR/bio-link/data:/app/data" \
    -v "$REPO_DIR/bio-link/uploads:/app/uploads" \
    -e FILE_SERVER_URL="http://file-storage:3010" \
    -e STORAGE_API_KEY="$STORAGE_API_KEY" \
    bio-link:latest >/dev/null

  wait_for_http "bio-link (na2hand.com)" "http://127.0.0.1:3005"
}

# ------------------------------------------------------------------------------
# Menu lựa chọn (Hoặc truyền trực tiếp tham số 1 / 2 / 3)
# ------------------------------------------------------------------------------
CHOICE="${1:-}"

if [ -z "$CHOICE" ]; then
  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║         🚀 TRÌNH QUẢN LÝ BUILD & DEPLOY DOCKER TRÊN VPS        ║"
  echo "╠════════════════════════════════════════════════════════════════╣"
  echo "║  1) Build & chạy CẢ 2 DỰ ÁN cùng lúc (datnguyentien + bio-link)║"
  echo "║  2) Chỉ build dự án datnguyentien (datnguyentien.online :3000) ║"
  echo "║  3) Chỉ build dự án bio-link      (na2hand.com          :3005) ║"
  echo "║  4) Dọn dẹp file rác & tối ưu dung lượng ổ cứng VPS            ║"
  echo "║  0) Thoát                                                      ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  read -rp "👉 Nhập lựa chọn của bạn (1 / 2 / 3 / 4): " CHOICE
fi

case "$CHOICE" in
  1)
    pull_latest_code
    ensure_infra_and_storage
    deploy_biolink
    deploy_datnguyentien
    ;;
  2)
    pull_latest_code
    ensure_infra_and_storage
    deploy_datnguyentien
    ;;
  3)
    pull_latest_code
    ensure_infra_and_storage
    deploy_biolink
    ;;
  4)
    pull_latest_code
    bash "$REPO_DIR/clean-server.sh"
    exit 0
    ;;
  0)
    log_info "Đã hủy thao tác."
    exit 0
    ;;
  *)
    log_err "Lựa chọn không hợp lệ: '$CHOICE'. Vui lòng chọn 1, 2, 3 hoặc 4."
    exit 1
    ;;
esac

# Dọn dẹp các image trung gian <none> và giữ build cache gọn (<512MB) để chống đầy ổ cứng VPS
docker image prune -f >/dev/null 2>&1 || true
docker builder prune -f --keep-storage=512m >/dev/null 2>&1 || true

echo ""
echo "=================================================================="
log_ok "🎉 HOÀN TẤT TRIỂN KHAI! DANH SÁCH CONTAINER ĐANG CHẠY:"
echo "=================================================================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
