---
title: "Level 2 — F20: Quản lý Cây Thư mục & Thao tác Lab (Lab & Folder CRUD)"
feature_id: "F20"
feature_group: "04-lab-management"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F20: QUẢN LÝ CÂY THƯ MỤC & THAO TÁC LAB (LAB & FOLDER CRUD)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép người dùng và quản trị viên tổ chức, quản lý toàn bộ các bài lab trong hệ thống theo một cây thư mục phân cấp nhiều tầng (giống như File Explorer): Tạo mới lab, Đổi tên lab, Xóa lab, Tạo thư mục, Đổi tên thư mục, Di chuyển (Cut/Paste) và Nhân bản bài lab (Clone).
- **Đối tượng sử dụng**: Tất cả người dùng có tài khoản trên PNet v8.
- **Thời điểm kích hoạt**: Khi ở màn hình quản trị thư viện bài Lab (Main Dashboard).

## 2. Cơ chế Chạy (Mechanism)
1. **Duyệt Thư viện Tệp**:
   - Client gọi `GET /api/folders` để lấy danh sách cấu trúc cây thư mục.
   - `api_folders.php::apiFoldersGet()` quét thư mục gốc `/opt/unetlab/labs/`, đọc danh sách các thư mục con và các file có phần mở rộng `.unl`.
2. **Tạo Mới Bài Lab**:
   - Client gửi `POST /api/labs` kèm tên lab, tác giả, mô tả, phiên bản, thư mục cha.
   - `api_labs.php` nạp khung XML mặc định, gán UUID và lưu file `.unl` vào đường dẫn `/opt/unetlab/labs/<path>/<lab_name>.unl`.
3. **Di chuyển hoặc Đổi tên (Move/Rename)**:
   - Client gửi `POST /api/labs/move` hoặc `POST /api/labs/rename`.
   - Backend kiểm tra bài lab có đang được ai mở hay không (kiểm tra bảng `lab_sessions`). Nếu an toàn, thực hiện lệnh `rename()` trên hệ thống file Linux.
4. **Xóa Bài Lab**:
   - Gửi `DELETE /api/labs`. Hệ thống xóa file `.unl` và toàn bộ các tệp ảnh bản đồ đính kèm của bài lab đó.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Filesystem Traversal**: Các hàm PHP `scandir()`, `is_dir()`, `rename()`, `unlink()`.
- **JSON Tree Structure**: Dữ liệu trả về được định dạng theo cấu trúc node cây phù hợp với các thư viện JS Tree.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/includes/api_folders.php`](../../../html/includes/api_folders.php)](../../../html/includes/api_folders.php) | `apiFoldersGet()`, `apiFolderAdd()` | Quản lý thư mục chứa lab |
| [`[`/opt/unetlab/html/includes/api_labs.php`](../../../html/includes/api_labs.php)](../../../html/includes/api_labs.php) | `apiLabAdd()`, `apiLabDelete()`, `apiLabRename()` | Điều phối thao tác bài lab |
| [`[`/opt/unetlab/html/main/js/labs.js`](../../../html/main/js/labs.js)](../../../html/main/js/labs.js) | `renderLabTree()`, `onNewLabClick()` | Giao diện hiển thị cây bài lab |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/labs` với payload:
  ```json
  { "name": "BGP_Advanced_Lab", "path": "/CCNP_SP", "version": "1.0", "description": "Lab BGP Full Mesh" }
  ```
- **Output**: `{ "code": 201, "status": "success", "message": "Lab created" }`
- **Edge Cases**: Đặt tên lab chứa ký tự nguy hiểm (dấu gạch chéo `/`, `..`, ký tự nhị phân) -> Backend loại bỏ và trả về lỗi `Invalid lab filename`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f20-lab-crud-tree-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f20-lab-crud-tree-sequence.md)
