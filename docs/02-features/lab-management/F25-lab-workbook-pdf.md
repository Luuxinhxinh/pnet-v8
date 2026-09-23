---
title: "Level 2 — F25: Trình Xem Tài liệu Thực hành (Integrated Workbook Viewer)"
feature_id: "F25"
feature_group: "04-lab-management"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F25: TRÌNH XEM TÀI LIỆU THỰC HÀNH (INTEGRATED WORKBOOK VIEWER)

## 1. Mô tả Tính năng
- **Mục đích**: Nhúng trực tiếp tài liệu hướng dẫn thực hành (Lab Guide / Workbook định dạng PDF hoặc Markdown) ngay bên cạnh màn hình Canvas topo mạng, giúp học viên có thể vừa đọc yêu cầu đề bài vừa gõ lệnh cấu hình trên cùng một màn hình mà không cần chuyển qua lại giữa các cửa sổ ứng dụng khác.
- **Đối tượng sử dụng**: Học viên làm bài tập, Thí sinh tham gia các kỳ thi sát hạch mạng.
- **Thời điểm kích hoạt**: Nhấn vào nút "Workbook" trên thanh công cụ góc phải Canvas.

## 2. Cơ chế Chạy (Mechanism)
1. **Lấy Danh sách Tài liệu Hướng dẫn**:
   - Khi mở lab, frontend kiểm tra xem trong thư mục lab hoặc trường thuộc tính `<lab workbook="...">` có liên kết tới file PDF nào không.
2. **Truyền Tải Luồng Tệp PDF**:
   - Client gọi `GET /api/workbook/pdf/<filename>`.
   - `api.php` đọc tệp từ `/opt/unetlab/labs/<path>/<filename>.pdf` và trả về luồng binary với HTTP Header `Content-Type: application/pdf` và `Content-Disposition: inline`.
3. **Nhúng Trình Xem Đồ họa**:
   - Trình duyệt hiển thị một khung xem có thể chia đôi màn hình (Split Pane) hoặc popup có thể co giãn kích thước sử dụng thư viện PDF.js hoặc trình render PDF tích hợp của trình duyệt.
   - Hỗ trợ cuộn trang, tìm kiếm từ khóa, đánh dấu trang và phóng to/thu nhỏ tài liệu.

## 3. Công nghệ & Cơ sở Sử dụng
- **PDF.js (Mozilla Engine)**: Thư viện JavaScript hiển thị file PDF chuẩn HTML5 Canvas.
- **Split.js Layout**: Cơ chế chia đôi màn hình kéo thả phân vùng linh hoạt giữa Canvas và Workbook.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/api.php`](../../../opt/unetlab/html/api.php)](../../../html/api.php) | `$app->get("/api/workbook/pdf/(:name)")` | API phục vụ luồng file PDF |
| [`[`/opt/unetlab/html/includes/Parsedown.php`](../../../opt/unetlab/html/includes/Parsedown.php)](../../../html/includes/Parsedown.php) | `class Parsedown` | Bộ phân tích cú pháp nếu tài liệu là Markdown (.md) |
| [`[`/opt/unetlab/html/themes/default/js/pnetlab-sidebar-tools.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-sidebar-tools.js)](../../../html/themes/default/js/pnetlab-sidebar-tools.js) | `toggleWorkbookPane()` | Điều khiển ẩn hiện khung xem tài liệu |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /api/workbook/pdf/CCNA_Lab_Guide.pdf`
- **Output**: Luồng nhị phân hiển thị trang tài liệu PDF.
- **Edge Cases**: Bài lab không có file tài liệu đính kèm -> Nút "Workbook" mờ đi và thông báo `No workbook attached to this lab`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f25-lab-workbook-pdf-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f25-lab-workbook-pdf-sequence.md)
