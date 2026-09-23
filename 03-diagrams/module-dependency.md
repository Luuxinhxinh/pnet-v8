---
title: "Level 3 — Sơ đồ Liên kết Module Toàn Hệ thống (Module Dependency Diagram)"
diagram_type: "module-dependency"
version: "8.0 (Build 6.0.0-103)"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 3"
---

# SƠ ĐỒ LIÊN KẾT MODULE TOÀN HỆ THỐNG PNET V8 (MODULE DEPENDENCY DIAGRAM)

## 1. Giới thiệu
Tài liệu này cung cấp **Sơ đồ Phụ thuộc Module Toàn Hệ thống (System-Wide Module Dependency Diagram)** của mã nguồn **PNet v8**. Sơ đồ thể hiện rõ mối quan hệ tương tác, import, require, gọi tiến trình con (IPC / exec) và liên kết cơ sở dữ liệu giữa tất cả các thành phần:
- Tầng giao diện người dùng Web Canvas (`html/themes/`, `html/main/`)
- Tầng Web Routing & Business Logic (`html/api.php`, `html/includes/`)
- Tầng Cầu nối WebConsole & WebSockets (`/opt/pnet-webconsole/backend/`)
- Tầng Daemons nền Python (`/opt/unetlab/scripts/`)
- Tầng Binary Wrappers C/C++ (`/opt/unetlab/wrappers/`)
- Tầng Hạ tầng Nhân Linux Virtualization (KVM, Bridge, TAP, Cgroups, NetEm)
- Tầng Cơ sở dữ liệu MariaDB (`pnetlab_db`, `guacdb`)

---

## 2. Sơ đồ Phụ thuộc Tổng thể (System-Wide Architecture Map)

```mermaid
graph TD
    %% SUBGRAPH CLIENT UI
    subgraph UI ["TẦNG GIAO DIỆN CLIENT (JavaScript / HTML5 Canvas / CSS)"]
        JS_CANVAS["javascript.js (Canvas Core Renderer)"]
        JS_ACTIONS["actions.js (Start/Stop/Wipe Actions)"]
        JS_FORMS["pnetlab-node-form.js (Node Config Modal)"]
        JS_NETEM["pnetlab-netem-advanced.js (NetEm Sliders)"]
        JS_OVERLAY["pnetlab-lazy-overlays.js (Route Visualizer)"]
        JS_AI["pnetlab-ai-builder.js (AI Chat Widget)"]
        JS_WEBCONSOLE["pnetlab-webconsole.js (xterm.js Console)"]
        JS_DASHBOARD["main/js/dashboard.js & clusters.js"]
    end

    %% SUBGRAPH WEB SERVER & REVERSE PROXY
    subgraph WEBSERVER ["TẦNG WEB SERVER & PROXY (Apache 2.4)"]
        APACHE_HTTP["Apache mod_php / PHP-FPM (Port 443 / 80)"]
        APACHE_WSTUNNEL["mod_proxy_wstunnel (/ws-cli, /ws-guac)"]
    end

    %% SUBGRAPH PHP BACKEND
    subgraph PHP_CORE ["TẦNG BACKEND & REST API (PHP Slim Framework)"]
        API_ROUTER["html/api.php (Slim REST Router)"]
        INIT_PHP["includes/init.php (Bootstrap & DB Connect)"]
        AUTH_PHP["includes/api_authentication.php (Auth & Tokens)"]
        LAB_OBJ["includes/__lab.php (Lab XML Domain Model)"]
        NODE_OBJ["includes/__node.php (Node Domain Model)"]
        NET_OBJ["includes/__network.php (Network Model)"]
        NODES_API["includes/api_nodes.php (Node Operations)"]
        NETS_API["includes/api_networks.php (Topology Bridging)"]
        LABS_API["includes/api_labs.php (Lab Management)"]
        FUNCS_CORE["includes/functions.php (System Glue & Infrastructure)"]
        DOCTOR_CORE["includes/doctor.php (Health & Permissions)"]
        PROBE_CORE["includes/lab_validation_probe.php (Grading Engine)"]
    end

    %% SUBGRAPH CONSOLE BRIDGES
    subgraph WEBCONSOLE_SRV ["TẦNG CẦU NỐI CONSOLE (Node.js & Python)"]
        WS_BRIDGE["http_ws_bridge.py (Port 8080 - Telnet/SSH Bridge)"]
        GUAC_LITE["guacamole-lite-server.js (Port 8082 - VNC/RDP Gateway)"]
        GUACD_NATIVE["guacd Native Daemon (Port 4822)"]
    end

    %% SUBGRAPH PYTHON DAEMONS
    subgraph PY_DAEMONS ["TẦNG DAEMONS NỀN (Python asyncio & Scripts)"]
        BROKERD["pnetlab-brokerd.py (Cluster Broker Daemon)"]
        LABSTATED["pnetlab-labstated.py (Real-time SSE Streamer)"]
        LINKWATCHD["pnetlab-linkwatchd.py (Kernel Netlink Monitor)"]
        MCP_SERVER["pnetlab-mcp.py (AI Model Context Protocol Server)"]
        AIRHANDLER["airhandler.py (802.11 Virtual Radio Engine)"]
        ROUTE_OVERLAY["pnet_routeoverlay.py (Convex Hull Routing Math)"]
        BGP_PARSE["pnet_bgpparse.py (BGP RIB State Machine)"]
        PROTO_TRACER["pnetlab-prototracer.py (Live Packet Capture)"]
        PROTO_DECODE["pnet_protodecode.py (40+ Protocol Decoders)"]
        VALID_TRANS["pnet_validation_transport.py (Automated CLI Probe)"]
        SDWAN_ONBOARD["sdwan/sdwan-onboard.py (vManage REST Orchestrator)"]
    end

    %% SUBGRAPH SHELL ORCHESTRATION & WRAPPERS
    subgraph WRAPPERS ["TẦNG WRAPPERS & SCRIPTS HỆ THỐNG"]
        UNL_WRAP_PHP["scripts/unl_wrapper.php (CLI Dispatcher)"]
        C_QEMU_WRAP["wrappers/qemu_wrapper (SUID root)"]
        C_IOL_WRAP["wrappers/iol_wrapper (SUID root)"]
        C_DOCKER_WRAP["wrappers/docker_wrapper (SUID root)"]
        C_FWD_WRAP["wrappers/simple_forwarder (Wireshark Raw Socket)"]
        CLEAN_SH["scripts/clean.sh (Cleanup Worker)"]
        KSM_TUNE["scripts/pnetlab-ksm-tune.sh (KSM Tuner)"]
        BRIDGES_SH["opt/ovf/pnet-bridges.sh (Bridge Initializer)"]
    end

    %% SUBGRAPH LINUX KERNEL & VIRTUALIZATION
    subgraph KERNEL ["NHÂN HỆ ĐIỀU HÀNH LINUX & HYPERVISORS"]
        KVM_VMM["KVM / QEMU (qemu-system-x86_64)"]
        IOL_EXEC["Cisco IOL (32-bit Linux Binary)"]
        DOCKER_D["Docker Daemon (dockerd / containerd)"]
        LINUX_BR["Linux Bridges (br-*, pnet0-pnet9)"]
        TAP_DEVS["Linux TAP Interfaces (tap<pod>_<node>_<port>)"]
        NETEM_SCHED["Linux Traffic Control NetEm (sch_netem)"]
        CGROUPS_FS["Linux Cgroups v1/v2 (/sys/fs/cgroup/)"]
        KSM_KERNEL["Kernel Samepage Merging (/sys/kernel/mm/ksm/)"]
    end

    %% SUBGRAPH DATABASES & FILESYSTEM
    subgraph STORAGE ["CƠ SỞ DỮ LIỆU & HỆ THỐNG TỆP"]
        DB_PNET["MariaDB: pnetlab_db (users, sessions, cluster)"]
        DB_GUAC["MariaDB: guacdb (guacamole connections)"]
        FS_LABS["/opt/unetlab/labs/ (*.unl XML files)"]
        FS_TMP["/opt/unetlab/tmp/<pod>/<node>/ (RAM/Disks)"]
        FS_ADDONS["/opt/unetlab/addons/ (qemu, iol, dynamips images)"]
    end

    %% RELATIONSHIPS: UI to WebServer
    JS_CANVAS -->|HTTP GET/POST/PUT| APACHE_HTTP
    JS_ACTIONS -->|HTTP POST| APACHE_HTTP
    JS_FORMS -->|HTTP POST| APACHE_HTTP
    JS_NETEM -->|HTTP POST| APACHE_HTTP
    JS_OVERLAY -->|HTTP GET| APACHE_HTTP
    JS_AI -->|HTTP POST| APACHE_HTTP
    JS_DASHBOARD -->|HTTP GET| APACHE_HTTP
    JS_WEBCONSOLE -->|WebSocket wss://| APACHE_WSTUNNEL

    %% RELATIONSHIPS: WebServer to Backend
    APACHE_HTTP --> API_ROUTER
    APACHE_WSTUNNEL -->|Proxy Port 8080| WS_BRIDGE
    APACHE_WSTUNNEL -->|Proxy Port 8082| GUAC_LITE

    %% RELATIONSHIPS: PHP Slim Internals
    API_ROUTER --> INIT_PHP
    INIT_PHP --> DB_PNET
    API_ROUTER --> AUTH_PHP
    AUTH_PHP --> DB_PNET
    API_ROUTER --> NODES_API
    API_ROUTER --> NETS_API
    API_ROUTER --> LABS_API
    NODES_API --> NODE_OBJ
    NETS_API --> NET_OBJ
    LABS_API --> LAB_OBJ
    LAB_OBJ --> FS_LABS
    NODES_API --> FUNCS_CORE
    NETS_API --> FUNCS_CORE
    API_ROUTER --> DOCTOR_CORE
    API_ROUTER --> PROBE_CORE

    %% RELATIONSHIPS: PHP to CLI & Daemons
    FUNCS_CORE -->|sudo shell exec| UNL_WRAP_PHP
    FUNCS_CORE -->|Unix Domain Socket| BROKERD
    NODES_API -->|Emit event| LABSTATED
    PROBE_CORE -->|Run python| VALID_TRANS
    DOCTOR_CORE -->|systemctl check| WEBSERVER

    %% RELATIONSHIPS: WebConsole
    GUAC_LITE --> DB_GUAC
    GUAC_LITE --> GUACD_NATIVE
    GUACD_NATIVE -->|TCP VNC 5900+| KVM_VMM
    WS_BRIDGE -->|TCP Telnet 32768+| KVM_VMM
    WS_BRIDGE -->|TCP Telnet 32768+| IOL_EXEC

    %% RELATIONSHIPS: Wrappers to Kernel & Hypervisors
    UNL_WRAP_PHP --> C_QEMU_WRAP
    UNL_WRAP_PHP --> C_IOL_WRAP
    UNL_WRAP_PHP --> C_DOCKER_WRAP
    C_QEMU_WRAP -->|Create TAP| TAP_DEVS
    C_QEMU_WRAP -->|Attach Bridge| LINUX_BR
    C_QEMU_WRAP -->|Assign Cgroup| CGROUPS_FS
    C_QEMU_WRAP -->|execve()| KVM_VMM
    C_IOL_WRAP -->|execve()| IOL_EXEC
    C_DOCKER_WRAP -->|docker run| DOCKER_D
    KVM_VMM --> FS_TMP
    KVM_VMM --> FS_ADDONS
    IOL_EXEC --> FS_TMP

    %% RELATIONSHIPS: Python Daemons to System
    BROKERD -->|mTLS TCP 8088| PY_DAEMONS
    LINKWATCHD -->|Netlink AF_NETLINK| LINUX_BR
    LINKWATCHD -->|Notify| LABSTATED
    PROTO_TRACER -->|Raw Socket AF_PACKET| TAP_DEVS
    PROTO_TRACER --> PROTO_DECODE
    AIRHANDLER -->|UDP Frames| TAP_DEVS
    MCP_SERVER --> API_ROUTER
    SDWAN_ONBOARD -->|REST HTTPS 8443| KVM_VMM
    VALID_TRANS -->|Telnet Socket| KVM_VMM
    KSM_TUNE --> KSM_KERNEL
    BRIDGES_SH --> LINUX_BR
    CLEAN_SH --> FS_TMP
```

---

## 3. Bảng Ánh xạ Khối Module và Phụ thuộc Chính

| Tầng Hệ thống | Module Nguồn Chính | Thư viện Phụ thuộc (Dependencies) | Thành phần Được gọi (Callees) |
| :--- | :--- | :--- | :--- |
| **Giao diện Web Canvas** | `html/themes/default/js/` | HTML5 Canvas, xterm.js, EJS, Ace Editor | Apache REST API, WebSockets |
| **Tầng Định tuyến API** | `html/api.php` | PHP Slim Framework v2/v3, PDO MySQL | `includes/api_*.php`, `functions.php` |
| **Tầng Mô hình Dữ liệu** | `html/includes/__*.php` | PHP SimpleXML, DOMDocument | File XML `.unl`, MySQL DB |
| **Tầng Điều phối Hạ tầng** | `html/includes/functions.php` | POSIX, Shell Execution | `scripts/unl_wrapper.php`, `broker.sock` |
| **Tầng WebConsole** | `/opt/pnet-webconsole/backend/` | Node.js, Python asyncio, websockets | `guacd`, raw TCP telnet sockets |
| **Tầng Quản lý Cụm** | `scripts/pnetlab-brokerd.py` | Python asyncio, OpenSSL, mTLS | `pnetlab-satd.py`, `/run/pnetlab/broker.sock` |
| **Tầng Phân tích Giao thức** | `scripts/pnet_routeoverlay.py` | Python SciPy (Convex Hull), Netmiko | Canvas Overlay Layer, Telnet sockets |
| **Tầng Đóng gói & Wrapper** | `/opt/unetlab/wrappers/` | C/C++ glibc, Linux Kernel ioctl TUN/TAP | `qemu-system-x86_64`, `i386-exec`, `docker` |
| **Tầng Nhân Hệ điều hành** | Linux Kernel Virtualization | KVM, Linux Bridge, TAP, NetEm, Cgroups | Máy ảo thiết bị mạng, Phần cứng máy chủ |

---

> 📌 **Ghi chú**: Sơ đồ này liên kết trực tiếp với 69 tài liệu đặc tả tính năng con tại thư mục [`02-features/`](../02-features/) và toàn bộ 138 sơ đồ Call Graph & Sequence Diagram chi tiết trong thư mục [`03-diagrams/`](./).
