---
title: "Level 2 — F68: Đồng bộ Cầu nối & Khắc phục Luồng Chuyển tiếp (Bridge Reconcile)"
feature_id: "F68"
feature_group: "12-system-platform"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F68: ĐỒNG BỘ CẦU NỐI & KHẮC PHÚC LUỒNG CHUYỂN TIẾP (BRIDGE RECONCILE)

## 1. Mô tả Tính năng
- **Mục đích**: Tự động cấu hình, kiểm tra và khắc phục định kỳ toàn bộ hệ thống cầu nối mạng máy chủ (Linux Bridges `pnet0` đến `pnet9` tương ứng với 10 card mạng Cloud): Cấu hình gộp card mạng LACP (Link Aggregation), thiết lập quy tắc chuyển tiếp gói tin của nhân Linux (`net.ipv4.ip_forward = 1`), mở quy tắc tường lửa Netfilter IPTables FORWARD, và tái kích hoạt các bridge nếu bị mất cấu hình sau khi cập nhật hệ điều hành hoặc khởi động lại dịch vụ mạng.
- **Đối tượng sử dụng**: Tầng mạng hạ tầng nền tảng.
- **Thời điểm kích hoạt**: Dịch vụ `pnetlab-pnet-bridges.service` chạy khi khởi động và kịch bản `pnet-fwd-reconcile.sh`.

## 2. Cơ chế Chạy (Mechanism)
1. **Khởi tạo 10 Bridge Cloud Tiêu chuẩn (`pnet-bridges.sh`)**:
   - Tạo vòng lặp từ `pnet0` đến `pnet9`:
     ```bash
     brctl addbr pnet0
     ip link set dev pnet0 up
     ```
   - Gắn card mạng vật lý chính của máy chủ (ví dụ `eth0`) vào `pnet0`.
   - Nếu máy chủ có nhiều card mạng vật lý (`eth1`, `eth2`), kịch bản tự động gắn lần lượt vào `pnet1`, `pnet2`.
2. **Khắc phục Quy tắc Chuyển tiếp Gói tin (`pnet-fwd-reconcile.sh`)**:
   - Docker daemon hoặc các phần mềm tường lửa khác (UFW) thường tự động đổi chính sách iptables FORWARD thành `DROP`, khiến các thiết bị mạng ảo trong lab không thể ping ra ngoài.
   - Kịch bản `pnet-fwd-reconcile.sh` tự động thiết lập lại:
     ```bash
     iptables -P FORWARD ACCEPT
     iptables -I FORWARD 1 -i pnet+ -j ACCEPT
     iptables -I FORWARD 2 -o pnet+ -j ACCEPT
     ```
   - Kích hoạt tính năng chuyển tiếp gói tin trong kernel sysctl: `sysctl -w net.ipv4.ip_forward=1`.
3. **Xử lý Tương thích LACP (IEEE 802.3ad)**:
   - Tắt tính năng chặn khung tin LLDP/LACP trên Linux Bridge bằng cách ghi giá trị `echo 16384 > /sys/class/net/pnetX/bridge/group_fwd_mask` để cho phép các giao thức L2 độc quyền đi qua bridge nguyên vẹn.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Bridge Group Forwarding Mask (`group_fwd_mask`)**: Cho phép chuyển tiếp các frame điều khiển đặc biệt (LACP, LLDP, 802.1X).
- **IP Forwarding & Netfilter**: Tầng chuyển mạch gói tin L3 của nhân Linux.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/ovf/pnet-bridges.sh` | Shell Script | Khởi tạo danh sách 10 bridge pnet |
| `/opt/ovf/pnet-fwd-reconcile.sh` | Shell Script (6.6KB) | Khắc phục rule iptables và ip_forward |
| `/etc/systemd/system/multi-user.target.wants/pnetlab-pnet-bridges.service`| Systemd Service | Quản lý khởi động bridge |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Thực thi `pnet-fwd-reconcile.sh`.
- **Output**: Toàn bộ bridge `pnet0`-`pnet9` ở trạng thái UP, iptables FORWARD là ACCEPT.
- **Edge Cases**: Docker khởi động lại làm ghi đè rule iptables -> Service tự động phát hiện và phục hồi lại rule sau 5 giây.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f68-bridge-lacp-fwd-reconcile-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f68-bridge-lacp-fwd-reconcile-sequence.md)
