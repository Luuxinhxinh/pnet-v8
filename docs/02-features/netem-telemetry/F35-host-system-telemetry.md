---
title: "Level 2 — F35: Thu thập Chỉ số Phần cứng Máy chủ (Host System Telemetry)"
feature_id: "F35"
feature_group: "06-netem-telemetry"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F35: THU THẬP CHỈ SỐ PHẦN CỨNG MÁY CHỦ (HOST SYSTEM TELEMETRY)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp bức tranh toàn cảnh về sức khỏe của máy chủ vật lý PNet v8 (hoặc máy ảo Hypervisor): Tải CPU tổng thể, Bộ nhớ RAM (Used / Free / Buffers / Cached), Tỷ lệ khử trùng lặp RAM của KSM (Kernel Samepage Merging savings), Tốc độ đọc ghi ổ đĩa cứng (Disk I/O), và Dung lượng phân vùng đĩa cài đặt.
- **Đối tượng sử dụng**: Quản trị viên hệ thống theo dõi giới hạn phần cứng.
- **Thời điểm kích hoạt**: Hiển thị trên thanh trạng thái đỉnh (Top Navigation Bar) và trang Dashboard System.

## 2. Cơ chế Chạy (Mechanism)
1. **Truy vấn Thông số Kernel (`/proc` và `/sys`)**:
   - `pnq-sysmon.php` và daemon `pnq-telemetryd.py` đọc các tệp trạng thái đặc biệt của Linux:
     - `/proc/stat`: Đọc các chỉ số `cpu user, nice, system, idle, iowait`.
     - `/proc/meminfo`: Đọc `MemTotal`, `MemFree`, `MemAvailable`.
     - `/sys/kernel/mm/ksm/pages_sharing`: Đo lường chính xác số megabyte RAM đã tiết kiệm được nhờ gộp các trang nhớ ảo giống nhau.
     - `/proc/diskstats`: Đo lường số sector đọc/ghi mỗi giây.
2. **Tổng hợp & Tính toán Chỉ số**:
   - Tính toán tải CPU trung bình: `CPU_Usage = 100 - (delta_idle * 100 / delta_total)`.
   - Tính toán tỷ lệ RAM: `RAM_Usage = (MemTotal - MemAvailable) / MemTotal * 100`.
3. **Phản hồi Client & Đồ thị Hóa**:
   - Cung cấp dữ liệu cho `pnetlab-sysmon.js` và `dashboard.js` để render các biểu đồ hình quạt (Gauge Charts) và biểu đồ đường biến thiên theo thời gian thực (Time-series Line Charts).

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Procfs Virtual Filesystem**: Thu thập trực tiếp chỉ số nhân hệ điều hành không qua phần mềm trung gian.
- **Chart.js / SVG Gauges**: Thư viện đồ thị hóa trực quan trên trình duyệt.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/pnq-sysmon.php`](../../../opt/unetlab/html/pnq-sysmon.php)](../../../html/pnq-sysmon.php) | PHP API | Cung cấp JSON thông số máy chủ |
| [`/opt/unetlab/scripts/pnq-telemetryd.py`](../../../opt/unetlab/scripts/pnq-telemetryd.py)](../../../scripts/pnq-telemetryd.py) | Python Daemon (16KB) | Daemon gom chỉ số và lưu lịch sử |
| [`/opt/unetlab/html/themes/default/js/pnetlab-sysmon.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-sysmon.js)](../../../html/themes/default/js/pnetlab-sysmon.js) | JavaScript | Vẽ đồng hồ đo tài nguyên trên giao diện |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /pnq-sysmon.php`
- **Output**:
  ```json
  { "cpu": 35.8, "ram_used": 16400, "ram_total": 65536, "ksm_saved_mb": 4200, "disk_used_percent": 62 }
  ```
- **Edge Cases**: Dung lượng đĩa vượt quá 95% -> Kích hoạt cảnh báo đỏ nguy hiểm trên đỉnh màn hình để quản trị viên dọn dẹp lab.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f35-host-system-telemetry-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f35-host-system-telemetry-sequence.md)
