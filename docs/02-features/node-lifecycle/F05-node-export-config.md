---
title: "Level 2 — F05: Trích xuất & Lưu trữ Cấu hình (Export Config)"
feature_id: "F05"
feature_group: "01-node-lifecycle"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F05: TRÍCH XUẤT & LƯU TRỮ CẤU HÌNH (EXPORT CONFIG)

## 1. Mô tả Tính năng
- **Mục đích**: Tự động trích xuất cấu hình khởi động (`running-config` / `startup-config`) từ các thiết bị mạng đang chạy trong lab và nhúng trực tiếp văn bản cấu hình đó vào trong tệp lab `.unl`. Nhờ đó, bài lab có thể đem sang máy chủ khác mà vẫn giữ nguyên cấu hình đã làm.
- **Đối tượng sử dụng**: Người thiết kế bài lab, Giảng viên tạo đề thi mạng.
- **Thời điểm kích hoạt**: Nhấn chuột phải vào Node chọn "Export" hoặc bấm nút "Export all" trên thanh tác vụ.

## 2. Cơ chế Chạy (Mechanism)
1. **Tiếp nhận Yêu cầu**: Gửi request `POST /api/labs/session/nodes/<node_id>/export`.
2. **Xác định Loại Thiết bị**:
   - Nếu là Cisco IOL: Đọc trực tiếp phân vùng NVRAM nhị phân bằng tiện ích [`scripts/iou_export`](../../../scripts/iou_export) để giải mã text file `startup-config`.
   - Nếu là Dynamips: Trích xuất file cấu hình `.cfg` từ thư mục làm việc.
   - Nếu là Cisco QEMU (CSR1000v, IOS-XR, vIOS): Kích hoạt kịch bản dòng lệnh tự động đăng nhập console qua Expect / Telnet, gửi lệnh `show running-config` và hứng lấy toàn bộ văn bản đầu ra.
3. **Lưu trữ vào File Lab**:
   - Nạp đối tượng `Lab` từ XML.
   - Tìm thẻ `<node id="...">` tương ứng.
   - Tạo hoặc cập nhật thẻ con `<config id="1">...Nội dung cấu hình Base64...</config>`.
   - Lưu lại tệp lab `.unl`.
4. **Phản hồi**: Trả về trạng thái xuất cấu hình thành công cho người dùng.

## 3. Công nghệ & Cơ sở Sử dụng
- **Expect / Telnet Scripting**: Tự động hóa đăng nhập console CLI của router/switch.
- **Cisco IOL NVRAM Parser (`iou_export`)**: Tiện ích C giải mã cấu trúc dữ liệu NVRAM đặc thù của Cisco IOL.
- **Base64 Encoding**: Mã hóa văn bản cấu hình mạng để nhúng an toàn vào thẻ XML mà không bị xung đột ký tự đặc biệt `<`, `>`, `&`.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`html/includes/api_nodes.php`](../../../html/includes/api_nodes.php) | `apiNodeExport()` | Tiếp nhận request xuất cấu hình |
| [`html/includes/functions.php`](../../../html/includes/functions.php) | `nodeExport()` | Điều phối giải mã NVRAM hoặc gọi script |
| [`scripts/iou_export`](../../../scripts/iou_export) | C binary | Trích xuất cấu hình từ file NVRAM của IOL |
| [`html/includes/__lab.php`](../../../html/includes/__lab.php) | `Lab::saveConfig()` | Ghi chuỗi cấu hình vào cây XML của lab |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/labs/session/nodes/1/export`
- **Output**: `{ "code": 200, "status": "success", "message": "Configuration exported successfully" }`
- **Edge Cases**: Thiết bị chưa khởi động xong (đang ở giai đoạn boot ROMmon) -> Timeout kịch bản Expect, ném lỗi `Node not ready for config export`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f05-node-export-config-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f05-node-export-config-sequence.md)
