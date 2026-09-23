---
title: "Level 2 — F31: Bộ Điều khiển Giả lập Sự cố NetEm (NetEm Link Impairment)"
feature_id: "F31"
feature_group: "06-netem-telemetry"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F31: BỘ ĐIỀU KHIỂN GIẢ LẬP SỰ CỐ NETEM (NETEM LINK IMPAIRMENT)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép kỹ sư mạng cố tình đưa các sự cố đường truyền vào bất kỳ liên kết cáp nào trên Canvas nhằm thử nghiệm độ bền vững của các giao thức định tuyến (BGP BFD, OSPF convergence) hoặc trải nghiệm người dùng (VoIP, Video streaming): Tạo độ trễ cố định hoặc biến thiên (Latency / Delay & Jitter), Tỷ lệ mất gói tin (Packet Loss), Gói tin bị đảo lộn thứ tự (Packet Reordering), Gói tin bị hỏng dữ liệu (Packet Corruption), Gói tin trùng lặp (Packet Duplication), và Bóp băng thông tối đa (Rate Limit / Bandwidth Shaping).
- **Đối tượng sử dụng**: Kỹ sư kiểm thử chất lượng dịch vụ QoS, Chuyên gia SD-WAN.
- **Thời điểm kích hoạt**: Nhấn đúp chuột vào một đường dây mạng trên Canvas để mở modal `pnetlab-netem-advanced.js`.

## 2. Cơ chế Chạy (Mechanism)
1. **Thiết lập Tham số trên Giao diện**:
   - Người dùng điều chỉnh các thanh trượt (Sliders):
     - Delay: từ 0 đến 5000 ms.
     - Jitter: từ 0 đến 500 ms.
     - Loss: từ 0 đến 100%.
     - Corrupt / Duplicate: từ 0 đến 100%.
     - Rate: từ 64 Kbps đến 10 Gbps.
   - Bấm nút "Apply Impairment".
2. **Gửi API Backend**:
   - Gửi `POST /pnq-linkwatch.php` kèm các tham số đã chọn và ID của liên kết mạng.
3. **Thực thi Lệnh Linux Kernel Traffic Control (`tc`)**:
   - Backend xác định các card TAP của 2 đầu đường dây (`tap_src` và `tap_dst`).
   - Xóa bỏ qdisc cũ nếu có: `sudo tc qdisc del dev <tap> root 2>/dev/null`.
   - Tạo hàng đợi NetEm mới:
     ```bash
     sudo tc qdisc replace dev <tap> root netem delay 50ms 10ms loss 2% corrupt 0.1% rate 10mbit
     ```
   - Lệnh được áp dụng độc lập cho cả 2 chiều truyền hoặc chỉ 1 chiều tùy chọn.
4. **Hiệu ứng Trực quan trên Canvas**:
   - Đường dây mạng đổi sang màu cam hoặc đỏ kèm icon tia sét và nhãn hiển thị thông số `[50ms, 2% loss]`.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Kernel Network Emulation (`sch_netem`)**: Phân hệ kernel chuyên dụng để mô phỏng thuộc tính mạng diện rộng.
- **Linux Traffic Control (`tc` utility)**: Công cụ cấu hình hàng đợi gói tin (Queuing Discipline - qdisc).
- **Token Bucket Filter (`tbf`)**: Thuật toán giới hạn tốc độ truyền byte theo định mức thời gian.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/themes/default/js/pnetlab-netem-advanced.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-netem-advanced.js)](../../../html/themes/default/js/pnetlab-netem-advanced.js) | `openNetemModal()`, `applyImpairment()` | Hộp thoại cấu hình thanh trượt NetEm |
| [`[`/opt/unetlab/html/pnq-linkwatch.php`](../../../opt/unetlab/html/pnq-linkwatch.php)](../../../html/pnq-linkwatch.php) | PHP API | Tiếp nhận và biên dịch tham số sang lệnh `tc` |
| [`[`/opt/unetlab/scripts/pnetlab-linkwatchd.py`](../../../opt/unetlab/scripts/pnetlab-linkwatchd.py)](../../../scripts/pnetlab-linkwatchd.py) | Python Daemon | Kiểm tra và duy trì qdisc trên interface |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /pnq-linkwatch.php` với JSON:
  ```json
  { "link_id": 12, "delay": 100, "jitter": 20, "loss": 5, "rate": "5mbit" }
  ```
- **Output**: `{ "status": "ok", "message": "NetEm applied successfully" }`
- **Edge Cases**: Cổng TAP chưa được up -> `tc` ném lỗi `Cannot find device` -> API tự động kích hoạt `ip link set dev <tap> up` rồi mới áp cấu hình.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f31-netem-link-impairment-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f31-netem-link-impairment-sequence.md)
