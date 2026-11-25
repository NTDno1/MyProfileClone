# 📦 File-Storage Container (Siêu Nhẹ ~6-8MB RAM cho cả Pofology & Bio-Link)

Container lưu trữ và phân phối file tập trung được viết bằng **Go thuần (Alpine Linux)** cực kỳ tiết kiệm tài nguyên cho VPS 1GB RAM:
- **Dung lượng Image**: ~10 MB
- **Tiêu thụ RAM thực tế**: **~6 – 10 MB RAM** (chỉ bằng 1/25 so với MinIO)
- **Phân vùng lưu trữ riêng biệt**:
  - `/storage/pofology/...` → Phục vụ `datnguyentien.online` (`/media/pofology/...`)
  - `/storage/bio-link/...` → Phục vụ `na2hand.com` (`/media/bio-link/...`)
- **Tự động bảo toàn dữ liệu**: Lưu bền vững ngoài ổ cứng VPS tại `/var/www/MyProfileClone/storage-data`, khi build lại bất kỳ web nào cũng không mất 1 file nào.
