---
title: "Level 2 — F51: Tích hợp Kho Đám mây IShare2 (IShare2 Cloud Store)"
feature_id: "F51"
feature_group: "09-templates-images"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F51: TÍCH HỢP KHO ĐÁM MÂY ISHARE2 (ISHARE2 CLOUD STORE)

## 1. Mô tả Tính năng
- **Mục đích**: Biến PNet v8 thành một kho ứng dụng thiết bị mạng phong phú (App Store for Network Images): Cho phép người dùng tìm kiếm, xem đánh giá và tải về trực tiếp hàng trăm image thiết bị mạng đã được đóng gói chuẩn hóa từ máy chủ đám mây IShare2 (Cisco vIOS, XRv9k, Arista, Fortigate, Windows, Kali Linux...) chỉ bằng một cú nhấp chuột mà không cần tải lên thủ công qua FTP/SSH.
- **Đối tượng sử dụng**: Tất cả người dùng và quản trị viên.
- **Thời điểm kích hoạt**: Khi chuyển sang tab "IShare2 Store" trong màn hình quản trị Image.

## 2. Cơ chế Chạy (Mechanism)
1. **Đồng bộ Danh mục Trực tuyến (Catalog Sync)**:
   - `ishare2/api.php` gửi HTTPS request tới máy chủ API đám mây IShare2.
   - Nhận danh mục JSON gồm: Tên image, Phiên bản, Dung lượng nén (MB), Mô tả, Ảnh đại diện, và Mã băm SHA256 kiểm tra toàn vẹn.
2. **Kích hoạt Tiến trình Tải Ngầm (Background Worker)**:
   - Khi người dùng nhấn nút "Get Image":
   - API gọi kịch bản nền: `nohup /opt/unetlab/scripts/workers/ishare2.sh --download <image_id> > /tmp/ishare.log 2>&1 &`.
3. **Tải & Giải nén Tự động**:
   - Worker sử dụng công cụ tải đa luồng `aria2c` hoặc `curl` để đạt tốc độ tối đa.
   - Sau khi tải xong: Kiểm tra mã băm SHA256 đối chiếu với manifest.
   - Tự động giải nén (Tar / Unzip / Zstd) vào đúng vị trí `/opt/unetlab/addons/qemu/<image_name>/`.
   - Tự động gọi lệnh sửa phân quyền `unl_wrapper -a fixpermissions`.
4. **Cập nhật Tiến độ Thời gian thực**:
   - Trình duyệt định kỳ đọc file log hoặc nhận sự kiện SSE để hiển thị thanh phần trăm tiến độ tải (% Downloaded).

## 3. Công nghệ & Cơ sở Sử dụng
- **Aria2c / cURL Multi-connection Download**: Tăng tốc độ tải file dung lượng lớn bằng cách chia nhỏ thành nhiều kết nối HTTP song song.
- **Cryptographic Hash Verification (SHA-256)**: Đảm bảo image tải về không bị lỗi hỏng hoặc bị can thiệp mã độc.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/unetlab/html/ishare2/api.php` | PHP API | API giao tiếp với kho IShare2 Cloud |
| `/opt/unetlab/scripts/workers/ishare2.sh` | Shell Script (7.8KB) | Worker chạy ngầm tải và giải nén image |
| `/opt/unetlab/html/main/js/images.js` | JavaScript | Giao diện kho IShare2 Store |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Nhấn "Download" trên gói `cisco-csr1000v-17.03.04`.
- **Output**: Tải về và cài đặt hoàn tất, hiển thị nút "Ready to use".
- **Edge Cases**: Máy chủ mất kết nối Internet giữa chừng -> Worker tự động thử lại (Retry) 5 lần có hỗ trợ tiếp tục tải điểm ngắt (Resume download).

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f51-ishare2-cloud-store-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f51-ishare2-cloud-store-sequence.md)
