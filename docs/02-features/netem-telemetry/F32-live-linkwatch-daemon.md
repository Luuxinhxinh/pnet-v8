---
title: "Level 2 — F32: Daemon Giám sát Liên kết Thời gian thực (Linkwatch Daemon)"
feature_id: "F32"
feature_group: "06-netem-telemetry"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F32: DAEMON GIÁM SÁT LIÊN KẾT THỜI GIAN THỰC (LINKWATCH DAEMON)

## 1. Mô tả Tính năng
- **Mục đích**: Liên tục theo dõi trạng thái vật lý và liên kết logic của toàn bộ các card mạng ảo trong các bài lab đang chạy, phát hiện tức thì khi một interface bị UP hoặc DOWN (ví dụ khi kỹ sư gõ lệnh `shutdown` hoặc `no shutdown` trên cổng router), và phản ánh trạng thái đó lên màu sắc đường dây mạng trên Canvas.
- **Đối tượng sử dụng**: Tầng giám sát mạng thời gian thực.
- **Thời điểm kích hoạt**: Daemon `pnetlab-linkwatchd.py` chạy ngầm liên tục theo thời gian thực.

## 2. Cơ chế Chạy (Mechanism)
1. **Lắng nghe Sự kiện Kernel Netlink (Linux Netlink Sockets)**:
   - Daemon `pnetlab-linkwatchd.py` mở một kết nối socket thuộc nhóm `NETLINK_ROUTE`, đăng ký nhận các nhóm multicast `RTMGRP_LINK`.
   - Mỗi khi trạng thái cờ giao diện mạng (Interface Flags: `IFF_UP`, `IFF_RUNNING`, `IFF_LOWER_UP`) thay đổi, nhân Linux tự động bắn bản tin Netlink về daemon trong thời gian micro-giây.
2. **Ánh xạ Interface vào Cấu trúc Lab**:
   - Daemon phân tích tên giao diện (ví dụ `tap0_1_2` -> Tenant `0`, Node `1`, Interface `2`).
   - Xác định được cổng của router nào vừa bị ngắt hoặc vừa được bật.
3. **Phát Bản tin Cập nhật Trạng thái**:
   - Gửi bản tin JSON cập nhật tới kênh SSE của `pnetlab-labstated.py`.
   - Trình duyệt người dùng nhận được sự kiện và chuyển đổi đường dây nối mạng từ màu Xanh lá cây (Up) sang màu Đỏ nét đứt (Down).

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Netlink Protocol (AF_NETLINK)**: Kênh IPC hướng sự kiện tốc độ cao giữa Kernel Space và User Space của Linux, không cần tốn tài nguyên polling liên tục.
- **Python Socket API & Struct Unpacking**: Giải mã cấu trúc dữ liệu nhị phân `nlmsghdr` và `ifinfomsg` của kernel.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/unetlab/scripts/pnetlab-linkwatchd.py` | `LinkWatchDaemon`, `listen_netlink()` | Daemon lắng nghe netlink sockets |
| `/opt/unetlab/html/themes/default/js/pnetlab-network-watcher.js`| JavaScript | Client lắng nghe sự kiện link state trên UI |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Bản tin Netlink kernel `RTM_NEWLINK` hoặc `RTM_DELLINK`.
- **Output**: Thông điệp SSE: `{"event": "link_state_change", "tap": "tap0_1_0", "status": "down"}`.
- **Edge Cases**: Card TAP bị xóa khi node tắt -> Bỏ qua cảnh báo link down không cần thiết.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f32-live-linkwatch-daemon-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f32-live-linkwatch-daemon-sequence.md)
