---
title: "Level 2 — F38: Phân tích Bảng Định tuyến & Thác đổ BGP (BGP Waterfall)"
feature_id: "F38"
feature_group: "07-protocol-overlay"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F38: PHÂN TÍCH BẢNG ĐỊNH TUYẾN & THÁC ĐỔ BGP (BGP WATERFALL)

## 1. Mô tả Tính năng
- **Mục đích**: Bóc tách chi tiết toàn bộ bảng định tuyến BGP (BGP Routing Information Base - RIB) từ các Autonomous System (AS) khác nhau trong lab, phân tích các thuộc tính đường dẫn (Path Attributes: AS-Path, Next-Hop, Local Pref, MED, Origin, Community) và dựng nên biểu đồ thác nước (Waterfall Graph) thể hiện thứ tự ưu tiên chọn đường Best-Path của thuật toán BGP.
- **Đối tượng sử dụng**: Kỹ sư mạng ISP, Chuyên gia BGP Traffic Engineering.
- **Thời điểm kích hoạt**: Khi click chọn menu "BGP Waterfall" trên thanh công cụ.

## 2. Cơ chế Chạy (Mechanism)
1. **Thu thập BGP Table**:
   - `pnet_bgpparse.py` (36KB) kết nối vào các BGP Speaker qua Telnet socket.
   - Gửi lệnh `show ip bgp` hoặc `show bgp ipv4 unicast`.
2. **Phân tích Cú pháp Thuộc tính BGP (Regex State Machine)**:
   - Bóc tách từng tiền tố mạng (Prefix), nhận diện cờ `*` (Valid route), `>` (Best route), `i` (Internal BGP).
   - Giải mã chuỗi số AS trong trường `AS_PATH` (ví dụ: `65001 65002 65003 i`).
3. **Vẽ Biểu đồ Thác đổ (Waterfall Visualization)**:
   - API `pnq-bgppath.php` chuyển dữ liệu về cho component `pnetlab-bgp-waterfall.js`.
   - Hiển thị từng bước loại trừ theo thứ tự thuật toán BGP Best Path Selection:
     - Bước 1: Weight cao nhất.
     - Bước 2: Local Preference cao nhất.
     - Bước 3: AS-Path ngắn nhất.
     - Bước 4: Origin Code thấp nhất (IGP < EGP < Incomplete).
     - Bước 5: MED thấp nhất.
     - Bước 6: eBGP ưu tiên hơn iBGP.
     - Bước 7: Router ID nhỏ nhất.
4. **Trực quan hóa Đồ thị**: Các đường bị loại bỏ bị gạch đỏ kèm lý do loại (ví dụ *"AS-Path longer: 3 hops vs 2 hops"*).

## 3. Công nghệ & Cơ sở Sử dụng
- **BGP Decision Process Specification (RFC 4271)**: Chuẩn hóa 9 bước chọn đường của Border Gateway Protocol.
- **D3.js / SVG Sankey / Waterfall Charts**: Đồ thị hóa trực quan cây quyết định mạng viễn thông.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/scripts/pnet_bgpparse.py`](../../../opt/unetlab/scripts/pnet_bgpparse.py)](../../../scripts/pnet_bgpparse.py) | Python Script | Bóc tách bảng BGP từ CLI |
| [`/opt/unetlab/html/pnq-bgppath.php`](../../../opt/unetlab/html/pnq-bgppath.php)](../../../html/pnq-bgppath.php) | PHP API | Endpoint cung cấp dữ liệu AS-Path |
| [`/opt/unetlab/html/themes/default/js/pnetlab-bgp-waterfall.js`](../../../opt/unetlab/html/themes/default/js/pnetlab-bgp-waterfall.js)](../../../html/themes/default/js/pnetlab-bgp-waterfall.js)| JavaScript | Render biểu đồ thác đổ và cây quyết định BGP |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Chọn tiền tố cần phân tích: `prefix = 10.0.0.0/24`.
- **Output**: Biểu đồ hình cây thể hiện 4 đường đi và lý do đường số 2 được chọn làm Best-Path.
- **Edge Cases**: BGP chưa hội tụ xong (chưa có Best Path) -> Hiển thị trạng thái "BGP Converging...".

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f38-bgp-waterfall-analytics-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f38-bgp-waterfall-analytics-sequence.md)
