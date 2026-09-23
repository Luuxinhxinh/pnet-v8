---
title: "Level 2 — F13: Bản đồ Ảnh nền Tùy biến (Custom Pictures & Maps)"
feature_id: "F13"
feature_group: "02-network-topology"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F13: BẢN ĐỒ ẢNH NỀN TÙY BIẾN (CUSTOM PICTURES & MAPS)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép tải lên các hình ảnh bản đồ địa lý thực tế (Bản đồ Việt Nam, Bản đồ thế giới) hoặc sơ đồ mặt bằng trung tâm dữ liệu (Datacenter Floorplan), đặt làm nền Canvas và ánh xạ các điểm hotspot trên ảnh tới các router/switch trong bài lab.
- **Đối tượng sử dụng**: Người thiết kế topo mạng doanh nghiệp phân tán.
- **Thời điểm kích hoạt**: Chọn menu "Pictures" -> "Add Picture" trên thanh công cụ.

## 2. Cơ chế Chạy (Mechanism)
1. **Tải lên Tệp Ảnh (Image Upload)**:
   - Gửi file ảnh (PNG, JPEG) qua `POST /api/labs/session/pictures`.
   - `api_pictures.php` lưu file vào thư mục `/opt/unetlab/labs/<lab_folder>/<picture_id>.png`.
2. **Cấu hình Điểm Ánh xạ (Hotspots Mapping)**:
   - Người dùng click vào một điểm trên ảnh nền và gán điểm đó tương ứng với Node nào trong bài lab.
   - Thao tác này lưu tọa độ x, y, bán kính r và node_id vào danh sách hotspots.
3. **Hiển thị & Tương tác**:
   - Khi xem chế độ Picture: Canvas vẽ bức ảnh làm hình nền chính.
   - Khi click vào vị trí router trên bản đồ ảnh, hệ thống tự động mở Console của thiết bị tương ứng.

## 3. Công nghệ & Cơ sở Sử dụng
- **Image Processing (GD / ImageMagick)**: Xác thực kích thước ảnh, chuyển đổi định dạng và tối ưu dung lượng.
- **Image Map Hotspot Collision**: Thuật toán tính khoảng cách Euclid từ điểm click tới tâm hotspot.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`html/includes/api_pictures.php`](../../../html/includes/api_pictures.php) | `apiPictureAdd()`, `apiPictureEdit()` | Quản lý upload và tọa độ ảnh |
| [`html/includes/__picture.php`](../../../html/includes/__picture.php) | `class Picture` | Đối tượng Picture trong Lab XML |
| [`html/themes/default/js/pnetlab-image-store.js`](../../../html/themes/default/js/pnetlab-image-store.js) | `renderPictureView()` | Hiển thị và xử lý click trên ảnh nền |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Multipart Form Data gồm file ảnh và JSON danh sách hotspots.
- **Output**: `{ "code": 201, "status": "success", "picture_id": 1 }`
- **Edge Cases**: Upload file không phải định dạng ảnh hoặc quá 10MB -> Ném lỗi `Invalid image format or file size exceeded`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f13-canvas-custom-pictures-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f13-canvas-custom-pictures-sequence.md)
