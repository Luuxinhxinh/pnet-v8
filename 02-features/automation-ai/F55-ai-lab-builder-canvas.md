---
title: "Level 2 — F55: Widget Trợ lý AI Sinh Topo trên Canvas (AI Lab Builder)"
feature_id: "F55"
feature_group: "10-automation-ai"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F55: WIDGET TRỢ LÝ AI SINH TOPO TRÊN CANVAS (AI LAB BUILDER)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp một khung chat tương tác thông minh (Floating AI Assistant Widget) nằm ngay trên góc màn hình Canvas, cho phép người dùng gõ câu lệnh bằng ngôn ngữ tự nhiên tiếng Việt hoặc tiếng Anh (ví dụ: *"Hãy tạo giúp tôi topo mạng Hub-and-Spoke với 1 Hub router và 3 Spoke routers chạy EIGRP"*) và hệ thống AI sẽ tự động phân tích ngữ nghĩa, tự tính toán vị trí sắp xếp, tự nối dây và nạp cấu hình cơ bản cho bài lab.
- **Đối tượng sử dụng**: Người mới học mạng cần dựng nhanh mô hình mẫu.
- **Thời điểm kích hoạt**: Nhấn vào biểu tượng robot AI trên thanh công cụ góc phải Canvas.

## 2. Cơ chế Chạy (Mechanism)
1. **Tiếp nhận Yêu cầu Ngôn ngữ Tự nhiên**:
   - Người dùng nhập prompt vào widget `pnetlab-ai-builder.js`.
   - Gửi yêu cầu qua `POST /mcp/api.php?action=chat`.
2. **Phân tích Ngữ nghĩa & Lập kế hoạch Hành động (Agent Reasoning)**:
   - Module `ai_lab_agent.py` nạp prompt kèm ngữ cảnh sơ đồ mạng hiện tại.
   - AI lập kế hoạch gồm chuỗi hành động tuần tự:
     - Thao tác 1: Tạo Hub_Router tại tọa độ (400, 200).
     - Thao tác 2: Tạo Spoke_1 tại (200, 400), Spoke_2 tại (400, 400), Spoke_3 tại (600, 400).
     - Thao tác 3: Nối dây từ Hub cổng e0/0 sang Spoke 1 cổng e0/0, tương tự với Spoke 2, 3.
     - Thao tác 4: Nạp startup-config với IP 10.0.0.x/24.
3. **Thực thi Chuỗi Công cụ (Batch Tool Execution)**:
   - AI Agent gọi máy chủ MCP thực thi các công cụ đã lập kế hoạch.
4. **Phản hồi Tương tác**:
   - AI hiển thị lời giải thích từng bước trên khung chat và Canvas tự động vẽ các thiết bị và dây nối theo thời gian thực.

## 3. Công nghệ & Cơ sở Sử dụng
- **LLM Reasoning & Function Calling**: Tận dụng khả năng lập luận của các mô hình ngôn ngữ tiên tiến.
- **Automatic Spatial Layout Algorithms**: Thuật toán tính toán tọa độ topo hình sao (Star), hình lưới (Mesh), hình vòng (Ring) hài hòa thẩm mỹ.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/unetlab/html/themes/default/js/pnetlab-ai-builder.js` | JavaScript | Giao diện khung chat widget AI nổi |
| `/opt/unetlab/scripts/mcp/ai_lab_agent.py` | Python Script (28KB) | Động cơ agent thông minh phân tách lệnh |
| `/opt/unetlab/html/mcp/api.php` | PHP API | Cầu nối API giao tiếp với AI Agent |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Chuỗi prompt: `"Tạo 2 router R1, R2 nối nhau qua cổng e0/0"`.
- **Output**: 2 router xuất hiện trên Canvas nối với nhau bằng 1 sợi dây cáp.
- **Edge Cases**: Yêu cầu số lượng node quá lớn vượt quá tài nguyên máy chủ -> AI cảnh báo người dùng và đề xuất giảm bớt số node.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f55-ai-lab-builder-canvas-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f55-ai-lab-builder-canvas-sequence.md)
