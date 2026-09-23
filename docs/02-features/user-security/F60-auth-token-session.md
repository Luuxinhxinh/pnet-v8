---
title: "Level 2 — F60: Xác thực Đăng nhập & Quản lý Phiên (Auth Token & Session)"
feature_id: "F60"
feature_group: "11-user-security"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F60: XÁC THỰC ĐĂNG NHẬP & QUẢN LÝ PHIÊN (AUTH TOKEN & SESSION)

## 1. Mô tả Tính năng
- **Mục đích**: Xác thực định danh người dùng qua username và password; cấp phát Cookie Token an toàn có ký số; kiểm tra thời hạn phiên làm việc (Session Lifetime / Inactivity Timeout); và xử lý quy trình đăng xuất an toàn xóa sạch dấu vết phiên.
- **Đối tượng sử dụng**: Tất cả người dùng đăng nhập hệ thống.
- **Thời điểm kích hoạt**: Khi truy cập trang login `/login/` hoặc khi gọi bất kỳ API nào cần xác thực.

## 2. Cơ chế Chạy (Mechanism)
1. **Quy trình Đăng nhập (Login Flow)**:
   - Người dùng gửi `POST /api/auth` với `{"username": "admin", "password": "password"}`.
   - `api_authentication.php::apiAuthentication()` truy vấn bảng `users` tìm `username`.
   - So khớp mật khẩu qua hàm `password_verify($password, $user['password'])`.
2. **Cấp phát Secure Cookie Token**:
   - Sinh chuỗi ngẫu nhiên bảo mật 64 ký tự (Cryptographically Secure Pseudo-Random Bytes).
   - Thiết lập Cookie `token` với các cờ bảo vệ bắt buộc: `HttpOnly` (chống tấn công XSS lấy cắp cookie), `SameSite=Lax`, và `Secure` (nếu chạy HTTPS).
   - Lưu trữ ánh xạ token vào bảng phiên hoặc cache session.
3. **Kiểm tra Phiên làm việc (Session Verification Hook)**:
   - Trong middleware của Slim Framework (`api.php`), mỗi request đều đọc `$app->getCookie('token')`.
   - Đối chiếu token, cập nhật thời gian hoạt động cuối (`last_activity = time()`).
   - Nếu thời gian không hoạt động vượt quá `session_timeout` (mặc định 3600s / 1 giờ), hệ thống xóa token và trả về `401 Unauthorized`.
4. **Quy trình Đăng xuất (Logout Flow)**:
   - Gửi `GET /api/auth/logout`.
   - Backend gọi `$app->deleteCookie('token')`, hủy phiên và chuyển hướng người dùng về màn hình đăng nhập.

## 3. Công nghệ & Cơ sở Sử dụng
- **Bcrypt / Argon2i Password Hashing**: Tiêu chuẩn băm mật khẩu chống tấn công vét cạn (Brute-Force) và Rainbow Tables.
- **HTTP-Only Cookies**: Bảo vệ chống trích xuất phiên từ mã JavaScript độc hại.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/includes/api_authentication.php`](../../../opt/unetlab/html/includes/api_authentication.php)](../../../html/includes/api_authentication.php) | `apiAuthentication()`, `authorization()` | Xác thực thông tin đăng nhập và cấp token |
| [`[`/opt/unetlab/html/api.php`](../../../opt/unetlab/html/api.php)](../../../html/api.php) | Middleware `$app->hook('slim.before')` | Bộ lọc kiểm tra phiên trước mọi API |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/auth` với username và password.
- **Output**: `{ "code": 200, "status": "success", "user": { "username": "admin", "role": "admin" } }` kèm HTTP-Only Set-Cookie Header.
- **Edge Cases**: Nhập sai mật khẩu quá 5 lần liên tiếp -> Kích hoạt cơ chế khóa tạm thời (Account Lockout) trong 5 phút để chống Brute-Force.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f60-auth-token-session-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f60-auth-token-session-sequence.md)
