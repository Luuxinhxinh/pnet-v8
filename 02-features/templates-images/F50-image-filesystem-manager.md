---
title: "Level 2 — F50: Quản lý Thư mục Image Thiết bị Cục bộ (Image Manager)"
feature_id: "F50"
feature_group: "09-templates-images"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F50: QUẢN LÝ THƯ MỤC IMAGE THIẾT BỊ CỤC BỘ (IMAGE MANAGER)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp giao diện quản lý toàn bộ kho ảnh đĩa ảo cài đặt trên máy chủ vật lý PNet v8: Duyệt danh sách các image QEMU, IOL, Dynamips đang có trên đĩa cứng; Kiểm tra dung lượng chiếm dụng (GB); Đổi tên thư mục phiên bản; Xóa các image lỗi thời giải phóng dung lượng đĩa; và Tự động quét sửa quyền phân quyền file (Fix Permissions).
- **Đối tượng sử dụng**: Quản trị viên hệ thống.
- **Thời điểm kích hoạt**: Khi vào trang "System -> Image Management" trên Dashboard.

## 2. Cơ chế Chạy (Mechanism)
1. **Quét Cây Thư mục Addons**:
   - `images-manage/api.php` duyệt qua 3 thư mục gốc:
     - `/opt/unetlab/addons/qemu/` (Chứa các thư mục máy ảo QEMU).
     - `/opt/unetlab/addons/iol/bin/` (Chứa các file nhị phân Cisco IOL `.bin`).
     - `/opt/unetlab/addons/dynamips/` (Chứa các file IOS Cisco 7200 `.image`).
2. **Kiểm tra Tính Toàn vẹn của Tệp Tin**:
   - Với QEMU: Kiểm tra xem bên trong thư mục có file `virtioa.qcow2`, `hda.qcow2` hoặc `cdrom.iso` hay không.
   - Đo dung lượng file bằng hàm `filesize()` hoặc lệnh `du -sh`.
3. **Thao tác Xóa & Sửa Tên**:
   - Cho phép xóa thư mục image qua lệnh an toàn có xác nhận.
4. **Bộ Sửa Quyền Hệ thống (Fix Permissions Hook)**:
   - Khi tải image mới lên qua WinSCP thường bị sai quyền root:root -> Chức năng "Fix Permissions" gọi lệnh: `/opt/unetlab/wrappers/unl_wrapper -a fixpermissions` để khôi phục quyền `chown -R root:unl` và gán setuid.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Filesystem Traversal**: Các API duyệt thư mục POSIX.
- **UNL Permission Architecture**: Mô hình phân quyền đảm bảo web server www-data và tiến trình ảo hóa unl có thể đọc ghi file mà không bị lỗi permission denied.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/unetlab/html/images-manage/api.php` | PHP API | API quét danh sách và xóa image |
| `/opt/unetlab/html/main/js/images.js` | JavaScript | Giao diện quản lý bảng image |
| `/opt/unetlab/wrappers/unl_wrapper` | C binary | Tùy chọn `-a fixpermissions` sửa quyền đĩa |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /images-manage/api.php?type=qemu`
- **Output**: JSON danh sách các thư mục image, dung lượng và trạng thái hợp lệ.
- **Edge Cases**: Cố gắng xóa image đang có lab sử dụng -> Cảnh báo `Image is currently referenced by running nodes`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f50-image-filesystem-manager-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f50-image-filesystem-manager-sequence.md)
