---
title: "Level 2 — F09: Kết nối Điểm-Điểm Tối ưu (Point-to-Point Links)"
feature_id: "F09"
feature_group: "02-network-topology"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F09: KẾT NỐI ĐIỂM-ĐIỂM TỐI ƯU (POINT-TO-POINT LINKS)

## 1. Mô tả Tính năng
- **Mục đích**: Tối ưu hóa hiệu năng truyền gói tin giữa 2 cổng kết nối trực tiếp của 2 thiết bị mà không cần phải qua một đối tượng Cloud hay Switch trung gian.
- **Đối tượng sử dụng**: Người dùng nối dây trực tiếp giữa 2 router/firewall (ví dụ link e0/0 của R1 sang e0/0 của R2).
- **Thời điểm kích hoạt**: Kéo đầu dây từ cổng node A thả vào cổng node B trên Canvas.

## 2. Cơ chế Chạy (Mechanism)
1. **Sinh Mạng Ẩn (P2P Network Stub)**:
   - Hệ thống tự động sinh một thực thể mạng nội bộ kiểu `p2p` với tên ẩn trong XML: `<network id="X" name="Net-R1_e0-R2_e0" type="bridge" visibility="0" />`.
2. **Liên kết Hai Cổng Giao diện**:
   - Thẻ interface của Node A (`e0/0`) được gán `network_id = X`.
   - Thẻ interface của Node B (`e0/0`) được gán `network_id = X`.
3. **Tạo Cầu nối Riêng Biệt (Dedicated Micro-Bridge)**:
   - Linux Kernel tạo một bridge chuyên dụng `br-<pod>-<X>` chỉ chứa đúng 2 interface TAP của Node A và Node B.
   - Nhờ đó, gói tin unicast/broadcast chỉ lưu thông trực tiếp giữa 2 node mà không bị rò rỉ ra các phân đoạn mạng khác.
4. **Hiển thị Đồ họa**: Canvas vẽ một đường thẳng nối giữa 2 icon của Node A và Node B kèm nhãn hiển thị tên interface ở 2 đầu dây.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Micro-Bridging**: Sử dụng các Linux Bridge độc lập siêu nhẹ cho từng cặp kết nối trực tiếp.
- **Port Mapping Logic**: Ánh xạ slot/port tương ứng trong model `Node` và `Lab`.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/api.php`](../../../opt/unetlab/html/api.php)](../../../html/api.php) | `$app->put("/api/labs/session/network/manage")` | API quản lý việc gán interface vào network |
| [`/opt/unetlab/html/includes/api_networks.php`](../../../opt/unetlab/html/includes/api_networks.php)](../../../html/includes/api_networks.php) | `apiNetworkP2PConnect()` | Xử lý logic tự sinh mạng p2p |
| [`/opt/unetlab/html/themes/default/js/javascript.js`](../../../opt/unetlab/html/themes/default/js/javascript.js)](../../../html/themes/default/js/javascript.js) | `connectNodes()` | Bắt sự kiện thả dây giữa 2 node trên UI |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**:
  ```json
  { "source_node": 1, "source_port": 0, "destination_node": 2, "destination_port": 0 }
  ```
- **Output**: `{ "code": 200, "status": "success", "network_id": 5 }`
- **Edge Cases**: Nối cổng đã được cắm dây -> Báo lỗi `Port is already connected. Please disconnect first.`

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f09-network-p2p-links-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f09-network-p2p-links-sequence.md)
