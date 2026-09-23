---
title: "Level 2 — F03: Dừng & Hủy Tiến trình Node (Stop & Kill)"
feature_id: "F03"
feature_group: "01-node-lifecycle"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F03: DỪNG & HỦY TIẾN TRÌNH NODE (STOP & KILL)

## 1. Mô tả Tính năng
- **Mục đích**: Tắt thiết bị mạng ảo đang chạy một cách an toàn (graceful shutdown) hoặc cưỡng bức hủy tiến trình (kill process), thu hồi tài nguyên bộ nhớ và card mạng ảo TAP.
- **Đối tượng sử dụng**: Người dùng thực hành lab.
- **Thời điểm kích hoạt**: Khi người dùng nhấn chuột phải chọn "Stop", hoặc khi đóng lab.

## 2. Cơ chế Chạy (Mechanism)
1. **Gửi Lệnh**: Client gửi `POST /api/labs/session/nodes/<node_id>/stop`.
2. **Truy vấn PID**: `functions.php::nodeStop()` đọc PID của tiến trình node từ file `/opt/unetlab/tmp/<pod>/<node_id>/.pid` hoặc truy vấn bảng `node_sessions`.
3. **Gửi Tín hiệu Dừng (Graceful Signal)**:
   - Gọi wrapper: `sudo /opt/unetlab/scripts/unl_wrapper.php -a stop -T <pod> -D <node_id>`.
   - Wrapper gửi tín hiệu `SIGTERM` (Signal 15) đến tiến trình hypervisor (QEMU/IOL/Docker) để cho phép thiết bị lưu trạng thái đệm.
4. **Cưỡng bức Dừng nếu Quá Thời gian (Timeout Kill)**:
   - Hệ thống chờ trong khoảng 5 giây. Nếu tiến trình vẫn tồn tại trong danh sách tiến trình của kernel, wrapper sẽ gửi tiếp tín hiệu `SIGKILL` (Signal 9) để chấm dứt ngay lập tức.
5. **Thu hồi Tài nguyên Mạng**:
   - Xóa bỏ các card mạng TAP (`ip link delete tap...`).
   - Gỡ bỏ interface khỏi Linux Bridge.
6. **Xóa Trạng thái Phiên**:
   - Xóa bản ghi trong bảng `node_sessions` và file `.pid`.
   - Đẩy thông báo SSE để UI đổi icon sang màu Xám (Stopped).

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Signals (POSIX)**: Tín hiệu `SIGTERM` và `SIGKILL` điều khiển vòng đời tiến trình Unix.
- **Kernel Tun/Tap Subsystem**: Lệnh gỡ bỏ virtual tap interfaces để giải phóng kernel network memory.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/unetlab/html/includes/api_nodes.php` | `apiNodeStop()` | Tiếp nhận request stop từ router |
| `/opt/unetlab/html/includes/functions.php` | `nodeStop()` | Quản lý logic gửi tín hiệu và dọn dẹp |
| `/opt/unetlab/scripts/unl_wrapper.php` | `stopNode()` | Gọi wrapper dừng tiến trình |
| `/opt/unetlab/wrappers/unl_wrapper` | C function | `kill(pid, SIGTERM)` & `kill(pid, SIGKILL)` |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/labs/session/nodes/1/stop`
- **Output**: `{ "code": 200, "status": "success", "message": "Node 1 stopped" }`
- **Edge Cases**: Tiến trình bị treo ở trạng thái D-state (uninterruptible sleep do lỗi đĩa NFS/iSCSI) -> Ghi log cảnh báo và cưỡng bức thu hồi card mạng.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f03-node-stop-kill-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f03-node-stop-kill-sequence.md)
