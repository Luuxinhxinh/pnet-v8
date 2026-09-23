---
title: "Level 2 — F41: Giả lập Sóng Vô tuyến 802.11 & Biểu đồ Nhiệt (vWiFi Engine)"
feature_id: "F41"
feature_group: "07-protocol-overlay"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F41: GIẢ LẬP SÓNG VÔ TUYẾN 802.11 & BIỂU ĐỒ NHIỆT (VIRTUAL WIFI ENGINE)

## 1. Mô tả Tính năng
- **Mục đích**: Mô phỏng sự truyền sóng điện từ trong không gian hai chiều giữa các điểm truy cập không dây (Virtual Access Points - vAP) và các máy trạm không dây (Virtual WiFi Clients). Tự động tính toán độ suy hao tín hiệu theo khoảng cách địa lý trên Canvas, cường độ tín hiệu thu được (RSSI tính bằng dBm), tỷ số tín hiệu trên nhiễu (SNR) và vẽ biểu đồ nhiệt (Heatmap) vùng phủ sóng rực rỡ.
- **Đối tượng sử dụng**: Học viên học mạng không dây CWNA/CCNP Enterprise Wireless.
- **Thời điểm kích hoạt**: Khi thêm đối tượng vWiFi AP hoặc kéo di chuyển client trên Canvas.

## 2. Cơ chế Chạy (Mechanism)
1. **Động cơ Vật lý Lan truyền Sóng (`airhandler.py` - 31KB)**:
   - Daemon `airhandler.py` liên tục đọc tọa độ (X, Y) của các AP và Client từ file lab XML.
   - Tính toán khoảng cách thực tế (Pixel to Meter ratio: ví dụ 10px = 1 mét).
   - Áp dụng mô hình suy hao Log-distance Path Loss Model:
     $$RSSI(d) = P_{tx} + G_{ant} - PL(d_0) - 10 \cdot n \cdot \log_{10}(d/d_0)$$
     *(Trong đó: $P_{tx}$ là công suất phát dBm, $n$ là hệ số cản trở môi trường tường/không khí).*
2. **Mô phỏng Gói tin Không gian (Virtual Air Mesh)**:
   - Daemon chuyển tiếp các khung tin 802.11 (Beacon, Probe Request/Response, Data) giữa các card mạng ảo của AP và Client qua socket UDP.
   - Nếu khoảng cách quá xa ($RSSI < -85	ext{ dBm}$), daemon tự động hủy gói tin (Drop packet) để mô phỏng mất kết nối khi ra khỏi vùng phủ sóng.
3. **Vẽ Biểu đồ Nhiệt trên Canvas (`pnetlab-wifi-painter.js`)**:
   - Sử dụng gradient tỏa tròn (Radial Gradient):
     - Vùng trung tâm sát AP: Màu Đỏ rực rỡ (Tín hiệu rất mạnh: $-30$ đến $-50	ext{ dBm}$).
     - Vùng trung bình: Màu Vàng sang Xanh lá ($-50$ đến $-70	ext{ dBm}$).
     - Vùng biên phủ sóng: Màu Xanh dương nhạt ($-70$ đến $-85	ext{ dBm}$).
     - Ngoài vùng phủ sóng: Trong suốt hoàn toàn.

## 3. Công nghệ & Cơ sở Sử dụng
- **Radio Frequency (RF) Propagation Models**: Mô hình toán học suy hao đường truyền vô tuyến tiêu chuẩn viễn thông.
- **HTML5 Canvas Radial Color Stop Gradients**: Render vùng phủ sóng mềm mại không bị vỡ hạt.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/scripts/airhandler.py`](../../../scripts/airhandler.py)](../../../scripts/airhandler.py) | Python Daemon (31KB) | Động cơ vật lý tính toán RF và chuyển tiếp frame |
| [`[`/opt/unetlab/scripts/pnet-wifi-truth.py`](../../../scripts/pnet-wifi-truth.py)](../../../scripts/pnet-wifi-truth.py) | Python Script (11KB) | Kịch bản trích xuất thông số anten và công suất |
| [`[`/opt/unetlab/html/pnq-wifi.php`](../../../html/pnq-wifi.php)](../../../html/pnq-wifi.php) | PHP API (15KB) | Endpoint trả về RSSI của từng client |
| [`[`/opt/unetlab/html/themes/default/js/pnetlab-wifi-painter.js`](../../../html/themes/default/js/pnetlab-wifi-painter.js)](../../../html/themes/default/js/pnetlab-wifi-painter.js) | JavaScript | Vẽ gradient biểu đồ nhiệt vô tuyến |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Tọa độ di chuyển của WiFi Client trên màn hình.
- **Output**: Cập nhật giá trị RSSI trên thanh sóng: `RSSI = -62 dBm (Excellent)`.
- **Edge Cases**: Di chuyển Client ra quá xa vùng phủ sóng -> Client tự động hủy liên kết (Deauthenticate) với AP và ngắt IP DHCP.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f41-virtual-wifi-simulation-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f41-virtual-wifi-simulation-sequence.md)
