---
title: "Level 2 — F39: Giải mã Gói tin Trực tiếp trên Canvas (Packet Prototracer)"
feature_id: "F39"
feature_group: "07-protocol-overlay"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F39: GIẢI MÃ GÓI TIN TRỰC TIẾP TRÊN CANVAS (PACKET PROTOTRACER)

## 1. Mô tả Tính năng
- **Mục đích**: Bắt, lọc và giải mã các gói tin giao thức mạng đang trao đổi qua đường dây cáp theo thời gian thực và hiển thị bảng phân tích cấu trúc header ngay trên màn hình Canvas mà không cần tải hoặc mở phần mềm Wireshark ngoài. Hỗ trợ giải mã chuyên sâu hơn 40 giao thức viễn thông: Ethernet, ARP, IPv4/IPv6, ICMP, TCP, UDP, OSPF, BGP, LDP, ISIS, STP BPDU, LACP, LLDP, CDP, DHCP.
- **Đối tượng sử dụng**: Học viên học giao thức mạng, Kỹ sư kiểm tra bắt tay giao thức.
- **Thời điểm kích hoạt**: Nhấn vào icon "Prototracer" trên một liên kết mạng.

## 2. Cơ chế Chạy (Mechanism)
1. **Khởi động Daemon Bắt Gói (`pnetlab-prototracer.py`)**:
   - Khi người dùng kích hoạt theo dõi trên liên kết mạng `link_id`:
   - Daemon `pnetlab-prototracer.py` gắn vào interface TAP tương ứng qua raw socket.
2. **Thư viện Giải mã Giao thức Chuyên dụng (`pnet_protodecode.py` - 57KB)**:
   - Mỗi frame nhận được đưa qua hàm `decode_packet(raw_bytes)`.
   - Bộ giải mã bóc tách từng tầng:
     - L2: MAC nguồn, MAC đích, EtherType (0x0800 IPv4, 0x0806 ARP, 0x8100 802.1Q).
     - L3: IP nguồn, IP đích, TTL, Protocol (89 OSPF, 6 TCP, 17 UDP).
     - L4/L7: Giải mã chi tiết trường OSPF Router ID, Area ID, OSPF Packet Type (Hello, DBD, LSR, LSU, LSAck).
3. **Đẩy Dữ liệu Thời gian thực qua SSE/WebSocket**:
   - Bản tin phân tích được đẩy về trình duyệt qua endpoint `pnq-prototrace.php`.
4. **Hiển thị trên Giao diện (`pnetlab-protocol-inspector.js`)**:
   - Hiển thị thanh cuộn danh sách gói tin (Packet List) kèm màu sắc đặc trưng (OSPF màu xanh lá, BGP màu vàng, ICMP màu hồng).
   - Khi click vào 1 gói tin: Bung mở cây phân tích chi tiết (Packet Details Tree) giống hệt Wireshark ngay bên dưới Canvas.

## 3. Công nghệ & Cơ sở Sử dụng
- **Python Binary Protocol Decoding (`struct.unpack`)**: Tự xây dựng bộ bóc tách byte header tốc độ cực cao.
- **Virtual DOM Packet Inspector**: Cây giao diện hiển thị cấu trúc phân cấp gói tin mượt mà.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/scripts/pnetlab-prototracer.py`](../../../opt/unetlab/scripts/pnetlab-prototracer.py)](../../../scripts/pnetlab-prototracer.py) | Python Daemon | Bắt gói tin raw trên card TAP |
| [`/opt/unetlab/scripts/pnet_protodecode.py`](../../../opt/unetlab/scripts/pnet_protodecode.py)](../../../scripts/pnet_protodecode.py) | Python Library (57KB) | Thư viện giải mã hơn 40 giao thức mạng |
| [`/opt/unetlab/html/pnq-prototrace.php`](../../../opt/unetlab/html/pnq-prototrace.php)](../../../html/pnq-prototrace.php) | PHP API | API stream gói tin giải mã về UI |
| [`/opt/unetlab/html/themes/default/js/pnetlab-protocol-inspector.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-protocol-inspector.js)](../../../html/themes/default/js/pnetlab-protocol-inspector.js) | JavaScript | Giao diện cây phân tích gói tin |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Luồng byte Ethernet frame thô trên card TAP.
- **Output**: Cấu trúc JSON chi tiết: `{ "protocol": "OSPF", "type": "Hello", "src": "10.1.1.1", "area": "0.0.0.0" }`.
- **Edge Cases**: Lưu lượng quá lớn (> 10,000 pps) -> Daemon tự động kích hoạt bộ lọc lấy mẫu (Packet Sampling 1:10) để tránh làm nghẽn trình duyệt client.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f39-live-packet-prototracer-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f39-live-packet-prototracer-sequence.md)
