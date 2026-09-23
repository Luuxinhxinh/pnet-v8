---
title: "Level 2 — F02: Quy trình Khởi động Node (Start Lifecycle)"
feature_id: "F02"
feature_group: "01-node-lifecycle"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F02: QUY TRÌNH KHỞI ĐỘNG NODE (NODE START LIFECYCLE)

## 1. Mô tả Tính năng
- **Mục đích**: Khởi động thiết bị mạng ảo được chọn, cấp phát tài nguyên tính toán (vCPU, RAM), tạo card mạng ảo TAP, chuẩn bị không gian đĩa làm việc riêng biệt (Overlay disk) và gọi wrapper tương ứng để chạy tiến trình ảo hóa.
- **Đối tượng sử dụng**: Người dùng thực hành lab.
- **Thời điểm kích hoạt**: Khi người dùng nhấn chuột phải vào Node chọn "Start", hoặc chọn nhiều node rồi bấm nút "Start Selected" trên thanh công cụ.

## 2. Cơ chế Chạy (Mechanism)
1. **Tiếp nhận Lệnh**: UI gọi `POST /api/labs/session/nodes/<node_id>/start`.
2. **Khởi tạo Môi trường Làm việc Cục bộ (Tmp Directory Creation)**:
   - Hệ thống tạo thư mục tạm tại `/opt/unetlab/tmp/<tenant_pod>/<lab_session_id>/<node_id>/`.
   - Phân quyền thư mục cho user `www-data` và nhóm `unl`.
3. **Chuẩn bị Ổ đĩa Chạy (Disk Preparation)**:
   - Nếu là QEMU: Gọi `qemu-img create -f qcow2 -b /opt/unetlab/addons/qemu/<template>/virtioa.qcow2 virtioa.qcow2` để tạo đĩa COW (Copy-On-Write). Nhờ đó ổ đĩa gốc không bao giờ bị ghi đè.
   - Nếu có file `startup-config`: Nạp nội dung cấu hình vào NVRAM hoặc đĩa ảo khởi tạo (`minidisk`, `createdosdisk.sh`).
4. **Cấu hình Card Mạng Ảo (TAP Interface Creation)**:
   - Tạo các giao diện mạng TAP cho từng cổng kết nối: `tap<tenant_pod>_<node_id>_<port_id>`.
   - Đưa các card TAP này vào Linux Bridge tương ứng của Network kết nối.
5. **Kích hoạt Wrapper Nhị phân**:
   - PHP API gọi dòng lệnh hệ thống: `sudo [`[`/opt/unetlab/scripts/unl_wrapper.php`](../../../scripts/unl_wrapper.php)](../../../scripts/unl_wrapper.php) -a start -T <tenant_pod> -D <node_id>`.
   - `unl_wrapper.php` gọi tiếp wrapper C (`qemu_wrapper`, `iol_wrapper` hoặc `docker_wrapper`).
   - Wrapper tạo tiến trình con (`fork` & `execve`), gán cgroups và chuyển hướng console ra cổng TCP Telnet/VNC.
6. **Cập nhật Trạng thái**:
   - Ghi thông tin tiến trình vào bảng `node_sessions` trong MySQL `pnetlab_db`.
   - Gửi tín hiệu SSE qua daemon `pnetlab-labstated.py` để UI đổi màu icon node từ Xám (Stopped) sang Xanh dương (Starting) rồi Xanh lá cây (Running).

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux KVM / QEMU**: Động cơ ảo hóa phần cứng máy ảo dựa trên nhân Linux.
- **QEMU Copy-On-Write (QCOW2)**: Kỹ thuật tạo đĩa ảo khác biệt (Delta overlay), giúp tiết kiệm dung lượng đĩa tối đa và cho phép nhiều node dùng chung 1 base image.
- **Linux TAP Devices & Bridging**: Giao diện mạng ảo tầng 2 cho phép tiến trình người dùng truyền nhận Ethernet frames trực tiếp với kernel bridge.
- **Setuid Root Wrappers**: Cho phép tiến trình PHP (chạy quyền www-data) gọi wrapper có quyền root an toàn để cấu hình mạng kernel.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/api.php`](../../../html/api.php)](../../../html/api.php) | `$app->post("/api/labs/session/nodes/(:action)")` | Định tuyến hành động `start` |
| [`[`/opt/unetlab/html/includes/api_nodes.php`](../../../html/includes/api_nodes.php)](../../../html/includes/api_nodes.php) | `apiNodeStart()` | Kiểm tra trạng thái và điều phối khởi động |
| [`[`/opt/unetlab/html/includes/functions.php`](../../../html/includes/functions.php)](../../../html/includes/functions.php) | `nodeStart()` | Sinh thư mục tmp, chuẩn bị đĩa và gọi unl_wrapper |
| [`[`/opt/unetlab/scripts/unl_wrapper.php`](../../../scripts/unl_wrapper.php)](../../../scripts/unl_wrapper.php) | `startNode()` | Script CLI phân tích loại thiết bị và gọi wrapper C |
| [`[`/opt/unetlab/wrappers/qemu_wrapper`](../../../wrappers/qemu_wrapper)](../../../wrappers/qemu_wrapper) | C main process | Tạo TAP, cấu hình qemu cmdline và khởi chạy QEMU |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/labs/session/nodes/1/start`
- **Output (Thành công)**:
  ```json
  { "code": 200, "status": "success", "message": "Node 1 has been started" }
  ```
- **Xử lý Ngoại lệ**:
  - Không đủ RAM máy chủ: Wrapper ném lỗi `Cannot allocate memory` -> Node dừng ngay lập tức, UI hiển thị cảnh báo đỏ và ghi log vào `/opt/unetlab/data/Logs/node_errors.txt`.
  - Thiếu file image gốc trong `/opt/unetlab/addons/`: Trả về lỗi `Image missing`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f02-node-start-lifecycle-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f02-node-start-lifecycle-sequence.md)
