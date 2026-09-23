---
title: "Level 1 — Nhóm 12: Quản trị Hệ thống, Nền tảng & Doctor"
group_id: "G12"
group_name: "System Administration, Diagnostics, Platform & Doctor Subsystem"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 1"
---

# NHÓM 12: QUẢN TRỊ HỆ THỐNG, NỀN TẢNG & DOCTOR (SYSTEM ADMINISTRATION, DIAGNOSTICS & PLATFORM)

## 1. Mục đích của Nhóm Tính năng

Nhóm **Quản trị Hệ thống, Nền tảng & Doctor** đảm bảo cho toàn bộ cỗ máy PNet v8 vận hành ổn định, tự động khắc phục các lỗi phát sinh và tối ưu hóa tài nguyên phần cứng máy chủ:
1. **Hệ thống Tự Chẩn đoán Toàn diện (PNet Doctor Diagnostics)**: Quét kiểm tra toàn bộ tính toàn vẹn của hệ thống: phát hiện các dịch vụ bị dừng (`systemd services`), kiểm tra phân quyền sai lệch trên các thư mục `/opt/unetlab/`, kiểm tra kết nối cơ sở dữ liệu MariaDB, trạng thái card mạng ảo và đưa ra các hành động sửa lỗi tự động chỉ bằng một click.
2. **Quản trị Nguồn & Vận hành Máy chủ (Power Management & System Operations)**: Cho phép quản trị viên khởi động lại máy chủ (Reboot), tắt máy chủ an toàn (Shutdown), đồng bộ thời gian NTP và dọn dẹp các tệp tin rác/tệp tạm (`clean.sh`).
3. **Tối ưu Hóa Khử Trùng lặp Bộ nhớ Chia sẻ (Kernel Samepage Merging - KSM Tuning)**: Kích hoạt tính năng KSM của Linux Kernel kết hợp script `pnetlab-ksm-tune.sh` và `ksm_merge_exec` để quét tìm các trang nhớ RAM giống nhau giữa hàng chục máy ảo QEMU/IOL đang chạy và gộp chúng lại, giúp tiết kiệm tới 40% dung lượng RAM thực tế của máy chủ.
4. **Khởi tạo Mạng Máy ảo OVF Tự động (OVF Network Firstboot Initialization)**: Tự động phát hiện cấu hình mạng khi triển khai file OVF/OVA trên VMware ESXi hoặc Proxmox, gán IP tĩnh hoặc DHCP, khởi tạo các cầu nối `pnet-bridges` (`pnetlab-netcfg.sh`, `ovfstartup.sh`).
5. **Đồng bộ & Khắc phục Cầu nối Mạng Host (Bridge LACP & Forwarding Reconcile)**: Daemon kiểm tra và thiết lập các rule iptables forward, xử lý tương thích LACP cho card mạng gộp và khôi phục trạng thái mạng sau sự cố.
6. **Tăng cứng Bảo mật Web & Chuyển đổi PHP-FPM (Security Hardening)**: Tự động cấu hình bảo vệ Content Security Policy (CSP), vô hiệu hóa các hàm nguy hiểm trong PHP và tối ưu hiệu năng thông qua kịch bản `enable-web-hardening.sh` và `enable-php-fpm.sh`.

---

## 2. Danh sách Toàn bộ Tính năng Con Thuộc Nhóm (Dẫn tới Level 2)

Dưới đây là 6 tính năng con độc lập thuộc Nhóm 12, được đặc tả chi tiết tại thư mục `02-features/system-platform/`:

| Mã tính năng | Tên tính năng con | File tài liệu Level 2 | Tóm tắt Chức năng |
| :---: | :--- | :--- | :--- |
| **F64** | **Hệ thống Chẩn đoán Tự động (PNet Doctor Diagnostics)** | [`F64-system-doctor-diagnostics.md`](../02-features/system-platform/F64-system-doctor-diagnostics.md) | Vận hành của `doctor.php` và `pnetlab_doctor.php`: Kiểm tra phân quyền file, dịch vụ systemd, disk space |
| **F65** | **Quản lý Nguồn & Vệ sinh Dữ liệu Rác (Power & Maintenance)** | [`F65-system-power-maintenance.md`](../02-features/system-platform/F65-system-power-maintenance.md) | Các lệnh khởi động lại, tắt máy chủ, xóa thư mục tmp và dọn dẹp cgroups qua `clean.sh` |
| **F66** | **Tối ưu Hóa Bộ nhớ RAM qua Linux KSM (KSM Memory Tuning)** | [`F66-ksm-memory-deduplication.md`](../02-features/system-platform/F66-ksm-memory-deduplication.md) | Tinh chỉnh thông số `/sys/kernel/mm/ksm/pages_to_scan`, `sleep_millisecs` và nhị phân `ksm_merge_exec` |
| **F67** | **Khởi tạo Mạng Máy ảo OVF Đầu tiên (OVF Firstboot Network)** | [`F67-ovf-network-initialization.md`](../02-features/system-platform/F67-ovf-network-initialization.md) | Kịch bản `ovfstartup.sh` và `pnetlab-netcfg.sh` thiết lập card mạng quản trị và cấu hình ban đầu |
| **F68** | **Đồng bộ Cầu nối & Khắc phục Luồng Chuyển tiếp (Bridge Reconcile)**| [`F68-bridge-lacp-fwd-reconcile.md`](../02-features/system-platform/F68-bridge-lacp-fwd-reconcile.md) | Kịch bản `pnet-bridges.sh` và `pnet-fwd-reconcile.sh` thiết lập các bridge pnet0-pnet9 và forwarding rules |
| **F69** | **Tăng Cứng Bảo mật Web & Tăng tốc PHP-FPM (Web Hardening)**| [`F69-security-hardening-phpfpm.md`](../02-features/system-platform/F69-security-hardening-phpfpm.md) | Tinh chỉnh bảo mật Apache, cấu hình HTTP headers CSP, chặn duyệt thư mục và kích hoạt PHP-FPM |

---

## 3. Các Module & File Mã nguồn Chịu trách nhiệm Chính

| Đường dẫn File / Thư mục | Ngôn ngữ / Loại | Vai trò chính |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/includes/doctor.php`](../../opt/unetlab/html/includes/doctor.php)](../../html/includes/doctor.php) | PHP (11KB) | Thư viện logic chẩn đoán lỗi hệ sinh thái PNet v8 |
| [`[`/opt/unetlab/scripts/pnetlab_doctor.php`](../../opt/unetlab/scripts/pnetlab_doctor.php)](../../scripts/pnetlab_doctor.php) | PHP CLI | Trình kiểm tra doctor chạy bằng dòng lệnh terminal |
| [`[`/opt/unetlab/html/system/api.php`](../../opt/unetlab/html/system/api.php)](../../html/system/api.php) | PHP | REST API thực hiện các tác vụ quản trị hệ thống |
| [`[`/opt/unetlab/scripts/clean.sh`](../../opt/unetlab/scripts/clean.sh)](../../scripts/clean.sh) | Shell Script | Script xóa file tạm trong `/opt/unetlab/tmp` |
| [`[`/opt/unetlab/scripts/pnetlab-ksm-tune.sh`](../../opt/unetlab/scripts/pnetlab-ksm-tune.sh)](../../scripts/pnetlab-ksm-tune.sh) | Shell Script | Script tối ưu thông số khử trùng lặp RAM KSM |
| [`[`/opt/unetlab/wrappers/ksm_merge_exec`](../../opt/unetlab/wrappers/ksm_merge_exec)](../../wrappers/ksm_merge_exec) | C Binary | Nhị phân kích hoạt cờ `MADV_MERGEABLE` trên bộ nhớ ảo |
| `/opt/ovf/ovfstartup.sh` | Shell Script (14KB) | Kịch bản chạy khi khởi động máy ảo OVF |
| `/opt/ovf/pnetlab-netcfg.sh` | Shell Script (25KB) | Trình tương tác cấu hình mạng console ban đầu (ncurses wizard) |
| `/opt/ovf/pnet-bridges.sh` | Shell Script | Thiết lập các Linux Bridge cho 10 card Cloud |
| `/opt/ovf/pnet-fwd-reconcile.sh` | Shell Script | Khắc phục quy tắc chuyển tiếp gói tin iptables |
| [`[`/opt/unetlab/scripts/enable-web-hardening.sh`](../../opt/unetlab/scripts/enable-web-hardening.sh)](../../scripts/enable-web-hardening.sh) | Shell Script (11KB) | Kịch bản tự động gia cố an ninh Apache Web Server |
| [`[`/opt/unetlab/scripts/enable-php-fpm.sh`](../../opt/unetlab/scripts/enable-php-fpm.sh)](../../scripts/enable-php-fpm.sh) | Shell Script | Chuyển đổi từ mod_php sang PHP-FPM hiệu năng cao |
| [`[`/opt/unetlab/html/main/js/system.js`](../../opt/unetlab/html/main/js/system.js)](../../html/main/js/system.js) | JavaScript | Giao diện quản trị hệ thống trên Dashboard |

---

## 4. Sơ đồ Component Diagram (C4 Level 3: System Administration & Doctor)

```mermaid
flowchart TD
    %% Styling classes
    classDef ui fill:#1f6feb,stroke:#58a6ff,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef api fill:#238636,stroke:#3fb950,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef wrap fill:#d29922,stroke:#f0883e,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef kernel fill:#8957e5,stroke:#a371f7,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef storage fill:#21262d,stroke:#8b949e,stroke-width:1.5px,color:#c9d1d9,rx:6px,ry:6px;

    subgraph SG_admin_dashboard [" 📦 Giao diện Quản trị Hệ thống (Browser) "]
        direction TB
        system_ui["<b>system.js</b><br/><i>(System Admin UI)</i><br/>Các nút Reboot, Shutdown, nút Chạy Doctor, bảng cấu hình KSM"]:::ui
    end

    subgraph SG_system_apis [" 📦 Tầng Backend System APIs (PHP) "]
        direction TB
        sys_api["<b>system/api.php</b><br/><i>(System Controller)</i><br/>Tiếp nhận lệnh quản trị từ UI"]:::api
        doctor_core["<b>includes/doctor.php</b><br/><i>(Doctor Diagnostic Engine)</i><br/>Quét kiểm tra trạng thái dịch vụ, phân quyền file"]:::api
    end

    subgraph SG_maintenance_scripts [" 📦 Tầng Kịch bản Bảo trì & Nền tảng (Bash & C) "]
        direction TB
        clean_script["<b>clean.sh</b><br/><i>(Cleanup Script)</i><br/>Xóa sạch tệp tạm /opt/unetlab/tmp/"]:::wrap
        ksm_tuner["<b>pnetlab-ksm-tune.sh</b><br/><i>(KSM Memory Tuner)</i><br/>Ghi giá trị vào sysfs ksm"]:::wrap
        ksm_binary["<b>ksm_merge_exec</b><br/><i>(Setuid C Helper)</i><br/>Gọi madvise(MADV_MERGEABLE) trên tiến trình node"]:::wrap
        ovf_netcfg["<b>pnetlab-netcfg.sh</b><br/><i>(OVF Netcfg Wizard)</i><br/>Thiết lập IP tĩnh / DHCP qua dialog ncurses"]:::wrap
        bridge_init["<b>pnet-bridges.sh</b><br/><i>(Bridge Initializer)</i><br/>Khởi tạo pnet0 đến pnet9 và gắn card vật lý"]:::wrap
        hardening_sh["<b>enable-web-hardening.sh</b><br/><i>(Security Hardening Script)</i><br/>Gia cố Apache conf và cấm mod_userdir"]:::wrap
    end

    subgraph SG_os_kernel [" 📦 Nhân Hệ điều hành & Systemd "]
        direction TB
        systemd_svc["<b>Systemd Service Manager</b><br/><i>(Init System)</i><br/>Quản lý 12 systemd service của PNet v8"]:::kernel
        ksm_kernel["<b>/sys/kernel/mm/ksm/</b><br/><i>(Kernel Memory Dedup)</i><br/>Khử trùng lặp bộ nhớ vật lý"]:::kernel
        iptables_fwd["<b>Netfilter & IP Forwarding</b><br/><i>(Packet Routing)</i><br/>Cho phép gói tin đi qua các bridge"]:::kernel
    end

    %% Quan hệ giữa các thành phần
    system_ui -->|"POST /system/api.php<br/><i>[Lệnh Reboot / Cleanup / Doctor]</i>"| sys_api
    sys_api -->|"Thực thi chẩn đoán<br/><i>[runDoctorChecks()]</i>"| doctor_core
    doctor_core -->|"Kiểm tra dịch vụ<br/><i>[systemctl is-active ...]</i>"| systemd_svc
    sys_api -->|"Kích hoạt dọn dẹp<br/><i>[sudo [`[`/opt/unetlab/scripts/clean.sh`](../../opt/unetlab/scripts/clean.sh)](../../scripts/clean.sh)]</i>"| clean_script
    sys_api -->|"Cấu hình KSM<br/><i>[sudo [`[`/opt/unetlab/scripts/pnetlab-ksm-tune.sh`](../../opt/unetlab/scripts/pnetlab-ksm-tune.sh)](../../scripts/pnetlab-ksm-tune.sh)]</i>"| ksm_tuner
    ksm_tuner -->|"Ghi thông số<br/><i>[echo 1 > /sys/kernel/mm/ksm/run]</i>"| ksm_kernel
    bridge_init -->|"Áp cấu hình<br/><i>[iptables -A FORWARD ...]</i>"| iptables_fwd
```

---

> 👉 **Xem chi tiết từng tính năng con**:
> 1. [`F64-system-doctor-diagnostics.md`](../02-features/system-platform/F64-system-doctor-diagnostics.md) — Hệ thống Chẩn đoán Tự động (PNet Doctor Diagnostics)
> 2. [`F65-system-power-maintenance.md`](../02-features/system-platform/F65-system-power-maintenance.md) — Quản lý Nguồn & Vệ sinh Dữ liệu Rác (Power & Maintenance)
> 3. [`F66-ksm-memory-deduplication.md`](../02-features/system-platform/F66-ksm-memory-deduplication.md) — Tối ưu Hóa Bộ nhớ RAM qua Linux KSM (KSM Memory Tuning)
> 4. [`F67-ovf-network-initialization.md`](../02-features/system-platform/F67-ovf-network-initialization.md) — Khởi tạo Mạng Máy ảo OVF Đầu tiên (OVF Firstboot Network)
> 5. [`F68-bridge-lacp-fwd-reconcile.md`](../02-features/system-platform/F68-bridge-lacp-fwd-reconcile.md) — Đồng bộ Cầu nối & Khắc phục Luồng Chuyển tiếp (Bridge Reconcile)
> 6. [`F69-security-hardening-phpfpm.md`](../02-features/system-platform/F69-security-hardening-phpfpm.md) — Tăng Cứng Bảo mật Web & Tăng tốc PHP-FPM (Web Hardening)
