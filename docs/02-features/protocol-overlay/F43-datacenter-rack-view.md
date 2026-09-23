---
title: "Level 2 — F43: Tự động Dựng Sơ đồ Bố trí Tủ Rack (Datacenter Rack View)"
feature_id: "F43"
feature_group: "07-protocol-overlay"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F43: TỰ ĐỘNG DỰNG SƠ ĐỒ BỐ TRÍ TỦ RACK (DATACENTER RACK VIEW)

## 1. Mô tả Tính năng
- **Mục đích**: Tự động chuyển đổi sơ đồ mạng logic trừu tượng trên Canvas thành sơ đồ bố trí không gian vật lý thực tế bên trong các tủ Rack trung tâm dữ liệu chuẩn 42U (Front View và Rear View), thể hiện chính xác kích thước đơn vị rack (Rack Unit: 1U, 2U, 4U) của từng dòng thiết bị (Switch Spine, Switch Leaf, Firewall, Server, Patch Panel) và vị trí cắm dây mạng phía sau.
- **Đối tượng sử dụng**: Kỹ sư triển khai phòng máy chủ, Quản trị viên Data Center (DCIM).
- **Thời điểm kích hoạt**: Chọn tab hiển thị "Rack View" trên menu chính của Canvas.

## 2. Cơ chế Chạy (Mechanism)
1. **Phân tích Kích thước Rack Unit (Device Footprint Mapping)**:
   - Kịch bản `pnet_racklayout.py` (19KB) đọc danh sách các thiết bị trong lab.
   - Tra cứu cơ sở dữ liệu kích thước vật lý theo template:
     - Cisco Catalyst 9300 / Nexus 93180: `1U`.
     - Cisco Nexus 9504 Chassis: `7U`.
     - Server Dell PowerEdge R740: `2U`.
2. **Thuật toán Xếp Chồng Tối ưu (Rack Packing Algorithm)**:
   - Tự động phân bổ thiết bị vào các tủ rack:
     - Spine Switches đặt tại vị trí đỉnh tủ (Top of Rack - ToR hoặc Middle of Row).
     - Patch Panel đặt tại vị trí trung tâm.
     - Server và Storage đặt tại nửa dưới tủ rack để hạ trọng tâm.
   - Nếu số lượng thiết bị vượt quá 42U, hệ thống tự động sinh thêm tủ Rack thứ 2 (`Rack-02`).
3. **Hiển thị Đồ họa Trực quan (`pnetlab-rack-view.js`)**:
   - Render hình ảnh mô phỏng tủ rack 42U với thanh đo số U từ `U1` đến `U42`.
   - Vẽ mặt trước thiết bị kèm đèn LED trạng thái (Xanh lá nếu đang chạy, Xám nếu đang tắt).
   - Có thể click trực tiếp vào thiết bị trên tủ rack để mở Console cấu hình.

## 3. Công nghệ & Cơ sở Sử dụng
- **1D Bin-Packing Problem Algorithm**: Thuật toán phân bổ vật thể có kích thước vào các thùng chứa dung lượng cố định 42U.
- **SVG / Canvas Skeuomorphic Rendering**: Vẽ giao diện đồ họa chân thực mô phỏng phần cứng thực tế.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/scripts/pnet_racklayout.py`](../../../opt/unetlab/scripts/pnet_racklayout.py)](../../../scripts/pnet_racklayout.py) | Python Script (19KB) | Thuật toán tính toán bố cục tủ rack |
| [`/opt/unetlab/html/themes/default/js/pnetlab-rack-view.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-rack-view.js)](../../../html/themes/default/js/pnetlab-rack-view.js) | JavaScript | Giao diện hiển thị đồ họa tủ Rack 42U |
| [`/opt/unetlab/html/pnq-overlay.php`](../../../opt/unetlab/html/pnq-overlay.php)](../../../html/pnq-overlay.php) | PHP API | API trả về JSON bố cục rack layout |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Danh sách 15 thiết bị trong lab.
- **Output**: JSON sơ đồ rack gồm 1 tủ 42U chứa đầy đủ 15 thiết bị đúng vị trí U.
- **Edge Cases**: Lab có thiết bị chassis quá lớn (> 20U) -> Thuật toán ưu tiên đặt ở đáy tủ để đảm bảo nguyên lý trọng tâm an toàn.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f43-datacenter-rack-view-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f43-datacenter-rack-view-sequence.md)
