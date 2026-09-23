---
title: "Level 2 — F36: Kênh Đẩy Trạng thái Lab Thời gian thực qua SSE (Labstate Engine)"
feature_id: "F36"
feature_group: "06-netem-telemetry"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F36: KÊNH ĐẨY TRẠNG THÁI LAB THỜI GIAN THỰC QUA SSE (LABSTATE ENGINE)

## 1. Mô tả Tính năng
- **Mục đích**: Đảm bảo toàn bộ các thay đổi trạng thái trong bài lab (Node khởi động xong, Node bị tắt, Link bị ngắt, Người dùng khác đang thao tác trên cùng lab) được đẩy trực tiếp tới trình duyệt của người dùng ngay tức khắc (Real-time Event Streaming) mà không cần trình duyệt phải liên tục gửi request thăm dò (HTTP Polling), tiết kiệm băng thông và tối ưu hiệu năng máy chủ.
- **Đối tượng sử dụng**: Tầng giao tiếp sự kiện thời gian thực.
- **Thời điểm kích hoạt**: Ngay khi mở màn hình Canvas bài lab.

## 2. Cơ chế Chạy (Mechanism)
1. **Thiết lập Kết nối Server-Sent Events (SSE)**:
   - Trình duyệt nạp `pnetlab-labstate-client.js`, khởi tạo đối tượng `new EventSource('/events/labstate?token=...')`.
   - Yêu cầu được chuyển tiếp tới daemon Python `pnetlab-labstated.py` (cổng 8089).
   - Daemon phản hồi với header chuẩn: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
2. **Cơ chế Publish / Subscribe Nội bộ (Event Bus)**:
   - Khi có sự kiện xảy ra ở bất kỳ đâu trong hệ thống (ví dụ `unl_wrapper` khởi động xong node):
   - Kịch bản backend gửi thông điệp vào Unix Socket của `pnetlab-labstated.py`.
   - Daemon xác định các client đang xem cùng bài lab (`lab_id`) và phát bản tin dạng SSE chunk:
     ```text
     event: node_state
     data: {"node_id": 1, "status": 2, "status_text": "running"}
     ```
3. **Phản hồi Tức thì trên Giao diện**:
   - `EventSource.onmessage` bắt được gói tin, cập nhật đối tượng DOM trên Canvas mà không cần tải lại trang.

## 3. Công nghệ & Cơ sở Sử dụng
- **Server-Sent Events (SSE / HTML5 EventSource)**: Chuẩn web một chiều tối ưu cho việc đẩy dữ liệu từ server về client qua HTTP/1.1 hoặc HTTP/2.
- **Python Asyncio SSE Streamer**: Duy trì hàng nghìn kết nối HTTP treo (long-lived connections) với mức tiêu thụ RAM cực thấp.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/scripts/pnetlab-labstated.py`](../../../opt/unetlab/scripts/pnetlab-labstated.py)](../../../scripts/pnetlab-labstated.py) | `LabStateServer`, `stream_events()` | Daemon quản lý kênh đẩy SSE (12KB) |
| [`/opt/unetlab/html/pnq-labstate-token.php`](../../../opt/unetlab/html/pnq-labstate-token.php)](../../../html/pnq-labstate-token.php) | PHP API | Cấp phát token bảo mật cho kết nối SSE |
| [`/opt/unetlab/html/themes/default/js/pnetlab-labstate-client.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-labstate-client.js)](../../../html/themes/default/js/pnetlab-labstate-client.js)| JavaScript | Trình nghe EventSource trên trình duyệt |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Kết nối HTTP GET duy trì lâu dài với `Accept: text/event-stream`.
- **Output**: Dòng dữ liệu sự kiện văn bản chuẩn UTF-8 `data: {...}

`.
- **Edge Cases**: Kết nối mạng của client bị ngắt (Sleep máy tính) -> Trình duyệt tự động kích hoạt tính năng tự kết nối lại (`auto-reconnect`) của EventSource sau 3 giây.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f36-realtime-labstate-sse-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f36-realtime-labstate-sse-sequence.md)
