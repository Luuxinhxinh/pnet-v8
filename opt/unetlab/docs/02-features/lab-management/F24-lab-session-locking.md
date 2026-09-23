---
title: "Level 2 — F24: Khóa Phiên & Kiểm soát Đồng thời (Lab Session Locking)"
feature_id: "F24"
feature_group: "04-lab-management"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F24: KHÓA PHIÊN & KIỂM SOÁT ĐỒNG THỜI (LAB SESSION LOCKING)

## 1. Mô tả Tính năng
- **Mục đích**: Ngăn ngừa hiện tượng ghi đè xung đột dữ liệu (Race Conditions) khi nhiều người dùng cùng mở hoặc chỉnh sửa chung một bài lab cùng lúc; đồng thời bảo vệ trạng thái của các node đang chạy không bị xóa nhầm.
- **Đối tượng sử dụng**: Cơ chế quản lý phiên đa người dùng của hệ thống.
- **Thời điểm kích hoạt**: Khi người dùng mở một bài lab hoặc bật tính năng Lock Lab.

## 2. Cơ chế Chạy (Mechanism)
1. **Kiểm tra Trạng thái Khóa (Lock Check)**:
   - Mỗi file `.unl` có cờ thuộc tính `<lab ... lock="1">` (F-LOCK).
   - Nếu bài lab được đặt cờ `lock=1` bởi tác giả: Người dùng khác chỉ có quyền xem (Read-Only) và khởi động thiết bị để thực hành, không được phép thay đổi vị trí, thêm xóa node hoặc sửa dây mạng.
2. **Theo dõi Phiên Mở (Session Tracking)**:
   - Khi mở lab, hệ thống tạo bản ghi trong bảng `lab_sessions` (gồm: `pod`, `user_id`, `lab_path`, `started_at`, `last_activity`).
3. **Bảo vệ Khi Xóa/Sửa**:
   - Khi có request xóa bài lab: `api_labs.php` kiểm tra bảng `lab_sessions` và kiểm tra xem có node nào của lab đang ở trạng thái `Running` hay không.
   - Nếu lab đang chạy hoặc đang được mở bởi người khác, hệ thống từ chối xóa với thông báo lỗi rõ ràng.
4. **Mở Khóa An toàn (Unlock)**:
   - Chỉ người dùng tạo ra bài lab hoặc quản trị viên cấp cao (Admin) mới có quyền tắt cờ `lock=0`.

## 3. Công nghệ & Cơ sở Sử dụng
- **Optimistic / Pessimistic Concurrency Locking**: Kết hợp khóa trạng thái trong XML và khóa phiên trong cơ sở dữ liệu quan hệ MySQL.
- **Session Heartbeat Update**: Client định kỳ cập nhật `last_activity` để phát hiện phiên treo (zombie sessions).

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/includes/lab-session-access.php`](../../../html/includes/lab-session-access.php)](../../../html/includes/lab-session-access.php) | `checkLabSessionLock()` | Kiểm tra quyền truy cập và cờ khóa |
| [`[`/opt/unetlab/html/api.php`](../../../html/api.php)](../../../html/api.php) | `$app->post("/api/labs/session/lock")` | API bật tắt cờ khóa F-LOCK |
| [`[`/opt/unetlab/html/includes/__lab.php`](../../../html/includes/__lab.php)](../../../html/includes/__lab.php) | `Lab::getLock()`, `Lab::setLock()` | Đọc ghi thuộc tính lock trong XML |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/labs/session/lock` với `{ "lock": 1 }`
- **Output**: `{ "code": 200, "status": "success", "message": "Lab locked" }`
- **Edge Cases**: Cố gắng xóa bài lab đang có người thực hành -> Trả về lỗi `HTTP 409 Conflict: Cannot delete lab while active sessions exist.`

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f24-lab-session-locking-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f24-lab-session-locking-sequence.md)
