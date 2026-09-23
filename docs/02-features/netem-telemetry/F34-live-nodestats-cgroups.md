---
title: "Level 2 — F34: Giám sát Tải CPU/RAM Từng Node qua Linux Cgroups"
feature_id: "F34"
feature_group: "06-netem-telemetry"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F34: GIÁM SÁT TẢI CPU/RAM TỪNG NODE QUA LINUX CGROUPS

## 1. Mô tả Tính năng
- **Mục đích**: Đo lường và hiển thị chính xác mức độ tiêu hao tài nguyên tính toán (CPU % và dung lượng RAM thực tế MB) của từng thiết bị mạng ảo độc lập, hiển thị trực quan dạng huy hiệu (HUD Badge) ngay dưới chân biểu tượng node trên Canvas.
- **Đối tượng sử dụng**: Kỹ sư mạng cần phát hiện thiết bị bị treo CPU (CPU Spike 100%) do lỗi lặp vòng định tuyến hoặc cấu hình sai.
- **Thời điểm kích hoạt**: Khi bật chế độ "Node Stats HUD" trên giao diện.

## 2. Cơ chế Chạy (Mechanism)
1. **Truy vấn Cgroups Subsystems**:
   - Khi mỗi node ảo được wrapper khởi chạy, PID của nó được đưa vào cgroup riêng biệt: `/sys/fs/cgroup/cpu/pnetlab/<tenant>_<node>/` và `/sys/fs/cgroup/memory/pnetlab/<tenant>_<node>/`.
2. **Kịch bản Thu thập Hiệu năng Cao (`pnq-nodestats.sh`)**:
   - API `pnq-nodestats.php` gọi script bash tối ưu `pnq-nodestats.sh`.
   - Script đọc:
     - `cpuacct.usage` (tổng thời gian CPU nano-giây).
     - `memory.usage_in_bytes` (dung lượng RAM thực tế đang chiếm dụng).
   - So sánh độ lệch `delta_usage` sau 100ms để tính toán ra phần trăm CPU chính xác: `cpu_percent = (delta_usage / delta_time) * 100`.
3. **Phản hồi Dữ liệu & Render HUD**:
   - Trả về JSON mảng các node.
   - Script `pnetlab-node-stats.js` vẽ một thanh tiến độ mini (Progress bar) và con số `CPU: 12% | RAM: 512MB` dưới tên router.
   - Nếu CPU vượt quá 90%, thanh bar đổi sang màu Đỏ cảnh báo.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Control Groups (cgroups v1/v2)**: Phân hệ hạch toán và cô lập tài nguyên phần cứng của nhân Linux.
- **Microsecond Timestamp Differencing**: Tính toán phần trăm CPU chuẩn xác không bị phụ thuộc vào lệnh `top` cồng kềnh.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/pnq-nodestats.php`](../../../opt/unetlab/html/pnq-nodestats.php)](../../../html/pnq-nodestats.php) | PHP API | Endpoint trả về dữ liệu tài nguyên node |
| [`/opt/unetlab/html/pnq-nodestats.sh`](../../../opt/unetlab/html/pnq-nodestats.sh)](../../../html/pnq-nodestats.sh) | Shell Script | Script đọc nhanh các file trong sysfs cgroup |
| [`/opt/unetlab/html/themes/default/js/pnetlab-node-stats.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-node-stats.js)](../../../html/themes/default/js/pnetlab-node-stats.js) | JavaScript | Vẽ thanh mini HUD hiển thị thông số trên Canvas |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /pnq-nodestats.php`
- **Output**:
  ```json
  { "nodes": { "1": { "cpu": 15.2, "ram": 524288000, "status": "running" } } }
  ```
- **Edge Cases**: Máy chủ chạy cgroups v2 (Unified Hierarchy) -> Script tự động chuyển sang đọc file `cpu.stat` và `memory.current`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f34-live-nodestats-cgroups-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f34-live-nodestats-cgroups-sequence.md)
