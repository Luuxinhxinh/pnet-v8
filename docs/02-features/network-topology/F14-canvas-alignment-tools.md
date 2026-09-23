---
title: "Level 2 — F14: Bộ Công cụ Căn gióng & Nhân bản (Align, Distribute, Duplicate)"
feature_id: "F14"
feature_group: "02-network-topology"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F14: BỘ CÔNG CỤ CĂN GIÓNG & NHÂN BẢN (ALIGN, DISTRIBUTE, DUPLICATE)

## 1. Mô tả Tính năng
- **Mục đích**: Giúp người dùng sắp xếp sơ đồ mạng đẹp mắt, chuyên nghiệp chỉ bằng một thao tác: Căn thẳng hàng (ngang, dọc, giữa), Dàn đều khoảng cách giữa các node (Distribute horizontal/vertical spacing), và Nhân bản nhanh một cụm thiết bị kèm cấu hình (Duplicate).
- **Đối tượng sử dụng**: Người vẽ topo mạng quy mô lớn.
- **Thời điểm kích hoạt**: Dùng chuột kéo vùng chọn nhiều node, nhấn chuột phải chọn menu "Align" hoặc "Duplicate".

## 2. Cơ chế Chạy (Mechanism)
1. **Thuật toán Căn gióng (Alignment Math)**:
   - Khi chọn "Align Horizontal Center": Thuật toán tìm giá trị `top` trung bình hoặc lấy theo node đầu tiên, sau đó gán lại `top` của tất cả các node được chọn bằng giá trị đó.
   - Khi chọn "Distribute Horizontally": Tìm tọa độ node ngoài cùng bên trái (`min_left`) và ngoài cùng bên phải (`max_left`). Tính khoảng cách `step = (max_left - min_left) / (count - 1)`, rồi gán tọa độ X tăng dần đều.
2. **Cơ chế Nhân bản Node (Duplication Engine)**:
   - `pnetlab-node-duplicate.js` đọc thuộc tính của node gốc.
   - Tự động sinh tên mới (ví dụ từ `R1` thành `R1_copy` hoặc `R2`), sinh ID mới, dịch chuyển tọa độ một khoảng offset (+50px, +50px).
   - Gửi yêu cầu tạo node mới tới backend API.
3. **Đồng bộ Tọa độ về Máy chủ**:
   - Mảng tọa độ mới của các node được gửi đồng loạt qua API `PUT /api/labs/session/nodes` để lưu vào file XML.

## 3. Công nghệ & Cơ sở Sử dụng
- **Vector Transformation Math**: Các phép tính khoảng cách Euclid, min, max, average phân bố không gian 2D.
- **Client-Side Bulk State Mutation**: Cập nhật trạng thái đồ họa tức thời trước khi gửi API ngầm.

## 4. File / Hàm Liên quan
| [`/opt/unetlab/html/themes/default/js/pnetlab-align-distribute.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-align-distribute.js) | `distribute()`, `collect()` | Thuật toán toán học căn khoảng cách đều giữa các node theo trục ngang/dọc |
| [`/opt/unetlab/html/themes/default/js/actions.js`](../../../opt/unetlab/html/themes/default/js/actions.js) | `action-halign-group`, `action-valign-group` | Căn lề trái, phải, trên, dưới cho nhóm node |
| [`/opt/unetlab/html/themes/default/js/pnetlab-node-duplicate.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-node-duplicate.js) | `window.pnqDuplicateNodes()`, `buildPayload()`, `addOne()` | Xử lý nhân bản cấu hình và offset vị trí node bản sao |
| [`/opt/unetlab/html/includes/api_nodes.php`](../../../opt/unetlab/html/includes/api_nodes.php) | `apiAddLabNode()` | Tiếp nhận tạo node bản sao và gán ID/cổng mới |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Mảng các Node ID được chọn và loại căn chỉnh: `{ "action": "align_horizontal", "node_ids": [1, 2, 3] }`
- **Output**: Cập nhật tọa độ thành công, các node thẳng hàng tức thì trên màn hình.
- **Edge Cases**: Chọn ít hơn 3 node khi dùng chức năng "Distribute" -> Hiển thị thông báo yêu cầu chọn tối thiểu 3 node.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f14-canvas-alignment-tools-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f14-canvas-alignment-tools-sequence.md)
