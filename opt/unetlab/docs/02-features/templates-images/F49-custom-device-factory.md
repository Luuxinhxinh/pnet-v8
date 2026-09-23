---
title: "Level 2 — F49: Nhà máy Chế tạo Mẫu Thiết bị Tùy biến (Device Factory)"
feature_id: "F49"
feature_group: "09-templates-images"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F49: NHÀ MÁY CHẾ TẠO MẪU THIẾT BỊ TÙY BIẾN (CUSTOM DEVICE FACTORY)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp giao diện đồ họa trực quan (Visual Template Wizard) cho phép quản trị viên tự thiết kế các mẫu thiết bị mạng mới hoàn toàn chưa có sẵn trong PNet v8 (ví dụ: một dòng firewall ảo mới ra mắt, một bản phân phối Linux chuyên dụng), tùy chỉnh các tham số boot, tham số QEMU và lưu vào thư viện dùng chung.
- **Đối tượng sử dụng**: Quản trị viên hệ thống mở rộng thiết bị.
- **Thời điểm kích hoạt**: Khi truy cập trang "Device Factory" trên menu quản trị.

## 2. Cơ chế Chạy (Mechanism)
1. **Thiết lập Tham số Thiết bị Mới**:
   - Quản trị viên điền form: Tên thiết bị, Prefix tiền tố thư mục (ví dụ `myfirewall-`), Kiến trúc CPU (x86_64, i386, aarch64), Loại card mạng (e1000, virtio), Tiền tố cổng (`eth`, `port`, `ge-`), Dung lượng RAM, vCPU và Icon.
2. **Sinh File Định nghĩa Template**:
   - `devices-factory/api.php` kiểm tra tính hợp lệ của tên định danh.
   - Tự động sinh mã nguồn PHP template chuẩn và ghi vào [`[`/opt/unetlab/html/templates`](../../../html/templates)](../../../html/templates)/<template_name>.php`.
3. **Tạo Thư mục Lưu trữ Image**:
   - Tự động tạo thư mục tương ứng trong `/opt/unetlab/addons/qemu/<template_name>-default/`.
   - Phân quyền `755` cho người dùng `www-data` và nhóm `unl`.
4. **Cập nhật Bộ nhớ Đệm Hệ thống**:
   - Làm mới danh sách template có sẵn, cho phép người dùng trong hệ thống có thể chọn ngay thiết bị mới này trên Canvas.

## 3. Công nghệ & Cơ sở Sử dụng
- **Code Generation Engine**: Tự động sinh file mã nguồn PHP cấu hình an toàn từ template mẫu.
- **Filesystem Permissions Enforcement**: Đảm bảo phân quyền chuẩn Unix cho các file template mới tạo.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/devices-factory/api.php`](../../../html/devices-factory/api.php)](../../../html/devices-factory/api.php) | PHP API | Endpoint tiếp nhận và sinh file template |
| [`[`/opt/unetlab/html/main/js/devices.js`](../../../html/main/js/devices.js)](../../../html/main/js/devices.js) | JavaScript | Giao diện Device Factory Wizard |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**:
  ```json
  { "name": "Custom_Debian_Router", "prefix": "cdeb-", "ram": 1024, "cpu": 1, "nic": "virtio-net-pci" }
  ```
- **Output**: `{ "code": 201, "status": "success", "message": "Custom template created" }`
- **Edge Cases**: Prefix bị trùng với template đã có sẵn của Cisco/Juniper -> Ném lỗi `Template prefix already exists`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f49-custom-device-factory-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f49-custom-device-factory-sequence.md)
