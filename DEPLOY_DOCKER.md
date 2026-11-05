# Hướng Dẫn Triển Khai Dự Án Bằng Docker Trên Máy Chủ Ubuntu (Port 80, 443 & Domain)

Tài liệu này hướng dẫn chi tiết cách đóng gói và chạy dự án **MyProfileClone (`pofology`)** bằng **Docker**, cấu hình reverse proxy mở **Port 80**, cấp chứng chỉ SSL miễn phí mở **Port 443** và gắn tên miền riêng — đặc biệt được tinh chỉnh an toàn cho cấu hình máy chủ **1 Core, 1 GB RAM, 20 GB Disk**.

---

## 1. Chuẩn Bị Máy Chủ Ubuntu (Bắt buộc cho VPS 1 GB RAM)

### 1.1. Tạo 2 GB Swap (RAM ảo)

SSH vào máy chủ Ubuntu và chạy lần lượt:

```bash
# Tạo file swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Thiết lập tự kích hoạt khi khởi động lại VPS
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Kiểm tra xem RAM và Swap đã nhận đủ chưa
free -h
```

---

### 1.2. Cài đặt Docker & Docker Compose Plugin trên Ubuntu

Chạy khối lệnh sau để cài đặt phiên bản Docker Engine mới nhất từ repository chính thức:

```bash
# 1. Cập nhật và cài đặt các gói tiền đề
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git ufw

# 2. Thêm GPG key chính thức của Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Thêm Docker Repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Cài đặt Docker Engine & Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Cho phép user hiện tại chạy docker không cần gõ sudo
sudo usermod -aG docker $USER
newgrp docker

# Kiểm tra phiên bản Docker
docker --version
docker compose version
```

---

## 2. Triển Khai Container Ứng Dụng

Bạn có thể chọn 1 trong 2 phương án bên dưới:

### Phương án A: Build & Chạy trực tiếp trên VPS (Đơn giản nhất)

```bash
# 1. Tạo thư mục và clone dự án về
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/NTDno1/MyProfileClone.git
cd MyProfileClone/pofology

# (Tùy chọn) Chuyển sang nhánh giao diện mới nếu muốn:
# git checkout redesign/editorial-ui

# 2. Build Docker Image (Nhờ có 2GB Swap ở Bước 1 nên build sẽ chạy mượt)
docker build -t portfolio:latest .

# 3. Chạy container ở cổng 3000 nội bộ, tự khởi động lại khi reboot
docker run -d \
  --name portfolio \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  portfolio:latest
```

---

### Phương án B: Build trên máy tính cá nhân -> Push Docker Hub -> Kéo về VPS (Tiết kiệm CPU/RAM VPS tối đa)

Nếu bạn không muốn VPS 1 Core phải gánh tác vụ build image:

1. **Trên máy tính của bạn (Windows/Mac có cài Docker Desktop):**
   ```bash
   cd pofology
   docker build -t <DOCKERHUB_USERNAME>/portfolio:latest .
   docker login
   docker push <DOCKERHUB_USERNAME>/portfolio:latest
   ```

2. **Trên máy chủ Ubuntu:**
   ```bash
   docker run -d \
     --name portfolio \
     --restart unless-stopped \
     -p 127.0.0.1:3000:3000 \
     <DOCKERHUB_USERNAME>/portfolio:latest
   ```

---

Kiểm tra container đang chạy:
```bash
docker ps
curl -I http://127.0.0.1:3000
```
*(Nếu trả về HTTP `200` là container đã sẵn sàng).*

---

## 3. Cấu hình Nginx & Cấp SSL Certbot (Mở Port 80, 443 & Gắn Domain)

> **Mô hình tối ưu cho VPS 1 GB RAM:** Chạy ứng dụng web trong Docker ở cổng `127.0.0.1:3000`, dùng Nginx nhẹ (~15MB RAM) trên host làm cổng đón ở Port `80/443` và Certbot tự động quản trị chứng chỉ SSL.

### 3.1. Cài đặt Nginx & Certbot
```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Mở cổng trên tường lửa UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### 3.2. Cấu hình Nginx mở Port 80
Thay `tenmien.com` bằng tên miền thật của bạn:

```bash
DOMAIN="tenmien.com"

# Xóa cấu hình mặc định
sudo rm -f /etc/nginx/sites-enabled/default

# Tạo file cấu hình Nginx chuyển tiếp vào Docker Container
sudo tee /etc/nginx/sites-available/portfolio > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name $DOMAIN www.$DOMAIN _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Kích hoạt và nạp lại Nginx
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
sudo nginx -t
sudo systemctl reload nginx
```
Lúc này bạn đã có thể truy cập qua `http://<IP_UBUNTU>` hoặc `http://tenmien.com`.

---

### 3.3. Cấp chứng chỉ SSL tự động mở Port 443 (HTTPS)

1. Trỏ bản ghi DNS tên miền của bạn về IP của máy chủ:
   - Bản ghi `A` | `@` -> `<IP_UBUNTU>`
   - Bản ghi `A` | `www` -> `<IP_UBUNTU>`

2. Chạy lệnh sau để Certbot tự động cấu hình SSL và mở Port 443:
```bash
sudo certbot --nginx \
  -d tenmien.com \
  -d www.tenmien.com \
  --non-interactive \
  --agree-tos \
  -m datt19112001@gmail.com \
  --redirect
```

---

## 4. Phương Án Dự Phòng: Triển Khai 100% Bằng Docker Compose (Cả App + Nginx + Certbot trong Docker)

Nếu bạn không muốn cài bất kỳ thứ gì trên hệ điều hành host ngoài Docker, hãy dùng cấu hình Docker Compose này:

Tạo file `/var/www/docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: ./MyProfileClone/pofology
      dockerfile: Dockerfile
    container_name: portfolio_app
    restart: unless-stopped
    expose:
      - "3000"

  nginx:
    image: nginx:alpine
    container_name: portfolio_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - app

  certbot:
    image: certbot/certbot
    container_name: portfolio_certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt:rw
      - ./certbot/www:/var/www/certbot:rw
```

Khởi động toàn bộ:
```bash
docker compose up -d
```

---

## 5. Quy Trình Cập Nhật Code Mới Sau Này

Khi bạn push code mới lên GitHub, chạy các lệnh sau trên Ubuntu để cập nhật:

```bash
cd /var/www/MyProfileClone/pofology

# 1. Kéo code mới
git pull

# 2. Build lại image mới
docker build -t portfolio:latest .

# 3. Khởi động lại container với bản build mới
docker stop portfolio
docker rm portfolio
docker run -d \
  --name portfolio \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  portfolio:latest

# 4. Dọn dẹp image cũ để giải phóng ổ cứng 20GB
docker image prune -f
```

---

## 6. Các Lệnh Quản Trị Docker Hữu Ích

```bash
# Xem danh sách container đang chạy và mức tiêu thụ RAM/CPU
docker ps
docker stats --no-stream

# Xem log trực tiếp của container
docker logs -f portfolio --tail 100

# Khởi động lại / Dừng container
docker restart portfolio
docker stop portfolio

# Dọn dẹp toàn bộ dữ liệu rác, cache của Docker khi ổ cứng 20GB bị đầy
docker system prune -a --volumes -f
```

