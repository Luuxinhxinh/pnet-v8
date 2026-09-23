# PNet v8 (PNETLab v8) — Hệ thống Giả lập Mạng Phân tán Doanh nghiệp

Repository này lưu trữ toàn bộ mã nguồn chuyên trách cốt lõi và tài liệu kỹ thuật của hệ thống **PNet v8 (PNETLab v8)**, được tổ chức **chuẩn hóa 1:1 đồng nhất với cây thư mục thực tế trên hệ điều hành Linux**.

---

## 📂 Cấu trúc Thư mục Hệ thống (Exact Linux Filesystem Tree)

```
pnet-v8/
└── opt/
    ├── unetlab/
    │   ├── docs/                      # 📚 Toàn bộ 223 tài liệu đặc tả kiến trúc (SAD) & tính năng (FSD)
    │   │   ├── INDEX.md               # Mục lục tổng thể & bảng tra cứu chéo mã nguồn
    │   │   ├── 00-overview.md         # Tổng quan nghiệp vụ & C4 Context Diagram
    │   │   ├── 00-architecture.md     # Tài liệu kiến trúc kỹ thuật chuyên sâu (SAD 5-Tier, CoW, Data Path)
    │   │   ├── 01-feature-groups/     # Kiến trúc 12 nhóm tính năng lớn (Level 1)
    │   │   ├── 02-features/           # Đặc tả chi tiết 69 tính năng cốt lõi (Level 2)
    │   └── └── 03-diagrams/           # 139 sơ đồ kiến trúc, Call Graph & Sequence Diagrams (Level 3)
    │   │
    │   ├── html/                      # 🌐 Web Frontend (Canvas/JS) & REST API Backend (PHP Slim)
    │   │   ├── api.php                # Entrypoint định tuyến REST API (/api/*)
    │   │   ├── includes/              # Logic cốt lõi: api_nodes.php, __node.php, functions.php...
    │   │   ├── themes/default/js/     # Động cơ đồ họa HTML5 Canvas & UI actions
    │   │   └── templates/             # Template thiết bị & giao diện HTML
    │   │
    │   ├── wrappers/                  # 🛡️ Tầng điều phối nhị phân Setuid Root (C/C++)
    │   │   ├── qemu_wrapper.c         # Tạo TAP, gắn Bridge, gán cgroups và execve KVM/QEMU
    │   │   ├── iol_wrapper.c          # Quản lý vòng đời Cisco IOL (L2/L3), NVRAM
    │   │   └── docker_wrapper.c       # Quản lý Docker network namespace
    │   │
    │   └── scripts/                   # ⚙️ Tầng điều phối dòng lệnh & Micro-Daemons nền
    │       ├── unl_wrapper.php        # CLI Orchestrator giữa PHP Web và binary wrappers
    │       ├── cluster_broker.py      # Python asyncio daemon quản lý Cluster Satellite & mTLS
    │       ├── linkwatch.py           # Giám sát Netlink sự kiện mạng thời gian thực
    │       └── pnet_doctor.py         # Công cụ tự động chẩn đoán hệ thống
    │
    └── pnet-webconsole/               # 🖥️ WebConsole Terminal Multiplexer (Node.js & WebSocket bridge)
        └── backend/                   # WebSocket bridge cho CLI xterm.js và Guacamole VNC/RDP
```

---

## 📖 Bắt đầu Khám phá Hệ thống
* Xem mục lục điều hướng & tra cứu mã nguồn: [**`opt/unetlab/docs/INDEX.md`**](opt/unetlab/docs/INDEX.md)
* Đọc tài liệu kiến trúc kỹ thuật sâu: [**`opt/unetlab/docs/00-architecture.md`**](opt/unetlab/docs/00-architecture.md)
* Tìm hiểu 12 nhóm tính năng cốt lõi: [**`opt/unetlab/docs/01-feature-groups/`**](opt/unetlab/docs/01-feature-groups/)
