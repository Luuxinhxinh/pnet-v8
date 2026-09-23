---
title: "Level 2 — F11: Tương tác Nối dây Trực quan (Canvas Link Drawing)"
feature_id: "F11"
feature_group: "02-network-topology"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F11: TƯƠNG TÁC NỐI DÂY TRỰC QUAN (CANVAS LINK DRAWING)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp giao diện tương tác trực quan cho phép người dùng kéo một sợi dây cáp từ cổng mạng của thiết bị nguồn và thả vào cổng mạng của thiết bị đích, hỗ trợ kiểm tra tính tương thích của cổng (Ethernet sang Ethernet, Serial sang Serial).
- **Đối tượng sử dụng**: Người thiết kế topo mạng.
- **Thời điểm kích hoạt**: Di chuột vào biểu tượng node, xuất hiện icon đầu cắm cáp (Plug Icon), nhấn giữ chuột và kéo sang node khác.

## 2. Cơ chế Chạy (Mechanism)
1. **Khởi tạo Chế độ Kéo Dây**:
   - Khi di chuột vào node, `javascript.js` hiển thị điểm neo (anchor point).
   - Khi nhấn giữ chuột và kéo: Render một đường dây đàn hồi (Rubberband bezier curve) bám theo con trỏ chuột.
2. **Thả Dây & Chọn Cổng (Port Selection Dialog)**:
   - Khi thả chuột trên node đích: Canvas mở một hộp thoại modal liệt kê danh sách các cổng mạng còn trống của cả Node Nguồn và Node Đích.
   - Loại trừ các cổng đã được cắm dây trước đó.
3. **Xác nhận Kết nối**:
   - Người dùng bấm "Save".
   - Gọi API `/api/labs/session/network/manage` để cập nhật ánh xạ interface vào network.
4. **Render Dây Hoàn chỉnh**:
   - Vẽ đường nối kiên cố giữa 2 điểm neo.
   - Hiển thị nhãn tên cổng (ví dụ `e0/0` và `e0/1`) nằm sát 2 đầu thiết bị.

## 3. Công nghệ & Cơ sở Sử dụng
- **Cubic Bezier Curves**: Thuật toán vẽ đường cong uốn lượn tự nhiên tránh chồng lấn khi có nhiều dây nối song song giữa 2 thiết bị.
- **Port Compatibility Filter**: Kiểm tra kiểu dữ liệu interface (Ethernet, GigabitEthernet, Serial).

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/themes/default/js/javascript.js`](../../../opt/unetlab/html/themes/default/js/javascript.js)](../../../html/themes/default/js/javascript.js) | `startLinkDrag()`, `drawRubberband()`, `openPortModal()` | Quản lý tương tác nối dây |
| [`[`/opt/unetlab/html/api.php`](../../../opt/unetlab/html/api.php)](../../../html/api.php) | `$app->put("/api/labs/session/network/manage")` | Cập nhật cấu hình cổng mạng |
| [`[`/opt/unetlab/html/devices/interfc.php`](../../../opt/unetlab/html/devices/interfc.php)](../../../html/devices/interfc.php) | `getInterfaces()` | Trích xuất danh sách interface hợp lệ |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**:
  ```json
  { "source_node": 1, "source_port": 0, "destination_node": 2, "destination_port": 1 }
  ```
- **Output**: `{ "code": 200, "status": "success", "message": "Link connected" }`
- **Edge Cases**: Nối dây giữa 2 cổng không cùng chủng loại (ví dụ Ethernet cắm vào Serial) -> Hiển thị cảnh báo đỏ cấm kết nối.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f11-canvas-link-connect-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f11-canvas-link-connect-sequence.md)
