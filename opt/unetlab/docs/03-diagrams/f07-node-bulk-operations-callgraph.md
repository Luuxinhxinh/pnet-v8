---
title: "Level 3 — Call Graph: F07 Thao tác Node Hàng loạt"
diagram_type: "callgraph"
feature_id: "F07"
---

# SƠ ĐỒ GỌI HÀM (CALL GRAPH): F07 - BULK OPERATIONS

```mermaid
graph TD
    UI["actions.js: startAllNodes()"] -->|HTTP POST| API["api.php: /nodes/start (array)"]
    API --> CONTROLLER["api_nodes.php: apiNodesStart()"]
    CONTROLLER --> QUEUE["Tạo hàng đợi danh sách Node IDs"]
    QUEUE --> LOOP["Vòng lặp foreach(node_id in queue)"]
    LOOP --> SLEEP["Giãn cách thời gian (usleep 500ms)"]
    LOOP --> CALL_START["functions.php: nodeStart(node_id)"]
    CALL_START --> SSE_BROADCAST["Phát SSE thông báo node vừa chạy"]
    LOOP --> AGGREGATE["Tổng hợp kết quả Success / Failed"]
    AGGREGATE --> RESP["Trả về JSON tổng quan kết quả"]
```
