---
title: "Level 1 — Nhóm 08: Thẩm định & Chấm điểm Lab Tự động"
group_id: "G08"
group_name: "Lab Validation & Automated Assessment Engine"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 1"
---

# NHÓM 08: THẨM ĐỊNH & CHẤM ĐIỂM LAB TỰ ĐỘNG (LAB VALIDATION & AUTOMATED ASSESSMENT ENGINE)

## 1. Mục đích của Nhóm Tính năng

Nhóm **Thẩm định & Chấm điểm Lab Tự động** là hệ thống khảo sát, kiểm tra và chấm điểm tự động các bài thực hành mạng dành cho giảng viên, trung tâm đào tạo và doanh nghiệp sát hạch kỹ năng:
1. **Định nghĩa Bộ Tiêu chí Đánh giá Linh hoạt (Task & Validation Rules Definition)**: Cho phép tác giả bài lab định nghĩa danh sách các nhiệm vụ (Tasks) cần hoàn thành trong file XML của bài lab. Mỗi task gắn liền với một hoặc nhiều tiêu chí kiểm tra (ví dụ: Router A phải ping thông Router B; VLAN 10 phải được tạo trên Switch; OSPF Neighbor phải ở trạng thái FULL).
2. **Động cơ Chạy Thăm dò Trực tiếp (Live Probe Engine - `lab_validation_probe.php`)**: Khi người dùng nhấn nút "Kiểm tra bài lab" (Validate Lab), động cơ sẽ kích hoạt các bài kiểm tra chạy đồng thời hoặc tuần tự đối chiếu với thiết bị thật đang chạy.
3. **Kênh Vận chuyển & Thực thi Lệnh Tự động (`pnet_validation_transport.py`)**: Mở kênh Telnet/SSH/API trực tiếp vào thiết bị đang chạy trong lab, gửi các lệnh kiểm tra cấu hình (`show ip interface brief`, `show ip route`, `show run`), bóc tách kết quả đầu ra bằng Regex (Regular Expressions) hoặc khớp chuỗi chính xác để xác minh cấu hình.
4. **Lưu trữ Kết quả & Chấm điểm Theo Thời gian (Validation Store & Progress Reporting)**: Lưu lại toàn bộ lịch sử các lần kiểm tra, tính toán tổng số điểm đạt được (Score), tỷ lệ hoàn thành (%) và hiển thị trực quan lên giao diện người dùng (`validate.js`).

---

## 2. Danh sách Toàn bộ Tính năng Con Thuộc Nhóm (Dẫn tới Level 2)

Dưới đây là 4 tính năng con độc lập thuộc Nhóm 08, được đặc tả chi tiết tại thư mục `02-features/lab-validation/`:

| Mã tính năng | Tên tính năng con | File tài liệu Level 2 | Tóm tắt Chức năng |
| :---: | :--- | :--- | :--- |
| **F44** | **Định nghĩa Nhiệm vụ & Cấu trúc Tiêu chí Lab (Task Definition)** | [`F44-validation-task-definition.md`](../02-features/lab-validation/F44-validation-task-definition.md) | Cấu trúc thẻ `<tasks>` trong file `.unl`, định nghĩa trọng số điểm, câu lệnh kiểm tra và điều kiện đạt |
| **F45** | **Động cơ Thực thi Kiểm tra Tự động (Probe Engine)** | [`F45-validation-probe-engine.md`](../02-features/lab-validation/F45-validation-probe-engine.md) | Vận hành của `lab_validation_probe.php`: Phân loại probe (ICMP ping, Port check, CLI regex matching) |
| **F46** | **Kênh Giao tiếp Thực thi Lệnh CLI (Transport Executor)** | [`F46-validation-transport-executor.md`](../02-features/lab-validation/F46-validation-transport-executor.md) | Kịch bản `pnet_validation_transport.py`: Đăng nhập Telnet/SSH vào node, gửi lệnh và hứng output |
| **F47** | **Lưu trữ Điểm số & Báo cáo Tiến độ (Validation Store & UI)** | [`F47-validation-score-report.md`](../02-features/lab-validation/F47-validation-score-report.md) | Lưu kết quả vào `lab_validation_store.php`, hiển thị checklist task hoàn thành và thanh % tiến độ trên UI |

---

## 3. Các Module & File Mã nguồn Chịu trách nhiệm Chính

| Đường dẫn File / Thư mục | Ngôn ngữ / Loại | Vai trò chính |
| :--- | :--- | :--- |
| [`html/includes/lab_validation_probe.php`](../../html/includes/lab_validation_probe.php) | PHP (34KB) | Động cơ điều phối và phân tích các bài kiểm tra validation |
| [`html/includes/lab_validation_store.php`](../../html/includes/lab_validation_store.php) | PHP (36KB) | Tầng lưu trữ kết quả kiểm tra, chấm điểm và tính toán lịch sử |
| [`html/includes/lab_tasks_unl.php`](../../html/includes/lab_tasks_unl.php) | PHP | Trích xuất và cập nhật các thẻ `<tasks>` trong file `.unl` |
| [`scripts/pnet_validation_transport.py`](../../scripts/pnet_validation_transport.py) | Python | Kênh vận chuyển kết nối dòng lệnh Telnet/SSH vào thiết bị ảo |
| [`html/themes/default/js/validate.js`](../../html/themes/default/js/validate.js) | JavaScript | Giao diện thanh tiến độ hoàn thành, danh sách task và nút "Check Lab" |

---

## 4. Sơ đồ Component Diagram (C4 Level 3: Lab Validation Engine)

```mermaid
flowchart TD
    %% Styling classes
    classDef ui fill:#1f6feb,stroke:#58a6ff,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef api fill:#238636,stroke:#3fb950,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef wrap fill:#d29922,stroke:#f0883e,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef kernel fill:#8957e5,stroke:#a371f7,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef storage fill:#21262d,stroke:#8b949e,stroke-width:1.5px,color:#c9d1d9,rx:6px,ry:6px;

    subgraph SG_student_ui [" 📦 Giao diện Học viên / Thí sinh (Browser) "]
        direction TB
        validate_ui["<b>validate.js</b><br/><i>(Validation Dashboard)</i><br/>Hiển thị danh sách câu hỏi, số điểm đạt/tổng điểm, nút 'Check My Lab'"]:::ui
    end

    subgraph SG_validation_backend [" 📦 Tầng Backend Chấm điểm (PHP) "]
        direction TB
        task_parser["<b>lab_tasks_unl.php</b><br/><i>(Task XML Parser)</i><br/>Đọc danh sách tiêu chí kiểm tra từ file .unl của bài lab"]:::api
        probe_engine["<b>lab_validation_probe.php</b><br/><i>(Validation Probe Engine)</i><br/>Lập lịch thực thi các bài kiểm tra đối chiếu"]:::api
        score_store["<b>lab_validation_store.php</b><br/><i>(Score Storage Service)</i><br/>Lưu điểm số vào tệp JSON phiên người dùng"]:::api
    end

    subgraph SG_probe_executor [" 📦 Tầng Thực thi Probe Ngoại vi (Python) "]
        direction TB
        transport_py["<b>pnet_validation_transport.py</b><br/><i>(CLI Transport Worker)</i><br/>Tự động Telnet/SSH vào console port của thiết bị"]:::wrap
    end

    subgraph SG_running_devices [" 📦 Thiết bị Đang Chạy trong Lab "]
        direction TB
        target_node["<b>Virtual Router / Switch</b><br/><i>(Console TCP Port)</i><br/>Tiếp nhận lệnh 'show ip route', trả về kết quả cấu hình"]:::kernel
    end

    %% Quan hệ giữa các thành phần
    validate_ui -->|"POST /api/labs/session/validate<br/><i>[Yêu cầu chấm điểm]</i>"| probe_engine
    probe_engine -->|"Lấy danh sách câu hỏi và quy tắc<br/><i>[getLabTasks()]</i>"| task_parser
    probe_engine -->|"Thực thi kiểm tra<br/><i>[python3 pnet_validation_transport.py --host 127.0.0.1 --port ... --cmd ...]</i>"| transport_py
    transport_py -->|"Telnet Socket / SSH<br/><i>[show running-config]</i>"| target_node
    target_node -->|"Trả về văn bản CLI output<br/><i>[interface GigabitEthernet0/0...]</i>"| transport_py
    transport_py -->|"Trả kết quả text<br/><i>[stdout JSON]</i>"| probe_engine
    probe_engine -->|"So khớp Regex và lưu điểm<br/><i>[storeResult(taskId, PASS/FAIL, score)]</i>"| score_store
    score_store -->|"Trả về kết quả chấm<br/><i>[JSON: {score: 80, total: 100, tasks: [...]}]</i>"| validate_ui
```

---

> 👉 **Xem chi tiết từng tính năng con**:
> 1. [`F44-validation-task-definition.md`](../02-features/lab-validation/F44-validation-task-definition.md) — Định nghĩa Nhiệm vụ & Cấu trúc Tiêu chí Lab (Task Definition)
> 2. [`F45-validation-probe-engine.md`](../02-features/lab-validation/F45-validation-probe-engine.md) — Động cơ Thực thi Kiểm tra Tự động (Probe Engine)
> 3. [`F46-validation-transport-executor.md`](../02-features/lab-validation/F46-validation-transport-executor.md) — Kênh Giao tiếp Thực thi Lệnh CLI (Transport Executor)
> 4. [`F47-validation-score-report.md`](../02-features/lab-validation/F47-validation-score-report.md) — Lưu trữ Điểm số & Báo cáo Tiến độ (Validation Store & UI)
