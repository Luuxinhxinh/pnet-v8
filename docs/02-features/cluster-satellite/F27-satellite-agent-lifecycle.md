---
title: "Level 2 — F27: Đăng ký & Quản lý Vòng đời Vệ tinh (Satellite Agent Lifecycle)"
feature_id: "F27"
feature_group: "05-cluster-satellite"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F27: ĐĂNG KÝ & QUẢN LÝ VÒNG ĐỜI VỆ TINH (SATELLITE AGENT LIFECYCLE)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép biến một máy chủ vật lý mới thành một Node Vệ tinh (Satellite) của cụm PNetLab bằng kịch bản kết nạp tự động (`pnet-satellite-join`), tự động cấp chứng chỉ bảo mật, khởi chạy daemon `pnetlab-satd.py` và đồng bộ tài nguyên với máy chủ Master.
- **Đối tượng sử dụng**: Quản trị viên hệ thống mở rộng phần cứng.
- **Thời điểm kích hoạt**: Khi thiết lập thêm máy chủ vệ tinh mới vào cụm.

## 2. Cơ chế Chạy (Mechanism)
1. **Khởi tạo Lệnh Tham gia Cụm (Join Command)**:
   - Trên máy chủ vệ tinh, quản trị viên gõ: `pnet-satellite-join --master <master_ip> --token <cluster_token>`.
2. **Quy trình Bắt tay & Chứng thực (Handshake & PKI)**:
   - Vệ tinh gửi yêu cầu tới API `/pki/api.php` của Master.
   - Master sinh cặp khóa và chứng chỉ số X.509 ký bởi Root CA nội bộ, gửi trả lại vệ tinh.
   - Vệ tinh lưu chứng chỉ tại `/etc/pnetlab/pki/satellite.crt` và `/etc/pnetlab/pki/satellite.key`.
3. **Kích hoạt Dịch vụ Vệ tinh (`pnetlab-satd`)**:
   - Kịch bản kích hoạt service systemd: `systemctl enable --now pnetlab-satd`.
   - Daemon `pnetlab-satd.py` mở kết nối bảo mật mTLS lâu dài (Keep-alive) về cổng 8088 của Master Broker.
4. **Chu kỳ Nhịp tim & Đo Tải (Heartbeat & Telemetry Loop)**:
   - Cứ mỗi 3 giây, daemon vệ tinh gửi gói tin heartbeat chứa thông số tải CPU hiện tại (%), RAM khả dụng (MB), dung lượng đĩa và số lượng node đang chạy về Master.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Systemd Service**: Quản lý daemon tự động khởi động cùng hệ thống và tự phục hồi khi crash.
- **X.509 Certificate Generation**: Mã hóa bảo mật đảm bảo chỉ các vệ tinh được cấp phép mới được kết nối.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/scripts/pnet-satellite-join`](../../../opt/unetlab/scripts/pnet-satellite-join)](../../../scripts/pnet-satellite-join) | Shell Script | Kịch bản dòng lệnh thực hiện quy trình join |
| [`[`/opt/unetlab/scripts/pnetlab-satd.py`](../../../opt/unetlab/scripts/pnetlab-satd.py)](../../../scripts/pnetlab-satd.py) | Python (14KB) | Daemon chạy trên vệ tinh để nhận lệnh |
| [`[`/opt/unetlab/html/cluster/api.php`](../../../opt/unetlab/html/cluster/api.php)](../../../html/cluster/api.php) | PHP | API tiếp nhận đăng ký vệ tinh trên Master |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input CLI**: `pnet-satellite-join --master 192.168.1.10 --token SECRET123`
- **Output**: `Satellite joined successfully. Daemon pnetlab-satd running.`
- **Edge Cases**: Token sai hoặc Master không thể kết nối -> Kịch bản hủy tiến trình và in ra hướng dẫn kiểm tra Firewall/UFW.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f27-satellite-agent-lifecycle-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f27-satellite-agent-lifecycle-sequence.md)
