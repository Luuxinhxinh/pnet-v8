---
title: "Level 2 — F56: Trình Thiết kế Fabric Cisco SD-WAN Trực quan (SD-WAN Builder)"
feature_id: "F56"
feature_group: "10-automation-ai"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F56: TRÌNH THIẾT KẾ FABRIC CISCO SD-WAN TRỰC QUAN (SD-WAN BUILDER)

## 1. Mô tả Tính năng
- **Mục đích**: Tự động hóa thiết kế và khởi tạo một mạng diện rộng ảo hóa Cisco SD-WAN hoàn chỉnh chỉ trong 3 bước wizard: Tự động tính toán số lượng bộ điều khiển (vManage Controller, vSmart Controller, vBond Orchestrator), tạo các router biên cạnh WAN Edge (vEdge/cEdge), tự động đấu nối các mạng truyền tải giao thông (Underlay Transports: Internet MPLS, 4G/LTE Cloud) và gán dải địa chỉ IP hệ thống.
- **Đối tượng sử dụng**: Kỹ sư triển khai Cisco SD-WAN (CCNP/CCIE Enterprise).
- **Thời điểm kích hoạt**: Chọn chức năng "SD-WAN Builder" trên menu chính.

## 2. Cơ chế Chạy (Mechanism)
1. **Thu Thập Tham số Mạng SD-WAN (Wizard Form)**:
   - `pnetlab-sdwan-builder.js` cung cấp giao diện nhập:
     - Tên tổ chức (Organization Name): ví dụ `MyCompany-SDWAN`.
     - Địa chỉ IP công khai của vBond: ví dụ `198.51.100.1`.
     - Số lượng Site chi nhánh và số lượng kết nối WAN (Single WAN / Dual WAN MPLS + Internet).
2. **Tự động Sinh Topo Phức hợp (Topology Generation)**:
   - Backend `sdwan/api.php` nạp mẫu kiến trúc chuẩn Cisco SD-WAN.
   - Tự động sinh node `vManage` (RAM 16GB, 4 vCPU), `vSmart` (RAM 4GB), `vBond` (RAM 2GB) và các `vEdge`.
   - Tạo 2 đám mây mạng truyền tải: `INET_Transport` và `MPLS_Transport`.
   - Tự động nối các interface `ge0/0` vào Internet và `ge0/1` vào MPLS.
3. **Sinh Cấu hình Khởi tạo Tự động (Bootstrap Config Generation)**:
   - Tự động sinh file cấu hình Day-0 chứa sẵn `system ip`, `site-id`, `organization-name`, `vbond <ip>` và nhúng vào startup-config của từng node.

## 3. Công nghệ & Cơ sở Sử dụng
- **Cisco Viptela SD-WAN Architecture**: Chuẩn thiết kế mạng tách biệt mặt phẳng điều khiển (Control Plane - vSmart), quản trị (Management Plane - vManage), điều phối (Orchestration Plane - vBond) và dữ liệu (Data Plane - vEdge).
- **Day-0 Bootstrap Templating**: Sinh cấu hình mẫu tự động hóa theo biến số.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/themes/default/js/pnetlab-sdwan-builder.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-sdwan-builder.js)](../../../html/themes/default/js/pnetlab-sdwan-builder.js) | JavaScript | Giao diện wizard 3 bước thiết kế SD-WAN |
| [`/opt/unetlab/html/sdwan/api.php`](../../../opt/unetlab/html/sdwan/api.php)](../../../html/sdwan/api.php) | PHP API | Endpoint tiếp nhận tham số và sinh topo SD-WAN |
| [`/opt/unetlab/scripts/workers/sdwan.sh`](../../../opt/unetlab/scripts/workers/sdwan.sh)](../../../scripts/workers/sdwan.sh) | Shell Script | Worker chạy nạp cấu hình nền |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**:
  ```json
  { "org_name": "Lab_Corp", "vbond_ip": "1.1.1.1", "sites_count": 2, "transports": ["biz-internet", "mpls"] }
  ```
- **Output**: Tạo ra một bài lab SD-WAN hoàn chỉnh với đầy đủ các bộ điều khiển và chi nhánh kết nối sẵn sàng.
- **Edge Cases**: Máy chủ không đủ RAM cho vManage (yêu cầu tối thiểu 16GB) -> Wizard cảnh báo và cho phép chọn phiên bản vManage Lite hoặc chạy trên vệ tinh.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f56-sdwan-fabric-builder-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f56-sdwan-fabric-builder-sequence.md)
