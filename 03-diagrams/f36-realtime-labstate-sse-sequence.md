---
title: "Level 3 — Sequence Diagram: F36 Kênh Đẩy Trạng thái Lab Thời gian thực qua SSE"
diagram_type: "sequence"
feature_id: "F36"
---

# SƠ ĐỒ TRÌNH TỰ (SEQUENCE DIAGRAM): F36 - REALTIME LABSTATE SSE

```mermaid
sequenceDiagram
    autonumber
    actor User as Kỹ sư Mạng
    participant Browser as Browser (pnetlab-labstate-client.js)
    participant Daemon as pnetlab-labstated.py
    participant Wrapper as unl_wrapper.php (Backend)

    Browser->>Daemon: GET /events/labstate?lab=CCNA (Accept: text/event-stream)
    Daemon-->>Browser: HTTP 200 OK (Content-Type: text/event-stream)
    Note over Browser,Daemon: Kết nối giữ mở liên tục (Keep-Alive)
    Wrapper->>Daemon: Node 1 khởi động thành công (Unix socket event)
    Daemon->>Browser: Gửi frame: "event: node_state
data: {id: 1, status: 2}

"
    Browser->>Browser: Bắt sự kiện và đổi màu icon Router 1 sang Xanh
    User->>User: Nhìn thấy thiết bị chuyển trạng thái ngay trên màn hình
```
