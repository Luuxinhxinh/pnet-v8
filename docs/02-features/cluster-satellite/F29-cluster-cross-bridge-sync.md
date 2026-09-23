---
title: "Level 2 — F29: Đồng bộ Luồng Mạng Xuyên Cụm (Cross-Bridge Network Sync)"
feature_id: "F29"
feature_group: "05-cluster-satellite"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F29: ĐỒNG BỘ LUỒNG MẠNG XUYÊN CỤM (CROSS-BRIDGE NETWORK SYNC)

## 1. Mô tả Tính năng
- **Mục đích**: Thiết lập kết nối mạng trong suốt tầng liên kết dữ liệu (Layer 2 Transparency) giữa các thiết bị nằm trên các máy chủ vật lý khác nhau trong cụm. Cho phép Router A chạy trên Master có thể cắm dây mạng trực tiếp sang Router B đang chạy trên Satellite mà vẫn trao đổi được các bản tin broadcast/multicast (OSPF Hello, ARP, CDP/LLDP).
- **Đối tượng sử dụng**: Tầng mạng phân tán của cụm PNetLab.
- **Thời điểm kích hoạt**: Khi khởi động một đường liên kết mạng mà 2 đầu kết nối nằm trên 2 máy chủ khác nhau.

## 2. Cơ chế Chạy (Mechanism)
1. **Phát hiện Liên kết Xuyên Cụm (Cross-Host Link Detection)**:
   - Khi khởi động kết nối mạng, hệ thống đối chiếu vị trí đặt host của Node nguồn và Node đích.
   - Nếu `host(Node A) != host(Node B)`, hệ thống kích hoạt cơ chế tạo đường hầm VXLAN Overlay.
2. **Khởi tạo Đường hầm VXLAN (VXLAN Tunneling)**:
   - Trên Master: Tạo giao diện VXLAN `vxlan_<vni>` sử dụng giao thức UDP cổng 4789 trỏ tới IP của Satellite.
   - Trên Satellite: Tạo giao diện VXLAN đối ứng trỏ ngược lại IP của Master với cùng chỉ số VNI (VXLAN Network Identifier = `net_id`).
3. **Gán VXLAN vào Linux Bridge**:
   - Thêm card `vxlan_<vni>` vào Linux Bridge của mạng tương ứng: `brctl addif br-... vxlan_<vni>`.
4. **Truyền nhận Gói tin L2 Đóng gói**:
   - Frame Ethernet phát ra từ Router A đi vào card TAP trên Master -> chuyển vào Bridge -> được card VXLAN đóng gói vào UDP datagram -> truyền qua mạng vật lý tới Satellite -> card VXLAN bóc tách IP/UDP header -> trả lại frame Ethernet nguyên bản vào TAP của Router B.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Kernel VXLAN (Virtual Extensible LAN)**: Tiêu chuẩn đóng gói Ethernet-in-UDP RFC 7348 của Linux kernel.
- **IP Multicast / Static Unicast FDB**: Cấu hình bảng Forwarding Database (FDB) định tuyến frame trực tiếp qua địa chỉ IP của host đích.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`scripts/pnetlab-brokerd.py`](../../../scripts/pnetlab-brokerd.py) | `setup_cross_host_link()` | Điều phối tạo VXLAN trên 2 đầu |
| [`scripts/pnet-satdeploy.sh`](../../../scripts/pnet-satdeploy.sh) | Shell Script | Cấu hình tham số kernel VXLAN trên vệ tinh |
| `/opt/ovf/pnet-fwd-reconcile.sh` | Shell Script | Đảm bảo tường lửa không chặn cổng UDP 4789 |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Tạo liên kết giữa Node 1 (Master) và Node 2 (Satellite).
- **Output**: Giao diện `vxlan_100` hoạt động, gói tin ping thông suốt giữa 2 thiết bị.
- **Edge Cases**: MTU mạng vật lý quá nhỏ (< 1550 bytes) gây phân mảnh gói tin VXLAN -> Hệ thống tự động thiết lập MSS Clamping hoặc hạ MTU của interface máy ảo xuống 1450 bytes.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f29-cluster-cross-bridge-sync-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f29-cluster-cross-bridge-sync-sequence.md)
