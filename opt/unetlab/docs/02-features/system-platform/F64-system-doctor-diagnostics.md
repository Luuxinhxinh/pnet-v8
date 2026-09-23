---
title: "Level 2 — F64: Hệ thống Chẩn đoán Tự động (PNet Doctor Diagnostics)"
feature_id: "F64"
feature_group: "12-system-platform"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F64: HỆ THỐNG CHẨN ĐOÁN TỰ ĐỘNG (PNET DOCTOR DIAGNOSTICS)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp công cụ tự kiểm tra và chẩn đoán toàn diện sức khỏe hệ sinh thái PNet v8 (PNet Doctor), giúp kỹ sư và quản trị viên phát hiện ngay nguyên nhân khi hệ thống gặp trục trặc: Kiểm tra trạng thái 12 dịch vụ systemd nền, kiểm tra phân quyền truy cập file trên `/opt/unetlab/`, kiểm tra kết nối cơ sở dữ liệu MySQL, kiểm tra hỗ trợ ảo hóa phần cứng CPU Intel VT-x / AMD-V (`/dev/kvm`), kiểm tra dung lượng đĩa và đưa ra các nút bấm sửa lỗi tự động (One-Click Auto Fix).
- **Đối tượng sử dụng**: Tất cả người dùng và quản trị viên.
- **Thời điểm kích hoạt**: Khi gặp lỗi không khởi động được node, hoặc vào trang "System -> PNet Doctor".

## 2. Cơ chế Chạy (Mechanism)
1. **Thực thi Danh mục Bài Kiểm tra (Diagnostic Suites)**:
   - Khi gọi `GET /api/health` hoặc vào giao diện Doctor:
   - Thư viện `includes/doctor.php` (11KB) và CLI `pnetlab_doctor.php` chạy tuần tự:
     - **Test 1 - KVM Virtualization**: Kiểm tra file thiết bị `/dev/kvm` có tồn tại và user www-data có quyền đọc ghi không.
     - **Test 2 - Systemd Services**: Kiểm tra `systemctl is-active` đối với: `pnet-http-bridge`, `pnet-console-mux`, `pnet-guac-lite`, `pnetlab-brokerd`, `pnetlab-labstated`, `mysql`, `apache2`.
     - **Test 3 - Database Integrity**: Kiểm tra kết nối PDO tới `pnetlab_db` và `guacdb`.
     - **Test 4 - Filesystem Permissions**: Quét kiểm tra quyền sở hữu `www-data:unl` và quyền setuid của các binary wrapper trong [`wrappers`](../../../wrappers)/`.
     - **Test 5 - Disk Space**: Cảnh báo nếu phân vùng `/` hoặc `/opt/unetlab` còn dưới 5GB.
2. **Tổng hợp Báo cáo Sức khỏe (Health Scorecard)**:
   - Phân loại kết quả: `OK` (Xanh lá), `WARNING` (Vàng), `CRITICAL` (Đỏ).
3. **Cơ chế Tự Sửa Lỗi Tự động (One-Click Remediation)**:
   - Người dùng bấm nút "Fix All Issues": Hệ thống tự động kích hoạt `unl_wrapper -a fixpermissions`, restart các service bị treo và giải phóng bộ nhớ đệm swap.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux System Diagnostics API**: Tương tác với systemd D-Bus, sysfs và procfs.
- **Automated Remediation Hooks**: Kịch bản sửa lỗi đặc quyền an toàn.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/includes/doctor.php`](../../../html/includes/doctor.php)](../../../html/includes/doctor.php) | `class PnetDoctor`, `runAllChecks()`, `fixPermissions()` | Lõi chẩn đoán lỗi hệ thống (11KB) |
| [`[`/opt/unetlab/scripts/pnetlab_doctor.php`](../../../scripts/pnetlab_doctor.php)](../../../scripts/pnetlab_doctor.php) | PHP CLI Script | Trình kiểm tra doctor chạy bằng dòng lệnh |
| [`[`/opt/unetlab/html/api.php`](../../../html/api.php)](../../../html/api.php) | `$app->get("/api/health")` | REST API kiểm tra sức khỏe hệ thống |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /api/health`.
- **Output**: JSON báo cáo kết quả chi tiết từng dịch vụ kèm tổng điểm sức khỏe hệ thống (System Health: 100%).
- **Edge Cases**: Máy chủ bị tắt tính năng ảo hóa trong BIOS -> Báo lỗi `CRITICAL: Hardware virtualization (VT-x/AMD-V) is disabled in BIOS`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f64-system-doctor-diagnostics-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f64-system-doctor-diagnostics-sequence.md)
