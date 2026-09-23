---
title: "Level 2 — F45: Động cơ Thực thi Kiểm tra Tự động (Probe Engine)"
feature_id: "F45"
feature_group: "08-lab-validation"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F45: ĐỘNG CƠ THỰC THI KIỂM TRA TỰ ĐỘNG (PROBE ENGINE)

## 1. Mô tả Tính năng
- **Mục đích**: Chịu trách nhiệm thực thi các bài kiểm tra tự động đối chiếu với các router/switch đang chạy thật trong lab khi học viên bấm nút "Check My Lab". Động cơ hỗ trợ nhiều loại đầu dò kiểm tra (Probe Types):
  - **CLI Command Probe**: Đăng nhập vào thiết bị, gửi lệnh và so khớp văn bản đầu ra.
  - **ICMP Ping Probe**: Kiểm tra tính thông suốt đường truyền giữa các mạng.
  - **TCP/UDP Port Probe**: Quét kiểm tra cổng dịch vụ mạng (SSH, HTTP, BGP 179).
- **Đối tượng sử dụng**: Học viên kiểm tra bài làm, Hệ thống tự động chấm điểm thi.
- **Thời điểm kích hoạt**: Khi học viên bấm nút "Validate / Check Lab" trên Canvas.

## 2. Cơ chế Chạy (Mechanism)
1. **Khởi động Phiên Kiểm tra**:
   - Client gọi `POST /api/labs/session/validate`.
   - `lab_validation_probe.php` (34KB) nạp toàn bộ danh sách task từ `lab_tasks_unl.php`.
2. **Lập lịch Chạy Probe Song song / Tuần tự**:
   - Đối với từng nhiệm vụ (Task):
   - Động cơ xác định `node_id` mục tiêu và lấy thông tin cổng Console (Telnet Port) hoặc địa chỉ IP quản trị của node.
3. **Thực thi Kiểm tra (Execution)**:
   - Nếu là CLI Probe: Kích hoạt transport executor `pnet_validation_transport.py` gửi lệnh `command` vào router.
   - Nhận chuỗi văn bản đầu ra (`cli_output`).
4. **Đối chiếu Tiêu chí (Assertion & Pattern Matching)**:
   - Sử dụng hàm `preg_match($pattern, $cli_output)` để kiểm tra.
   - Nếu khớp: Đánh dấu trạng thái `PASS`, ghi nhận điểm số của task.
   - Nếu không khớp hoặc timeout: Đánh dấu trạng thái `FAIL`, ghi nhận 0 điểm kèm thông điệp hướng dẫn sửa lỗi.
5. **Tổng hợp Kết quả**: Gửi kết quả sang `lab_validation_store.php` để lưu trữ.

## 3. Công nghệ & Cơ sở Sử dụng
- **PHP PCRE Engine**: Động cơ so khớp biểu thức chính quy tốc độ cao.
- **Non-blocking Probe Execution**: Chạy kiểm tra với cơ chế timeout (mặc định 5s) tránh trường hợp thiết bị treo làm đứng toàn bộ tiến trình chấm thi.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/includes/lab_validation_probe.php`](../../../opt/unetlab/html/includes/lab_validation_probe.php)](../../../html/includes/lab_validation_probe.php) | `LabValidationProbe`, `executeTaskProbe()` | Động cơ điều phối và chấm điểm probe (34KB) |
| [`[`/opt/unetlab/scripts/pnet_validation_transport.py`](../../../opt/unetlab/scripts/pnet_validation_transport.py)](../../../scripts/pnet_validation_transport.py) | Python Script | Kênh vận chuyển kết nối dòng lệnh |
| [`[`/opt/unetlab/html/themes/default/js/validate.js`](../../../opt/unetlab/html/themes/default/js/validate.js)](../../../html/themes/default/js/validate.js) | JavaScript | Giao diện nút "Check Lab" và checklist kết quả |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /api/labs/session/validate`
- **Output**:
  ```json
  {
    "total_score": 80,
    "max_score": 100,
    "tasks": [
      { "id": 1, "status": "PASS", "score": 20, "message": "R1 OSPF cấu hình chính xác!" },
      { "id": 2, "status": "FAIL", "score": 0, "message": "Chưa quảng bá mạng 192.168.1.0/24" }
    ]
  }
  ```
- **Edge Cases**: Router chưa bật (Stopped) khi kiểm tra -> Probe lập tức ghi nhận `FAIL` kèm lý do `Target node R1 is not running`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f45-validation-probe-engine-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f45-validation-probe-engine-sequence.md)
