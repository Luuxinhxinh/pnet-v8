---
title: "Level 3 — Sequence Diagram: F46 Kênh Giao tiếp Thực thi Lệnh CLI"
diagram_type: "sequence"
feature_id: "F46"
---

# SƠ ĐỒ TRÌNH TỰ (SEQUENCE DIAGRAM): F46 - TRANSPORT EXECUTOR

```mermaid
sequenceDiagram
    autonumber
    participant Probe as lab_validation_probe.php
    participant Trans as pnet_validation_transport.py
    participant Node as Router Console Port (TCP 32769)

    Probe->>Trans: python3 pnet_validation_transport.py --port 32769 --cmd "show ip bgp summary"
    Trans->>Node: Mở Telnet Socket tới 127.0.0.1:32769
    Trans->>Node: Gửi ký tự Enter (
)
    Node-->>Trans: Trả về dấu nhắc "R1>"
    Trans->>Node: Gửi lệnh "enable
"
    Node-->>Trans: Trả về dấu nhắc "R1#"
    Trans->>Node: Gửi lệnh "terminal length 0
"
    Trans->>Node: Gửi lệnh "show ip bgp summary
"
    Node-->>Trans: Trả về danh sách BGP Neighbor và State
    Trans->>Trans: Lọc bỏ mã điều khiển ký tự terminal ANSI
    Trans-->>Probe: Chuỗi JSON chứa toàn bộ output sạch
```
