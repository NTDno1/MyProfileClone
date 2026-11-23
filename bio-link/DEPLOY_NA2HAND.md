# 🚀 Hướng Dẫn Deploy `bio-link` Bằng Docker & Cắm Domain `na2hand.com`

Hướng dẫn chạy **thêm 1 container Docker `bio-link`** song song với website FE hiện tại đang chạy ở port `80`/`443` trên cùng VPS **`103.82.26.134`** mà **không gây xung đột cổng**.

---

## 🧩 Kiến trúc chạy song song trên VPS `103.82.26.134`

```text
Internet (Cổng 80 / 443)
   └── Nginx trên Ubuntu Host (Reverse Proxy chia theo tên miền)
         ├── datnguyentien.online  ──▶  http://127.0.0.1:3000  (Docker FE hiện tại)
         └── na2hand.com           ──▶  http://127.0.0.1:3005  (Docker bio-link mới)
```

---

## Bước 1: Trỏ tên miền `na2hand.com` về IP `103.82.26.134`

Vào trang quản lý DNS của **Cloudflare** (hoặc nơi bạn mua tên miền `na2hand.com`), thêm 2 bản ghi `A`:

| Type | Name | Content (IPv4) | Proxy Status (nếu dùng Cloudflare) |
| :--- | :--- | :--- | :--- |
| `A` | `@` (hoặc `na2hand.com`) | `103.82.26.134` | Proxied (Đám mây cam) hoặc DNS Only |
| `A` | `www` | `103.82.26.134` | Proxied (Đám mây cam) hoặc DNS Only |

> ⚠️ **Lưu ý:** Nếu thấy các bản ghi `AAAA` cũ/lạ có sẵn trong DNS thì hãy xóa đi để tránh lỗi Cloudflare Error 1000.

---

## Bước 2: Kéo code `bio-link` về VPS & Chạy Container Docker thứ 2

SSH vào server `103.82.26.134` và chạy lần lượt các lệnh sau:

```bash
# 1. Di chuyển vào thư mục dự án trên VPS và kéo code mới nhất từ GitHub
cd /var/www/MyProfileClone
git pull origin main

# 2. Vào thư mục bio-link
cd /var/www/MyProfileClone/bio-link

# 3. Đảm bảo thư mục lưu data và ảnh có sẵn
mkdir -p data uploads

# 4. Build image Docker (chỉ mất khoảng 5-15 giây)
docker build -t bio-link:latest .

# 5. Xóa container cũ nếu đã từng chạy thử
docker rm -f bio-link 2>/dev/null || true

# 6. Chạy container bio-link ở cổng nội bộ 127.0.0.1:3005 (giới hạn tối đa 128MB RAM)
docker run -d \
  --name bio-link \
  --restart unless-stopped \
  -p 127.0.0.1:3005:3005 \
  --memory="128m" \
  -v /var/www/MyProfileClone/bio-link/data:/app/data \
  -v /var/www/MyProfileClone/bio-link/uploads:/app/uploads \
  bio-link:latest

# 7. Kiểm tra container đang chạy và test cổng 3005
docker ps
curl -I http://127.0.0.1:3005
```

> Nếu thấy `HTTP/1.1 200 OK` và `docker ps` hiển thị cả container FE cũ (port `3000`) lẫn `bio-link` (port `3005`) ở trạng thái `Up` là đã chạy song song thành công!

---

## Bước 3: Cấu hình Nginx cắm domain `na2hand.com` (Không ảnh hưởng Web FE đang chạy ở 80/443)

Chạy lệnh sau trên VPS để tạo file cấu hình Virtual Host riêng cho `na2hand.com`:

```bash
sudo tee /etc/nginx/sites-available/na2hand > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name na2hand.com www.na2hand.com;

    # Cho phép upload ảnh đại diện / banner từ trang /admin tới 20MB
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Kích hoạt cấu hình na2hand.com
sudo ln -sf /etc/nginx/sites-available/na2hand /etc/nginx/sites-enabled/na2hand

# Kiểm tra cú pháp Nginx và tải lại (không làm gián đoạn web cũ)
sudo nginx -t && sudo systemctl reload nginx
```

---

## Bước 4: Bật HTTPS (Ổ khóa xanh cổng 443) cho `na2hand.com`

Tùy theo cách bạn quản lý tên miền `na2hand.com`, chọn **1 trong 2 cách** dưới đây:

### Cách 1: Cài SSL trực tiếp lên cổng 443 bằng Certbot (Khuyên dùng — Chuẩn nhất)
*(Nếu dùng Cloudflare, hãy tạm tắt đám mây cam sang **DNS Only** trong lúc chạy lệnh Certbot, cài xong bật lại đám mây cam + đặt SSL/TLS là **Full (Strict)**)*:

```bash
# Cài certbot nếu máy chưa có
sudo apt update && sudo apt install -y certbot python3-certbot-nginx

# Tự động cấp chứng chỉ SSL HTTPS 443 cho na2hand.com
sudo certbot --nginx -d na2hand.com -d www.na2hand.com
```

### Cách 2: Dùng Cloudflare SSL chế độ Flexible (Nhanh 5 giây, không cần cài Certbot)
* Trên Cloudflare của domain `na2hand.com`, bật **Proxied (Đám mây cam)** cho 2 bản ghi `A` (`@` và `www`).
* Vào menu bên trái **SSL/TLS -> Overview** -> chọn **Flexible**.
* Truy cập ngay `https://na2hand.com` và `https://na2hand.com/admin`.

---

## 🔐 Bảo mật sau khi lên web

1. Truy cập **`https://na2hand.com/admin`**
2. Đăng nhập bằng tài khoản mặc định ban đầu (`admin` / `123`).
3. Vào tab **`⚙️ 6. Cài đặt & Mật khẩu`** và đổi ngay sang mật khẩu riêng của bạn!
4. Khi cần cập nhật code sau này:
```bash
cd /var/www/MyProfileClone && git pull origin main && cd bio-link && docker build -t bio-link:latest . && docker rm -f bio-link && docker run -d --name bio-link --restart unless-stopped -p 127.0.0.1:3005:3005 --memory="128m" -v /var/www/MyProfileClone/bio-link/data:/app/data -v /var/www/MyProfileClone/bio-link/uploads:/app/uploads bio-link:latest
```
