---
title: "Level 2 — F15: Cầu nối WebConsole WebSocket (WebSocket CLI Bridge)"
feature_id: "F15"
feature_group: "03-console-access"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F15: CẦU NỐI WEBCONSOLE WEBSOCKET (WEBSOCKET CLI BRIDGE)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp khả năng mở cửa sổ dòng lệnh (CLI Terminal) của bất kỳ router, switch hoặc máy chủ nào ngay trên trình duyệt web mà không cần cài đặt phần mềm bên ngoài (Zero-Client).
- **Đối tượng sử dụng**: Học viên, kỹ sư cấu hình thiết bị.
- **Thời điểm kích hoạt**: Khi click vào biểu tượng một node đang chạy trên Canvas ở chế độ Web Console.

## 2. Cơ chế Chạy (Mechanism)
1. **Khởi tạo Phiên Terminal trên Trình duyệt**:
   - `pnetlab-webconsole.js` mở một tab hoặc cửa sổ popup mới, nhúng thư viện `xterm.js`.
   - Gọi API lấy token bảo mật tạm thời từ `token_mint.php`.
2. **Thiết lập Kết nối WebSocket**:
   - Trình duyệt tạo kết nối WebSocket an toàn: `wss://<host>/ws-cli?token=<token>&port=<console_port>`.
   - Apache reverse proxy tiếp nhận qua `mod_proxy_wstunnel` và chuyển tiếp nội bộ tới cổng `8080`.
3. **Cầu nối Daemon `http_ws_bridge.py` & `console_mux.py`**:
   - Daemon Python `http_ws_bridge.py` tiếp nhận frame WebSocket.
   - Giải mã token và xác thực quyền truy cập đối với port console được yêu cầu.
   - Mở một kết nối TCP Socket thuần (Raw TCP Socket) đến `127.0.0.1:<console_port>` (cổng Telnet mà QEMU/IOL đang lắng nghe).
4. **Truyền nhận Dữ liệu Hai chiều Song công Toàn phần (Full-Duplex Data Streaming)**:
   - Ký tự người dùng gõ trên bàn phím -> xterm.js bắt sự kiện -> đóng gói vào WebSocket binary frame -> gửi sang bridge -> đẩy vào TCP socket.
   - Luồng ký tự trả về từ router -> TCP socket nhận byte -> bridge đóng gói UTF-8 -> WebSocket đẩy về client -> xterm.js hiển thị trên màn hình.

## 3. Công nghệ & Cơ sở Sử dụng
- **xterm.js**: Thư viện mô phỏng terminal VT100/Xterm trên nền tảng Canvas/DOM trình duyệt.
- **Python asyncio & WebSockets**: Xử lý hàng nghìn luồng kết nối I/O bất đồng bộ đồng thời với độ trễ dưới 5ms.
- **Apache mod_proxy_wstunnel**: Chuyển tiếp kết nối WebSocket qua cổng 443 HTTPS chuẩn tránh bị chặn bởi Firewall doanh nghiệp.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/pnet-webconsole/backend/http_ws_bridge.py` | `WebSocketServer`, `handle_client()` | Daemon cầu nối WebSocket sang TCP |
| `/opt/pnet-webconsole/backend/console_mux.py` | `ConsoleMux` | Bộ quản lý tập trung các kết nối console |
| `/opt/unetlab/html/themes/default/js/pnetlab-webconsole.js` | `initTerminal()`, `attachWebSocket()` | Khởi tạo terminal xterm.js trên trình duyệt |
| `/etc/apache2/conf-available/pnet-console.conf` | Apache config | Cấu hình proxy WebSocket định tuyến cổng 8080 |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Chuỗi byte ký tự gõ từ bàn phím (ASCII / ANSI escape codes).
- **Output**: Luồng ký tự phản hồi từ CLI router.
- **Edge Cases**: Node bị tắt đột ngột -> TCP connection bị reset, bridge gửi mã ngắt WebSocket `1006` kèm thông báo `Connection closed by remote host` để xterm.js hiển thị màu xám.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f15-webconsole-websocket-bridge-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f15-webconsole-websocket-bridge-sequence.md)
