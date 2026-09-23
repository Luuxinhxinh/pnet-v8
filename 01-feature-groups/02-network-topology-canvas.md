---
title: "Level 1 — Nhóm 02: Mạng kết nối, Topo & Canvas Đồ họa"
group_id: "G02"
group_name: "Network Topology & Canvas Graphic Engine"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 1"
---

# NHÓM 02: MẠNG KẾT NỐI, TOPO & CANVAS ĐỒ HỌA (NETWORK TOPOLOGY & CANVAS GRAPHIC ENGINE)

## 1. Mục đích của Nhóm Tính năng

Nhóm **Mạng kết nối, Topo & Canvas Đồ họa** chịu trách nhiệm toàn bộ việc mô hình hóa không gian đồ họa tương tác và hạ tầng kết nối mạng ảo trong PNet v8:
1. **Hạ tầng Mạng Ảo (Virtual Switching & Bridging)**: Tạo lập và quản lý các Linux Bridge nội bộ để nối các card mạng ảo (TAP interfaces) giữa các node với nhau; cấu hình mạng Point-to-Point (P2P) tốc độ cao; và kết nối các thiết bị ra mạng vật lý bên ngoài (Cloud Networks từ `pnet0` đến `pnet9` hoặc NAT).
2. **Động cơ Đồ họa Canvas (HTML5 Canvas Engine)**: Cung cấp giao diện tương tác mượt mà hỗ trợ hàng trăm đối tượng node/link/shape/text cùng lúc với đầy đủ chức năng Pan, Zoom, Kéo thả tọa độ (Drag & Drop), Lưới căn chỉnh (Grid snapping), và Lưu vị trí tự động.
3. **Tương tác Nối dây Trực quan (Visual Cable Connection)**: Cho phép người dùng kéo thả đầu dây từ cổng card mạng của node này sang node khác, tự động kiểm tra loại cổng tương thích (Ethernet, GigabitEthernet, Serial, Subslot).
4. **Trang trí & Chú thích Sơ đồ Mạng (Diagramming & Annotations)**: Hỗ trợ vẽ các khối đa giác, hình chữ nhật, hình tròn, đường cong tùy biến màu sắc, độ dày viền, độ trong suốt; thêm nhãn văn bản đa định dạng; và chèn bản đồ ảnh nền (Background Pictures / Data Center Floorplans).
5. **Bộ công cụ Định vị Nâng cao (Alignment & Distribution)**: Cung cấp các thao tác tự động căn thẳng hàng ngang, hàng dọc, dàn đều khoảng cách giữa các node (Distribute spacing), và nhân bản nhanh cấu trúc node (Duplicate).

---

## 2. Danh sách Toàn bộ Tính năng Con Thuộc Nhóm (Dẫn tới Level 2)

Dưới đây là 7 tính năng con độc lập thuộc Nhóm 02, được đặc tả chi tiết tại thư mục `02-features/network-topology/`:

| Mã tính năng | Tên tính năng con | File tài liệu Level 2 | Tóm tắt Chức năng |
| :---: | :--- | :--- | :--- |
| **F08** | **Mạng Cầu nối & Kết nối Đám mây (Bridge & Cloud Networks)** | [`F08-network-bridge-cloud.md`](../02-features/network-topology/F08-network-bridge-cloud.md) | Quản lý Linux Bridge cục bộ và Cloud Interfaces `pnet0-pnet9`, NAT interface ra Internet |
| **F09** | **Kết nối Điểm-Điểm Tối ưu (Point-to-Point Links)** | [`F09-network-p2p-links.md`](../02-features/network-topology/F09-network-p2p-links.md) | Cơ chế đấu nối trực tiếp 2 interface của 2 node qua bridge chuyên dụng mà không cần cloud router |
| **F10** | **Động cơ Vẽ & Tương tác Canvas (Canvas Topology Engine)** | [`F10-canvas-topology-engine.md`](../02-features/network-topology/F10-canvas-topology-engine.md) | Vòng lặp render Canvas HTML5, xử lý sự kiện chuột, Zoom/Pan mượt mà, lưu tọa độ X/Y vào XML |
| **F11** | **Tương tác Nối dây Trực quan (Canvas Link Drawing)** | [`F11-canvas-link-connect.md`](../02-features/network-topology/F11-canvas-link-connect.md) | Luồng kéo dây từ cổng mạng nguồn sang cổng đích, kiểm tra xung đột cổng và cập nhật Topology XML |
| **F12** | **Công cụ Vẽ Khối & Chú thích (Shapes & Annotations)** | [`F12-canvas-shapes-annotations.md`](../02-features/network-topology/F12-canvas-shapes-annotations.md) | Vẽ hình vuông, hình tròn, đường kẻ phân vùng mạng (VLAN, Area, AS), tùy biến màu HEX, opacity, border |
| **F13** | **Bản đồ Ảnh nền Tùy biến (Custom Pictures & Maps)** | [`F13-canvas-custom-pictures.md`](../02-features/network-topology/F13-canvas-custom-pictures.md) | Tải lên ảnh sơ đồ tòa nhà, DC floorplan; ánh xạ các điểm hotspot trên ảnh vào thiết bị trong lab |
| **F14** | **Bộ Công cụ Căn gióng & Nhân bản (Align, Distribute, Duplicate)** | [`F14-canvas-alignment-tools.md`](../02-features/network-topology/F14-canvas-alignment-tools.md) | Tự động căn lề (trái, phải, giữa, ngang, dọc), chia đều khoảng cách các node và sao chép node nhanh |

---

## 3. Các Module & File Mã nguồn Chịu trách nhiệm Chính

| Đường dẫn File / Thư mục | Ngôn ngữ / Loại | Vai trò chính |
| :--- | :--- | :--- |
| `/opt/unetlab/html/includes/api_networks.php` | PHP | Nghiệp vụ mạng: `apiNetworkAdd()`, `apiNetworkEdit()`, `apiNetworkDelete()` |
| `/opt/unetlab/html/includes/__network.php` | PHP | Domain Object `Network`: Đọc ghi thuộc tính mạng trong Lab XML, gán loại mạng (bridge, pnet) |
| `/opt/unetlab/html/includes/api_topology.php` | PHP | Trả về cấu trúc đồ thị mạng hoàn chỉnh (nodes, links, interfaces) cho Canvas render |
| `/opt/unetlab/html/includes/api_pictures.php` | PHP | Xử lý tải ảnh nền, cắt ảnh, lưu trữ và ánh xạ vị trí hotspot |
| `/opt/unetlab/html/includes/api_textobjects.php`| PHP | Quản lý các đối tượng chữ chú thích (Text Objects) trên Canvas |
| `/opt/unetlab/html/themes/default/js/javascript.js`| JavaScript | Tệp điều khiển chính Canvas, xử lý mouse down/move/up, vẽ icon node và dây mạng |
| `/opt/unetlab/html/themes/default/js/pnetlab-shape-draw.js`| JavaScript | Bộ công cụ vẽ vector hình khối (Shapes, Rectangles, Circles) |
| `/opt/unetlab/html/themes/default/js/pnetlab-align-distribute.js`| JavaScript | Thuật toán tính toán tọa độ căn lề và dàn đều khoảng cách node |
| `/opt/unetlab/html/themes/default/js/pnetlab-node-duplicate.js`| JavaScript | Xử lý sao chép node kèm cấu hình và giao diện kết nối |

---

## 4. Sơ đồ Component Diagram (C4 Level 3: Network Topology Engine)

```mermaid
C4Component
    title C4 Level 3: Sơ đồ Thành phần Nhóm 02 (Network Topology & Canvas Graphic Engine)

    Container_Boundary(canvas_ui, "Tầng Giao diện Đồ họa Canvas (Browser)") {
        Component(canvas_core, "javascript.js", "HTML5 Canvas Renderer", "Vẽ node, tính toán tọa độ, render đường dây kết nối và bắt sự kiện kéo thả")
        Component(shape_tool, "pnetlab-shape-draw.js", "Shape Vector Tool", "Vẽ khối hình chữ nhật, hình tròn, đổi màu nền hex, độ trong suốt")
        Component(align_tool, "pnetlab-align-distribute.js", "Alignment Math Engine", "Thuật toán căn lề (min/max X, Y) và dàn đều khoảng cách giữa các node")
        Component(dup_tool, "pnetlab-node-duplicate.js", "Duplication Handler", "Nhân bản đối tượng node kèm gán tự động tên và port mới")
    }

    Container_Boundary(api_layer, "Tầng REST API & Domain Models (PHP)") {
        Component(topo_api, "api_topology.php", "Topology Service", "Tính toán ma trận kết nối và trả về JSON đồ thị mạng cho Canvas")
        Component(net_api, "api_networks.php", "Network Service", "Thêm, sửa, xóa đối tượng Network và gán card mạng vào Bridge")
        Component(net_model, "__network.php", "Domain Model (Network)", "Biểu diễn thực thể mạng trong file Lab XML")
        Component(pic_api, "api_pictures.php", "Picture Service", "Lưu trữ và ánh xạ ảnh bản đồ nền, tính tọa độ hotspot")
        Component(text_api, "api_textobjects.php", "Text Annotation Service", "Quản lý các nhãn ghi chú văn bản trên sơ đồ")
    }

    Container_Boundary(kernel_net, "Tầng Nhân Mạng Linux (Kernel Networking)") {
        Component(linux_bridge, "Linux Bridge (br-*)", "L2 Virtual Switch", "Gom nhóm các card mạng TAP của các node vào chung một broadcast domain")
        Component(pnet_clouds, "Physical Bridges (pnet0-pnet9)", "External L2 Interface", "Nối dây ảo trực tiếp vào card mạng vật lý hoặc VLAN Trunk")
        Component(iptables_nat, "Kernel NAT / IP Forwarding", "L3 Gateway", "Cung cấp kết nối Internet cho các node qua cơ chế masquerade")
    }

    Rel(canvas_core, topo_api, "GET /api/labs/session/topology", "Nhận JSON đồ thị mạng")
    Rel(canvas_core, net_api, "POST /api/labs/session/networks", "Tạo hoặc nối dây vào Network")
    Rel(shape_tool, canvas_core, "Vẽ đối tượng lên Canvas", "Canvas 2D Context")
    Rel(align_tool, canvas_core, "Cập nhật lại mảng tọa độ", "Array of {id, left, top}")
    Rel(dup_tool, canvas_core, "Sinh bản sao trên UI", "Clone Node Object")
    Rel(net_api, net_model, "Đọc ghi vào cấu trúc XML", "$lab->getNetworks()")
    Rel(net_api, linux_bridge, "Gọi lệnh brctl / ip link", "Tạo bridge br-<lab_id>-<net_id>")
    Rel(net_api, pnet_clouds, "Gán interface vào bridge", "brctl addif pnet0 tap...")
    Rel(net_api, iptables_nat, "Cấu hình quy tắc iptables", "iptables -t nat -A POSTROUTING")
```

---

> 👉 **Xem chi tiết từng tính năng con**:
> 1. [`F08-network-bridge-cloud.md`](../02-features/network-topology/F08-network-bridge-cloud.md) — Mạng Cầu nối & Kết nối Đám mây (Bridge & Cloud Networks)
> 2. [`F09-network-p2p-links.md`](../02-features/network-topology/F09-network-p2p-links.md) — Kết nối Điểm-Điểm Tối ưu (Point-to-Point Links)
> 3. [`F10-canvas-topology-engine.md`](../02-features/network-topology/F10-canvas-topology-engine.md) — Động cơ Vẽ & Tương tác Canvas (Canvas Topology Engine)
> 4. [`F11-canvas-link-connect.md`](../02-features/network-topology/F11-canvas-link-connect.md) — Tương tác Nối dây Trực quan (Canvas Link Drawing)
> 5. [`F12-canvas-shapes-annotations.md`](../02-features/network-topology/F12-canvas-shapes-annotations.md) — Công cụ Vẽ Khối & Chú thích (Shapes & Annotations)
> 6. [`F13-canvas-custom-pictures.md`](../02-features/network-topology/F13-canvas-custom-pictures.md) — Bản đồ Ảnh nền Tùy biến (Custom Pictures & Maps)
> 7. [`F14-canvas-alignment-tools.md`](../02-features/network-topology/F14-canvas-alignment-tools.md) — Bộ Công cụ Căn gióng & Nhân bản (Align, Distribute, Duplicate)
