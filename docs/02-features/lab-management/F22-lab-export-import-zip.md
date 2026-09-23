---
title: "Level 2 — F22: Đóng gói & Nhập Xuất Lab (ZIP Export & Import)"
feature_id: "F22"
feature_group: "04-lab-management"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F22: ĐÓNG GÓI & NHẬP XUẤT LAB (ZIP EXPORT & IMPORT)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép đóng gói toàn bộ bài lab (file `.unl`, toàn bộ ảnh sơ đồ đính kèm, cấu hình startup-config của từng router) thành 1 file nén `.zip` độc lập duy nhất để chia sẻ hoặc sao lưu; đồng thời hỗ trợ tải file zip lên hệ thống khác để giải nén tự động.
- **Đối tượng sử dụng**: Người chia sẻ bài lab, Quản trị viên sao lưu hệ thống.
- **Thời điểm kích hoạt**: Chọn chức năng "Export" hoặc "Import" trên menu Lab Dashboard.

## 2. Cơ chế Chạy (Mechanism)
1. **Quy trình Xuất Gói (Export ZIP)**:
   - Gọi `POST /api/export` kèm đường dẫn bài lab.
   - Hệ thống khởi tạo đối tượng `ZipArchive` trong PHP.
   - Thêm file `.unl` chính vào kho lưu trữ ZIP.
   - Quét thư mục ảnh đính kèm và thêm toàn bộ các file ảnh vào thư mục con bên trong file ZIP.
   - Gửi file ZIP về trình duyệt dưới dạng file tải về (Content-Disposition: attachment).
2. **Quy trình Nhập Khẩu (Import ZIP)**:
   - Người dùng kéo thả file ZIP vào màn hình Import.
   - `import/api.php` tiếp nhận file tải lên, lưu vào thư mục `/tmp/`.
   - Kích hoạt worker nền [`scripts/workers/import.sh`](../../../scripts/workers/import.sh).
   - Worker giải nén file ZIP, phân loại file `.unl` đưa vào thư mục `/opt/unetlab/labs/`, đưa ảnh vào đúng thư mục đính kèm, sửa quyền sở hữu thành `www-data:unl`.
3. **Phản hồi**: Cập nhật lại cây thư mục trên giao diện người dùng.

## 3. Công nghệ & Cơ sở Sử dụng
- **PHP ZipArchive Extension**: Đọc và nén file định dạng ZIP chuẩn Deflate.
- **Background Shell Worker (`import.sh`)**: Xử lý giải nén bất đồng bộ tránh làm treo tiến trình web server khi file tải lên có dung lượng lớn.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`html/api.php`](../../../html/api.php) | `$app->post("/api/export")` | Tiếp nhận yêu cầu xuất file ZIP |
| [`html/import/api.php`](../../../html/import/api.php) | PHP API | Tiếp nhận upload file ZIP bài lab |
| [`scripts/workers/import.sh`](../../../scripts/workers/import.sh) | Shell Script (12KB) | Worker giải nén và phân quyền an toàn |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Tải lên file `Advanced_OSPF_Lab.zip`.
- **Output**: `{ "code": 200, "status": "success", "message": "Import completed" }`
- **Edge Cases**: Tệp ZIP chứa mã độc tấn công leo thang thư mục (Zip Slip Attack dạng `../../etc/passwd`) -> `import.sh` kiểm tra và từ chối giải nén các file có đường dẫn bất thường.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f22-lab-export-import-zip-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f22-lab-export-import-zip-sequence.md)
