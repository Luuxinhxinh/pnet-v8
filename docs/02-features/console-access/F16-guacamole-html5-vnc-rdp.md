---
title: "Level 2 — F16: Tích hợp Guacamole HTML5 VNC/RDP"
feature_id: "F16"
feature_group: "03-console-access"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F16: TÍCH HỢP GUACAMOLE HTML5 VNC/RDP (GUACAMOLE HTML5 GRAPHIC CONSOLE)

## 1. Mô tả Tính năng
- **Mục đích**: Nhúng màn hình đồ họa trực quan (GUI) của các hệ điều hành máy tính (Windows 10/11, Windows Server, Ubuntu Desktop) và các thiết bị tường lửa quản trị qua web (Fortigate GUI, Palo Alto GUI) ngay trên trình duyệt mà không cần cài VNC Viewer hay Remote Desktop Client.
- **Đối tượng sử dụng**: Người thực hành cấu hình máy chủ đồ họa hoặc tường lửa web.
- **Thời điểm kích hoạt**: Khi click vào node có cấu hình kiểu console là `vnc` hoặc `rdp`.

## 2. Cơ chế Chạy (Mechanism)
1. **Khởi tạo Phiên Đồ họa**:
   - Khi node Windows khởi động, QEMU mở màn hình VNC tại cổng TCP `5900 + node_id`.
   - Người dùng click mở Console trên giao diện Canvas.
2. **Cấp Quyền & Sinh Tham số Guacamole**:
   - Backend PHP nạp thông số kết nối từ cơ sở dữ liệu `guacdb` (Host: 127.0.0.1, Port: 5900+X, Password nếu có).
   - Mã hóa đối tượng kết nối thành chuỗi Token ký HMAC.
3. **Cầu nối Guacamole Lite Server**:
   - Client nạp thư viện `guacamole-common-js` và kết nối WebSocket tới `guacamole-lite-server.js` (Node.js).
   - `guacamole-lite-server.js` giải mã Token, kết nối qua giao thức Guacamole thuần tới daemon C `guacd` (cổng 4822).
4. **Render Đồ họa Canvas**:
   - Daemon `guacd` đóng vai trò VNC/RDP Client, nhận khung hình ảnh từ QEMU, nén dạng PNG/JPEG delta streams và gửi qua tunnel.
   - Thư viện Guacamole trên trình duyệt vẽ trực tiếp các khối ảnh thay đổi lên thẻ HTML5 Canvas kèm con trỏ chuột đồng bộ.

## 3. Công nghệ & Cơ sở Sử dụng
- **Apache Guacamole & Guacamole Lite**: Nền tảng Gateway Remote Desktop không cần cài đặt phía máy khách.
- **Giao thức Guacamole Protocol**: Giao thức truyền tải đồ họa tối ưu hóa băng thông dạng văn bản mô tả chỉ thị vẽ hình.
- **MySQL `guacdb`**: Cơ sở dữ liệu lưu trữ lịch sử kết nối, tài khoản và tham số mapping port VNC.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/pnet-webconsole/backend/guacamole-lite-server.js`](../../../opt/pnet-webconsole/backend/guacamole-lite-server.js)](../../../../pnet-webconsole/backend/guacamole-lite-server.js) | Node.js Server | Chuyển đổi WebSocket sang giao thức guacd |
| `/etc/pnet-webconsole/guac.env` | Config env | Chứa thông tin đăng nhập MySQL guacdb và port guacd |
| [`[`/opt/unetlab/html/rdp/index.php`](../../../opt/unetlab/html/rdp/index.php)](../../../html/rdp/index.php) | PHP | Trang nhúng trình xem đồ họa Guacamole |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Tọa độ di chuyển chuột và phím bấm từ trình duyệt.
- **Output**: Luồng hình ảnh giao diện đồ họa máy ảo hiển thị mượt mà 60 FPS.
- **Edge Cases**: Máy ảo chưa nạp xong driver card màn hình -> Màn hình hiển thị "Connecting to server..." cho đến khi VNC port mở.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f16-guacamole-html5-vnc-rdp-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f16-guacamole-html5-vnc-rdp-sequence.md)
