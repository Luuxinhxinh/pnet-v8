# PNet v8 (PNETLab v8) — Core Source Code & System Architecture

Chào mừng đến với kho mã nguồn cốt lõi và tài liệu kỹ thuật của **PNet v8 (PNETLab v8)** — Nền tảng giả lập hạ tầng mạng phân tán cho doanh nghiệp.

## 📂 Cấu trúc Thư mục Dự án

```
.
├── docs/                      # 📚 Toàn bộ 223 tài liệu đặc tả kiến trúc (SAD) & tính năng (FSD)
│   ├── INDEX.md               # Mục lục điều hướng & tra cứu mã nguồn
│   ├── 00-overview.md         # Tổng quan nghiệp vụ & C4 Context Diagram
│   ├── 00-architecture.md     # Tài liệu kiến trúc kỹ thuật chuyên sâu (SAD 5-Tier, CoW, Data Path)
│   ├── 01-feature-groups/     # Kiến trúc 12 nhóm tính năng lớn (Level 1)
│   ├── 02-features/           # Đặc tả chi tiết 69 tính năng cốt lõi (Level 2)
│   └── 03-diagrams/           # 139 sơ đồ kiến trúc, Call Graph & Sequence Diagrams (Level 3)
│
├── html/                      # 🌐 Toàn bộ mã nguồn Web Frontend (Canvas/JS) & REST API Backend (PHP Slim)
│   ├── api.php                # Điểm định tuyến chính của REST API
│   ├── includes/              # Tầng nghiệp vụ cốt lõi: api_nodes.php, __node.php, functions.php...
│   ├── themes/default/js/     # Động cơ đồ họa HTML5 Canvas & UI Controllers
│   └── templates/             # Giao diện HTML & Blade templates
│
├── wrappers/                  # 🛡️ Tầng điều phối nhị phân Setuid Root (C/C++)
│   ├── qemu_wrapper.c         # Tạo TAP, gắn Bridge, gán cgroups và execve KVM/QEMU
│   ├── iol_wrapper.c          # Quản lý vòng đời Cisco IOL (L2/L3)
│   └── docker_wrapper.c       # Quản lý Docker network namespace
│
├── scripts/                   # ⚙️ Tầng điều phối dòng lệnh & Micro-Daemons nền
│   ├── unl_wrapper.php        # CLI Orchestrator giữa PHP Web và binary wrappers
│   ├── cluster_broker.py      # Python asyncio daemon quản lý Cluster Satellite
│   ├── linkwatch.py           # Giám sát Netlink sự kiện mạng thời gian thực
│   └── pnet_doctor.py         # Công cụ tự động chẩn đoán hệ thống
│
└── pnet-webconsole/           # 🖥️ WebConsole Terminal Multiplexer (Node.js & WebSocket)
```

## 📖 Bắt đầu với Tài liệu
* Xem mục lục tra cứu nhanh: [`docs/INDEX.md`](docs/INDEX.md)
* Tìm hiểu kiến trúc kỹ thuật: [`docs/00-architecture.md`](docs/00-architecture.md)
