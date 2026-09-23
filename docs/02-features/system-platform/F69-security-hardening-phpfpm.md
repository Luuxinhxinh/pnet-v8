---
title: "Level 2 — F69: Tăng Cứng Bảo mật Web & Tăng tốc PHP-FPM (Web Hardening)"
feature_id: "F69"
feature_group: "12-system-platform"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F69: TĂNG CỨNG BẢO MẬT WEB & TĂNG TỐC PHP-FPM (WEB HARDENING & PHP-FPM)

## 1. Mô tả Tính năng
- **Mục đích**: Tối ưu hóa hiệu năng phục vụ web và tăng cường an ninh cấp độ doanh nghiệp cho máy chủ web Apache: Chuyển đổi từ mô hình nhúng `mod_php` cũ sang kiến trúc tiến trình độc lập **PHP-FPM (FastCGI Process Manager)** kết hợp Apache MPM Event cho phép phục vụ hàng nghìn kết nối đồng thời với lượng RAM tối thiểu; đồng thời thiết lập các tiêu chuẩn tăng cứng an ninh web (Content Security Policy - CSP, chặn duyệt danh mục thư mục Indexes, ẩn phiên bản máy chủ ServerSignature, chặn Clickjacking X-Frame-Options).
- **Đối tượng sử dụng**: Quản trị viên hệ thống mạng doanh nghiệp.
- **Thời điểm kích hoạt**: Khi quản trị viên thực thi kịch bản gia cố bảo mật `enable-web-hardening.sh` và `enable-php-fpm.sh`.

## 2. Cơ chế Chạy (Mechanism)
1. **Chuyển đổi Mô hình Xử lý PHP-FPM (`enable-php-fpm.sh`)**:
   - Vô hiệu hóa module MPM Prefork và mod_php chậm chạp: `a2dismod php7.4 mpm_prefork`.
   - Kích hoạt module MPM Event và FastCGI Proxy: `a2enmod mpm_event proxy_fcgi setenvif`.
   - Cấu hình chuyển hướng request `.php` sang Unix Domain Socket của PHP-FPM: `/run/php/php7.4-fpm.sock`.
   - Khởi động lại Apache và PHP-FPM service.
2. **Gia Cố Bảo Mật Máy Chủ Web (`enable-web-hardening.sh` - 11KB)**:
   - Thêm các HTTP Security Response Headers:
     - `X-Content-Type-Options: nosniff` (chống tấn công MIME-sniffing).
     - `X-Frame-Options: SAMEORIGIN` (chống tấn công Clickjacking).
     - `Content-Security-Policy` (kiểm soát nguồn nạp script an toàn).
     - `Strict-Transport-Security: max-age=31536000` (ép buộc dùng HTTPS).
   - Tắt tính năng duyệt danh mục thư mục: `Options -Indexes`.
   - Ẩn thông tin nhạy cảm của máy chủ: `ServerTokens Prod` và `ServerSignature Off`.
   - Cấm truy cập các file ẩn và file cấu hình nhạy cảm (`.htaccess`, `.git`, `.env`).

## 3. Công nghệ & Cơ sở Sử dụng
- **PHP-FPM (FastCGI Process Manager)**: Trình quản lý tiến trình PHP hiệu năng cao hỗ trợ dynamic process pool.
- **Apache MPM Event (Multi-Processing Module)**: Mô hình xử lý bất đồng bộ dựa trên luồng và sự kiện (Event-driven).
- **OWASP Secure HTTP Headers Standard**: Các tiêu chuẩn bảo vệ ứng dụng web quốc tế.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/scripts/enable-web-hardening.sh`](../../../opt/unetlab/scripts/enable-web-hardening.sh)](../../../scripts/enable-web-hardening.sh) | Shell Script (11KB) | Kịch bản cấu hình các tiêu chuẩn an ninh Apache |
| [`[`/opt/unetlab/scripts/enable-php-fpm.sh`](../../../opt/unetlab/scripts/enable-php-fpm.sh)](../../../scripts/enable-php-fpm.sh) | Shell Script (3.7KB) | Kịch bản chuyển đổi sang PHP-FPM |
| `/etc/apache2/conf-available/security.conf` | Apache Config | Tệp cấu hình an ninh máy chủ web |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input CLI**: `sudo [`[`/opt/unetlab/scripts/enable-web-hardening.sh`](../../../opt/unetlab/scripts/enable-web-hardening.sh)](../../../scripts/enable-web-hardening.sh).
- **Output**: Báo cáo kiểm tra các tiêu chuẩn bảo mật đạt điểm A+ trên SecurityHeaders.
- **Edge Cases**: Có module ngoài cần nạp script inline bị CSP chặn -> Kịch bản tự động chèn cờ `'unsafe-inline'` hợp lệ cho riêng các thư viện giao diện Canvas.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f69-security-hardening-phpfpm-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f69-security-hardening-phpfpm-sequence.md)
