---
title: "Level 2 — F46: Kênh Giao tiếp Thực thi Lệnh CLI (Transport Executor)"
feature_id: "F46"
feature_group: "08-lab-validation"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F46: KÊNH GIAO TIẾP THỰC THI LỆNH CLI (TRANSPORT EXECUTOR)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp kênh vận chuyển (Transport Layer) tự động hóa dòng lệnh, chịu trách nhiệm kết nối mạng vào cổng Console hoặc cổng SSH của thiết bị ảo, xử lý quá trình đăng nhập (gõ Enter, chờ dấu nhắc `Router>`, xử lý mật khẩu `enable`), vô hiệu hóa phân trang (tự động gửi lệnh `terminal length 0`), thực thi lệnh kiểm tra và hứng toàn bộ dữ liệu trả về mà không làm ảnh hưởng đến phiên làm việc của người dùng.
- **Đối tượng sử dụng**: Tầng thực thi tự động hóa của PNet v8.
- **Thời điểm kích hoạt**: Khi động cơ Validation Probe hoặc kịch bản AI Agent cần thu thập thông tin thiết bị.

## 2. Cơ chế Chạy (Mechanism)
1. **Khởi tạo Kịch bản Python Transport (`pnet_validation_transport.py`)**:
   - Được gọi với các tham số: `--host 127.0.0.1 --port <console_port> --cmd "<command>" --timeout 5`.
2. **Quản lý Bắt tay Dòng lệnh (CLI Expect State Machine)**:
   - Sử dụng thư viện `telnetlib` hoặc `pexpect`.
   - Kết nối vào socket TCP của node.
   - Gửi ký tự xuống dòng `
` để kích hoạt dấu nhắc.
   - Chờ nhận dấu nhắc lệnh kết thúc bằng `>`, `#`, hoặc `$`.
   - Nếu gặp dấu nhắc `>`, tự động gửi lệnh `enable` để lấy đặc quyền cao nhất.
3. **Vô hiệu hóa Phân trang (Disable Paging)**:
   - Gửi lệnh `terminal length 0` (đối với Cisco IOS) hoặc `set cli screen-length 0` (đối với JunOS) để output không bị dừng lại bởi phím cách `--More--`.
4. **Thực thi & Thu thập Buffer**:
   - Gửi lệnh cần kiểm tra (ví dụ `show running-config`).
   - Đọc toàn bộ chuỗi byte cho tới khi dấu nhắc `#` xuất hiện trở lại.
   - Làm sạch văn bản: Loại bỏ các ký tự điều khiển ANSI escape codes, ký tự `
`.
   - Xuất văn bản sạch ra định dạng JSON qua `stdout`.

## 3. Công nghệ & Cơ sở Sử dụng
- **Expect Pattern (Stateful CLI Automation)**: Xử lý tương tác dòng lệnh theo máy trạng thái hữu hạn.
- **ANSI Escape Code Stripping**: Biểu thức chính quy loại bỏ mã màu và điều khiển con trỏ terminal.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/scripts/pnet_validation_transport.py`](../../../scripts/pnet_validation_transport.py)](../../../scripts/pnet_validation_transport.py) | Python Script (4.5KB) | Kịch bản vận chuyển lệnh CLI qua Telnet/SSH |
| [`[`/opt/unetlab/scripts/pnet-showcmd.py`](../../../scripts/pnet-showcmd.py)](../../../scripts/pnet-showcmd.py) | Python Script | Kịch bản hỗ trợ thu thập nhiều lệnh đồng thời |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input CLI**: `python3 pnet_validation_transport.py --port 32769 --cmd "show version"`
- **Output**: Chuỗi JSON chứa toàn bộ nội dung văn bản output của lệnh `show version`.
- **Edge Cases**: Thiết bị bị khóa mật khẩu enable lạ -> Kịch bản ném mã lỗi `AUTHENTICATION_FAILED`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f46-validation-transport-executor-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f46-validation-transport-executor-sequence.md)
