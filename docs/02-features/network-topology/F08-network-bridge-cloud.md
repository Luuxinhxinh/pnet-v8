---
title: "Level 2 — F08: Mạng Cầu nối & Kết nối Đám mây (Bridge & Cloud Networks)"
feature_id: "F08"
feature_group: "02-network-topology"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F08: MẠNG CẦU NỐI & KẾT NỐI ĐÁM MÂY (BRIDGE & CLOUD NETWORKS)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp cơ chế kết nối các card mạng ảo của thiết bị trong lab vào các mạng chuyển mạch ảo cục bộ (Bridge Networks) hoặc kết nối ra mạng vật lý của máy chủ thật và Internet thông qua các giao diện Đám mây (Cloud Networks từ `pnet0` đến `pnet9`, hoặc NAT Cloud).
- **Đối tượng sử dụng**: Kỹ sư mạng cần kết nối thiết bị ra Internet hoặc liên thông lab với switch/router vật lý bên ngoài.
- **Thời điểm kích hoạt**: Khi thêm mới một đối tượng "Network" loại Bridge hoặc Cloud trên Canvas, và khi kết nối dây từ node vào Network đó.

## 2. Cơ chế Chạy (Mechanism)
1. **Tạo Đối tượng Mạng**: Gửi `POST /api/labs/session/networks` với các thông số: tên mạng, kiểu mạng (`bridge`, `pnet0`, `pnet1`... `nat`), vị trí X/Y trên Canvas.
2. **Khởi tạo Linux Bridge tầng Kernel**:
   - Khi mạng là `bridge` cục bộ: Hệ thống sinh tên bridge dạng `br-<tenant_pod>-<network_id>`. Gọi lệnh `brctl addbr <bridge_name>` và `ip link set <bridge_name> up`.
   - Khi mạng là `pnet0`: Đây là cầu nối liên kết trực tiếp với card mạng vật lý chính của máy chủ (ví dụ `eth0` hoặc `ens18`). Giao diện TAP của node được add trực tiếp vào bridge `pnet0`.
   - Khi mạng là `nat`: Giao diện TAP được gán vào bridge NAT nội bộ có cấp phát DHCP và quy tắc `iptables MASQUERADE` để ra Internet.
3. **Đấu nối Interface**: Khi người dùng nối dây từ cổng thiết bị vào Network, card TAP của cổng đó được thêm vào bridge qua lệnh `brctl addif <bridge_name> <tap_interface>`.
4. **Lưu trữ XML**: Cấu trúc mạng được tuần tự hóa vào thẻ `<network id="..." name="..." type="..." left="..." top="..." />` trong file `.unl`.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux 802.1d Ethernet Bridging (`bridge-utils` / `iproute2`)**: Chuyển mạch gói tin L2 giữa các cổng TAP trong cùng broadcast domain.
- **Linux IPTables / Netfilter**: Cấu hình NAT Masquerade chuyển dịch địa chỉ mạng cho card NAT Cloud.
- **Kernel Spanning Tree Protocol (STP)**: Tùy chọn bật/tắt STP trên Linux Bridge để ngăn ngừa loop mạng ảo.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/includes/api_networks.php`](../../../opt/unetlab/html/includes/api_networks.php)](../../../html/includes/api_networks.php) | `apiAddLabNetwork()`, `apiEditLabNetwork()` | Xử lý yêu cầu tạo/sửa đối tượng Network |
| [`/opt/unetlab/html/includes/__network.php`](../../../opt/unetlab/html/includes/__network.php)](../../../html/includes/__network.php) | `class Network` | Mô hình dữ liệu Network trong Lab XML |
| [`/opt/unetlab/html/includes/functions.php`](../../../opt/unetlab/html/includes/functions.php)](../../../html/includes/functions.php) | `apiStartLabNode()`, `checkDatabase()` | Tạo bridge và quản lý giao diện kernel |
| `/opt/ovf/pnet-bridges.sh` | Shell Script | Khởi tạo sẵn các bridge `pnet0` - `pnet9` từ khi boot máy |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**:
  ```json
  { "name": "Management_Cloud", "type": "pnet0", "left": 500, "top": 300 }
  ```
- **Output**: `{ "code": 201, "status": "success", "data": { "id": 1, "name": "Management_Cloud", "type": "pnet0" } }`
- **Edge Cases**: Gán card mạng vào `pnet` không tồn tại -> Báo lỗi `Cloud interface pnetX not available on host`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f08-network-bridge-cloud-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f08-network-bridge-cloud-sequence.md)
