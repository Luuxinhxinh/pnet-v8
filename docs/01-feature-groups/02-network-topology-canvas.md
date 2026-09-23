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
| [`/opt/unetlab/html/includes/api_networks.php`](../../opt/unetlab/html/includes/api_networks.php)](../../html/includes/api_networks.php) | PHP | Nghiệp vụ mạng: `apiAddLabNetwork()`, `apiEditLabNetwork()`, `apiDeleteLabNetwork()` |
| [`/opt/unetlab/html/includes/__network.php`](../../opt/unetlab/html/includes/__network.php)](../../html/includes/__network.php) | PHP | Domain Object `Network`: Đọc ghi thuộc tính mạng trong Lab XML, gán loại mạng (bridge, pnet) |
| [`/opt/unetlab/html/includes/api_topology.php`](../../opt/unetlab/html/includes/api_topology.php)](../../html/includes/api_topology.php) | PHP | Trả về cấu trúc đồ thị mạng hoàn chỉnh (nodes, links, interfaces) cho Canvas render |
| [`/opt/unetlab/html/includes/api_pictures.php`](../../opt/unetlab/html/includes/api_pictures.php)](../../html/includes/api_pictures.php) | PHP | Xử lý tải ảnh nền, cắt ảnh, lưu trữ và ánh xạ vị trí hotspot |
| [`/opt/unetlab/html/includes/api_textobjects.php`](../../opt/unetlab/html/includes/api_textobjects.php)](../../html/includes/api_textobjects.php)| PHP | Quản lý các đối tượng chữ chú thích (Text Objects) trên Canvas |
| [`/opt/unetlab/html/themes/default/js/javascript.js`](../../opt/unetlab/html/themes/default/js/javascript.js)](../../html/themes/default/js/javascript.js)| JavaScript | Tệp điều khiển chính Canvas, xử lý mouse down/move/up, vẽ icon node và dây mạng |
| [`/opt/unetlab/html/themes/default/js/pnetlab-shape-draw.js`](../../opt/unetlab/html/themes/default/js/pnetlab-shape-draw.js)](../../html/themes/default/js/pnetlab-shape-draw.js)| JavaScript | Bộ công cụ vẽ vector hình khối (Shapes, Rectangles, Circles) |
| [`/opt/unetlab/html/themes/default/js/pnetlab-align-distribute.js`](../../opt/unetlab/html/themes/default/js/pnetlab-align-distribute.js)](../../html/themes/default/js/pnetlab-align-distribute.js)| JavaScript | Thuật toán tính toán tọa độ căn lề và dàn đều khoảng cách node |
| [`/opt/unetlab/html/themes/default/js/pnetlab-node-duplicate.js`](../../opt/unetlab/html/themes/default/js/pnetlab-node-duplicate.js)](../../html/themes/default/js/pnetlab-node-duplicate.js)| JavaScript | Xử lý sao chép node kèm cấu hình và giao diện kết nối |

---

## 4. Sơ đồ Component Diagram (C4 Level 3: Network Topology Engine)

```mermaid
flowchart TD
    %% Styling classes
    classDef ui fill:#1f6feb,stroke:#58a6ff,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef api fill:#238636,stroke:#3fb950,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef wrap fill:#d29922,stroke:#f0883e,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef kernel fill:#8957e5,stroke:#a371f7,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef storage fill:#21262d,stroke:#8b949e,stroke-width:1.5px,color:#c9d1d9,rx:6px,ry:6px;

    subgraph SG_canvas_ui [" 📦 Tầng Giao diện Đồ họa Canvas (Browser) "]
        direction TB
        canvas_core["<b>javascript.js</b><br/><i>(HTML5 Canvas Renderer)</i><br/>Vẽ node, tính toán tọa độ, render đường dây kết nối và bắt sự kiện kéo thả"]:::ui
        shape_tool["<b>pnetlab-shape-draw.js</b><br/><i>(Shape Vector Tool)</i><br/>Vẽ khối hình chữ nhật, hình tròn, đổi màu nền hex, độ trong suốt"]:::ui
        align_tool["<b>pnetlab-align-distribute.js</b><br/><i>(Alignment Math Engine)</i><br/>Thuật toán căn lề (min/max X, Y) và dàn đều khoảng cách giữa các node"]:::ui
        dup_tool["<b>pnetlab-node-duplicate.js</b><br/><i>(Duplication Handler)</i><br/>Nhân bản đối tượng node kèm gán tự động tên và port mới"]:::ui
    end

    subgraph SG_api_layer [" 📦 Tầng REST API & Domain Models (PHP) "]
        direction TB
        topo_api["<b>api_topology.php</b><br/><i>(Topology Service)</i><br/>Tính toán ma trận kết nối và trả về JSON đồ thị mạng cho Canvas"]:::api
        net_api["<b>api_networks.php</b><br/><i>(Network Service)</i><br/>Thêm, sửa, xóa đối tượng Network và gán card mạng vào Bridge"]:::api
        net_model["<b>__network.php</b><br/><i>(Domain Model (Network))</i><br/>Biểu diễn thực thể mạng trong file Lab XML"]:::api
        pic_api["<b>api_pictures.php</b><br/><i>(Picture Service)</i><br/>Lưu trữ và ánh xạ ảnh bản đồ nền, tính tọa độ hotspot"]:::api
        text_api["<b>api_textobjects.php</b><br/><i>(Text Annotation Service)</i><br/>Quản lý các nhãn ghi chú văn bản trên sơ đồ"]:::api
    end

    subgraph SG_kernel_net [" 📦 Tầng Nhân Mạng Linux (Kernel Networking) "]
        direction TB
        linux_bridge["<b>Linux Bridge (br-*)</b><br/><i>(L2 Virtual Switch)</i><br/>Gom nhóm các card mạng TAP của các node vào chung một broadcast domain"]:::wrap
        pnet_clouds["<b>Physical Bridges (pnet0-pnet9)</b><br/><i>(External L2 Interface)</i><br/>Nối dây ảo trực tiếp vào card mạng vật lý hoặc VLAN Trunk"]:::wrap
        iptables_nat["<b>Kernel NAT / IP Forwarding</b><br/><i>(L3 Gateway)</i><br/>Cung cấp kết nối Internet cho các node qua cơ chế masquerade"]:::wrap
    end

    %% Quan hệ giữa các thành phần
    canvas_core -->|"GET /api/labs/session/topology<br/><i>[Nhận JSON đồ thị mạng]</i>"| topo_api
    canvas_core -->|"POST /api/labs/session/networks<br/><i>[Tạo hoặc nối dây vào Network]</i>"| net_api
    shape_tool -->|"Vẽ đối tượng lên Canvas<br/><i>[Canvas 2D Context]</i>"| canvas_core
    align_tool -->|"Cập nhật lại mảng tọa độ<br/><i>[Array of {id, left, top}]</i>"| canvas_core
    dup_tool -->|"Sinh bản sao trên UI<br/><i>[Clone Node Object]</i>"| canvas_core
    net_api -->|"Đọc ghi vào cấu trúc XML<br/><i>[$lab->getNetworks()]</i>"| net_model
    net_api -->|"Gọi lệnh brctl / ip link<br/><i>[Tạo bridge br-<lab_id>-<net_id>]</i>"| linux_bridge
    net_api -->|"Gán interface vào bridge<br/><i>[brctl addif pnet0 tap...]</i>"| pnet_clouds
    net_api -->|"Cấu hình quy tắc iptables<br/><i>[iptables -t nat -A POSTROUTING]</i>"| iptables_nat
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
