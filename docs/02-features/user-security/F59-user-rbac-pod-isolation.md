---
title: "Level 2 — F59: Phân quyền Vai trò & Cách ly POD (RBAC & POD Isolation)"
feature_id: "F59"
feature_group: "11-user-security"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F59: PHÂN QUYỀN VAI TRÒ & CÁCH LY POD (RBAC & POD ISOLATION)

## 1. Mô tả Tính năng
- **Mục đích**: Thiết lập cơ chế kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC) và bảo đảm tính cách ly tuyệt đối về tài nguyên giữa các người dùng thông qua kiến trúc phân vùng POD (Point of Delivery):
  - **Phân quyền Role**: `admin` (toàn quyền hệ thống, sửa template, quản lý cụm, thêm xóa user), `user` (chỉ được thực hành trên lab được gán, không được sửa cấu hình máy chủ), `offline` (chế độ học viên làm bài tập ngoại tuyến).
  - **Cách ly POD (Multi-Tenancy)**: Mỗi người dùng được cấp phát 1 chỉ số POD duy nhất (từ 0 đến 128). Mọi tiến trình chạy, thư mục tạm `/opt/unetlab/tmp/<pod>/`, dải cổng console và card mạng TAP của người dùng này hoàn toàn độc lập và không thể can thiệp sang POD của người dùng khác.
- **Đối tượng sử dụng**: Quản trị viên hệ thống, Kỹ sư an ninh.
- **Thời điểm kích hoạt**: Khi thêm, sửa tài khoản người dùng hoặc khi kiểm tra quyền thực thi API.

## 2. Cơ chế Chạy (Mechanism)
1. **Quản lý Thông tin Tài khoản trong MySQL**:
   - Dữ liệu người dùng được lưu trong bảng `users` (`username`, `email`, `role`, `pod`, `session_timeout`, `status`).
   - Bảng `user_roles` và `user_permission` định nghĩa chi tiết các cờ quyền hạn (ví dụ `USER_PER_EDIT_LAB`, `USER_PER_ADMIN_PANEL`, `USER_PER_ACCESS_CONSOLE`).
2. **Khởi tạo Thư mục POD Riêng Biệt**:
   - Khi tạo người dùng mới: `api_uusers.php` gọi tạo thư mục `/opt/unetlab/tmp/<pod>/` và `/opt/unetlab/users/<username>/`.
   - Phân quyền chỉ người dùng và nhóm `unl` mới có quyền truy cập.
3. **Phân bổ Dải Cổng Mạng Không Xung đột**:
   - Mọi cổng Telnet/VNC/Wireshark được dịch chuyển theo công thức:
     $$	ext{Port} = 32768 + (	ext{POD} 	imes 128) + 	ext{Node\_ID}$$
   - Đảm bảo 100 học viên cùng làm bài lab có cùng Node 1 thì mỗi người vẫn có một cổng Telnet riêng biệt không trùng nhau.
4. **Kiểm tra Quyền trên từng API Endpoint**:
   - Mỗi request vào `api.php` đều qua bộ lọc quyền `checkUserPermission()`. Nếu user thường cố gọi API Admin -> Trả về `403 Forbidden: Administrator access is required`.

## 3. Công nghệ & Cơ sở Sử dụng
- **Multi-Tenant Linux Filesystem Isolation**: Phân vùng thư mục theo Tenant POD.
- **Mathematical Port Offset Calculation**: Thuật toán chia dải cổng mạng xác định không xung đột.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`html/includes/api_uusers.php`](../../../html/includes/api_uusers.php) | `apiUserAdd()`, `apiUserEdit()`, `apiUserDelete()` | Nghiệp vụ quản lý user và gán POD |
| [`html/users/api.php`](../../../html/users/api.php) | PHP API | Endpoint phục vụ giao diện quản trị user |
| [`html/main/js/users.js`](../../../html/main/js/users.js) | JavaScript | Giao diện bảng danh sách tài khoản người dùng |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/uusers` với `{ "username": "student01", "role": "user", "pod": 5 }`.
- **Output**: `{ "code": 201, "status": "success", "message": "User student01 created" }`.
- **Edge Cases**: Gán số POD vượt quá 128 hoặc trùng với POD đang sử dụng -> Ném lỗi `POD ID already assigned or out of bounds (0-128)`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f59-user-rbac-pod-isolation-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f59-user-rbac-pod-isolation-sequence.md)
