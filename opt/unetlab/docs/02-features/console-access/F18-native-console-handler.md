---
title: "Level 2 — F18: Tích hợp Giao thức Native Terminal Client"
feature_id: "F18"
feature_group: "03-console-access"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F18: TÍCH HỢP GIAO THỨC NATIVE TERMINAL CLIENT (NATIVE CONSOLE INTEGRATION)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép các kỹ sư mạng mở trực tiếp ứng dụng dòng lệnh chuyên nghiệp ưa thích đã cài trên máy tính cá nhân (SecureCRT, PuTTY, SuperPuTTY, Royal TS, MobaXterm) chỉ với một cú nhấp chuột trên trình duyệt thay vì dùng Web Console.
- **Đối tượng sử dụng**: Kỹ sư mạng chuyên nghiệp cần các tính năng nâng cao (logging file, multi-tab layout, script automation).
- **Thời điểm kích hoạt**: Khi tùy chọn Console Type của người dùng được đặt là "Native Console" trong User Settings.

## 2. Cơ chế Chạy (Mechanism)
1. **Thiết lập URL Scheme Tùy biến**:
   - Khi cài đặt gói phần mềm PNetLab Client Pack trên máy Windows/macOS, một URL Protocol Handler tùy biến được đăng ký vào Windows Registry hoặc macOS LaunchServices (ví dụ scheme: `pnetlab://` hoặc gán đè `telnet://`).
2. **Sinh Đường dẫn Liên kết trên Canvas**:
   - Khi người dùng click vào node, `browsers.js` đọc chế độ console của tài khoản.
   - Sinh đường dẫn URI dạng: `telnet://<pnet_server_ip>:<calculated_port>`.
3. **Kích hoạt Ứng dụng Desktop**:
   - Trình duyệt web kích hoạt lệnh gọi hệ điều hành cục bộ (OS Shell Execute).
   - Hệ điều hành mở SecureCRT hoặc PuTTY với tham số truyền vào: `/T /TELNET <pnet_server_ip> <port>`.
4. **Kết nối Thẳng**:
   - Ứng dụng SecureCRT thiết lập trực tiếp phiên Telnet tới cổng công khai của máy chủ PNet v8.

## 3. Công nghệ & Cơ sở Sử dụng
- **Custom URI Scheme Handler**: Cơ chế của hệ điều hành cho phép trình duyệt kích hoạt ứng dụng desktop thông qua giao thức URL riêng.
- **Windows Registry Scripting (`.reg`)**: Đăng ký các khóa `HKEY_CLASSES_ROOT	elnet\shell\open\command`.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/themes/default/js/browsers.js`](../../../html/themes/default/js/browsers.js)](../../../html/themes/default/js/browsers.js) | `openNativeConsole()` | Sinh URL telnet/pnetlab và gọi trình duyệt mở |
| [`[`/opt/unetlab/html/includes/api_nodes.php`](../../../html/includes/api_nodes.php)](../../../html/includes/api_nodes.php) | `calculateConsolePort()` | Tính toán port Telnet chính xác |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Nhấp chuột vào biểu tượng Router trên Canvas.
- **Output**: Cửa sổ ứng dụng SecureCRT hoặc PuTTY bung mở và kết nối sẵn sàng.
- **Edge Cases**: Máy người dùng chưa cài Client Pack -> Trình duyệt hiển thị cảnh báo `No application is associated with the specified protocol`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f18-native-console-handler-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f18-native-console-handler-sequence.md)
