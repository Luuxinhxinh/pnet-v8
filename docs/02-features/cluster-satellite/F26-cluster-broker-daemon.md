---
title: "Level 2 — F26: Bộ Điều phối Cụm Trung tâm (Cluster Broker Daemon)"
feature_id: "F26"
feature_group: "05-cluster-satellite"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F26: BỘ ĐIỀU PHỐI CỤM TRUNG TÂM (CLUSTER BROKER DAEMON)

## 1. Mô tả Tính năng
- **Mục đích**: Quản lý tập trung toàn bộ hạ tầng phân tán gồm máy chủ chính (Master) và nhiều máy chủ vệ tinh (Satellites). Daemon `pnetlab-brokerd.py` duy trì các kết nối mTLS thời gian thực, điều phối phân bổ node, giám sát tải phần cứng của từng máy trong cụm, và làm cầu nối chuyển tiếp các lệnh Start/Stop/Wipe từ Web API sang các máy vệ tinh.
- **Đối tượng sử dụng**: Tầng hạ tầng phân tán lõi của PNet v8.
- **Thời điểm kích hoạt**: Khởi động cùng hệ điều hành qua dịch vụ `pnetlab-brokerd.service` và chạy liên tục dưới nền.

## 2. Cơ chế Chạy (Mechanism)
1. **Lắng nghe Cổng Dịch vụ & IPC Socket**:
   - `pnetlab-brokerd.py` (341KB mã nguồn Python) mở Unix Domain Socket tại `/run/pnetlab/broker.sock` để nhận lệnh IPC từ PHP Backend.
   - Đồng thời mở cổng mạng TCP `8088` (hoặc cổng cấu hình) sử dụng SSL/TLS hai chiều (mTLS) để kết nối với các daemon vệ tinh `pnetlab-satd.py`.
2. **Quản lý Vòng đời Kết nối Vệ tinh (Connection Pool)**:
   - Khi vệ tinh khởi động, nó gửi bản tin đăng ký (Registration Handshake) kèm chứng chỉ số và token bảo mật.
   - Broker xác thực với bảng `cluster_hosts` trong MariaDB, nếu hợp lệ sẽ đưa kết nối vào `active_satellites_pool`.
3. **Tiếp nhận & Định tuyến Lệnh**:
   - Khi người dùng bấm Start một node được chỉ định chạy trên vệ tinh `SAT-02`:
   - PHP API gửi bản tin JSON-RPC: `{"method": "node_start", "params": {"sat_id": "SAT-02", "tenant": 0, "node_data": {...}}}` vào Unix Socket `/run/pnetlab/broker.sock`.
   - Broker bóc tách `sat_id`, tìm socket mTLS tương ứng của `SAT-02` trong pool và đẩy lệnh qua mạng.
4. **Nhận Phản hồi & Báo cáo Trạng thái**:
   - Vệ tinh thực thi và trả về PID hoặc thông báo lỗi.
   - Broker cập nhật trạng thái vào cơ sở dữ liệu và thông báo cho Web API.

## 3. Công nghệ & Cơ sở Sử dụng
- **Python Asyncio & Event Loop**: Xử lý hàng nghìn kết nối socket song song không gây block I/O.
- **Mutual TLS (mTLS) Authentication**: Xác thực mã hóa hai chiều bằng chứng chỉ X.509 giữa Master và Satellite.
- **Unix Domain Socket IPC**: Giao tiếp liên tiến trình tốc độ cực cao giữa PHP và Python trên cùng máy chủ Master.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/scripts/pnetlab-brokerd.py`](../../../opt/unetlab/scripts/pnetlab-brokerd.py)](../../../scripts/pnetlab-brokerd.py) | `BrokerServer`, `handle_ipc_command()` | Daemon điều phối cụm trung tâm |
| [`[`/opt/unetlab/html/includes/cluster.php`](../../../opt/unetlab/html/includes/cluster.php)](../../../html/includes/cluster.php) | `broker_send_command()` | Client PHP gửi JSON-RPC qua Unix socket |
| `/etc/systemd/system/multi-user.target.wants/pnetlab-brokerd.service` | Systemd Service | Quản lý tiến trình daemon nền |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input IPC**: `{"action": "start_node", "host_id": 2, "node_id": 10}`
- **Output**: `{"status": "ok", "remote_pid": 48210}`
- **Edge Cases**: Vệ tinh bị đứt cáp mạng giữa chừng -> Broker kích hoạt cơ chế Timeout sau 5 giây, đánh dấu vệ tinh là `Offline` trong DB và báo lỗi `Satellite unreachable`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f26-cluster-broker-daemon-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f26-cluster-broker-daemon-sequence.md)
