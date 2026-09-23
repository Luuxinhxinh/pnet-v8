---
title: "Level 2 — F30: Kiểm tra Sức khỏe Cụm & Cảnh báo (Cluster Health & Failover)"
feature_id: "F30"
feature_group: "05-cluster-satellite"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F30: KIỂM TRA SỨC KHỎE CỤM & CẢNH BÁO (CLUSTER HEALTH & FAILOVER)

## 1. Mô tả Tính năng
- **Mục đích**: Liên tục theo dõi tình trạng sống còn và hiệu năng của các máy chủ vệ tinh trong cụm, kịp thời phát hiện sự cố mất điện, mất kết nối mạng hoặc quá tải tài nguyên, cảnh báo cho quản trị viên và hỗ trợ điều chuyển node khi có sự cố.
- **Đối tượng sử dụng**: Quản trị viên hệ thống mạng.
- **Thời điểm kích hoạt**: Vòng lặp định kỳ chạy 24/7 của daemon `pnetlab-brokerd.py`.

## 2. Cơ chế Chạy (Mechanism)
1. **Kiểm tra Nhịp tim Định kỳ (Heartbeat Checker Loop)**:
   - Broker duy trì một timer chạy mỗi 5 giây quét bảng danh sách các vệ tinh đang kết nối.
   - Đối chiếu trường `last_seen` với thời gian hiện tại.
2. **Phát hiện Trạng thái Mất Kết nối (Dead Node Detection)**:
   - Nếu một vệ tinh không gửi heartbeat trong quá 15 giây (quá 3 chu kỳ): Chuyển trạng thái host từ `Online` sang `Degraded` hoặc `Offline`.
   - Cập nhật trường `status = 'offline'` trong bảng `cluster_hosts`.
3. **Cảnh báo Thời gian thực lên Web UI**:
   - Broker gửi sự kiện SSE tới trình duyệt của quản trị viên: Hiển thị thanh thông báo đỏ *"Satellite [Tên_Host] is unreachable!"*.
   - Khóa các hành động can thiệp vào các node đang nằm trên vệ tinh đó để tránh xung đột dữ liệu.
4. **Tự động Khôi phục khi Kết nối lại (Auto-Recovery)**:
   - Khi vệ tinh có mạng trở lại, nó tự động thực hiện lại quy trình handshake, khôi phục trạng thái `Online` mà không cần khởi động lại máy chủ Master.

## 3. Công nghệ & Cơ sở Sử dụng
- **Dead Man's Snitch / Heartbeat Pattern**: Mẫu thiết kế giám sát hệ thống phân tán tiêu chuẩn.
- **Server-Sent Events (SSE)**: Đẩy cảnh báo sự cố tức thời lên Dashboard.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/unetlab/scripts/pnetlab-brokerd.py` | `check_satellite_heartbeats()` | Vòng lặp kiểm tra nhịp tim |
| `/opt/unetlab/html/cluster/api.php` | `getClusterStatus()` | Trả về tình trạng sức khỏe cụm |
| `/opt/unetlab/html/main/js/clusters.js` | `updateHostStatusHUD()` | Hiển thị chấm tròn xanh/đỏ trạng thái host |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Chu kỳ thời gian `time() - last_seen > 15s`.
- **Output**: Cập nhật trạng thái host sang `Offline` và gửi alert tới Web UI.
- **Edge Cases**: Vệ tinh bị nghẽn mạng tạm thời 10s rồi có lại -> Hệ thống tự xóa cảnh báo và phục hồi trạng thái bình thường.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f30-cluster-health-failover-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f30-cluster-health-failover-sequence.md)
