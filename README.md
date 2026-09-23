# PNet v8 (PNETLab v8) — Mã Nguồn Hệ Thống & Bộ Đặc Tả Kiến Trúc (SAD / FSD)

Repository này bao gồm **Mã nguồn thực tế của hệ thống PNet v8** (nằm nguyên bản trong `opt/`) và **Bộ tài liệu đặc tả kiến trúc phân lớp toàn diện** (nằm tách biệt trong thư mục `docs/`).

---

## 📂 Cấu trúc Repository

```
pnet-v8/
├── docs/                              # 📚 Toàn bộ 223 tài liệu đặc tả kiến trúc (SAD) & tính năng (FSD)
│   ├── INDEX.md                       # Mục lục tổng thể & bảng tra cứu chéo mã nguồn
│   ├── 00-overview.md                 # Tổng quan nghiệp vụ & C4 Context Diagram
│   ├── 00-architecture.md             # SAD: Phân tích kiến trúc kỹ thuật sâu (5 tầng, CoW, IPC Broker Socket)
│   ├── 01-feature-groups/             # Kiến trúc 12 nhóm tính năng lớn (Level 1)
│   ├── 02-features/                   # Đặc tả chi tiết 69 tính năng cốt lõi (Level 2)
│   └── 03-diagrams/                   # 139 sơ đồ kiến trúc, Call Graph & Sequence Diagrams (Level 3)
│
└── opt/                               # 💻 Toàn bộ mã nguồn thực tế của dự án trên máy chủ Linux
    ├── unetlab/
    │   ├── html/                      # Web Frontend (Canvas/JS) & REST API Backend (PHP Slim)
    │   │   ├── api.php                # Điểm định tuyến chính của REST API (/api/*)
    │   │   ├── includes/              # Logic nghiệp vụ: broker.php, api_nodes.php, __node.php...
    │   │   ├── themes/default/js/     # Động cơ vẽ Canvas, actions.js, wiring...
    │   │   └── templates/             # Template cấu hình thiết bị
    │   │
    │   ├── wrappers/                  # Tầng điều phối nhị phân Setuid Root (qemu_wrapper, iol_wrapper...)
    │   └── scripts/                   # Micro-daemons: pnetlab-brokerd.py, cluster_broker.py, linkwatch...
    │
    └── pnet-webconsole/               # WebConsole Terminal Multiplexer (Node.js WebSocket proxy)
```

---

## 📖 Bắt đầu Khám phá
* Xem mục lục điều hướng và tra cứu nhanh vị trí code: [**`docs/INDEX.md`**](docs/INDEX.md)
* Tìm hiểu kiến trúc kỹ thuật chuyên sâu: [**`docs/00-architecture.md`**](docs/00-architecture.md)
