---
title: "Level 1 — Nhóm 11: Quản lý Người dùng, Phân quyền POD & Bảo mật PKI"
group_id: "G11"
group_name: "User Management, Security, POD Isolation & PKI Subsystem"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 1"
---

# NHÓM 11: QUẢN LÝ NGƯỜI DÙNG, PHÂN QUYỀN POD & BẢO MẬT PKI (USER, SECURITY, POD & PKI)

## 1. Mục đích của Nhóm Tính năng

Nhóm **Quản lý Người dùng, Phân quyền POD & Bảo mật PKI** thiết lập bức tường an ninh, xác thực danh tính và đảm bảo khả năng cô lập tài nguyên đa người dùng (Multi-tenancy):
1. **Kiến trúc Cô lập Không gian Làm việc theo POD (POD Multi-Tenant Isolation)**: Phân bổ cho mỗi tài khoản người dùng một số POD duy nhất (từ 0 đến 128). Mỗi POD có thư mục làm việc riêng biệt (`/opt/unetlab/tmp/<pod>/`), dải port mạng riêng và không thể can thiệp hoặc nhìn trộm thiết bị của POD khác.
2. **Kiểm soát Truy cập Dựa trên Vai trò (Role-Based Access Control - RBAC)**: Quản lý các cấp độ quyền hạn nghiêm ngặt (Admin: toàn quyền cấu hình cụm, hệ thống, template; User: chỉ thao tác trong phạm vi lab được giao; Offline: chế độ thực hành không cần kết nối mạng ngoài).
3. **Quản lý Phiên & Token Xác thực An toàn (Secure Cookie Token & Session Lifecycle)**: Áp dụng cơ chế Cookie Token kết hợp băm mật khẩu Argon2i/Bcrypt, thiết lập hạn sử dụng phiên và bảo vệ chống tấn công CSRF / Session Hijacking.
4. **Quy trình Khôi phục Mật khẩu Tự phục vụ (Self-Service Password Reset Workflow)**: Cho phép người dùng yêu cầu đặt lại mật khẩu qua email; sinh mã token một lần có thời hạn kiểm tra tại bảng `password_resets` (`password_reset.php`).
5. **Cấu hình Dịch vụ Gửi Mail Hệ thống (SMTP Mailer & Notification Engine)**: Quản lý cấu hình kết nối SMTP (SSL/TLS, cổng, chứng thực) và các mẫu email thông báo hệ thống (`smtp_mailer.php`).
6. **Hạ tầng Khóa Công khai Cụm (Cluster PKI & Certificate Management)**: Tự động khởi tạo Certificate Authority (CA) nội bộ, phát hành và ký chứng chỉ số SSL/mTLS cho các máy chủ vệ tinh Satellite kết nối vào Master an toàn tuyệt đối (`pnet-pki.py`, `pki/api.php`).
7. **Nhật ký Hoạt động & Kiểm toán An ninh (Activity Log & Security Audit)**: Ghi lại chi tiết mọi hành vi đăng nhập, tạo, sửa, xóa node, xuất cấu hình vào bảng cơ sở dữ liệu `activity_log`.

---

## 2. Danh sách Toàn bộ Tính năng Con Thuộc Nhóm (Dẫn tới Level 2)

Dưới đây là 5 tính năng con độc lập thuộc Nhóm 11, được đặc tả chi tiết tại thư mục `02-features/user-security/`:

| Mã tính năng | Tên tính năng con | File tài liệu Level 2 | Tóm tắt Chức năng |
| :---: | :--- | :--- | :--- |
| **F59** | **Phân quyền Vai trò & Cách ly POD (RBAC & POD Isolation)** | [`F59-user-rbac-pod-isolation.md`](../02-features/user-security/F59-user-rbac-pod-isolation.md) | Quản lý bảng `users`, `user_roles`, `user_permission`; gán số POD và kiểm soát giới hạn tài nguyên |
| **F60** | **Xác thực Đăng nhập & Quản lý Phiên (Auth Token & Session)** | [`F60-auth-token-session.md`](../02-features/user-security/F60-auth-token-session.md) | Luồng đăng nhập `/api/auth`, cấp phát HTTP-Only Cookie Token, kiểm tra timeout và đăng xuất |
| **F61** | **Khôi phục Mật khẩu Tự phục vụ (Password Reset Workflow)** | [`F61-password-reset-workflow.md`](../02-features/user-security/F61-password-reset-workflow.md) | Sinh token ngẫu nhiên bảo mật cao, gửi link qua email và xác thực đặt lại mật khẩu mới |
| **F62** | **Cấu hình Gửi Mail & Mẫu Thông báo (SMTP Mailer)** | [`F62-smtp-mailer-notifications.md`](../02-features/user-security/F62-smtp-mailer-notifications.md) | Cấu hình máy chủ SMTP, gửi mail kiểm tra kết nối và tùy biến nội dung mẫu email gửi người dùng |
| **F63** | **Quản lý Chứng chỉ Số Cụm (Cluster PKI & Certificates)** | [`F63-cluster-pki-certificates.md`](../02-features/user-security/F63-cluster-pki-certificates.md) | Script `pnet-pki.py`: Khởi tạo CA, sinh cặp khóa RSA 4096-bit, ký chứng chỉ mTLS cho Satellite |

---

## 3. Các Module & File Mã nguồn Chịu trách nhiệm Chính

| Đường dẫn File / Thư mục | Ngôn ngữ / Loại | Vai trò chính |
| :--- | :--- | :--- |
| `/opt/unetlab/html/includes/api_authentication.php` | PHP | Xác thực thông tin đăng nhập, sinh session token và kiểm tra quyền truy cập API |
| `/opt/unetlab/html/includes/api_uusers.php` | PHP | Nghiệp vụ CRUD người dùng, gán POD, phân quyền role |
| `/opt/unetlab/html/users/api.php` | PHP | REST API phục vụ giao diện quản lý người dùng |
| `/opt/unetlab/html/includes/password_reset.php` | PHP | Xử lý logic sinh token, kiểm tra hạn và cập nhật mật khẩu mới |
| `/opt/unetlab/html/includes/smtp_mailer.php` | PHP | Thư viện gửi email qua giao thức SMTP (hỗ trợ STARTTLS và SSL) |
| `/opt/unetlab/html/includes/activity_log.php` | PHP | Ghi lại hành vi người dùng vào bảng `activity_log` |
| `/opt/unetlab/scripts/pki/pnet-pki.py` | Python (22KB) | Quản lý vòng đời chứng chỉ số X.509, khởi tạo Root CA và phát hành Cert cho nodes |
| `/opt/unetlab/html/pki/api.php` | PHP | API kích hoạt sinh cert cho vệ tinh |
| `/opt/unetlab/html/main/js/users.js` | JavaScript | Giao diện quản lý người dùng, tạo tài khoản, phân quyền POD |
| `/opt/unetlab/html/main/js/mail-settings.js` | JavaScript | Giao diện thiết lập cấu hình SMTP server |

---

## 4. Sơ đồ Component Diagram (C4 Level 3: Security & PKI Subsystem)

```mermaid
C4Component
    title C4 Level 3: Sơ đồ Thành phần Nhóm 11 (User Management, Security, POD & PKI)

    Container_Boundary(user_browser, "Giao diện Quản trị An ninh (Browser)") {
        Component(users_ui, "users.js", "User Management UI", "Thêm/xóa user, gán role admin/user, cấu hình POD ID")
        Component(login_ui, "login/index.html", "Login & Reset UI", "Form đăng nhập và form yêu cầu quên mật khẩu")
        Component(mail_ui, "mail-settings.js", "Mail Settings UI", "Nhập thông tin SMTP host, port, user, password")
    }

    Container_Boundary(security_backend, "Tầng Backend Security & Auth APIs (PHP)") {
        Component(auth_api, "api_authentication.php", "Auth & RBAC Service", "Kiểm tra mật khẩu băm, tạo token phiên")
        Component(uusers_api, "api_uusers.php", "User CRUD Service", "Tạo thư mục POD /opt/unetlab/tmp/<pod>")
        Component(pw_reset, "password_reset.php", "Password Reset Service", "Tạo token ngẫu nhiên và kiểm tra thời hạn")
        Component(mailer_svc, "smtp_mailer.php", "SMTP Mailer Service", "Gửi email kích hoạt hoặc link reset mật khẩu")
        Component(audit_svc, "activity_log.php", "Audit Trail Service", "Ghi log truy cập vào MariaDB")
    }

    Container_Boundary(pki_subsystem, "Tầng Hạ tầng Chứng chỉ Số (PKI)") {
        Component(pki_api, "pki/api.php", "PKI API Controller", "Nhận yêu cầu cấp chứng chỉ cho vệ tinh")
        Component(pki_engine, "pnet-pki.py", "X.509 PKI Engine", "Tương tác với OpenSSL sinh Root CA, CSR và Certificate")
    }

    Container_Boundary(security_db, "Cơ sở Dữ liệu Hệ thống (MariaDB: pnetlab_db)") {
        Component(tbl_users, "users & user_roles", "User Tables", "Lưu username, password hash, role, pod_id")
        Component(tbl_resets, "password_resets", "Reset Tokens", "Lưu email, token hash, expired_at")
        Component(tbl_logs, "activity_log", "Audit Log Table", "Lưu user, IP, action, timestamp")
    }

    Rel(login_ui, auth_api, "POST /api/auth", "Username + Password")
    Rel(auth_api, tbl_users, "Truy vấn kiểm tra hash", "SELECT password FROM users")
    Rel(auth_api, audit_svc, "Ghi log đăng nhập thành công", "logActivity()")
    Rel(audit_svc, tbl_logs, "INSERT", "activity_log")
    Rel(users_ui, uusers_api, "POST /api/uusers", "Tạo user mới kèm gán POD")
    Rel(uusers_api, tbl_users, "INSERT INTO users", "Lưu thông tin tài khoản")
    Rel(login_ui, pw_reset, "POST /api/password-reset/check", "Gửi email reset")
    Rel(pw_reset, tbl_resets, "Lưu token một lần", "INSERT INTO password_resets")
    Rel(pw_reset, mailer_svc, "Gửi email cho người dùng", "sendMail()")
    Rel(mail_ui, mailer_svc, "PUT /api/admin/mail", "Lưu cấu hình SMTP")
    Rel(users_ui, pki_api, "POST /pki/api.php", "Yêu cầu sinh cert cho Satellite")
    Rel(pki_api, pki_engine, "Gọi script", "python3 pnet-pki.py generate-cert")
```

---

> 👉 **Xem chi tiết từng tính năng con**:
> 1. [`F59-user-rbac-pod-isolation.md`](../02-features/user-security/F59-user-rbac-pod-isolation.md) — Phân quyền Vai trò & Cách ly POD (RBAC & POD Isolation)
> 2. [`F60-auth-token-session.md`](../02-features/user-security/F60-auth-token-session.md) — Xác thực Đăng nhập & Quản lý Phiên (Auth Token & Session)
> 3. [`F61-password-reset-workflow.md`](../02-features/user-security/F61-password-reset-workflow.md) — Khôi phục Mật khẩu Tự phục vụ (Password Reset Workflow)
> 4. [`F62-smtp-mailer-notifications.md`](../02-features/user-security/F62-smtp-mailer-notifications.md) — Cấu hình Gửi Mail & Mẫu Thông báo (SMTP Mailer)
> 5. [`F63-cluster-pki-certificates.md`](../02-features/user-security/F63-cluster-pki-certificates.md) — Quản lý Chứng chỉ Số Cụm (Cluster PKI & Certificates)
