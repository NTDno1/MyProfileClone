# Deploy file-storage (lưu file tập trung cho pofology + bio-link)

```bash
cd /var/www/MyProfileClone && git pull origin main

# 1. Clone file cũ sang kho tập trung /var/www/MyProfileClone/storage-data
bash file-storage/migrate-existing-files.sh

# 2. Mạng chung + container file-storage (~7MB RAM)
docker network create profile-net 2>/dev/null || true
cd file-storage && docker build -t file-storage:latest .
docker rm -f file-storage
docker run -d --name file-storage --restart unless-stopped --network profile-net \
  --memory 32m -p 127.0.0.1:3010:3010 \
  -v /var/www/MyProfileClone/storage-data:/storage \
  -e STORAGE_API_KEY=myprofile_storage_2026_key file-storage:latest

# 3. Bio-link (tự clone + đổi link /uploads -> /media/bio-link)
cd ../bio-link && docker build -t bio-link:latest .
docker rm -f bio-link
docker run -d --name bio-link --restart unless-stopped --network profile-net \
  -p 127.0.0.1:3005:3005 \
  -v /var/www/MyProfileClone/bio-link/data:/app/data \
  -v /var/www/MyProfileClone/bio-link/uploads:/app/uploads \
  -e FILE_SERVER_URL=http://file-storage:3010 \
  -e STORAGE_API_KEY=myprofile_storage_2026_key bio-link:latest

# 4. Pofology
cd ../pofology && docker build -t portfolio:latest .
docker rm -f portfolio
docker run -d --name portfolio --restart unless-stopped --network profile-net \
  -p 127.0.0.1:3000:3000 portfolio:latest

docker image prune -f; docker ps; curl -s http://127.0.0.1:3010/health
```

Đổi `STORAGE_API_KEY` thành chuỗi bí mật riêng (dùng chung cho file-storage và bio-link).
