---
title: "Level 3 — Sequence Diagram: F60 Xác thực Đăng nhập & Quản lý Phiên"
diagram_type: "sequence"
feature_id: "F60"
---

# SƠ ĐỒ TRÌNH TỰ (SEQUENCE DIAGRAM): F60 - AUTH & SESSION

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as Trang Đăng nhập (login.html)
    participant API as api_authentication.php
    participant DB as MariaDB (users)
    participant Audit as activity_log.php

    User->>UI: Nhập username "admin" và mật khẩu
    UI->>API: POST /api/auth (username, password)
    API->>DB: Truy vấn lấy hash mật khẩu
    DB-->>API: $2y$10$e8Z... (Bcrypt hash)
    API->>API: password_verify() -> Khớp hoàn toàn
    API->>Audit: Ghi nhận đăng nhập thành công
    API-->>UI: HTTP 200 OK (Set-Cookie: token=xyz; HttpOnly)
    UI->>User: Chuyển hướng vào màn hình chính Main Dashboard
```
