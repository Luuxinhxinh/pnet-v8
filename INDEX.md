---
title: "Mục lục Tổng thể Bộ Tài liệu Kỹ thuật PNet v8 (SAD & FSD)"
version: "8.0 (Build 6.0.0-103)"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
format: "Software Architecture Document (SAD) & Feature Specification Document (FSD)"
---

# BỘ TÀI LIỆU KỸ THUẬT PHÂN LỚP HỆ THỐNG PNET V8 (SAD & FSD)

Chào mừng lập trình viên và kỹ sư đến với bộ tài liệu đặc tả kiến trúc phần mềm (**Software Architecture Document - SAD**) và đặc tả chi tiết tính năng (**Feature Specification Document - FSD**) của nền tảng **PNet v8 (PNETLab v8)**. 

Bộ tài liệu được chuẩn hóa theo mô hình **C4 Model** và phân cấp 4 tầng kỹ thuật từ tổng quan vĩ mô đến mã nguồn vi mô (Level 0 → Level 3), bao phủ toàn diện **100% tính năng trong mã nguồn thật của PNet v8**.

---

## CÂY THƯ MỤC HỆ THỐNG TÀI LIỆU (DOCUMENTATION TREE)

```
docs/
├── INDEX.md                                              # Trang mục lục điều hướng trung tâm (File hiện tại)
├── 00-overview.md                                        # [Level 0] SAD - System Context & Tech Stack Tổng quan
├── 00-architecture.md                                    # [Level 0] SAD - Phân tích Kiến trúc Kỹ thuật Chuyên sâu (Tầng, Mạng, Data Path)
│
├── 01-feature-groups/                                    # [Level 1] SAD/FSD - Danh mục 12 Nhóm Tính năng Lớn
│   ├── 01-node-lifecycle-emulation.md                    # G01: Động cơ Giả lập & Quản lý Vòng đời Node
│   ├── 02-network-topology-canvas.md                     # G02: Mạng kết nối, Topo & Canvas Đồ họa
│   ├── 03-console-remote-access.md                       # G03: Bàn điều khiển & Truy cập Từ xa (WebConsole/Native)
│   ├── 04-lab-management-collaboration.md               # G04: Quản lý Lab, Import/Export & Phân quyền Lab
│   ├── 05-cluster-distributed-satellite.md               # G05: Cụm phân tán Cluster & Vệ tinh (Satellite)
│   ├── 06-netem-telemetry-monitoring.md                  # G06: Giả lập Sự cố Mạng (NetEm) & Giám sát Thời gian thực
│   ├── 07-protocol-overlay-analytics.md                  # G07: Phân tích Giao thức & Lớp phủ Trực quan (Overlay)
│   ├── 08-lab-validation-assessment.md                   # G08: Thẩm định & Chấm điểm Lab Tự động
│   ├── 09-device-templates-images.md                     # G09: Quản lý Image, Template Thiết bị & Kho Ứng dụng
│   ├── 10-automation-ai-sdwan.md                         # G10: Tự động hóa, Trợ lý AI (MCP) & Cisco SD-WAN
│   ├── 11-user-security-pki.md                           # G11: Quản lý Người dùng, Phân quyền POD & Bảo mật PKI
│   └── 12-system-diagnostics-platform.md                 # G12: Quản trị Hệ thống, Nền tảng & Doctor
│
├── 02-features/                                          # [Level 2] FSD - 69 Tài liệu Đặc tả Tính năng Chi tiết
│   ├── node-lifecycle/                                   # Nhóm 01: Vòng đời Thiết bị Ảo
│   │   ├── F01-node-create-edit.md                       # Khởi tạo & Cấu hình Tham số Node
│   │   ├── F02-node-start-lifecycle.md                   # Quy trình Khởi động Node (Start Lifecycle)
│   │   ├── F03-node-stop-kill.md                         # Dừng & Hủy Tiến trình Node (Stop & Kill)
│   │   ├── F04-node-wipe-clean.md                        # Làm sạch Dữ liệu Thiết bị (Node Wipe)
│   │   ├── F05-node-export-config.md                     # Trích xuất & Lưu trữ Cấu hình (Export Config)
│   │   ├── F06-node-wrapper-orchestration.md             # Tầng Điều phối Wrapper Nhị phân (Binary Wrappers)
│   │   └── F07-node-bulk-operations.md                   # Thao tác Node Hàng loạt (Bulk Operations)
│   │
│   ├── network-topology/                                 # Nhóm 02: Mạng Kết nối & Đồ họa Canvas
│   │   ├── F08-network-bridge-cloud.md                   # Mạng Cầu nối & Kết nối Đám mây (Bridge & Cloud)
│   │   ├── F09-network-p2p-links.md                      # Kết nối Điểm-Điểm Tối ưu (Point-to-Point Links)
│   │   ├── F10-canvas-topology-engine.md                 # Động cơ Vẽ & Tương tác Canvas (Topology Engine)
│   │   ├── F11-canvas-link-connect.md                    # Tương tác Nối dây Trực quan (Canvas Link Drawing)
│   │   ├── F12-canvas-shapes-annotations.md              # Công cụ Vẽ Khối & Chú thích (Shapes & Annotations)
│   │   ├── F13-canvas-custom-pictures.md                 # Bản đồ Ảnh nền Tùy biến (Custom Pictures & Maps)
│   │   └── F14-canvas-alignment-tools.md                 # Bộ Công cụ Căn gióng & Nhân bản (Align & Duplicate)
│   │
│   ├── console-access/                                   # Nhóm 03: Bàn điều khiển & Truy cập Từ xa
│   │   ├── F15-webconsole-websocket-bridge.md            # Cầu nối WebConsole WebSocket (WebSocket CLI Bridge)
│   │   ├── F16-guacamole-html5-vnc-rdp.md                # Tích hợp Guacamole HTML5 VNC/RDP
│   │   ├── F17-console-token-minting.md                  # Cấp phát & Kiểm thực Token Console (Token Minting)
│   │   ├── F18-native-console-handler.md                 # Tích hợp Giao thức Native Terminal Client
│   │   └── F19-native-wireshark-capture.md               # Bắt Gói tin Wireshark Trực tiếp Từ xa
│   │
│   ├── lab-management/                                   # Nhóm 04: Quản lý Lab & Đóng gói
│   │   ├── F20-lab-crud-tree.md                          # Quản lý Cây Thư mục & Thao tác Lab (Lab & Folder CRUD)
│   │   ├── F21-lab-xml-parser-serializer.md              # Bộ Đọc & Ghi Cấu trúc Lab XML (XML Serializer)
│   │   ├── F22-lab-export-import-zip.md                  # Đóng gói & Nhập Xuất Lab (ZIP Export & Import)
│   │   ├── F23-lab-cml-virl-converter.md                 # Bộ Chuyển đổi Lab Cisco CML / VIRL (Format Converter)
│   │   ├── F24-lab-session-locking.md                    # Khóa Phiên & Kiểm soát Đồng thời (Lab Session Locking)
│   │   └── F25-lab-workbook-pdf.md                       # Trình Xem Tài liệu Thực hành (Workbook Viewer)
│   │
│   ├── cluster-satellite/                                # Nhóm 05: Cụm Phân tán & Máy chủ Vệ tinh
│   │   ├── F26-cluster-broker-daemon.md                  # Bộ Điều phối Cụm Trung tâm (Cluster Broker Daemon)
│   │   ├── F27-satellite-agent-lifecycle.md              # Đăng ký & Quản lý Vòng đời Vệ tinh (Satellite Lifecycle)
│   │   ├── F28-node-cluster-placement.md                 # Điều phối Vị trí Node Chạy (Node Cluster Placement)
│   │   ├── F29-cluster-cross-bridge-sync.md              # Đồng bộ Luồng Mạng Xuyên Cụm (Cross-Bridge Sync)
│   │   └── F30-cluster-health-failover.md                # Kiểm tra Sức khỏe Cụm & Cảnh báo (Cluster Health)
│   │
│   ├── netem-telemetry/                                  # Nhóm 06: Giả lập Sự cố & Đo đạc Thời gian thực
│   │   ├── F31-netem-link-impairment.md                  # Bộ Điều khiển Giả lập Sự cố NetEm (NetEm Impairment)
│   │   ├── F32-live-linkwatch-daemon.md                  # Daemon Giám sát Liên kết Thời gian thực (Linkwatch Daemon)
│   │   ├── F33-live-linkstats-egress.md                  # Thống kê Lưu lượng & Hiệu ứng Phát sáng (Egress Glow)
│   │   ├── F34-live-nodestats-cgroups.md                 # Giám sát Tải CPU/RAM Từng Node qua Linux Cgroups
│   │   ├── F35-host-system-telemetry.md                  # Thu thập Chỉ số Phần cứng Máy chủ (Host Telemetry)
│   │   └── F36-realtime-labstate-sse.md                  # Kênh Đẩy Trạng thái Lab Thời gian thực qua SSE
│   │
│   ├── protocol-overlay/                                 # Nhóm 07: Phân tích Giao thức & Lớp phủ Đồ họa
│   │   ├── F37-routing-protocol-overlay.md               # Lớp phủ Trực quan Đường đi Giao thức (Routing Overlays)
│   │   ├── F38-bgp-waterfall-analytics.md                # Phân tích Bảng Định tuyến & Thác đổ BGP (BGP Waterfall)
│   │   ├── F39-live-packet-prototracer.md                # Giải mã Gói tin Trực tiếp trên Canvas (Prototracer)
│   │   ├── F40-roce-rdma-telemetry.md                    # Phân tích Mạng RoCE v2 & RDMA Datacenter (RoCE Analytics)
│   │   ├── F41-virtual-wifi-simulation.md                # Giả lập Sóng Vô tuyến 802.11 & Biểu đồ Nhiệt (vWiFi)
│   │   ├── F42-virtual-wifi-spy-capture.md               # Bắt Gói tin Vô tuyến Không dây (vWiFi Spy Capture)
│   │   └── F43-datacenter-rack-view.md                   # Tự động Dựng Sơ đồ Bố trí Tủ Rack (Datacenter Rack View)
│   │
│   ├── lab-validation/                                   # Nhóm 08: Thẩm định & Chấm điểm Tự động
│   │   ├── F44-validation-task-definition.md             # Định nghĩa Nhiệm vụ & Cấu trúc Tiêu chí (Task Definition)
│   │   ├── F45-validation-probe-engine.md                # Động cơ Thực thi Kiểm tra Tự động (Probe Engine)
│   │   ├── F46-validation-transport-executor.md          # Kênh Giao tiếp Thực thi Lệnh CLI (Transport Executor)
│   │   └── F47-validation-score-report.md                # Lưu trữ Điểm số & Báo cáo Tiến độ (Validation Store)
│   │
│   ├── templates-images/                                 # Nhóm 09: Bản mẫu Thiết bị & Kho Ứng dụng
│   │   ├── F48-device-templates-schema.md                # Hệ thống Định nghĩa Bản mẫu Thiết bị (Template Schema)
│   │   ├── F49-custom-device-factory.md                  # Nhà máy Chế tạo Mẫu Thiết bị Tùy biến (Device Factory)
│   │   ├── F50-image-filesystem-manager.md               # Quản lý Thư mục Image Thiết bị Cục bộ (Image Manager)
│   │   ├── F51-ishare2-cloud-store.md                    # Tích hợp Kho Đám mây IShare2 (IShare2 Cloud Store)
│   │   ├── F52-image-normalizer-qcow2.md                 # Bộ Chuẩn hóa Tên & Chuyển đổi Đĩa Ảo (Image Normalizer)
│   │   └── F53-custom-icon-manager.md                    # Quản lý Biểu tượng Thiết bị Đồ họa (Icon Manager)
│   │
│   ├── automation-ai/                                    # Nhóm 10: Tự động hóa, Trợ lý AI & Cisco SD-WAN
│   │   ├── F54-ai-agent-mcp-server.md                    # Máy chủ Giao thức Ngữ cảnh Mô hình AI (MCP Server)
│   │   ├── F55-ai-lab-builder-canvas.md                  # Widget Trợ lý AI Sinh Topo trên Canvas (AI Lab Builder)
│   │   ├── F56-sdwan-fabric-builder.md                   # Trình Thiết kế Fabric Cisco SD-WAN Trực quan (SD-WAN Builder)
│   │   ├── F57-sdwan-onboarding-automation.md            # Tự động hóa Bootstrap & Khởi động SD-WAN (SD-WAN Onboard)
│   │   └── F58-config-push-automation.md                 # Tự động Hóa Đẩy Cấu hình & Thu Thập Lệnh (Config Push)
│   │
│   ├── user-security/                                    # Nhóm 11: Quản lý Người dùng & Bảo mật PKI
│   │   ├── F59-user-rbac-pod-isolation.md                # Phân quyền Vai trò & Cách ly POD (RBAC & POD Isolation)
│   │   ├── F60-auth-token-session.md                     # Xác thực Đăng nhập & Quản lý Phiên (Auth Token & Session)
│   │   ├── F61-password-reset-workflow.md                # Khôi phục Mật khẩu Tự phục vụ (Password Reset Workflow)
│   │   ├── F62-smtp-mailer-notifications.md              # Cấu hình Gửi Mail & Mẫu Thông báo (SMTP Mailer)
│   │   └── F63-cluster-pki-certificates.md               # Quản lý Chứng chỉ Số Cụm (Cluster PKI & Certificates)
│   │
│   └── system-platform/                                  # Nhóm 12: Quản trị Hệ thống, Nền tảng & Doctor
│       ├── F64-system-doctor-diagnostics.md              # Hệ thống Chẩn đoán Tự động (PNet Doctor Diagnostics)
│       ├── F65-system-power-maintenance.md               # Quản lý Nguồn & Vệ sinh Dữ liệu Rác (Power & Maintenance)
│       ├── F66-ksm-memory-deduplication.md               # Tối ưu Hóa Bộ nhớ RAM qua Linux KSM (KSM Memory Tuning)
│       ├── F67-ovf-network-initialization.md             # Khởi tạo Mạng Máy ảo OVF Đầu tiên (OVF Firstboot Network)
│       ├── F68-bridge-lacp-fwd-reconcile.md              # Đồng bộ Cầu nối & Khắc phục Luồng Chuyển tiếp (Bridge Reconcile)
│       └── F69-security-hardening-phpfpm.md              # Tăng Cứng Bảo mật Web & Tăng tốc PHP-FPM (Web Hardening)
│
└── 03-diagrams/                                          # [Level 3] 139 Sơ đồ Mermaid Chi tiết
    ├── module-dependency.md                              # Sơ đồ Liên kết Module & Phụ thuộc Toàn Hệ thống
    ├── f01-node-create-edit-callgraph.md                 # Call Graph F01
    ├── f01-node-create-edit-sequence.md                  # Sequence Diagram F01
    ├── ... (đủ cặp Call Graph và Sequence Diagram cho toàn bộ 69 tính năng từ F01 đến F69) ...
    ├── f69-security-hardening-phpfpm-callgraph.md        # Call Graph F69
    └── f69-security-hardening-phpfpm-sequence.md         # Sequence Diagram F69
```

---

## BẢNG TRA CỨU NHANH TÍNH NĂNG VÀ VỊ TRÍ FILE MÃ NGUỒN

Khi bạn cần sửa lỗi hoặc phát triển tính năng mới trong PNet v8, hãy tra cứu nhanh bảng dưới đây để biết file code nào chịu trách nhiệm:

| Nhu cầu Can thiệp Mã nguồn | Nhóm | File / Thư mục Mã nguồn Cần sửa | Tài liệu Chi tiết Cần đọc |
| :--- | :---: | :--- | :--- |
| **Sửa logic khởi động QEMU/IOL/Docker** | G01 | `/opt/unetlab/wrappers/`, `html/includes/functions.php` | [`F02-node-start-lifecycle.md`](02-features/node-lifecycle/F02-node-start-lifecycle.md) |
| **Thêm hoặc sửa loại card mạng, cổng nối dây** | G02 | `html/devices/interfc.php`, `html/includes/api_networks.php` | [`F08-network-bridge-cloud.md`](02-features/network-topology/F08-network-bridge-cloud.md) |
| **Sửa giao diện vẽ Canvas hoặc kéo thả dây** | G02 | `html/themes/default/js/javascript.js` | [`F10-canvas-topology-engine.md`](02-features/network-topology/F10-canvas-topology-engine.md) |
| **Khắc phục lỗi WebConsole Telnet không gõ được** | G03 | `/opt/pnet-webconsole/backend/http_ws_bridge.py` | [`F15-webconsole-websocket-bridge.md`](02-features/console-access/F15-webconsole-websocket-bridge.md) |
| **Khắc phục lỗi Guacamole VNC màn hình đen** | G03 | `/opt/pnet-webconsole/backend/guacamole-lite-server.js` | [`F16-guacamole-html5-vnc-rdp.md`](02-features/console-access/F16-guacamole-html5-vnc-rdp.md) |
| **Sửa cấu trúc đọc ghi file Lab XML `.unl`** | G04 | `html/includes/__lab.php`, `includes/__node.php` | [`F21-lab-xml-parser-serializer.md`](02-features/lab-management/F21-lab-xml-parser-serializer.md) |
| **Sửa daemon điều phối cụm Satellite** | G05 | `/opt/unetlab/scripts/pnetlab-brokerd.py`, `pnetlab-satd.py`| [`F26-cluster-broker-daemon.md`](02-features/cluster-satellite/F26-cluster-broker-daemon.md) |
| **Sửa cơ chế tạo độ trễ NetEm đường dây cáp** | G06 | `html/pnq-linkwatch.php`, `scripts/pnetlab-linkwatchd.py` | [`F31-netem-link-impairment.md`](02-features/netem-telemetry/F31-netem-link-impairment.md) |
| **Chỉnh sửa thuật toán vẽ đường bao OSPF/BGP** | G07 | `/opt/unetlab/scripts/pnet_routeoverlay.py` | [`F37-routing-protocol-overlay.md`](02-features/protocol-overlay/F37-routing-protocol-overlay.md) |
| **Bổ sung tiêu chí chấm bài thi lab tự động** | G08 | `html/includes/lab_validation_probe.php` | [`F45-validation-probe-engine.md`](02-features/lab-validation/F45-validation-probe-engine.md) |
| **Bổ sung template thiết bị mạng mới** | G09 | `html/templates/`, `html/devices-factory/api.php` | [`F48-device-templates-schema.md`](02-features/templates-images/F48-device-templates-schema.md) |
| **Tích hợp thêm Tool gọi lệnh cho AI Agent MCP**| G10 | `/opt/unetlab/scripts/mcp/pnetlab-mcp.py` | [`F54-ai-agent-mcp-server.md`](02-features/automation-ai/F54-ai-agent-mcp-server.md) |
| **Sửa logic phân quyền người dùng và POD** | G11 | `html/includes/api_uusers.php`, `api_authentication.php` | [`F59-user-rbac-pod-isolation.md`](02-features/user-security/F59-user-rbac-pod-isolation.md) |
| **Bổ sung bài kiểm tra tự chẩn đoán PNet Doctor**| G12 | `html/includes/doctor.php`, `scripts/pnetlab_doctor.php`| [`F64-system-doctor-diagnostics.md`](02-features/system-platform/F64-system-doctor-diagnostics.md) |

---

## CHECKLIST NGHIỆM THU CHẤT LƯỢNG (QUALITY CHECKLIST)

- [x] **Độ bao phủ toàn diện**: Đầy đủ 69 tính năng con thuộc 12 nhóm lớn, bao phủ từ kernel virtualization đến web interface.
- [x] **Chuẩn cấu trúc FSD Level 2**: Mỗi file đặc tả tính năng có đủ 6 mục bắt buộc (Mô tả, Cơ chế, Công nghệ, File/Hàm, Input/Output, Link Diagram).
- [x] **Sơ đồ Mermaid Level 3**: Toàn bộ 69 tính năng đều có Call Graph và Sequence Diagram chi tiết đối chiếu với code thật.
- [x] **Sơ đồ Module Dependency**: Có sơ đồ kiến trúc tổng thể liên kết tất cả các module trong `03-diagrams/module-dependency.md`.
- [x] **Thân thiện với Dev Mới**: Mọi thuật ngữ viễn thông và ảo hóa (KSM, cgroups, NetEm, POD, TAP, IOL, VXLAN, MCP) đều được giải thích rõ ràng.
