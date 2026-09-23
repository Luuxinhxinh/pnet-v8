---
title: "Level 2 — F04: Làm sạch Dữ liệu Thiết bị (Node Wipe)"
feature_id: "F04"
feature_group: "01-node-lifecycle"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F04: LÀM SẠCH DỮ LIỆU THIẾT BỊ (NODE WIPE)

## 1. Mô tả Tính năng
- **Mục đích**: Xóa sạch toàn bộ cấu hình, tệp tạm, dữ liệu người dùng đã thay đổi trên thiết bị (phân vùng overlay disk, file NVRAM, logs), đưa thiết bị trở về trạng thái xuất xưởng ban đầu của image gốc.
- **Đối tượng sử dụng**: Người dùng muốn hoàn tác mọi cấu hình lỗi hoặc học viên bắt đầu lại bài thực hành từ đầu.
- **Thời điểm kích hoạt**: Nhấn chuột phải chọn "Wipe" khi node đang ở trạng thái dừng (Stopped).

## 2. Cơ chế Chạy (Mechanism)
1. **Kiểm tra Điều kiện Tiên quyết**: Kiểm tra xem node có đang chạy hay không. Nếu node đang chạy, API từ chối thực hiện và yêu cầu phải dừng node trước.
2. **Kích hoạt Lệnh Wipe**: Gọi `POST /api/labs/session/nodes/<node_id>/wipe`.
3. **Xóa File Vật lý**:
   - `functions.php::nodeWipe()` gọi `unl_wrapper.php -a wipe -T <pod> -D <node_id>`.
   - Xóa bỏ toàn bộ tệp tin trong thư mục tạm `/opt/unetlab/tmp/<pod>/<lab_session>/<node_id>/`:
     - Xóa các file `virtioa.qcow2`, `virtiob.qcow2` (đĩa delta).
     - Xóa file NVRAM của IOL: `nvram_<node_id>`.
     - Xóa container overlay nếu là Docker.
4. **Khởi tạo lại Cấu hình Mặc định (Nếu có)**:
   - Nếu node có khai báo `startup-config` trong lab, hệ thống sẽ nạp lại file cấu hình trắng hoặc cấu hình ban đầu vào thư mục tmp.
5. **Cập nhật Giao diện**: Gửi phản hồi thành công và thông báo cho người dùng trên Canvas.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux File Unlinking (`rm -rf`)**: Xóa thư mục làm việc an toàn.
- **QCOW2 Delta Isolation**: Bản thiết kế gốc nằm tại `/opt/unetlab/addons/` luôn được bảo vệ chỉ đọc (Read-Only), việc xóa đĩa delta ngay lập tức phục hồi trạng thái nguyên bản.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/includes/api_nodes.php`](../../../opt/unetlab/html/includes/api_nodes.php)](../../../html/includes/api_nodes.php) | `apiNodeWipe()` | Kiểm tra node đã stop và điều phối wipe |
| [`/opt/unetlab/html/includes/functions.php`](../../../opt/unetlab/html/includes/functions.php)](../../../html/includes/functions.php) | `nodeWipe()` | Xóa các tệp đĩa tạm và nvram |
| [`/opt/unetlab/scripts/unl_wrapper.php`](../../../opt/unetlab/scripts/unl_wrapper.php)](../../../scripts/unl_wrapper.php) | `wipeNode()` | Thực hiện thao tác xóa an toàn qua quyền root |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/labs/session/nodes/1/wipe`
- **Output**: `{ "code": 200, "status": "success", "message": "Node 1 wiped" }`
- **Edge Cases**: Gửi lệnh Wipe khi node đang Running -> Trả về lỗi `HTTP 400: Node is currently running. Please stop it first.`

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f04-node-wipe-clean-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f04-node-wipe-clean-sequence.md)
