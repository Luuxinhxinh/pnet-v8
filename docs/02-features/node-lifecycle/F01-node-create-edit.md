---
title: "Level 2 — F01: Khởi tạo & Cấu hình Tham số Node"
feature_id: "F01"
feature_group: "01-node-lifecycle"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F01: KHỞI TẠO & CẤU HÌNH THAM SỐ NODE (NODE CREATE & EDIT)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép người dùng thêm mới một thiết bị mạng ảo vào bài lab từ danh sách các template mẫu (Cisco, Juniper, Linux, Docker, etc.) hoặc chỉnh sửa các thông số phần cứng của node đã tồn tại (vCPU, RAM, Card mạng Ethernet/Serial, kiểu Console telnet/vnc/rdp, vị trí tọa độ X/Y trên Canvas, Icon đại diện).
- **Đối tượng sử dụng**: Kỹ sư thiết kế mạng, Giảng viên, Học viên thực hành.
- **Thời điểm kích hoạt**: Khi người dùng nhấn chuột phải vào Canvas chọn "Add an object -> Node", hoặc nhấn chuột phải vào một Node đang có chọn "Edit".

## 2. Cơ chế Chạy (Mechanism)
1. **Frontend Request**: Người dùng điền thông tin trong modal `pnetlab-node-form.js`, gửi HTTP POST tới `/api/labs/session/nodes` (khi thêm mới) hoặc HTTP PUT tới `/api/labs/session/nodes/<node_id>` (khi chỉnh sửa).
2. **Authentication & Authorization**: `api.php` trích xuất Cookie Token, đối chiếu phiên làm việc qua `$indent->authorization()`, kiểm tra quyền chỉnh sửa lab `USER_PER_EDIT_LAB` của người dùng đối với bài lab hiện hành.
3. **Route Handling**: `api.php` gọi hàm `apiAddLabNode()` hoặc `apiEditLabNode()` nằm trong `includes/api_nodes.php`.
4. **Domain Model Validation**:
   - `api_nodes.php` nạp đối tượng `$lab = new Lab(...)`.
   - Khởi tạo instance của class `Node` (`includes/__node.php`).
   - Phương thức `device::editParams()` thực hiện kiểm tra tính hợp lệ của các tham số: template có tồn tại không, số cổng mạng có vượt quá giới hạn template cho phép không, dung lượng RAM có phải số nguyên dương không.
   - Tính toán cổng console: Tự động cấp phát cổng Telnet/VNC/RDP theo công thức: `console_port = 32768 + (tenant_pod * 128) + node_id`.
5. **Cập nhật Cấu trúc Dữ liệu XML**:
   - Ghi thông tin thẻ `<node id="..." name="..." type="..." template="..." cpu="..." ram="..." ethernet="..." ...>` vào cấu trúc DOM của bài lab.
   - Gọi phương thức `$lab->save()` để ghi tuần tự hóa ngược lại file `.unl` trên ổ đĩa (`/opt/unetlab/labs/...`).
6. **Response**: Trả về mã HTTP 201 (Created) hoặc 200 (OK) kèm payload JSON chứa chi tiết thuộc tính node vừa tạo/sửa để frontend cập nhật lại phần tử đồ họa trên Canvas.

## 3. Công nghệ & Cơ sở Sử dụng
- **Slim Framework PHP**: Quản lý REST router, request parsing và HTTP response status codes.
- **XML DOM / SimpleXML**: Đọc và thao tác cây thẻ XML của định dạng file lab `.unl`.
- **EJS (Embedded JavaScript Templates)**: Render form modal nhập liệu phía client.
- **Port Allocation Formula**: Thuật toán chia dải cổng console tránh xung đột giữa các người dùng (Tenant Pod isolation).

## 4. File / Hàm Liên quan
| [`/opt/unetlab/html/api.php`](../../../opt/unetlab/html/api.php) | `$app->post("/api/labs/session/nodes")`, `$app->put("/api/labs/session/nodes/(:id)")` | Tiếp nhận REST request từ client |
| [`/opt/unetlab/html/includes/api_nodes.php`](../../../opt/unetlab/html/includes/api_nodes.php) | `apiAddLabNode()`, `apiEditLabNode()` | Xử lý logic kiểm tra và gán tham số node |
| [`/opt/unetlab/html/includes/__node.php`](../../../opt/unetlab/html/includes/__node.php) | `class Node`, `Node::edit()`, `Node::getParams()` | Mô hình đối tượng Node, khởi tạo device factory và session |
| [`/opt/unetlab/html/devices/device.php`](../../../opt/unetlab/html/devices/device.php) | `device::editParams()`, `device::getParams()` | Factory validate và gán tham số phần cứng phần mềm cho thiết bị |
| [`/opt/unetlab/html/includes/__lab.php`](../../../opt/unetlab/html/includes/__lab.php) | `Lab::addNode()`, `Lab::editNode()`, `Lab::save()` | Cập nhật thẻ XML và lưu file lab vật lý |
| [`/opt/unetlab/html/themes/default/js/actions.js`](../../../opt/unetlab/html/themes/default/js/actions.js) | `formNode()`, `printForm()` | Hiển thị form thêm/sửa node và bind sự kiện submit |
| [`/opt/unetlab/html/themes/default/js/pnetlab-node-form.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-node-form.js) | Giao diện cấu hình 2 cột | Tái cấu trúc layout #form-node-data thành Main Settings và Additional Settings |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**:
  ```json
  {
    "template": "iol",
    "type": "iol",
    "count": 1,
    "name": "R1",
    "icon": "Router.png",
    "cpu": 1,
    "ram": 512,
    "ethernet": 4,
    "serial": 2,
    "console": "telnet",
    "top": 250,
    "left": 400
  }
  ```
- **Output (Thành công - HTTP 201)**:
  ```json
  {
    "code": 201,
    "status": "success",
    "message": "Node has been added",
    "data": { "id": 1, "name": "R1", "type": "iol", "status": 0 }
  }
  ```
- **Trường hợp lỗi (Edge Cases)**:
  - `HTTP 400 Bad Request`: Template không tồn tại hoặc RAM không hợp lệ -> Ném ngoại lệ `InvalidParameterException`.
  - `HTTP 403 Forbidden`: Người dùng không có quyền chỉnh sửa lab (`USER_PER_EDIT_LAB`).
  - `HTTP 409 Conflict`: Tên node bị trùng lặp trong cùng bài lab.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f01-node-create-edit-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f01-node-create-edit-sequence.md)
