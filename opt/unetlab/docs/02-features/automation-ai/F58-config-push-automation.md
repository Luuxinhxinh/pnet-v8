---
title: "Level 2 — F58: Tự động Hóa Đẩy Cấu hình & Thu Thập Lệnh (Config Push & Scrape)"
feature_id: "F58"
feature_group: "10-automation-ai"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F58: TỰ ĐỘNG HÓA ĐẨY CẤU HÌNH & THU THẬP LỆNH (CONFIG PUSH & SCRAPE)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp bộ công cụ tự động hóa dòng lệnh Python đa luồng cho phép đẩy nhanh một khối cấu hình mẫu (Snippet Config) hoặc thu thập kết quả của các lệnh kiểm tra (`show ip route`, `show interfaces status`) từ hàng chục thiết bị trong lab chỉ trong vài giây mà không cần kỹ sư phải mở từng tab console để gõ lệnh thủ công.
- **Đối tượng sử dụng**: Giảng viên nạp cấu hình bài tập cho cả lớp, Kỹ sư kiểm thử kịch bản tự động hóa.
- **Thời điểm kích hoạt**: Khi chọn menu "Push Config" hoặc gọi script `pnet-pushconfig.py`.

## 2. Cơ chế Chạy (Mechanism)
1. **Phân tích Cấu trúc Lab & Bảng Cổng**:
   - `pnet-pushconfig.py` đọc file lab XML, lập danh sách tất cả các router đang chạy và cổng console Telnet tương ứng.
2. **Khởi tạo Luồng Thực thi Song song (ThreadPoolExecutor)**:
   - Sử dụng mô hình xử lý đa luồng (Multi-threading): Khởi tạo pool từ 10 đến 20 worker threads kết nối đồng thời vào các router.
3. **Đẩy Cấu hình (Config Pushing)**:
   - Mỗi luồng đăng nhập vào router qua Telnet/SSH.
   - Tự động vào chế độ cấu hình đặc quyền: `configure terminal`.
   - Gửi từng dòng cấu hình, kiểm tra lỗi cú pháp (ví dụ nếu router báo `% Invalid input detected`).
   - Lưu cấu hình vào NVRAM bằng lệnh `write memory` hoặc `copy run start`.
4. **Thu Thập Kết Quả Lệnh (CLI Scraping - `pnet_showmany.py`)**:
   - Thực thi lệnh `show` trên toàn bộ thiết bị song song và lưu kết quả vào thư mục log riêng biệt của từng node để tiện tra cứu hoặc nộp bài.

## 3. Công nghệ & Cơ sở Sử dụng
- **Python Concurrent Futures (ThreadPoolExecutor)**: Xử lý tác vụ I/O mạng song song hiệu năng cao.
- **CLI Robust Interaction Engine**: Tự động phát hiện prompt và xử lý các câu hỏi xác nhận `[confirm]`.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/scripts/pnet-pushconfig.py`](../../../scripts/pnet-pushconfig.py)](../../../scripts/pnet-pushconfig.py) | Python Script (11KB) | Đẩy cấu hình đa luồng vào danh sách router |
| [`[`/opt/unetlab/scripts/pnet-showcmd.py`](../../../scripts/pnet-showcmd.py)](../../../scripts/pnet-showcmd.py) | Python Script (12KB) | Thu thập kết quả lệnh show từ một router |
| [`[`/opt/unetlab/scripts/pnet_showmany.py`](../../../scripts/pnet_showmany.py)](../../../scripts/pnet_showmany.py) | Python Script (3.3KB) | Thu thập lệnh show từ nhiều router đồng thời |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input CLI**:
  ```bash
  python3 pnet-pushconfig.py --lab "/CCNA/Lab1.unl" --config "router ospf 1
 network 0.0.0.0 255.255.255.255 area 0"
  ```
- **Output**: Báo cáo: `[R1: SUCCESS], [R2: SUCCESS], [R3: SUCCESS] (Thời gian: 3.2s)`.
- **Edge Cases**: Một router bị treo không phản hồi console -> Thread tự động hủy sau 10s (Timeout) và không ảnh hưởng đến các router khác.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f58-config-push-automation-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f58-config-push-automation-sequence.md)
