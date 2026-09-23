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
1. **Phân tích Danh sách Node (Client-side Queue Resolution)**:
   - Khi người dùng bấm "Start all nodes" (`.action-nodesstart`) hoặc chọn một nhóm node (`.action-nodestart-group`), client trích xuất danh sách node IDs (`Object.keys(window.nodes)` hoặc `selectedNodeIds()`).
2. **Điều phối Tránh Quá Tải CPU/I/O (Staggered Startup Pool)**:
   - Nếu khởi động đồng thời nhiều máy ảo QEMU/IOL cùng lúc, máy chủ sẽ bị nghẽn I/O đĩa cứng (I/O storm) và cạn RAM tức thì.
   - PNet áp dụng cơ chế khởi động giãn cách qua hàm `staggeredPoolRun(thunks)` trong `actions.js`:
     - Giới hạn luồng chạy song song: `START_CONCURRENCY = 2`.
     - Giãn cách khởi động giữa các node: `START_STAGGER_MS = 800` ms.
3. **Thực thi Gọi API Từng Node**:
   - Hàm `start(node_id)` trong `lifecycle.js` phát `POST /api/labs/session/nodes/start` với payload `{ id: node_id }`.
   - Server tiếp nhận qua `api.php`, ủy quyền cho `apiStartLabNode($lab, $node_id, $tenant)` trong `api_nodes.php`.
   - `apiStartLabNode()` thực thi lệnh qua `node_wrapper_exec()` tương tác với daemon broker.
4. **Cập nhật Tiến trình Đồ họa Thời gian thực**:
   - Khi nhận request start, giao diện cập nhật trạng thái tạm (`data-status = 5` - booting).
   - Khi `start(node_id)` trả về HTTP 200, icon node chuyển sang màu xanh (`data-status = 3` - running) và trigger `App.topology.getTopoData()` để tải metadata console/port.

## 3. Công nghệ & Cơ sở Sử dụng
- **Client-side Staggered Worker Pool**: Điều phối hàng đợi Promise song song có độ trễ (`staggeredPoolRun`) giúp bảo vệ máy chủ khỏi CPU ramp/I/O storm.
- **Micro-dispatch Pattern**: Phân rã tác vụ hàng loạt thành các request đơn lẻ `apiStartLabNode()` để đảm bảo tính cô lập: nếu 1 node bị lỗi, các node khác vẫn khởi động bình thường.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/includes/api_nodes.php`](../../../opt/unetlab/html/includes/api_nodes.php) | `apiStartLabNode()`, `apiStopLabNode()` | Xử lý khởi động/dừng từng node đơn lẻ qua `node_wrapper_exec()` |
| [`/opt/unetlab/html/themes/default/js/actions.js`](../../../opt/unetlab/html/themes/default/js/actions.js) | `staggeredPoolRun()`, `.action-nodesstart`, `.action-nodesstop` | Hàng đợi khởi động giãn cách (concurrency=2, stagger=800ms) |
| [`/opt/unetlab/html/themes/default/js/functions/nodes/lifecycle.js`](../../../opt/unetlab/html/themes/default/js/functions/nodes/lifecycle.js) | `start(node_id)`, `stop(node_id)` | Phát HTTP POST request điều khiển lifecycle từng node |
| [`/opt/unetlab/html/themes/default/js/pnetlab-bulk-node-edit.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-bulk-node-edit.js) | `saveBulkNodeForm()` | Cập nhật tham số của nhiều node cùng lúc |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/labs/session/nodes/start` với payload form-data / JSON: `{"id": <node_id>}`
- **Output**: `{"code": 200, "status": "success", "message": "Node started"}`
- **Edge Cases**: Khi thực hiện Start All, các node được phân rã thành các lời gọi độc lập. Node bị lỗi image/config trả về mã lỗi riêng mà không làm gián đoạn tiến trình khởi động của các node còn lại trong hàng đợi.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f07-node-bulk-operations-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f07-node-bulk-operations-sequence.md)
