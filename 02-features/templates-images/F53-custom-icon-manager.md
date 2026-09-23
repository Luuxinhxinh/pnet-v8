---
title: "Level 2 — F53: Quản lý Biểu tượng Thiết bị Đồ họa (Custom Icon Manager)"
feature_id: "F53"
feature_group: "09-templates-images"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F53: QUẢN LÝ BIỂU TƯỢNG THIẾT BỊ ĐỒ HỌA (CUSTOM ICON MANAGER)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp kho biểu tượng đồ họa phong phú chuẩn Cisco/HPE/Fortinet/AWS/Azure (Router, Switch, Firewall, Cloud, Server, Database, Phone, Satellite, IoT) và cho phép người dùng tải lên các icon hình ảnh tùy biến (SVG vector hoặc PNG trong suốt) để cá nhân hóa sơ đồ mạng trên Canvas.
- **Đối tượng sử dụng**: Người thiết kế topo mạng chuyên nghiệp.
- **Thời điểm kích hoạt**: Khi chọn thay đổi Icon trong form Node hoặc mở trang quản lý Icon.

## 2. Cơ chế Chạy (Mechanism)
1. **Duyệt Thư viện Biểu tượng**:
   - `images-icons/api.php` quét toàn bộ thư mục `/opt/unetlab/html/images/icons/`.
   - Trả về danh sách tên file icon kèm phân loại danh mục (Networking, Security, Cloud, Endpoints).
2. **Tải lên Biểu tượng Mới (Upload Custom Icon)**:
   - Người dùng tải lên file `.png` hoặc `.svg` qua `POST /images-icons/api.php`.
   - Hệ thống chuẩn hóa kích thước (Scale về chuẩn 64x64 hoặc 128x128 pixels), giữ nguyên nền trong suốt (Alpha channel).
   - Lưu vào thư mục icons và cập nhật file chỉ mục `pnetlab-template-icons.json`.
3. **Hiển thị tức thì trên Canvas**:
   - Canvas nạp ảnh mới vào bộ nhớ đệm `Image()` của trình duyệt và render ngay lên node được chọn.

## 3. Công nghệ & Cơ sở Sử dụng
- **SVG Vector Graphics & Transparent PNG**: Đảm bảo icon sắc nét ở mọi mức độ phóng to thu nhỏ (Zoom In/Out).
- **Client-Side Image Caching**: Lưu trữ đệm trong bộ nhớ trình duyệt để giảm số lượng HTTP request tải icon.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/unetlab/html/images-icons/api.php` | PHP API | Quản lý duyệt và tải lên icon |
| `/opt/unetlab/html/themes/default/js/pnetlab-template-icons.json`| Config JSON | Danh mục ánh xạ icon thiết bị |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Upload file `my_custom_firewall.png`.
- **Output**: `{ "code": 201, "status": "success", "icon": "my_custom_firewall.png" }`.
- **Edge Cases**: Upload file ảnh kích thước quá lớn (> 2MB) -> Hệ thống tự động thu nhỏ về 128x128px bằng thư viện GD trước khi lưu.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f53-custom-icon-manager-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f53-custom-icon-manager-sequence.md)
