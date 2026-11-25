# 🚀 NA 2HAND Playwright Browser Companion (Tự mở Chrome & Kéo Shopee / TikTok Shop)

Công cụ này chạy ngay trên máy tính cá nhân của bạn để khi bạn bấm nút **"🚀 Mở Trình Duyệt & Kéo Sản Phẩm Về Ngay"** trong trang Quản trị Shop (`/shop-admin`), máy tính của bạn sẽ tự động bật trình duyệt **Google Chrome thật**, vào đúng link **Shopee** hoặc **TikTok Shop**, tự cuộn trang, lấy bộ ảnh HD + tên + giá + size/màu và đẩy thẳng lên MongoDB Atlas (`na2hand_shop`) mà **không cần xin API của Shopee hay TikTok**.

## Cách chạy (Chỉ 2 bước trên máy tính của bạn)

```bash
cd bio-link/browser-tools/playwright-sync
npm install
npm start
```

- Sau khi hiện dòng `🎀 NA 2HAND Playwright Browser Sync đang chạy tại: http://127.0.0.1:3899`, đèn trạng thái trên trang `/shop-admin` (kể cả trên `https://na2hand.com/shop-admin`) sẽ chuyển sang **🟢 Playwright Sẵn Sàng**.
- Lưu ý: Công cụ lưu hồ sơ trình duyệt riêng tại `./chrome-profile`. Nếu lần đầu tiên vào Shopee mà sàn yêu cầu đăng nhập tài khoản người mua, bạn chỉ cần đăng nhập bình thường trên cửa sổ Chrome vừa bật (công cụ **không** can thiệp hay vượt bất kỳ CAPTCHA nào để đảm bảo an toàn tuyệt đối cho tài khoản của bạn). Các lần sau trình duyệt tự nhớ phiên đăng nhập!
