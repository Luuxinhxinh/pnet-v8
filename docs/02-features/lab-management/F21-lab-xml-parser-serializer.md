---
title: "Level 2 — F21: Bộ Đọc & Ghi Cấu trúc Lab XML (XML Serializer & Parser)"
feature_id: "F21"
feature_group: "04-lab-management"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F21: BỘ ĐỌC & GHI CẤU TRÚC LAB XML (XML SERIALIZER & PARSER)

## 1. Mô tả Tính năng
- **Mục đích**: Chuyển đổi hai chiều giữa file lưu trữ vật lý `.unl` (định dạng XML) và các đối tượng dữ liệu trong bộ nhớ RAM của máy chủ (PHP OOP Objects: `Lab`, `Node`, `Network`, `Interface`, `Textobject`, `Picture`).
- **Đối tượng sử dụng**: Tầng lõi nghiệp vụ backend.
- **Thời điểm kích hoạt**: Mỗi khi mở, chỉnh sửa, lưu, hoặc truy vấn bất kỳ thông tin nào của một bài lab.

## 2. Cơ chế Chạy (Mechanism)
1. **Phân tích Cú pháp XML Đầu vào (Parser)**:
   - Khi khởi tạo `new Lab('/path/to/lab.unl')`, hàm `__construct()` nạp file qua `simplexml_load_file()`.
   - Quét thẻ gốc `<lab name="..." version="..." scripttimeout="...">`.
   - Duyệt vòng lặp trích xuất danh sách:
     - Thẻ `<topology>` -> `<nodes>` -> khởi tạo các đối tượng `Node`.
     - Thẻ `<networks>` -> khởi tạo các đối tượng `Network`.
     - Thẻ `<textobjects>` và `<pictures>`.
     - Thẻ `<tasks>` chứa các câu hỏi chấm điểm tự động.
2. **Xử lý Dữ liệu trong Bộ nhớ**:
   - Cung cấp các phương thức thao tác an toàn: `addNode()`, `editNode()`, `deleteNode()`, `connectInterfaces()`.
3. **Tuần tự hóa Ghi lại File (Serializer)**:
   - Phương thức `$lab->save()` chuyển đổi cây đối tượng trong bộ nhớ thành văn bản XML chuẩn định dạng (Pretty-printed XML).
   - Kiểm tra tính toàn vẹn và ghi ra file tạm `.unl.tmp` trước khi đổi tên đè vào file chính (`atomic write`) nhằm chống hỏng file nếu mất điện đột ngột.

## 3. Công nghệ & Cơ sở Sử dụng
- **PHP SimpleXML & DOMDocument**: Thư viện xử lý cây cấu trúc XML hiệu năng cao.
- **Atomic File Replacement**: Kỹ thuật ghi file tạm rồi đổi tên (`rename()`) để đảm bảo thao tác ghi mang tính nguyên tố (ACID).

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/includes/__lab.php`](../../../opt/unetlab/html/includes/__lab.php)](../../../html/includes/__lab.php) | `class Lab`, `save()`, `getNodes()` | Lõi đọc và ghi XML (100KB code) |
| [`[`/opt/unetlab/html/includes/__node.php`](../../../opt/unetlab/html/includes/__node.php)](../../../html/includes/__node.php) | `class Node` | Đọc ghi thuộc tính node XML |
| [`[`/opt/unetlab/html/includes/__network.php`](../../../opt/unetlab/html/includes/__network.php)](../../../html/includes/__network.php) | `class Network` | Đọc ghi thuộc tính network XML |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Đường dẫn file tệp `.unl` trên ổ đĩa.
- **Output**: Thể hiện đối tượng `Lab` với đầy đủ liên kết con.
- **Edge Cases**: File `.unl` bị hỏng cú pháp XML (Malformed XML) -> Ném ngoại lệ `XMLParseException` và kích hoạt file backup tự động `.unl.bak`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f21-lab-xml-parser-serializer-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f21-lab-xml-parser-serializer-sequence.md)
