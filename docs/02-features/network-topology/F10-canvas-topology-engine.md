---
title: "Level 2 — F10: Động cơ Vẽ & Tương tác Canvas (Canvas Topology Engine)"
feature_id: "F10"
feature_group: "02-network-topology"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F10: ĐỘNG CƠ VẼ & TƯƠNG TÁC CANVAS (CANVAS TOPOLOGY ENGINE)

## 1. Mô tả Tính năng
- **Mục đích**: Chịu trách nhiệm hiển thị toàn bộ không gian đồ họa tương tác của sơ đồ mạng: render biểu tượng thiết bị, đường dây cáp, tên cổng, nhãn IP, hỗ trợ thu phóng (Zoom In/Out), rê chuột di chuyển không gian (Pan), và kéo thả thay đổi vị trí thiết bị mượt mà.
- **Đối tượng sử dụng**: Tất cả người dùng thao tác với bài lab.
- **Thời điểm kích hoạt**: Ngay khi mở một bài lab trên trình duyệt.

## 2. Cơ chế Chạy (Mechanism)
1. **Nạp Cấu trúc Đồ thị (Fetch Topology Graph)**:
   - Khi mở lab, frontend gọi `GET /api/labs/session/topology`.
   - Backend `api_topology.php` duyệt qua toàn bộ nodes, networks, interfaces và trả về đối tượng JSON đồ thị mạng đầy đủ.
2. **Khởi tạo Canvas Context**:
   - `javascript.js` khởi tạo thẻ `<canvas id="canvas">`, thiết lập bộ nhớ đệm đồ họa 2D Context.
   - Nạp các ảnh biểu tượng (Icons) vào bộ nhớ cache trình duyệt để tránh render lại nhiều lần.
3. **Vòng lặp Render (Render Loop)**:
   - Xóa màn hình (`clearRect`).
   - Áp dụng ma trận biến đổi tọa độ (Transform matrix: Pan X, Pan Y, Zoom Scale).
   - Vẽ các đối tượng theo thứ tự phân lớp (Z-index): Ảnh nền -> Hình khối Shapes -> Đường dây mạng -> Biểu tượng Node -> Nhãn văn bản / Trạng thái CPU.
4. **Bắt Sự kiện Tương tác (Event Handling)**:
   - Bắt sự kiện `mousedown`, `mousemove`, `mouseup`, `wheel`.
   - Tính toán va chạm (Hit-testing) để xác định người dùng đang click vào node nào.
   - Khi kéo thả di chuyển node: Sau khi thả chuột (`mouseup`), gửi ngầm `PUT /api/labs/session/nodes/<id>` cập nhật tọa độ `left` và `top` mới vào XML.

## 3. Công nghệ & Cơ sở Sử dụng
- **HTML5 Canvas API 2D**: Động cơ render đồ họa vector trực tiếp qua GPU trình duyệt.
- **Spatial Hit-Testing**: Thuật toán kiểm tra điểm nằm trong bounding box hoặc đường cong Bezier.
- **Debounced Position Sync**: Trì hoãn ghi tọa độ sau khi dừng rê chuột để giảm tải request lên server.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/includes/api_topology.php`](../../../opt/unetlab/html/includes/api_topology.php)](../../../html/includes/api_topology.php) | `apiTopologyGet()` | Tính toán ma trận kết nối và trả về JSON đồ thị |
| [`/opt/unetlab/html/themes/default/js/javascript.js`](../../../opt/unetlab/html/themes/default/js/javascript.js)](../../../html/themes/default/js/javascript.js) | `drawTopology()`, `initCanvas()`, `handleDrag()` | Vòng lặp vẽ và quản lý sự kiện chuột |
| [`/opt/unetlab/html/themes/default/js/pnetlab-pan-button.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-pan-button.js)](../../../html/themes/default/js/pnetlab-pan-button.js) | `handlePan()` | Xử lý di chuyển khung nhìn |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /api/labs/session/topology`
- **Output**: JSON chứa danh sách nodes (id, name, icon, left, top, status), networks và links.
- **Edge Cases**: Canvas quá lớn (hàng trăm node) -> Tự động bật chế độ phân trang đồ họa (culling) chỉ vẽ các đối tượng nằm trong viewport hiện tại.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f10-canvas-topology-engine-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f10-canvas-topology-engine-sequence.md)
