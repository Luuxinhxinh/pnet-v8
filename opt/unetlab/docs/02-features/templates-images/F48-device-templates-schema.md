---
title: "Level 2 — F48: Hệ thống Định nghĩa Bản mẫu Thiết bị (Template Schema)"
feature_id: "F48"
feature_group: "09-templates-images"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F48: HỆ THỐNG ĐỊNH NGHĨA BẢN MẪU THIẾT BỊ (TEMPLATE SCHEMA)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp cơ sở định nghĩa chuẩn (Template Schema) quy định các thông số phần cứng mặc định và hành vi ảo hóa cho từng họ thiết bị mạng khác nhau: Số lượng vCPU mặc định, dung lượng RAM tối thiểu và khuyến nghị, loại card mạng ảo (e1000, virtio-net-pci, vmxnet3), quy tắc đặt tên cổng (e0/0, gi0/0, ge-0/0/0, eth0), kiểu console mặc định (telnet/vnc), và các tham số dòng lệnh QEMU bổ sung (`qemu_options`).
- **Đối tượng sử dụng**: Tầng lõi hệ thống và quản trị viên tùy biến thiết bị.
- **Thời điểm kích hoạt**: Khi hệ thống khởi tạo danh sách template hoặc khi người dùng mở form tạo node mới.

## 2. Cơ chế Chạy (Mechanism)
1. **Cấu trúc File Template trong [`[`/opt/unetlab/html/templates`](../../../html/templates)](../../../html/templates)/`**:
   - Mỗi dòng thiết bị được định nghĩa bằng một file PHP/YAML (ví dụ `cisco_csr1000v.php`, `juniper_vmx.php`, `arista_veos.php`):
     ```php
     <?php
     $pnet_template['name'] = 'Cisco CSR1000v';
     $pnet_template['cpus'] = 2;
     $pnet_template['ram'] = 4096;
     $pnet_template['ethernet'] = 4;
     $pnet_template['icon'] = 'Router.png';
     $pnet_template['type'] = 'qemu';
     $pnet_template['nic'] = 'virtio-net-pci';
     $pnet_template['console'] = 'telnet';
     $pnet_template['qemu_options'] = '-machine type=pc,accel=kvm -nographic';
     ```
2. **Duyệt & Nạp Cấu hình Template Mặc định**:
   - `api_templatedefaults.php::apiGetTemplateDefaults()` quét thư mục templates.
   - Trả về danh sách thuộc tính mặc định cho client render form tạo thiết bị.
3. **Kế thừa & Ghi đè (Inheritance & Overrides)**:
   - Người dùng có thể tùy chỉnh lại RAM/CPU trên từng node cụ thể trong lab mà không làm thay đổi file template gốc của hệ thống.

## 3. Công nghệ & Cơ sở Sử dụng
- **Modular Configuration Schema**: Thiết kế module hóa dễ dàng bổ sung hỗ trợ thiết bị mới mà không cần sửa code lõi.
- **KVM Architecture Acceleration Flags**: Cấu hình các cờ tăng tốc ảo hóa phần cứng Intel VT-x / AMD-V tối ưu cho từng OS mạng.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/includes/api_templatedefaults.php`](../../../html/includes/api_templatedefaults.php)](../../../html/includes/api_templatedefaults.php) | `apiGetTemplateDefaults()` | API đọc cấu hình mặc định của template |
| [`[`/opt/unetlab/html/templates`](../../../html/templates)](../../../html/templates)/` | Template Definitions | Thư mục chứa hàng trăm file định nghĩa thiết bị |
| [`[`/opt/unetlab/html/themes/default/js/pnetlab-template-defaults.js`](../../../html/themes/default/js/pnetlab-template-defaults.js)](../../../html/themes/default/js/pnetlab-template-defaults.js)| JavaScript | Nạp cấu hình mẫu vào form giao diện |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /api/templatedefaults/csr1000v`
- **Output**: JSON chứa toàn bộ tham số mặc định của dòng router Cisco CSR1000v.
- **Edge Cases**: Template bị thiếu trường bắt buộc -> Hệ thống tự gán giá trị dự phòng (Fallback: RAM 512MB, CPU 1, NIC e1000).

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f48-device-templates-schema-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f48-device-templates-schema-sequence.md)
