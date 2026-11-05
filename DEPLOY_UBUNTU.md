# Hướng Dẫn Triển Khai Dự Án Lên Máy Chủ Ubuntu Mới (Port 80, 443 & Domain)

Tài liệu này tổng hợp toàn bộ các bước và câu lệnh để triển khai dự án **MyProfileClone (`pofology`)** từ GitHub lên một máy chủ Ubuntu trắng, mở truy cập bên ngoài qua **Port 80 (HTTP)**, **Port 443 (HTTPS / SSL miễn phí)** và gắn tên miền riêng.

---

## 1. Thông tin Repository & Chuẩn bị

- **GitHub Repository**: https://github.com/NTDno1/MyProfileClone.git
- **Trạng thái hiển thị**: **Public** (`private: false`) — có thể `git clone` trực tiếp trên máy chủ Ubuntu mới mà không cần cấu hình SSH key hay Personal Access Token.

### Lưu ý trước khi chạy trên Ubuntu
1. **Đẩy nhánh giao diện mới lên GitHub (từ máy Windows cá nhân)**:
   - Nếu muốn chạy nhánh `redesign/editorial-ui` trên Ubuntu:
     ```powershell
     git push -u origin redesign/editorial-ui
     ```
   - Hoặc nếu đã ưng ý giao diện mới và muốn gộp thẳng vào `main`:
     ```powershell
     git checkout main
     git merge redesign/editorial-ui
     git push origin main
     ```
2. **Mở Firewall trên trang quản trị VPS / Cloud (AWS, GCP, Azure, DigitalOcean, Vultr...)**:
   - Đảm bảo phần **Security Group / Cloud Firewall** của nhà cung cấp đã mở **Inbound TCP** cho các cổng:
     - `22` (SSH)
     - `80` (HTTP)
     - `443` (HTTPS)
3. **Bảo mật cơ sở dữ liệu**:
   - Vì repository đang ở chế độ Public, bạn nên chuyển chuỗi kết nối MongoDB trong `pofology/src/lib/mongodb.ts` sang biến môi trường `.env.local` và đổi mật khẩu DB trên MongoDB Atlas khi thuận tiện.

---

## 2. Triển khai chuẩn với Node.js 20 LTS + PM2 + Nginx + Certbot

### Bước 1: Cập nhật Ubuntu, cài đặt Node.js 20, PM2, Nginx, Certbot & mở UFW

SSH vào máy chủ Ubuntu và chạy khối lệnh sau:

```bash
# 1. Cập nhật gói hệ thống và cài đặt các công cụ cần thiết
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# 2. Cài đặt Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra phiên bản Node & npm
node -v
npm -v

# 3. Cài đặt PM2 để quản lý ứng dụng chạy nền
sudo npm install -g pm2

# 4. Mở cổng 22 (SSH), 80 (HTTP), 443 (HTTPS) trên tường lửa Ubuntu
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

### Bước 2: Clone dự án, Build bản Production và khởi chạy với PM2

```bash
# 1. Tạo thư mục chứa mã nguồn và cấp quyền cho user hiện tại
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

# 2. Clone trực tiếp từ GitHub Public
git clone https://github.com/NTDno1/MyProfileClone.git
cd MyProfileClone

# 3. (Tùy chọn) Chuyển sang nhánh giao diện mới nếu chưa gộp vào main:
# git checkout redesign/editorial-ui

# 4. Cài đặt dependencies (dùng --legacy-peer-deps do xung đột peer dependency của React 18) và build
cd pofology
npm install --legacy-peer-deps
npx next build --no-lint

# 5. Khởi chạy ứng dụng nền ở cổng 3000 bằng PM2
pm2 start npm --name "portfolio" -- start
pm2 save

# 6. Tự động khởi chạy lại PM2 mỗi khi máy chủ Ubuntu khởi động lại (reboot)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

Kiểm tra nhanh tại nội bộ máy chủ xem ứng dụng đã phản hồi HTTP `200` ở cổng `3000` chưa:

```bash
curl -I http://127.0.0.1:3000
```

---

### Bước 3: Cấu hình Nginx Reverse Proxy mở Port 80

Thay `tenmien.com` trong biến `DOMAIN` bên dưới bằng tên miền thật của bạn.
*(Nhờ tham số `default_server` và `_`, ngay cả khi bạn chưa trỏ tên miền xong thì vẫn có thể truy cập trực tiếp bằng địa chỉ `http://<IP_SERVER>` từ bên ngoài).*

```bash
DOMAIN="tenmien.com"

# Xóa cấu hình mặc định của Nginx để tránh trang Welcome chiếm cổng 80
sudo rm -f /etc/nginx/sites-enabled/default

# Tạo file cấu hình Nginx cho dự án
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

# Kích hoạt cấu hình, kiểm tra cú pháp và nạp lại Nginx
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
sudo nginx -t
sudo systemctl reload nginx
```

Sau bước này, mở trình duyệt từ máy tính/điện thoại bên ngoài và truy cập thử:
- `http://<IP_MÁY_CHỦ_UBUNTU>`

---

### Bước 4: Gắn Domain & Cài đặt SSL miễn phí cho Port 443 (HTTPS)

#### 4.1. Cấu hình bản ghi DNS tại nhà cung cấp tên miền
Tạo 2 bản ghi trỏ về địa chỉ IPv4 công khai của máy chủ Ubuntu:

| Loại (Type) | Tên (Host / Name) | Giá trị (Value / Points to) | TTL |
| :--- | :--- | :--- | :--- |
| `A` | `@` | `<IP_MÁY_CHỦ_UBUNTU>` | Auto / 300 |
| `A` | `www` | `<IP_MÁY_CHỦ_UBUNTU>` | Auto / 300 |

> **Lưu ý nếu dùng Cloudflare quản lý DNS:**
> - Khi chạy lệnh cấp SSL của Certbot bên dưới, hãy để trạng thái Proxy của 2 bản ghi `A` ở chế độ **DNS Only (đám mây xám)**.
> - Sau khi Certbot cài đặt thành công cổng `443`, bạn có thể bật lại **Proxied (đám mây cam)** và đặt mục **SSL/TLS -> Overview** trên Cloudflare sang chế độ **Full (strict)** để tránh lỗi `ERR_TOO_MANY_REDIRECTS`.

#### 4.2. Cấp chứng chỉ SSL tự động và mở Port 443 với Certbot
Khi kiểm tra `ping tenmien.com` đã trả về đúng IP máy chủ Ubuntu, chạy lệnh sau (nhớ thay `tenmien.com` bằng tên miền thật của bạn):

```bash
sudo certbot --nginx \
  -d tenmien.com \
  -d www.tenmien.com \
  --non-interactive \
  --agree-tos \
  -m datt19112001@gmail.com \
  --redirect
```

Lệnh trên sẽ tự động:
1. Xác thực quyền sở hữu tên miền và tải chứng chỉ SSL Let's Encrypt.
2. Cập nhật file `/etc/nginx/sites-available/portfolio` để lắng nghe trên **Port 443 (`ssl http2`)**.
3. Tự động chuyển hướng toàn bộ truy cập từ `http://` (Port 80) sang `https://` (Port 443).

Kiểm tra dịch vụ tự động gia hạn chứng chỉ SSL định kỳ:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## 3. Các lệnh Quản trị & Cập nhật Code sau này

### Cập nhật phiên bản mới bằng 1 dòng lệnh (khi bạn push code mới lên GitHub)

```bash
cd /var/www/MyProfileClone/pofology && git pull && npm install --legacy-peer-deps && npx next build --no-lint && pm2 restart portfolio
```

### Đổi nhánh giữa giao diện cũ (`main`) và giao diện mới (`redesign/editorial-ui`) trên Ubuntu

```bash
cd /var/www/MyProfileClone
git fetch --all
git checkout redesign/editorial-ui   # Hoặc: git checkout main
cd pofology
npm install --legacy-peer-deps
npx next build --no-lint
pm2 restart portfolio
```

### Theo dõi trạng thái & Log hệ thống

```bash
# Kiểm tra trạng thái và log của ứng dụng Next.js trên PM2
pm2 status
pm2 logs portfolio --lines 100

# Kiểm tra các cổng mạng đang mở (80, 443, 3000)
sudo ss -tulpn | grep -E ':(80|443|3000)\b'

# Xem log truy cập và log lỗi của Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 4. Xử lý nhanh các lỗi thường gặp

1. **Truy cập tên miền hoặc IP báo `502 Bad Gateway`**:
   - Nguyên nhân: Ứng dụng Next.js ở cổng `3000` chưa chạy hoặc đang build dở.
   - Cách kiểm tra: Chạy `pm2 status` và `pm2 logs portfolio` để xem trạng thái tiến trình.
2. **Không kết nối được từ bên ngoài (Timeout)**:
   - Kiểm tra tường lửa Ubuntu: `sudo ufw status` (phải có `Nginx Full ALLOW`).
   - Kiểm tra **Security Group / Firewall** trên trang quản trị Cloud VPS xem đã mở cổng TCP `80` và `443` chiều Inbound chưa.
3. **Lỗi `Too Many Redirects` sau khi bật đám mây cam Cloudflare**:
   - Vào **Cloudflare Dashboard -> SSL/TLS -> Overview**, đổi từ `Flexible` sang **`Full (strict)`**.

