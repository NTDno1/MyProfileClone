# 🌸 Feminine Bio Link Studio (Canva Set of 3 Templates + Admin Dashboard)

Trang **Link in Bio** mềm mại, nữ tính, chuẩn theo bộ 3 mẫu thiết kế Canva, tối ưu 100% cho giao diện điện thoại di động (Instagram / TikTok / Facebook In-App Browser) và tích hợp sẵn **Trang Quản Trị (`/admin`)** xem trước trực tiếp theo thời gian thực.

---

## ✨ Tính năng nổi bật

1. **Tích hợp trọn bộ 3 Mẫu Bố Cục Canva (Chuyển đổi 1-Click trong Admin):**
   - **Mẫu 1 (`Bokeh Dream`):** Khung ảnh đại diện tròn cổ điển, nút bấm màu nổi bật, hàng icon mạng xã hội tròn ở dưới.
   - **Mẫu 2 (`Organic Muse`):** Khung Oval trắng nghệ thuật lệch nhẹ sau ảnh đại diện, nút bấm trắng mờ (Frosted Glass), icon mạng xã hội ở dưới.
   - **Mẫu 3 (`Editorial Portrait`):** Ảnh chân dung tràn toàn màn hình, hàng icon mạng xã hội ở trên cùng, kèm thẻ Banner bộ sưu tập (`GET MY ENTIRE COLLECTION`) có khung viền trắng ở dưới.

2. **7 Bảng Màu Nữ Tính Mềm Mại (1-Click Preset) & Hiệu ứng động:**
   - 🌸 **Hồng Phấn Mềm Mại (Blush Rose)**
   - 🩵 **Xanh Vũ Khúc (Chuẩn mẫu Canva 2 & 3)**
   - 💎 **Xanh Ngọc Biển (Chuẩn mẫu Canva 1)**
   - 💜 **Tím Oải Hương (Lavender Dream)**
   - 🍑 **Cam Đào Ngọt Ngào (Peach Velvet)**
   - 🍵 **Xanh Bơ Thanh Lịch (Matcha Silk)**
   - 珍珠 **Trắng Kem Tiểu Thư (Pearl Luxury)**
   - Hiệu ứng hạt **Bokeh lung linh**, **Cánh hoa anh đào rơi 🌸**, hoặc **Ánh sao lấp lánh ✨**.

3. **Trang Quản Trị (`/admin`) thay đổi mọi thứ:**
   - Tải ảnh đại diện, ảnh nền, ảnh banner trực tiếp từ điện thoại/máy tính (tự động nén nhẹ & lưu vào `/uploads`).
   - Thêm, sửa, xóa, sắp xếp thứ tự các nút đường dẫn, chọn từ **30+ icon** (Shopee, TikTok, Instagram, Facebook, Zalo, Túi mua sắm, Trái tim, Lấp lánh, Sách, Quà tặng...), gắn nhãn `HOT` / `NEW` / `FREE` và hiệu ứng ánh sáng `Shimmer`.
   - Đếm số lượt xem trang Bio & số lượt click vào từng đường dẫn.
   - Xem trước trực tiếp trên màn hình mô phỏng iPhone ngay khi đang gõ.

---

## 🚀 Cách chạy trên máy (Local)

```bash
cd bio-link
npm install
npm start
```

- **Trang Bio chính:** [http://localhost:3005](http://localhost:3005)
- **Trang Quản trị (Admin):** [http://localhost:3005/admin](http://localhost:3005/admin)
  - **Tài khoản mặc định:** `admin`
  - **Mật khẩu mặc định:** `123` *(Có thể đổi trong mục Cài đặt)*

---

## 🐳 Cách chạy bằng Docker trên VPS (Siêu nhẹ, chỉ tốn ~20MB RAM)

```bash
cd bio-link
docker compose up -d --build
```