---
title: "Level 2 — F07: Thao tác Node Hàng loạt (Bulk Operations)"
feature_id: "F07"
feature_group: "01-node-lifecycle"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F07: THAO TÁC NODE HÀNG LOẠT (BULK OPERATIONS)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép người dùng thực hiện các hành động điều khiển đồng thời trên nhiều hoặc toàn bộ node trong lab: Start All, Stop All, Wipe All, và Bulk Edit (chỉnh sửa cùng lúc RAM, CPU, Icon cho hàng chục node được bôi đen).
- **Đối tượng sử dụng**: Người dùng thực hành lab quy mô lớn (hàng chục đến hàng trăm router).
- **Thời điểm kích hoạt**: Nhấn các nút trên menu tác vụ bên trái Canvas ("Start all nodes", "Stop all nodes", "Wipe all nodes") hoặc dùng chuột bôi đen vùng chọn nhiều node và chọn "Bulk edit".

## 2. Cơ chế Chạy (Mechanism)
1. **Phân tích Danh sách Node (Queue Resolution)**:
   - Client gửi mảng ID các node: `POST /api/labs/session/nodes/start` với payload `{ "nodes": [1, 2, 3, 4, 5] }`.
2. **Điều phối Tránh Quá Tải CPU/I/O (Staggered Startup)**:
   - Nếu khởi động đồng thời 50 máy ảo QEMU cùng lúc, máy chủ sẽ bị nghẽn I/O đĩa cứng (I/O storm) và cạn RAM tức thì.
   - PNet v8 áp dụng cơ chế khởi động giãn cách (Staggered Delay): Khởi động từng cụm node (mỗi cụm 3-5 node), nghỉ cách nhau từ 2 đến 5 giây giữa các lượt.
3. **Thực thi Song song có Kiểm soát**:
   - Sử dụng vòng lặp kiểm tra trạng thái trong `api_nodes.php::apiNodesStart()`.
   - Gọi lần lượt `nodeStart()` cho từng node ID.
4. **Cập nhật Tiến trình Đồ họa Thời gian thực**:
   - Client hiển thị thanh phần trăm tiến độ (Progress bar).
   - Mỗi node khởi động xong sẽ phát sự kiện SSE cập nhật màu icon ngay lập tức.

## 3. Công nghệ & Cơ sở Sử dụng
- **Asynchronous Batching**: Hàng đợi xử lý tác vụ theo lô.
- **Throttling & Rate Limiting**: Ngăn chặn cạn kiệt tài nguyên hệ thống bằng cách kiểm soát số lượng tiến trình khởi động đồng thời.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/includes/api_nodes.php`](../../../html/includes/api_nodes.php)](../../../html/includes/api_nodes.php) | `apiNodesStart()`, `apiNodesStop()` | Xử lý danh sách node hàng loạt |
| [`[`/opt/unetlab/html/themes/default/js/actions.js`](../../../html/themes/default/js/actions.js)](../../../html/themes/default/js/actions.js) | `startAllNodes()`, `stopAllNodes()` | Giao diện điều khiển nút bấm hàng loạt |
| [`[`/opt/unetlab/html/themes/default/js/pnetlab-bulk-node-edit.js`](../../../html/themes/default/js/pnetlab-bulk-node-edit.js)](../../../html/themes/default/js/pnetlab-bulk-node-edit.js) | `saveBulkNodeForm()` | Cập nhật tham số của nhiều node cùng lúc |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/labs/session/nodes/start` với JSON: `{"nodes": [1, 2, 3]}`
- **Output**: `{"code": 200, "status": "success", "message": "Nodes started successfully"}`
- **Edge Cases**: Trong lúc đang Start All, có 1 node bị lỗi image -> Hệ thống bỏ qua node lỗi, tiếp tục khởi động các node còn lại và trả về danh sách cảnh báo chi tiết các node thất bại.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f07-node-bulk-operations-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f07-node-bulk-operations-sequence.md)
