---
title: "Level 2 — F28: Điều phối Vị trí Node Chạy (Node Cluster Placement)"
feature_id: "F28"
feature_group: "05-cluster-satellite"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F28: ĐIỀU PHỐI VỊ TRÍ NODE CHẠY (NODE CLUSTER PLACEMENT)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp cơ chế cho phép người dùng chỉ định thiết bị nào trong bài lab sẽ chạy trên máy chủ Master và thiết bị nào sẽ chạy trên các máy chủ vệ tinh (Satellite), hoặc để hệ thống tự động cân bằng tải (Dynamic Load Balancing) dựa trên lượng RAM còn trống của từng host.
- **Đối tượng sử dụng**: Người thiết kế lab lớn, Quản trị viên tối ưu tài nguyên.
- **Thời điểm kích hoạt**: Khi thêm/sửa node hoặc click vào menu "Run On" trên Canvas.

## 2. Cơ chế Chạy (Mechanism)
1. **Lựa chọn Host Chạy**:
   - Trong form cấu hình node hoặc modal `pnetlab-node-runon.js`, danh sách các máy chủ trong cụm được hiển thị kèm tỷ lệ sử dụng RAM/CPU thực tế.
   - Người dùng chọn máy chủ mong muốn (ví dụ `Master`, `Satellite-01`, `Satellite-02` hoặc `Auto`).
2. **Lưu Vị trí Điều phối (Placement Store)**:
   - Ghi nhận thông tin vào bảng `cluster_placements` trong cơ sở dữ liệu `pnetlab_db` và ghi thuộc tính `run_on="<sat_id>"` vào thẻ `<node>` trong XML của lab.
3. **Hiển thị Huy hiệu Vệ tinh trên Canvas (Satellite Badge)**:
   - Script `pnetlab-sat-badge.js` vẽ một huy hiệu nhỏ (Badge màu tím hoặc cam mang tên vệ tinh) ở góc trên bên phải biểu tượng của node để người dùng dễ dàng nhận biết thiết bị đang chạy ở máy chủ nào.
4. **Định tuyến Lệnh Khởi động**:
   - Khi bấm Start node: Hệ thống đọc trường `run_on`. Nếu `run_on` trỏ tới vệ tinh, lệnh tự động được chuyển tiếp qua Broker tới vệ tinh đó thay vì chạy tại Master.

## 3. Công nghệ & Cơ sở Sử dụng
- **Least-Loaded Scheduling Algorithm**: Thuật toán tự động chọn host có tỷ lệ RAM khả dụng cao nhất khi đặt chế độ `Auto`.
- **Relational Placement Mapping**: Bảng MySQL `cluster_placements` liên kết khóa ngoại với `cluster_hosts`.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/unetlab/html/themes/default/js/pnetlab-node-runon.js` | `renderRunOnModal()` | Modal chọn máy chủ chạy node |
| `/opt/unetlab/html/themes/default/js/pnetlab-sat-badge.js` | `drawSatelliteBadge()` | Vẽ huy hiệu tên host lên icon node |
| `/opt/unetlab/html/pnq-placements.php` | PHP API | Lấy và cập nhật bảng vị trí cluster placement |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /pnq-placements.php` với `{"node_id": 1, "host_id": 2}`
- **Output**: `{ "code": 200, "status": "success", "message": "Placement updated" }`
- **Edge Cases**: Máy chủ vệ tinh được chọn đang bị tắt nguồn (Offline) -> Hệ thống cảnh báo đỏ và đề xuất chuyển node sang máy chủ khác đang khả dụng.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f28-node-cluster-placement-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f28-node-cluster-placement-sequence.md)
