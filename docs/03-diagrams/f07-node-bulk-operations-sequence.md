---
title: "Level 3 — Sequence Diagram: F07 Thao tác Node Hàng loạt"
diagram_type: "sequence"
feature_id: "F07"
---

# SƠ ĐỒ TRÌNH TỰ (SEQUENCE DIAGRAM): F07 - BULK OPERATIONS

```mermaid
sequenceDiagram
    autonumber
    actor User as Kỹ sư Mạng
    participant Actions as actions.js (staggeredPoolRun)
    participant Life as lifecycle.js: start(id)
    participant API as api.php
    participant NodesAPI as api_nodes.php: apiStartLabNode()
    participant Broker as pnetlab-brokerd (Unix Socket)

    User->>Actions: Bấm menu "Start all nodes" (.action-nodesstart)
    Actions->>Actions: Thu thập danh sách ID node trong lab
    Actions->>Actions: Khởi tạo pool worker (concurrency=2, stagger=800ms)
    loop Xử lý tuần tự theo batch qua worker
        Actions->>Life: start(node_1)
        Note over Actions: Giãn cách 800ms trước thunk tiếp theo
        Life->>API: POST /api/labs/session/nodes/start {id: 1}
        API->>NodesAPI: apiStartLabNode($lab, 1, $tenant)
        NodesAPI->>Broker: node_wrapper_exec(start) via IPC
        Broker-->>NodesAPI: rc = 0 (Thành công)
        NodesAPI-->>API: code: 200, status: 'success'
        API-->>Life: HTTP 200 JSON
        Life->>Life: Cập nhật icon node 1 sang Running & Refresh Topology
        Actions->>Life: start(node_2)
        Life->>API: POST /api/labs/session/nodes/start {id: 2}
        API->>NodesAPI: apiStartLabNode($lab, 2, $tenant)
        NodesAPI->>Broker: node_wrapper_exec(start) via IPC
        Broker-->>NodesAPI: rc = 0
        NodesAPI-->>API: code: 200, status: 'success'
        API-->>Life: HTTP 200 JSON
        Life->>Life: Cập nhật icon node 2 sang Running & Refresh Topology
    end
    Actions-->>User: Hoàn tất khởi động toàn bộ danh sách node
```
