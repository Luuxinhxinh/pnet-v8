---
title: "Level 2 — F62: Cấu hình Gửi Mail & Mẫu Thông báo (SMTP Mailer)"
feature_id: "F62"
feature_group: "11-user-security"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F62: CẤU HÌNH GỬI MAIL & MẪU THÔNG BÁO (SMTP MAILER)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp phân hệ gửi email thông báo hệ thống của PNet v8: Thiết lập thông số kết nối máy chủ thư điện tử (SMTP Server, Port 25/465/587, Kiểu mã hóa SSL/TLS, Tài khoản và Mật khẩu SMTP), kiểm thử kết nối gửi email thử nghiệm (Test Email), và tùy biến nội dung các mẫu email thông báo (HTML Templates: Email kích hoạt tài khoản, Email đặt lại mật khẩu, Email cảnh báo máy chủ quá tải).
- **Đối tượng sử dụng**: Quản trị viên hệ thống.
- **Thời điểm kích hoạt**: Khi thiết lập hệ thống hoặc trong trang quản trị "Mail Settings".

## 2. Cơ chế Chạy (Mechanism)
1. **Lưu Trữ Cấu hình SMTP**:
   - `PUT /api/admin/mail` lưu thông số SMTP vào bảng cấu hình hoặc file cấu hình hệ thống: `host`, `port`, `smtp_auth`, `username`, `password`, `encryption`, `from_email`, `from_name`.
2. **Kiểm Thử Kết Nối (SMTP Connection Test)**:
   - Khi bấm "Send Test Email": `POST /api/admin/mail/test` kích hoạt thư viện `smtp_mailer.php`.
   - Mở socket TCP đến máy chủ SMTP, thực hiện bắt tay EHLO, STARTTLS, xác thực AUTH LOGIN.
   - Gửi thử một bức thư mẫu tới email quản trị viên và báo cáo kết quả chi tiết (SMTP Transaction Logs).
3. **Quản lý Mẫu Thư (Email Templates)**:
   - Các mẫu email được lưu dưới dạng file HTML có biến số thay thế (ví dụ `{{username}}`, `{{reset_link}}`, `{{server_name}}`).
   - `PUT /api/admin/mail/template/(:kind)` cho phép sửa đổi giao diện và câu chữ của email gửi ra.

## 3. Công nghệ & Cơ sở Sử dụng
- **SMTP Protocol (RFC 5321) & STARTTLS (RFC 3207)**: Giao thức truyền tải thư điện tử bảo mật chuẩn quốc tế.
- **PHPMailer / Native Stream Socket Client**: Thư viện socket xử lý giao tiếp SMTP tin cậy.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/includes/smtp_mailer.php`](../../../html/includes/smtp_mailer.php)](../../../html/includes/smtp_mailer.php) | `SMTPMailer`, `sendMail()`, `testConnection()` | Lõi gửi email qua SMTP socket (9.4KB) |
| [`[`/opt/unetlab/html/main/js/mail-settings.js`](../../../html/main/js/mail-settings.js)](../../../html/main/js/mail-settings.js) | JavaScript | Giao diện cấu hình máy chủ gửi thư |
| [`[`/opt/unetlab/html/api.php`](../../../html/api.php)](../../../html/api.php) | Các route `/api/admin/mail/*` | REST API quản trị cấu hình mail |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/admin/mail/test` với `{ "recipient": "admin@domain.com" }`.
- **Output**: `{ "code": 200, "status": "success", "message": "Test email sent successfully" }`.
- **Edge Cases**: Máy chủ SMTP yêu cầu xác thực 2 lớp (như Gmail App Password) bị từ chối đăng nhập -> Thư viện trả về mã lỗi `SMTP Error 535: Authentication failed`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f62-smtp-mailer-notifications-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f62-smtp-mailer-notifications-sequence.md)
