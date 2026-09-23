---
title: "Level 2 — F40: Phân tích Mạng RoCE v2 & RDMA Datacenter (RoCE Analytics)"
feature_id: "F40"
feature_group: "07-protocol-overlay"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F40: PHÂN TÍCH MẠNG ROCE V2 & RDMA DATACENTER (ROCE ANALYTICS)

## 1. Mô tả Tính năng
- **Mục đích**: Mô phỏng và phân tích hiệu năng của mạng hiệu năng cao RoCE v2 (RDMA over Converged Ethernet) thường dùng trong các cụm tính toán AI / Deep Learning GPU Clusters (NVIDIA InfiniBand/RoCE): Theo dõi lưu lượng truyền dữ liệu không tổn hao (Lossless Ethernet), giám sát các khung tin điều khiển luồng dựa trên mức ưu tiên (PFC - Priority Flow Control) và các bản tin thông báo tắc nghẽn (ECN - Explicit Congestion Notification / CNP - Congestion Notification Packet).
- **Đối tượng sử dụng**: Kỹ sư kiến trúc mạng AI Datacenter.
- **Thời điểm kích hoạt**: Khi bật chế độ "RoCE Analytics" trong các bài lab cấu hình chuyển mạch trung tâm dữ liệu (Cisco Nexus, Arista EOS).

## 2. Cơ chế Chạy (Mechanism)
1. **Lọc Gói tin RoCE v2**:
   - Gói tin RoCE v2 sử dụng giao thức UDP cổng đích `4791` với tiêu đề BTH (Base Transport Header).
   - Kịch bản backend lọc các frame có UDP port 4791 hoặc frame Ethernet có EtherType 802.1Q với CoS = 3 (Class of Service dành riêng cho RDMA).
2. **Đo Đếm Tắc Nghẽn & Khung Tin PFC**:
   - API `pnq-roce.php` đọc số lượng bản tin PFC PAUSE frame (gửi lệnh dừng truyền khi hàng đợi switch bị đầy) và tỷ lệ cờ CE (Congestion Experienced) trong IP header.
3. **Trực quan hóa trên Giao diện (`pnetlab-roce-lab.js`)**:
   - Hiển thị bảng đồ thị thông lượng RDMA (Throughput Gbps), độ trễ micro-giây, và số lượng cảnh báo tắc nghẽn PFC xả ra trên từng switch port.

## 3. Công nghệ & Cơ sở Sử dụng
- **InfiniBand Trade Association (IBTA) RoCE v2 Standard**: Chuẩn giao thức RDMA qua ngăn xếp UDP/IP.
- **Priority-Based Flow Control (IEEE 802.1Qbb)**: Tiêu chuẩn Ethernet không làm rơi gói tin.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/pnq-roce.php`](../../../opt/unetlab/html/pnq-roce.php)](../../../html/pnq-roce.php) | PHP API (10KB) | Endpoint phục vụ dữ liệu phân tích RoCE |
| [`/opt/unetlab/html/themes/default/js/pnetlab-roce-lab.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-roce-lab.js)](../../../html/themes/default/js/pnetlab-roce-lab.js) | JavaScript | Giao diện đồ thị phân tích RDMA |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /pnq-roce.php`
- **Output**: JSON chứa thông số `{ "rdma_throughput_gbps": 94.5, "pfc_pause_count": 12, "cnp_packets": 3 }`.
- **Edge Cases**: Không có lưu lượng RDMA -> Đồ thị hiển thị baseline 0 Gbps.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f40-roce-rdma-telemetry-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f40-roce-rdma-telemetry-sequence.md)
