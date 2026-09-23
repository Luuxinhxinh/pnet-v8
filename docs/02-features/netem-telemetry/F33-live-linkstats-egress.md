---
title: "Level 2 — F33: Thống kê Lưu lượng & Hiệu ứng Phát sáng Dây mạng (Egress Glow)"
feature_id: "F33"
feature_group: "06-netem-telemetry"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F33: THỐNG KÊ LƯU LƯỢNG & HIỆU ỨNG PHÁT SÁNG DÂY MẠNG (EGRESS GLOW)

## 1. Mô tả Tính năng
- **Mục đích**: Mang lại trải nghiệm trực quan hóa sinh động cho bài lab bằng cách thu thập lưu lượng gói tin/byte thực tế đang truyền qua các liên kết cáp và kích hoạt hiệu ứng đồ họa phát sáng phát quang (Glow Animation) với các hạt năng lượng chuyển động chạy dọc theo dây mạng tương ứng với tốc độ và chiều của dòng dữ liệu.
- **Đối tượng sử dụng**: Người xem demo lab, Giảng viên trình chiếu luồng dữ liệu mạng.
- **Thời điểm kích hoạt**: Khi bật chế độ "Traffic Glow" trên Canvas.

## 2. Cơ chế Chạy (Mechanism)
1. **Thu thập Bộ đếm Card Mạng (Kernel Statistics Polling)**:
   - Backend `pnq-linkstats.php` đọc trực tiếp từ hệ thống tệp ảo của Linux Kernel:
     - `/sys/class/net/<tap_interface>/statistics/rx_bytes`
     - `/sys/class/net/<tap_interface>/statistics/tx_bytes`
     - `/sys/class/net/<tap_interface>/statistics/rx_packets`
     - `/sys/class/net/<tap_interface>/statistics/tx_packets`
2. **Tính toán Tốc độ Truyền Tức thời (Bitrate Delta Calculation)**:
   - Tính toán biến thiên: `bitrate = (current_bytes - prev_bytes) * 8 / delta_time`.
   - Chuẩn hóa tốc độ ra đơn vị Kbps / Mbps / Gbps.
3. **Hiệu ứng Animation Phát sáng trên Canvas (`pnetlab-egress-glow.js`)**:
   - Sử dụng thuật toán đường cong Bezier và biến `t` (từ 0.0 đến 1.0) chạy theo thời gian.
   - Vẽ các chấm sáng chuyển động (Particle Glow) dọc theo tọa độ dây cáp.
   - Khi lưu lượng càng lớn: Số lượng hạt sáng càng dày, tốc độ chuyển động càng nhanh và đường viền dây cáp phát sáng càng rực rỡ (màu xanh neon hoặc vàng).

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Sysfs Interface Statistics**: Truy xuất dữ liệu bộ đếm phần cứng mạng không tốn CPU.
- **HTML5 Canvas Radial Gradients & Shadows**: Tạo hiệu ứng phát sáng mờ ảo (Neon blur glow) chuyên nghiệp.
- **`requestAnimationFrame()`**: Vòng lặp render đồ họa đồng bộ 60 FPS của trình duyệt.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/pnq-linkstats.php`](../../../opt/unetlab/html/pnq-linkstats.php)](../../../html/pnq-linkstats.php) | PHP API | Đọc sysfs và tính toán tốc độ bit/s |
| [`/opt/unetlab/html/themes/default/js/pnetlab-egress-glow.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-egress-glow.js)](../../../html/themes/default/js/pnetlab-egress-glow.js) | `animateGlow()`, `renderParticles()` | Động cơ vẽ hạt sáng chuyển động |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /pnq-linkstats.php?lab_session=...`
- **Output**: JSON chứa danh sách link: `{"links": [{"id": 1, "rx_rate": 1048576, "tx_rate": 524288}]}`.
- **Edge Cases**: Không có lưu lượng truyền qua -> Dây mạng trở về trạng thái tĩnh màu xám thông thường để tiết kiệm pin thiết bị client.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f33-live-linkstats-egress-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f33-live-linkstats-egress-sequence.md)
