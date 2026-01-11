# Docker Build và Push lên DockerHub

## Yêu cầu
1. Docker Desktop phải đang chạy
2. Đã đăng nhập DockerHub (hoặc sẽ được yêu cầu đăng nhập khi chạy script)

## Cách sử dụng

### Option 1: Sử dụng PowerShell script (Khuyến nghị)

```powershell
# Thay YOUR_DOCKERHUB_USERNAME bằng username DockerHub của bạn
.\build-and-push-docker.ps1 -DockerHubUsername "YOUR_DOCKERHUB_USERNAME"
```

Ví dụ:
```powershell
.\build-and-push-docker.ps1 -DockerHubUsername "dattnguyen"
```

### Option 2: Build và push thủ công

```powershell
# 1. Build image
docker build -t YOUR_DOCKERHUB_USERNAME/pofology:latest .

# 2. Login to DockerHub
docker login

# 3. Push image
docker push YOUR_DOCKERHUB_USERNAME/pofology:latest
```

## Chạy container

### Trên local (Windows/Mac):
```powershell
docker run -p 3000:3000 YOUR_DOCKERHUB_USERNAME/pofology:latest
```
Sau đó truy cập: http://localhost:3000

### Trên Ubuntu server:

#### Nếu cổng 80 đã được sử dụng (nginx/apache):
```bash
# Chạy container ở cổng 3000
docker run -d -p 3000:3000 --name pofology YOUR_DOCKERHUB_USERNAME/pofology:latest

# Sau đó cấu hình nginx reverse proxy (xem phần dưới)
```

#### Kiểm tra cấu hình nginx hiện tại:
```bash
# Xem tất cả cấu hình nginx
sudo cat /etc/nginx/nginx.conf
sudo ls -la /etc/nginx/sites-enabled/
sudo cat /etc/nginx/sites-enabled/*

# Hoặc chạy script kiểm tra
chmod +x check-nginx-config.sh
./check-nginx-config.sh
```

## Environment Variables

Nếu cần set environment variables (ví dụ MongoDB connection string):

```powershell
# Windows/Mac
docker run -p 3000:3000 -e MONGODB_URI="your_connection_string" YOUR_DOCKERHUB_USERNAME/pofology:latest

# Ubuntu server
docker run -d -p 3000:3000 -e MONGODB_URI="your_connection_string" --name pofology YOUR_DOCKERHUB_USERNAME/pofology:latest
```

## Cấu hình Nginx Reverse Proxy (Ubuntu Server)

Nếu bạn muốn chạy ứng dụng ở cổng 80 thông qua nginx:

### Cách 1: Sử dụng script tự động (Khuyến nghị)

1. **Upload script lên server và chạy:**
```bash
chmod +x setup-nginx-pofology.sh
./setup-nginx-pofology.sh
```

Script sẽ tự động:
- Kiểm tra nginx đã cài đặt chưa
- Hiển thị cấu hình hiện tại
- Tạo file cấu hình mới cho pofology
- Kích hoạt site
- Test và reload nginx

### Cách 2: Cấu hình thủ công

1. **Xem cấu hình nginx hiện tại:**
```bash
sudo ls -la /etc/nginx/sites-enabled/
sudo cat /etc/nginx/sites-enabled/*
```

2. **Tạo file cấu hình nginx:**
```bash
sudo nano /etc/nginx/sites-available/pofology
```

3. **Thêm nội dung:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Thay bằng domain của bạn hoặc dùng _ cho IP

    # Increase body size for file uploads if needed
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

4. **Kích hoạt site:**
```bash
sudo ln -s /etc/nginx/sites-available/pofology /etc/nginx/sites-enabled/
sudo nginx -t  # Kiểm tra cấu hình
sudo systemctl reload nginx
```

5. **Chạy container:**
```bash
docker run -d -p 3000:3000 --name pofology ntdno1/pofology:latest
```

### Kiểm tra và quản lý

```bash
# Xem logs nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Kiểm tra nginx status
sudo systemctl status nginx

# Restart nginx nếu cần
sudo systemctl restart nginx

# Xem container logs
docker logs pofology
docker logs -f pofology  # Real-time logs
```

