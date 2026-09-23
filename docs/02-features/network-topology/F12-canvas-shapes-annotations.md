---
title: "Level 2 — F12: Công cụ Vẽ Khối & Chú thích (Shapes & Annotations)"
feature_id: "F12"
feature_group: "02-network-topology"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F12: CÔNG CỤ VẼ KHỐI & CHÚ THÍCH (SHAPES & ANNOTATIONS)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp bộ công cụ vẽ hình khối đa giác, hình chữ nhật, hình elip/tròn và các đoạn văn bản ghi chú tự do trên Canvas để phân vùng kiến trúc mạng (ví dụ: khoanh vùng OSPF Area 0, BGP AS 65000, Phân vùng DMZ, VLAN 10).
- **Đối tượng sử dụng**: Người thiết kế bài lab.
- **Thời điểm kích hoạt**: Chọn công cụ "Draw Shape" trên thanh công cụ bên trái.

## 2. Cơ chế Chạy (Mechanism)
1. **Chọn Kiểu Khối & Thuộc tính Đồ họa**:
   - Người dùng chọn loại hình (`box` hoặc `circle`), màu nền (Hex / RGB), độ mờ đục (Opacity từ 0 đến 100%), độ dày viền (Border width), và kiểu viền (Solid hoặc Dashed).
2. **Tương tác Vẽ trên Canvas**:
   - `pnetlab-shape-draw.js` bắt sự kiện nhấn chuột để xác định tọa độ góc trái trên, kéo chuột để xác định chiều rộng (width) và chiều cao (height).
3. **Lưu Dữ liệu XML**:
   - Dữ liệu hình khối được gửi qua `POST /api/labs/session/textobjects` hoặc `POST /api/labs/session/shapes`.
   - Lưu vào thẻ `<textobject id="..." type="..." left="..." top="..." width="..." height="..." color="..." />` trong file `.unl`.
4. **Sắp xếp Lớp Hiển thị (Layer Ordering)**:
   - Các hình khối tự động được xếp ở tầng nền (Z-index thấp nhất) để không che khuất icon thiết bị và dây nối.

## 3. Công nghệ & Cơ sở Sử dụng
- **HTML5 Canvas Path API**: `ctx.beginPath()`, `ctx.rect()`, `ctx.arc()`, `ctx.stroke()`, `ctx.fill()`.
- **Alpha Transparency**: Hỗ trợ màu nền bán trong suốt để nhìn thấy các thành phần bên dưới.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/themes/default/js/pnetlab-shape-draw.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-shape-draw.js)](../../../html/themes/default/js/pnetlab-shape-draw.js) | `drawCustomShape()`, `initShapeTool()` | Bộ công cụ vẽ vector hình khối |
| [`/opt/unetlab/html/includes/api_textobjects.php`](../../../opt/unetlab/html/includes/api_textobjects.php)](../../../html/includes/api_textobjects.php) | `apiTextobjectAdd()` | Lưu thông số hình khối và văn bản vào lab |
| [`/opt/unetlab/html/includes/__textobject.php`](../../../opt/unetlab/html/includes/__textobject.php)](../../../html/includes/__textobject.php) | `class Textobject` | Mô hình dữ liệu thẻ XML của text/shape |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**:
  ```json
  { "type": "square", "left": 100, "top": 100, "width": 400, "height": 300, "color": "#00ff00", "border": 2 }
  ```
- **Output**: `{ "code": 201, "status": "success", "id": 1 }`
- **Edge Cases**: Kéo hình có kích thước âm (kéo từ phải sang trái) -> Tự động chuẩn hóa lại tọa độ `left` và `top` chuẩn.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f12-canvas-shapes-annotations-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f12-canvas-shapes-annotations-sequence.md)
