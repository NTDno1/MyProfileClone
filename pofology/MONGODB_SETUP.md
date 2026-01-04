# Hướng dẫn khắc phục lỗi kết nối MongoDB

## Lỗi SSL/TLS Connection

Nếu bạn gặp lỗi `SSL routines:ssl3_read_bytes:tlsv1 alert internal error`, hãy thử các bước sau:

### 1. Kiểm tra IP Whitelist trên MongoDB Atlas

1. Đăng nhập vào [MongoDB Atlas](https://cloud.mongodb.com/)
2. Vào **Network Access** (hoặc **Security** > **Network Access**)
3. Click **Add IP Address**
4. Chọn **Allow Access from Anywhere** (0.0.0.0/0) để cho phép tất cả IP
   - Hoặc thêm IP cụ thể của bạn
5. Click **Confirm**

### 2. Kiểm tra Connection String

Đảm bảo connection string có format đúng:
```
mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

**Lưu ý:**
- Nếu password có ký tự đặc biệt, cần encode URL (ví dụ: `@` thành `%40`)
- Username và password phải đúng với database user trên MongoDB Atlas

### 3. Kiểm tra Database User

1. Vào **Database Access** trên MongoDB Atlas
2. Đảm bảo user có quyền **Read and write to any database**
3. Nếu chưa có, tạo user mới với password

### 4. Test Connection

Sau khi cập nhật IP whitelist, đợi 1-2 phút rồi thử lại.

Nếu vẫn lỗi, kiểm tra:
- Firewall/antivirus có chặn kết nối không
- Internet connection có ổn định không
- MongoDB Atlas cluster có đang hoạt động không

### 5. Alternative: Sử dụng Environment Variables

Tạo file `.env.local` trong root project:

```env
MONGODB_URI=mongodb+srv://datt19112001_db_user:1@mongodbdatnt.bc8xywz.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=signalr_chat
MONGODB_COLLECTION=analytics
```

Sau đó cập nhật `src/lib/mongodb.ts` để sử dụng environment variables.

