---
title: "Level 2 — F54: Máy chủ Giao thức Ngữ cảnh Mô hình AI (MCP Server)"
feature_id: "F54"
feature_group: "10-automation-ai"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F54: MÁY CHỦ GIAO THỨC NGỮ CẢNH MÔ HÌNH AI (MCP SERVER)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp máy chủ triển khai chuẩn giao thức mở **Model Context Protocol (MCP)** do Anthropic khởi xướng, cho phép các mô hình ngôn ngữ lớn (LLM như Claude, Gemini, ChatGPT) hoặc các IDE AI (Cursor, Antigravity) kết nối trực tiếp vào PNet v8 để: Đọc sơ đồ bài lab hiện tại, Tự động tạo thiết bị, Nối dây mạng, Khởi động thiết bị, và Đọc log cấu hình để chẩn đoán sự cố mạng tự động.
- **Đối tượng sử dụng**: Trợ lý AI, Kỹ sư tích hợp hệ thống tự động hóa NetDevOps.
- **Thời điểm kích hoạt**: Daemon `pnetlab-mcp.py` chạy dịch vụ nền liên tục qua cổng JSON-RPC hoặc qua API `/mcp/api.php`.

## 2. Cơ chế Chạy (Mechanism)
1. **Lắng nghe & Bắt tay Giao thức MCP**:
   - `pnetlab-mcp.py` (52KB mã nguồn Python) mở cổng JSON-RPC hoặc kết nối qua giao thức SSE/Stdio.
   - Khi client AI kết nối, server phản hồi danh sách các **MCP Resources** (danh mục lab, danh mục template) và danh sách các **MCP Tools**.
2. **Đăng ký Danh mục Công cụ (Registered Tools)**:
   - `tool_get_topology`: Đọc toàn bộ danh sách node, link, interface của bài lab hiện hành.
   - `tool_create_node`: Tạo router/switch mới theo template và vị trí X, Y.
   - `tool_connect_interfaces`: Đấu nối dây mạng giữa 2 cổng thiết bị.
   - `tool_start_node` / `tool_stop_node`: Điều khiển trạng thái bật/tắt của thiết bị.
   - `tool_exec_command`: Gửi lệnh CLI vào router qua Telnet/SSH và trả kết quả cho AI phân tích.
3. **Thực thi Tool-Calling từ AI Agent**:
   - Khi AI quyết định gọi tool `create_node(template='iol', name='R1')`:
   - MCP Server xác thực phiên làm việc qua `mcp/bridge.php`, gọi các hàm nội bộ của PNet v8 và trả về kết quả JSON chuẩn cho mô hình ngôn ngữ.

## 3. Công nghệ & Cơ sở Sử dụng
- **Model Context Protocol (MCP) Standard**: Chuẩn giao thức trao đổi ngữ cảnh và công cụ hai chiều giữa AI và ứng dụng.
- **JSON-RPC 2.0 Specification**: Giao thức truyền tin gọi thủ tục từ xa chuẩn hóa.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`scripts/mcp/pnetlab-mcp.py`](../../../scripts/mcp/pnetlab-mcp.py) | `MCPServer`, `register_tools()` | Máy chủ MCP Server Python (52KB) |
| [`scripts/mcp/ai_lab_agent.py`](../../../scripts/mcp/ai_lab_agent.py) | `AILabAgent` | Bộ xử lý lập luận và phân tách lệnh của AI |
| [`html/mcp/api.php`](../../../html/mcp/api.php) | PHP API | Endpoint tiếp nhận truy vấn MCP từ Web |
| [`html/mcp/bridge.php`](../../../html/mcp/bridge.php) | PHP | Cầu nối xác thực cookie token với MCP |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input JSON-RPC**:
  ```json
  { "jsonrpc": "2.0", "method": "tools/call", "params": { "name": "create_node", "arguments": { "name": "R1", "template": "iol" } } }
  ```
- **Output**: `{ "jsonrpc": "2.0", "result": { "content": [{ "type": "text", "text": "Node R1 created with ID 1" }] } }`
- **Edge Cases**: Client AI gửi tên template không tồn tại -> Trả về JSON-RPC Error Code `-32602: Invalid params`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f54-ai-agent-mcp-server-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f54-ai-agent-mcp-server-sequence.md)
