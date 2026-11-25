#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SCRIPT DỌN DẸP RÁC & TỐI ƯU DUNG LƯỢNG VPS (UBUNTU + DOCKER)
# An toàn 100% cho các container đang chạy (portfolio, bio-link, file-storage)
# và toàn bộ dữ liệu người dùng (storage-data, bio-link/data, SSL, Nginx, Swap).
#
# Cách gọi bất cứ lúc nào trên VPS:
#   bash /var/www/MyProfileClone/clean-server.sh
#   (Hoặc gõ ngắn gọn: clean-vps)
# ==============================================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_step() { echo -e "${CYAN}➜${NC} $1"; }
log_done() { echo -e "${GREEN}✔${NC} $1"; }

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      🧹 DỌN DẸP FILE RÁC & TỐI ƯU DUNG LƯỢNG SERVER VPS       ║"
echo "╚════════════════════════════════════════════════════════════════╝"

BEFORE_KB=$(df -k / | awk 'NR==2 {print $3}')
BEFORE_HUMAN=$(df -h / | awk 'NR==2 {printf "Đã dùng: %s / %s (%s) — Còn trống: %s", $3, $2, $5, $4}')
echo -e "${YELLOW}📊 Trước khi dọn:${NC} $BEFORE_HUMAN"
echo "------------------------------------------------------------------"

# 1. Bảo vệ 3 container chính luôn ở trạng thái chạy trước khi prune container rác
log_step "1/8. Đảm bảo các container chính (file-storage, bio-link, portfolio) được giữ nguyên..."
for cname in file-storage bio-link portfolio; do
  if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^${cname}$"; then
    docker start "$cname" >/dev/null 2>&1 || true
  fi
done
# Tắt tiến trình PM2 rỗng (nếu có) để giải phóng thêm ~40MB RAM
if command -v pm2 >/dev/null 2>&1; then
  if [ "$(pm2 jlist 2>/dev/null || echo '[]')" = "[]" ]; then
    pm2 kill >/dev/null 2>&1 || true
  fi
fi

# 2. Dọn Docker BuildKit Cache, Container đã dừng, Image thừa (<none> / cũ) & Network thừa
log_step "2/8. Xóa Docker Build Cache, Image cũ không dùng & Container rác..."
docker container prune -f >/dev/null 2>&1 || true
docker image prune -af >/dev/null 2>&1 || true
docker builder prune -af >/dev/null 2>&1 || true
docker buildx prune -af >/dev/null 2>&1 || true
docker network prune -f >/dev/null 2>&1 || true

# Làm rỗng file JSON log quá lớn của các container Docker đang chạy
if [ -d /var/lib/docker/containers ]; then
  find /var/lib/docker/containers -name "*-json.log" -type f -exec truncate -s 0 {} + 2>/dev/null || true
fi

# Cấu hình giới hạn log Docker tự động (tối đa 10MB x 2 file / container) để chống đầy ổ về sau
if [ ! -f /etc/docker/daemon.json ]; then
  mkdir -p /etc/docker
  cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "2"
  }
}
EOF
fi
log_done "Đã dọn sạch Docker Build Cache & Image rác."

# 3. Dọn Systemd Journal Logs & khóa trần tối đa 40MB vĩnh viễn
log_step "3/8. Thu gọn Systemd Journal Logs (/var/log/journal) & khóa trần 40MB..."
mkdir -p /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/99-size-limit.conf <<'EOF'
[Journal]
SystemMaxUse=40M
SystemMaxFileSize=10M
MaxRetentionSec=5day
EOF
systemctl restart systemd-journald >/dev/null 2>&1 || true
journalctl --vacuum-size=30M >/dev/null 2>&1 || true
journalctl --vacuum-time=3d >/dev/null 2>&1 || true
log_done "Đã thu gọn Journal Logs."

# 4. Dọn các file log xoay vòng (.gz, .1, .old) và làm rỗng syslog/kern.log/auth.log bị phình
log_step "4/8. Xóa log hệ thống cũ (*.gz, *.1) và làm rỗng log đang phình lớn..."
find /var/log -type f \( -name "*.gz" -o -name "*.1" -o -name "*.2" -o -name "*.old" -o -name "*.xz" \) -delete 2>/dev/null || true
for lf in /var/log/syslog /var/log/kern.log /var/log/auth.log /var/log/ufw.log /var/log/btmp /var/log/wtmp /var/log/dpkg.log /var/log/apt/term.log; do
  if [ -f "$lf" ]; then
    truncate -s 0 "$lf" 2>/dev/null || true
  fi
done
find /var/log/nginx -type f -name "*.log" -size +10M -exec truncate -s 0 {} + 2>/dev/null || true
log_done "Đã làm sạch /var/log."

# 5. Xóa bản clone dự án bị trùng ở /root/MyProfileClone và node_modules/.next thừa trên máy chủ host
log_step "5/8. Xóa thư mục trùng lặp (/root/MyProfileClone) & node_modules/.next thừa ngoài Docker..."
if [ -d /root/MyProfileClone ] && [ -d /var/www/MyProfileClone ]; then
  rm -rf /root/MyProfileClone
fi
# Cả pofology và bio-link đều build & chạy 100% bên trong Docker container nên node_modules/.next trên host là rác
rm -rf /var/www/MyProfileClone/pofology/node_modules \
       /var/www/MyProfileClone/pofology/.next \
       /var/www/MyProfileClone/bio-link/node_modules \
       /var/www/MyProfileClone/bio-link/browser-tools/playwright-sync/node_modules 2>/dev/null || true
log_done "Đã xóa thư mục trùng & thư viện thừa trên host."

# 6. Xóa bộ nhớ đệm npm / yarn / pip / cache trên tài khoản root & /tmp
log_step "6/8. Dọn cache trình quản lý gói (/root/.npm, /root/.yarn, /root/.cache, /tmp)..."
rm -rf /root/.npm /root/.yarn /root/.cache /root/.node-gyp /root/config.json.bak 2>/dev/null || true
rm -rf /tmp/myprofile_deploy_backup /tmp/cfg.bak /tmp/npm-* /tmp/yarn-* /tmp/v8-* 2>/dev/null || true
find /tmp -mindepth 1 -maxdepth 1 -mtime +1 -exec rm -rf {} + 2>/dev/null || true
log_done "Đã dọn sạch cache người dùng & /tmp."

# 7. Dọn gói APT dư thừa, Kernel cũ không còn dùng & cache gói cài đặt (.deb)
log_step "7/8. Dọn dẹp APT cache & các gói hệ thống dư thừa..."
export DEBIAN_FRONTEND=noninteractive
apt-get autoremove --purge -y >/dev/null 2>&1 || true
apt-get autoclean -y >/dev/null 2>&1 || true
apt-get clean >/dev/null 2>&1 || true
rm -rf /var/cache/apt/archives/*.deb /var/cache/apt/archives/partial/* 2>/dev/null || true
# Dọn bản Snap cũ bị disabled (nếu máy chủ có cài snapd)
if command -v snap >/dev/null 2>&1; then
  snap list --all 2>/dev/null | awk '/disabled/{print $1, $3}' | while read -r snapname revision; do
    [ -n "$snapname" ] && snap remove "$snapname" --revision="$revision" >/dev/null 2>&1 || true
  done
  rm -rf /var/lib/snapd/cache/* 2>/dev/null || true
fi
log_done "Đã dọn sạch APT & gói thừa."

# 8. Nén gọn lịch sử Git (.git) của dự án & tạo lệnh tắt `clean-vps`
log_step "8/8. Tối ưu thư mục .git và cài đặt lệnh nhanh 'clean-vps'..."
if [ -d /var/www/MyProfileClone/.git ]; then
  git -C /var/www/MyProfileClone gc --prune=now --quiet >/dev/null 2>&1 || true
fi
if [ -f /var/www/MyProfileClone/clean-server.sh ]; then
  chmod +x /var/www/MyProfileClone/clean-server.sh
  ln -sf /var/www/MyProfileClone/clean-server.sh /usr/local/bin/clean-vps 2>/dev/null || true
fi
sync

AFTER_KB=$(df -k / | awk 'NR==2 {print $3}')
AFTER_HUMAN=$(df -h / | awk 'NR==2 {printf "Đã dùng: %s / %s (%s) — Còn trống: %s", $3, $2, $5, $4}')
FREED_KB=$((BEFORE_KB - AFTER_KB))
if [ "$FREED_KB" -lt 0 ]; then FREED_KB=0; fi
FREED_MB=$(awk "BEGIN {printf \"%.2f\", $FREED_KB / 1024}")
FREED_GB=$(awk "BEGIN {printf \"%.2f\", $FREED_KB / 1048576}")

echo "------------------------------------------------------------------"
echo -e "${GREEN}📊 Sau khi dọn :${NC} $AFTER_HUMAN"
echo -e "${GREEN}🎉 Đã giải phóng:${NC} ${FREED_MB} MB (~${FREED_GB} GB) dung lượng ổ cứng!"
echo "=================================================================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
