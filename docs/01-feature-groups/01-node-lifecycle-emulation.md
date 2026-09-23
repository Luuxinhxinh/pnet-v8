---
title: "Level 1 — Nhóm 01: Động cơ Giả lập & Quản lý Vòng đời Node"
group_id: "G01"
group_name: "Node Lifecycle & Emulation Engine"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 1"
---

# NHÓM 01: ĐỘNG CƠ GIẢ LẬP & QUẢN LÝ VÒNG ĐỜI NODE (NODE LIFECYCLE & EMULATION ENGINE)

## 1. Mục đích của Nhóm Tính năng

Nhóm **Động cơ Giả lập & Quản lý Vòng đời Node** là trái tim vận hành của toàn bộ nền tảng PNet v8. Nhóm này chịu trách nhiệm:
1. Trừu tượng hóa và thống nhất việc quản lý 5 công nghệ ảo hóa mạng khác nhau: **KVM/QEMU** (Cisco CSR1000v, XRv, Fortigate, Windows/Linux), **Cisco IOL** (IOS-on-Linux L2/L3), **Dynamips** (Cisco router thế hệ cũ c7200, c3725), **Docker Containers** và **VPCS** (Virtual PC Simulator).
2. Kiểm soát toàn bộ vòng đời của một thiết bị mạng ảo: Khởi tạo (`create`), Cấu hình tham số phần cứng (`edit`), Khởi động (`start`), Dừng an toàn hoặc cưỡng bức (`stop`/`kill`), Làm sạch dữ liệu về mặc định (`wipe`), và Trích xuất cấu hình khởi động (`export config`).
3. Cung cấp tầng điều phối nhị phân (Binary Wrapper Layer) chạy dưới quyền đặc quyền (setuid root) để can thiệp trực tiếp vào nhân Linux: tạo TAP interfaces, gán cgroups giới hạn CPU/RAM, cấu hình KSM và mở port console.
4. Xử lý các tác vụ điều khiển hàng loạt (Bulk Operations) trên Canvas như Start All, Stop All, Wipe All và Bulk Edit hàng chục thiết bị cùng lúc.

---

## 2. Danh sách Toàn bộ Tính năng Con Thuộc Nhóm (Dẫn tới Level 2)

Dưới đây là 7 tính năng con độc lập thuộc Nhóm 01, được đặc tả chi tiết tại thư mục `02-features/node-lifecycle/`:

| Mã tính năng | Tên tính năng con | File tài liệu Level 2 | Tóm tắt Chức năng |
| :---: | :--- | :--- | :--- |
| **F01** | **Khởi tạo & Cấu hình Tham số Node** | [`F01-node-create-edit.md`](../02-features/node-lifecycle/F01-node-create-edit.md) | Thêm node mới từ template, chỉnh sửa vCPU, RAM, số card mạng, console type (telnet/vnc/rdp), icon, vị trí Canvas |
| **F02** | **Quy trình Khởi động Node (Start Lifecycle)** | [`F02-node-start-lifecycle.md`](../02-features/node-lifecycle/F02-node-start-lifecycle.md) | Cấp phát Tenant POD, tạo thư mục tạm `/opt/unetlab/tmp/<pod>/<node_id>`, sinh overlay qcow2 disk, tạo card TAP và gọi wrapper |
| **F03** | **Dừng & Hủy Tiến trình Node (Stop & Kill)** | [`F03-node-stop-kill.md`](../02-features/node-lifecycle/F03-node-stop-kill.md) | Gửi tín hiệu ngắt SIGTERM cho tiến trình wrapper, chuyển sang SIGKILL nếu quá thời gian chờ, thu hồi TAP interface |
| **F04** | **Làm sạch Dữ liệu Thiết bị (Node Wipe)** | [`F04-node-wipe-clean.md`](../02-features/node-lifecycle/F04-node-wipe-clean.md) | Xóa toàn bộ file overlay disk, file NVRAM, giải phóng thư mục tạm, khôi phục node về trạng thái ban đầu của image gốc |
| **F05** | **Trích xuất & Lưu trữ Cấu hình (Export Config)** | [`F05-node-export-config.md`](../02-features/node-lifecycle/F05-node-export-config.md) | Đọc file cấu hình `startup-config` từ phân vùng NVRAM hoặc qua console scripting và lưu trực tiếp vào file Lab XML |
| **F06** | **Tầng Điều phối Wrapper Nhị phân (Binary Wrappers)** | [`F06-node-wrapper-orchestration.md`](../02-features/node-lifecycle/F06-node-wrapper-orchestration.md) | Kiến trúc và cơ chế thực thi của `qemu_wrapper`, `iol_wrapper`, `docker_wrapper`, `dynamips_wrapper`, `simple_forwarder` |
| **F07** | **Thao tác Node Hàng loạt (Bulk Operations)** | [`F07-node-bulk-operations.md`](../02-features/node-lifecycle/F07-node-bulk-operations.md) | Điều phối hàng đợi khởi động tuần tự hoặc song song cho toàn bộ lab (Start All, Stop All, Wipe All, Bulk Node Edit) |

---

## 3. Các Module & File Mã nguồn Chịu trách nhiệm Chính

Toàn bộ logic của Nhóm 01 nằm tại các file nguồn cốt lõi sau:

| Đường dẫn File / Thư mục | Ngôn ngữ / Loại | Vai trò chính |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/api.php`](../../opt/unetlab/html/api.php)](../../html/api.php) | PHP (Slim Framework) | Điểm tiếp nhận REST request: `/api/labs/session/nodes`, `/api/labs/session/nodes/(:action)`, `/api/nodestatus` |
| [`/opt/unetlab/html/includes/api_nodes.php`](../../opt/unetlab/html/includes/api_nodes.php)](../../html/includes/api_nodes.php) | PHP | Các hàm xử lý nghiệp vụ node: `apiNodeAdd()`, `apiNodeEdit()`, `apiNodeDelete()`, `apiNodeStart()`, `apiNodeStop()`, `apiNodeWipe()` |
| [`/opt/unetlab/html/includes/__node.php`](../../opt/unetlab/html/includes/__node.php)](../../html/includes/__node.php) | PHP (OOP Domain Object) | Đối tượng `Node`: Đọc ghi thuộc tính node từ Lab XML, tính toán port console, kiểm tra tính hợp lệ của tham số phần cứng |
| [`/opt/unetlab/html/includes/functions.php`](../../opt/unetlab/html/includes/functions.php)](../../html/includes/functions.php) | PHP | Tầng điều phối hạ tầng: `nodeStart()`, `nodeStop()`, `nodeWipe()`, `nodeExport()`, gọi các script CLI hệ thống |
| [`wrappers`](../../wrappers)/` | C / C++ compiled binaries | `qemu_wrapper`, `iol_wrapper`, `docker_wrapper`, `dynamips_wrapper`, `unl_wrapper`: Tiến trình setuid root khởi chạy hypervisors |
| [`/opt/unetlab/scripts/unl_wrapper.php`](../../opt/unetlab/scripts/unl_wrapper.php)](../../scripts/unl_wrapper.php) | PHP CLI | Cầu nối dòng lệnh giữa API Web và các wrapper nhị phân |
| [`/opt/unetlab/html/themes/default/js/actions.js`](../../opt/unetlab/html/themes/default/js/actions.js)](../../html/themes/default/js/actions.js) | JavaScript | Giao diện điều khiển hành động: Start, Stop, Wipe, Export, Restart, Start Selected |
| [`/opt/unetlab/html/themes/default/js/pnetlab-node-form.js`](../../opt/unetlab/html/themes/default/js/pnetlab-node-form.js)](../../html/themes/default/js/pnetlab-node-form.js) | JavaScript | Form modal cấu hình node (chọn image, template, vCPU, RAM, Ethernet slots) |
| [`/opt/unetlab/html/themes/default/js/pnetlab-bulk-node-edit.js`](../../opt/unetlab/html/themes/default/js/pnetlab-bulk-node-edit.js)](../../html/themes/default/js/pnetlab-bulk-node-edit.js)| JavaScript | Giao diện chỉnh sửa đồng loạt thuộc tính của nhiều node được chọn |

---

## 4. Sơ đồ Component Diagram (C4 Level 3: Node Lifecycle Engine)

Sơ đồ thể hiện các thành phần nội bộ bên trong Nhóm 01 và luồng gọi dữ liệu:

```mermaid
flowchart TD
    %% Styling classes
    classDef ui fill:#1f6feb,stroke:#58a6ff,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef api fill:#238636,stroke:#3fb950,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef wrap fill:#d29922,stroke:#f0883e,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef kernel fill:#8957e5,stroke:#a371f7,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef storage fill:#21262d,stroke:#8b949e,stroke-width:1.5px,color:#c9d1d9,rx:6px,ry:6px;

    subgraph SG_web_ui [" 📦 Giao diện Web Canvas (Client Browser) "]
        direction TB
        actions_js["<b>actions.js / node-form.js</b><br/><i>(JavaScript Canvas Controller)</i><br/>Gửi lệnh Start/Stop/Wipe/Edit qua REST API"]:::ui
        bulk_js["<b>pnetlab-bulk-node-edit.js</b><br/><i>(Bulk Edit UI)</i><br/>Quản lý thao tác chọn và chỉnh sửa hàng loạt node"]:::ui
    end

    subgraph SG_php_engine [" 📦 Tầng Backend API (PHP Engine) "]
        direction TB
        api_router["<b>api.php</b><br/><i>(Slim Router)</i><br/>Định tuyến các endpoint /api/labs/session/nodes/*"]:::api
        api_nodes["<b>api_nodes.php</b><br/><i>(Node Business Service)</i><br/>Kiểm tra quyền người dùng, validate input và điều phối phiên"]:::api
        node_model["<b>__node.php</b><br/><i>(Domain Model (Node))</i><br/>Biểu diễn node trong bộ nhớ, tính toán port telnet/vnc và map slot"]:::api
        functions_core["<b>functions.php</b><br/><i>(Core Infrastructure Bridge)</i><br/>Sinh thư mục /opt/unetlab/tmp/<pod>/<id>, tạo overlay disk"]:::api
    end

    subgraph SG_system_layer [" 📦 Tầng Điều phối Hệ thống (System & Wrappers) "]
        direction TB
        unl_wrapper_php["<b>unl_wrapper.php</b><br/><i>(CLI Orchestrator)</i><br/>Kịch bản PHP CLI nhận tham số từ Web để kích hoạt tiến trình ảo hóa"]:::wrap
        c_wrappers["<b>qemu_wrapper / iol_wrapper / docker_wrapper</b><br/><i>(Setuid Root Binaries)</i><br/>Tạo TAP interface, gắn vào Linux Bridge, khởi chạy QEMU/Docker/IOL"]:::wrap
    end

    subgraph SG_kernel_layer [" 📦 Linux Kernel & Hypervisors "]
        direction TB
        kvm_qemu["<b>KVM / QEMU Engine</b><br/><i>(Virtual Machine)</i><br/>Thực thi ảo hóa phần cứng máy ảo mạng"]:::kernel
        iol_exec["<b>Cisco IOL Executable</b><br/><i>(Native Linux Process)</i><br/>Chạy trực tiếp binary Cisco IOS L2/L3"]:::kernel
        docker_engine["<b>Docker Engine (dockerd)</b><br/><i>(Linux Containers)</i><br/>Chạy container mạng với network namespace riêng biệt"]:::kernel
        cgroups["<b>Linux Cgroups & NetEm</b><br/><i>(Kernel Resource Control)</i><br/>Giới hạn tải CPU/RAM và tạo độ trễ đường truyền"]:::kernel
    end

    %% Quan hệ giữa các thành phần
    actions_js -->|"HTTP POST /api/labs/session/nodes/start<br/><i>[JSON Payload]</i>"| api_router
    bulk_js -->|"HTTP POST /api/labs/session/nodes/bulk<br/><i>[JSON Payload]</i>"| api_router
    api_router -->|"Gọi hàm nghiệp vụ<br/><i>[apiNodeStart / apiNodeStop]</i>"| api_nodes
    api_nodes -->|"Đọc cấu hình node từ Lab XML<br/><i>[$lab->getNodes()]</i>"| node_model
    api_nodes -->|"Thực thi hạ tầng<br/><i>[nodeStart() / nodeStop()]</i>"| functions_core
    functions_core -->|"Thực thi lệnh shell<br/><i>[sudo [`[`/opt/unetlab/scripts/unl_wrapper.php`](../../opt/unetlab/scripts/unl_wrapper.php)](../../scripts/unl_wrapper.php) -a start]</i>"| unl_wrapper_php
    unl_wrapper_php -->|"Gọi trực tiếp file nhị phân<br/><i>[execve([`[`/opt/unetlab/wrappers/qemu_wrapper`](../../opt/unetlab/wrappers/qemu_wrapper)](../../wrappers/qemu_wrapper))]</i>"| c_wrappers
    c_wrappers -->|"Khởi chạy tiến trình máy ảo<br/><i>[execve(qemu-system-x86_64)]</i>"| kvm_qemu
    c_wrappers -->|"Khởi chạy tiến trình IOL<br/><i>[execve(i386-exec)]</i>"| iol_exec
    c_wrappers -->|"Điều khiển container<br/><i>[docker run / docker exec]</i>"| docker_engine
    c_wrappers -->|"Gán tiến trình vào cgroup<br/><i>[/sys/fs/cgroup/cpu,memory]</i>"| cgroups
```

---

> 👉 **Xem chi tiết từng tính năng con**:
> 1. [`F01-node-create-edit.md`](../02-features/node-lifecycle/F01-node-create-edit.md) — Khởi tạo & Cấu hình Tham số Node
> 2. [`F02-node-start-lifecycle.md`](../02-features/node-lifecycle/F02-node-start-lifecycle.md) — Quy trình Khởi động Node (Start Lifecycle)
> 3. [`F03-node-stop-kill.md`](../02-features/node-lifecycle/F03-node-stop-kill.md) — Dừng & Hủy Tiến trình Node (Stop & Kill)
> 4. [`F04-node-wipe-clean.md`](../02-features/node-lifecycle/F04-node-wipe-clean.md) — Làm sạch Dữ liệu Thiết bị (Node Wipe)
> 5. [`F05-node-export-config.md`](../02-features/node-lifecycle/F05-node-export-config.md) — Trích xuất & Lưu trữ Cấu hình (Export Config)
> 6. [`F06-node-wrapper-orchestration.md`](../02-features/node-lifecycle/F06-node-wrapper-orchestration.md) — Tầng Điều phối Wrapper Nhị phân (Binary Wrappers)
> 7. [`F07-node-bulk-operations.md`](../02-features/node-lifecycle/F07-node-bulk-operations.md) — Thao tác Node Hàng loạt (Bulk Operations)
