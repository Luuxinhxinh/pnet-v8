---
title: "Level 2 — F61: Khôi phục Mật khẩu Tự phục vụ (Password Reset Workflow)"
feature_id: "F61"
feature_group: "11-user-security"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F61: KHÔI PHÚC MẬT KHẨU TỰ PHỤC VỤ (PASSWORD RESET WORKFLOW)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp quy trình tự phục vụ (Self-Service) cho phép người dùng khôi phục mật khẩu khi bị quên mà không cần phải liên hệ trực tiếp với quản trị viên: Nhập email tài khoản -> Nhận link đặt lại mật khẩu kèm mã token bí mật dùng một lần qua email -> Thiết lập mật khẩu mới an toàn.
- **Đối tượng sử dụng**: Người dùng quên mật khẩu.
- **Thời điểm kích hoạt**: Khi click vào liên kết "Forgot password?" trên màn hình đăng nhập.

## 2. Cơ chế Chạy (Mechanism)
1. **Yêu cầu Khôi phục Mật khẩu**:
   - Người dùng nhập email tại trang `/reset-password/`.
   - Gửi `POST /api/password-reset/check` kèm địa chỉ email.
2. **Sinh Token Dùng Một Lần (One-Time Token Generation)**:
   - `password_reset.php` kiểm tra email có tồn tại trong bảng `users` hay không.
   - Sinh mã token ngẫu nhiên bảo mật 64 ký tự hex.
   - Băm token bằng SHA-256 trước khi lưu vào bảng `password_resets` (`email`, `token_hash`, `expires_at = NOW() + 1 hour`).
3. **Gửi Email Kèm Đường dẫn Khôi phục**:
   - Sử dụng thư viện `smtp_mailer.php` gửi email chứa đường dẫn: `https://<pnet_server>/reset-password/?token=<raw_token>`.
4. **Tiêu thụ Token & Cập nhật Mật khẩu Mới (Token Consumption)**:
   - Khi người dùng click link và nhập mật khẩu mới:
   - Gửi `POST /api/password-reset/consume` với `token` và `new_password`.
   - Hệ thống tìm bản ghi trong bảng `password_resets` có `token_hash` tương ứng và kiểm tra `expires_at > NOW()`.
   - Nếu hợp lệ: Băm mật khẩu mới bằng Bcrypt, cập nhật vào bảng `users`, và xóa ngay lập tức bản ghi token trong `password_resets` để chống dùng lại (Replay Attack).

## 3. Công nghệ & Cơ sở Sử dụng
- **One-Time Token Storage Pattern**: Lưu hash của token thay vì lưu token thô để phòng ngừa lộ token khi bị rò rỉ cơ sở dữ liệu.
- **Token Invalidation on Use**: Hủy token ngay sau lần dùng đầu tiên.

## 4. File / Hàm Liên quan
| [`/opt/unetlab/html/includes/password_reset.php`](../../../opt/unetlab/html/includes/password_reset.php) | `password_reset_create_token()`, `password_reset_consume()`, `password_reset_lookup()` | Xử lý vòng đời mã token xác thực và cập nhật mật khẩu mới |
| [`/opt/unetlab/html/includes/smtp_mailer.php`](../../../opt/unetlab/html/includes/smtp_mailer.php) | `smtp_send_mail()`, `password_reset_send_token()` | Gửi email khôi phục mật khẩu bảo mật qua TLS |
| [`/opt/unetlab/html/reset-password/`](../../../opt/unetlab/html/reset-password)/` | HTML / JS Views | Giao diện trang nhập email và đặt mật khẩu mới |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/password-reset/consume` với token và mật khẩu mới.
- **Output**: `{ "status": "success", "message": "Password updated successfully" }`.
- **Edge Cases**: Token đã hết hạn (> 1 giờ) -> Ném lỗi `Token has expired. Please request a new password reset link.`

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f61-password-reset-workflow-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f61-password-reset-workflow-sequence.md)
