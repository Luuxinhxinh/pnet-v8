---
title: "Level 2 — F42: Bắt Gói tin Vô tuyến Không dây (vWiFi Spy Capture)"
feature_id: "F42"
feature_group: "07-protocol-overlay"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F42: BẮT GÓI TIN VÔ TUYẾN KHÔNG DÂY (VWIFI SPY CAPTURE)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép các chuyên gia bảo mật và học viên bắt các khung tin vô tuyến 802.11 thô (Raw 802.11 Frames) bay trong không gian ảo ở chế độ giám sát (Monitor Mode): Khung quản trị (Management Frames: Beacon, Probe Request, Association, Authentication), Khung điều khiển (Control Frames: RTS, CTS, ACK), và Quá trình bắt tay 4 bước WPA2/WPA3 (4-Way Handshake) để phục vụ học tập phân tích mã hóa an ninh mạng không dây.
- **Đối tượng sử dụng**: Học viên bảo mật mạng không dây (Wireless Penetration Testing).
- **Thời điểm kích hoạt**: Chọn menu "Spy Capture" trên vùng phủ sóng WiFi của Canvas.

## 2. Cơ chế Chạy (Mechanism)
1. **Khởi tạo Kênh Bắt Ảo (Airduct Monitor Socket)**:
   - Kịch bản `vwifi-spy-capture.py` kết nối vào socket phát sóng của daemon `airhandler.py`.
2. **Đóng gói Tiêu đề Radio (Radiotap Header Injection)**:
   - Khi bắt được frame 802.11 thô, kịch bản chèn thêm tiêu đề Radiotap Header tiêu chuẩn vào đầu gói tin (chứa các siêu dữ liệu không dây thực tế: Kênh tần số Channel 1/6/11, Tần số 2.4 GHz / 5 GHz, Công suất tín hiệu dBm, Tốc độ truyền dẫn MCS Data Rate).
3. **Đẩy Luồng PCAP vào Wireshark**:
   - Dữ liệu được truyền trực tiếp qua SSH pipe vào Wireshark: Wireshark nhận diện đúng dạng link type `DLT_IEEE802_11_RADIO` và hiển thị chi tiết các trường mã hóa SSID, BSSID, Encryption Type.

## 3. Công nghệ & Cơ sở Sử dụng
- **Radiotap Header Specification**: Tiêu chuẩn định dạng bao bọc thông số sóng vật lý vô tuyến cho gói tin pcap.
- **IEEE 802.11 Frame Parsing**: Giải mã cấu trúc khung tin vô tuyến L2.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`scripts/vwifi-spy-capture.py`](../../../scripts/vwifi-spy-capture.py) | Python Script (5.7KB) | Bắt gói tin không gian và chèn Radiotap header |
| [`scripts/airhandler.py`](../../../scripts/airhandler.py) | Python Daemon | Cung cấp luồng frame vô tuyến thô |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Lệnh bắt gói tin vô tuyến trên Channel 6.
- **Output**: Luồng pcap hiển thị trong Wireshark với đầy đủ bản tin Beacon Broadcast và 4-Way Handshake.
- **Edge Cases**: Kênh sóng không có thiết bị phát -> Wireshark không nhận được frame nào cho đến khi AP phát Beacon.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f42-virtual-wifi-spy-capture-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f42-virtual-wifi-spy-capture-sequence.md)
