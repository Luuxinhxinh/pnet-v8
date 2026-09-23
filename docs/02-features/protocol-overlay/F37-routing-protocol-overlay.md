---
title: "Level 2 — F37: Lớp phủ Trực quan Đường đi Giao thức (Routing Overlays)"
feature_id: "F37"
feature_group: "07-protocol-overlay"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F37: LỚP PHỦ TRỰC QUAN ĐƯỜNG ĐI GIAO THỨC (ROUTING PROTOCOL OVERLAYS)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép người dùng bật các lớp phủ đồ họa trực quan (Visual Overlays) nhiều màu sắc đè lên trên sơ đồ mạng Canvas để phân biệt vùng hoạt động và đường đi của từng giao thức định tuyến: OSPF (vẽ các vùng OSPF Area 0, Area 1 bằng đường bao lồi đa giác), BGP (vẽ các liên kết iBGP/eBGP Peering), IS-IS (Level-1 / Level-2 Areas), Static Routes, và các đường hầm VXLAN Overlay.
- **Đối tượng sử dụng**: Học viên học giao thức định tuyến, Kỹ sư thiết kế kiến trúc mạng.
- **Thời điểm kích hoạt**: Khi click chọn các bộ lọc giao thức trên menu "Overlays" ở Canvas.

## 2. Cơ chế Chạy (Mechanism)
1. **Thu thập Thông tin Định tuyến**:
   - Khi chọn overlay OSPF, script `pnet_routeoverlay.py` được gọi ngầm hoặc truy vấn qua API `pnq-overlay.php?proto=ospf`.
   - Script đọc file cấu hình hoặc kết nối nhanh vào các router qua SSH/Telnet thu thập bảng lân cận (Neighbor Table: `show ip ospf neighbor`) và cơ sở dữ liệu trạng thái liên kết (LSDB: `show ip ospf database`).
2. **Thuật toán Đường bao Lồi (Convex Hull Geometry)**:
   - Python script nhóm các node thuộc cùng một Area (ví dụ Router 1, 2, 3 cùng thuộc Area 0).
   - Áp dụng thuật toán hình học Graham Scan hoặc Jarvis March để tìm tập hợp các tọa độ biên bao quanh toàn bộ các router trong Area.
   - Thêm một khoảng đệm an toàn (Padding margin 40px) để tạo đường cong bo tròn mềm mại.
3. **Render Lớp Phủ trên Canvas (`pnetlab-lazy-overlays.js`)**:
   - Nhận mảng tọa độ đỉnh đa giác từ API.
   - Sử dụng thẻ Canvas phủ (Overlay Canvas) vẽ vùng màu bán trong suốt (màu xanh dương cho Area 0, màu xanh lá cho Area 1) kèm nhãn "OSPF Area 0".

## 3. Công nghệ & Cơ sở Sử dụng
- **Computational Geometry (Convex Hull)**: Thuật toán bao lồi tự động xác định vùng bao tối ưu chứa tập hợp các điểm 2D.
- **Lazy Rendering & Canvas Layering**: Vẽ trên một thẻ Canvas riêng biệt xếp chồng lên Canvas chính để không làm chậm hiệu năng kéo thả node.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/scripts/pnet_routeoverlay.py`](../../../opt/unetlab/scripts/pnet_routeoverlay.py)](../../../scripts/pnet_routeoverlay.py) | Python Script (107KB) | Động cơ phân tích routing và tính toán tọa độ đường bao |
| [`/opt/unetlab/html/pnq-overlay.php`](../../../opt/unetlab/html/pnq-overlay.php)](../../../html/pnq-overlay.php) | PHP API (65KB) | Endpoint tổng hợp và phục vụ dữ liệu overlay |
| [`/opt/unetlab/html/themes/default/js/pnetlab-lazy-overlays.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-lazy-overlays.js)](../../../html/themes/default/js/pnetlab-lazy-overlays.js)| JavaScript | Quản lý vẽ các lớp phủ đồ họa trên client |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /pnq-overlay.php?proto=ospf`
- **Output**: JSON chứa danh sách areas, polygons tọa độ `[[x1,y1], [x2,y2]...]` và màu sắc HEX.
- **Edge Cases**: Có node nằm quá xa -> Đa giác bị méo mó -> Thuật toán tự động tách thành 2 vùng bao con độc lập.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f37-routing-protocol-overlay-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f37-routing-protocol-overlay-sequence.md)
