---
title: "Level 2 — F17: Cấp phát & Kiểm thực Token Console (Token Minting)"
feature_id: "F17"
feature_group: "03-console-access"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F17: CẤP PHÁT & KIỂM THỰC TOKEN CONSOLE (TOKEN MINTING)

## 1. Mô tả Tính năng
- **Mục đích**: Bảo vệ các cổng TCP Console của các thiết bị mạng ảo trong lab không bị truy cập trái phép hoặc dò quét (port scanning) từ người dùng không có thẩm quyền.
- **Đối tượng sử dụng**: Hệ thống bảo mật PNet v8.
- **Thời điểm kích hoạt**: Mỗi khi người dùng bấm mở Console Web hoặc mở liên kết Native Console.

## 2. Cơ chế Chạy (Mechanism)
1. **Yêu cầu Cấp Token**:
   - Client gửi `POST /html/console/token_mint.php` kèm `tenant_pod`, `node_id`, và `type` (telnet/vnc).
2. **Kiểm tra Quyền Truy cập**:
   - `token_mint.php` kiểm tra Cookie phiên người dùng.
   - Đối chiếu người dùng có quyền trên bài lab và node tương ứng hay không.
3. **Thuật toán Sinh Token HMAC**:
   - Hệ thống đọc khóa bí mật `CONSOLE_SECRET_KEY` từ file cấu hình hệ thống.
   - Tạo payload: `{ "pod": X, "node_id": Y, "port": Z, "exp": timestamp + 60 }`.
   - Ký payload bằng mã băm `hash_hmac('sha256', payload, secret_key)`.
4. **Kiểm thực Token tại WebSocket Bridge**:
   - Khi client gửi kết nối WebSocket kèm token, `http_ws_bridge.py` hoặc `guacamole-lite-server.js` kiểm tra chữ ký HMAC và thời gian hết hạn (`exp`).
   - Nếu chữ ký sai hoặc token quá hạn 60 giây, kết nối bị từ chối ngay lập tức với mã lỗi `403 Forbidden`.
5. **Dọn dẹp Token Hết hạn**: Dịch vụ `pnet-token-janitor.timer` định kỳ quét dọn các phiên token cũ.

## 3. Công nghệ & Cơ sở Sử dụng
- **HMAC-SHA256**: Thuật toán mã hóa băm có khóa bí mật đảm bảo tính toàn vẹn và chống giả mạo token.
- **Systemd Timers (`pnet-token-janitor`)**: Lập lịch dọn dẹp bộ đệm định kỳ trong Linux.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/console/token_mint.php`](../../../opt/unetlab/html/console/token_mint.php)](../../../html/console/token_mint.php) | `mintConsoleToken()` | Sinh token HMAC có thời hạn |
| [`[`/opt/pnet-webconsole/backend/http_ws_bridge.py`](../../../opt/pnet-webconsole/backend/http_ws_bridge.py)](../../../../pnet-webconsole/backend/http_ws_bridge.py) | `verify_token()` | Giải mã và kiểm tra tính hợp lệ của token |
| `/etc/systemd/system/timers.target.wants/pnet-token-janitor.timer` | Systemd Timer | Bộ hẹn giờ dọn dẹp token định kỳ |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /console/token_mint.php` với `node_id = 1`
- **Output**: `{ "status": "success", "token": "eyJhbGciOiJIUzI1NiIs...", "expires_in": 60 }`
- **Edge Cases**: Token quá hạn 60s -> Cầu nối trả về `Token expired. Please refresh your browser.`

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f17-console-token-minting-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f17-console-token-minting-sequence.md)
