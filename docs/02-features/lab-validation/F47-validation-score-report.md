---
title: "Level 2 — F47: Lưu trữ Điểm số & Báo cáo Tiến độ (Validation Store & UI)"
feature_id: "F47"
feature_group: "08-lab-validation"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F47: LƯU TRỮ ĐIỂM SỐ & BÁO CÁO TIẾN ĐỘ (VALIDATION STORE & UI)

## 1. Mô tả Tính năng
- **Mục đích**: Lưu trữ bền vững lịch sử kết quả chấm điểm của từng học viên qua các lần kiểm tra, tính toán tỷ lệ phần trăm hoàn thành bài lab, lưu giữ các vết lỗi cấu hình để học viên xem lại, và cung cấp bảng tổng hợp điểm thi cho giảng viên xuất ra file báo cáo Excel / CSV.
- **Đối tượng sử dụng**: Học viên xem tiến độ, Giảng viên quản lý điểm lớp học.
- **Thời điểm kích hoạt**: Tự động lưu sau mỗi lần thực hiện kiểm tra bài lab.

## 2. Cơ chế Chạy (Mechanism)
1. **Lưu trữ Kết quả Kiểm tra (`lab_validation_store.php` - 36KB)**:
   - Dữ liệu điểm số được gắn liền với cặp khóa: `user_id` + `lab_session_id`.
   - Lưu trữ bản ghi điểm chi tiết vào file JSON hoặc bảng cơ sở dữ liệu:
     - Điểm tổng hiện tại (`current_score`) và Điểm tối đa (`max_score`).
     - Trạng thái của từng câu hỏi: `PASS`, `FAIL`, số lần thử (`attempt_count`), thời gian kiểm tra gần nhất (`timestamp`).
     - Lịch sử thay đổi điểm số theo dòng thời gian (Score progression timeline).
2. **Hiển thị Bảng Điểm Tương tác trên UI (`validate.js`)**:
   - Vẽ thanh tiến độ động (Dynamic Progress Bar) từ 0% đến 100%.
   - Danh sách các câu hỏi với biểu tượng trực quan: Dấu tích xanh cho câu đã Pass, Dấu nhân đỏ cho câu bị Fail.
   - Nhấn vào câu bị Fail sẽ mở rộng phần giải thích nguyên nhân và gợi ý cấu hình khắc phục.
3. **Cơ chế Chống Gian lận (Anti-Cheat & Rate Limit)**:
   - Áp dụng giới hạn tần suất bấm kiểm tra (ví dụ: mỗi lần kiểm tra phải cách nhau tối thiểu 10 giây) để tránh học viên spam script kiểm tra làm quá tải máy chủ.

## 3. Công nghệ & Cơ sở Sử dụng
- **JSON Structured Persistence**: Lưu trữ báo cáo đánh giá linh hoạt không phụ thuộc cấu trúc bảng cố định.
- **Animated SVG Progress Rings**: Vẽ vòng tròn phần trăm điểm số ấn tượng trên giao diện.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/includes/lab_validation_store.php`](../../../opt/unetlab/html/includes/lab_validation_store.php)](../../../html/includes/lab_validation_store.php) | `LabValidationStore`, `saveScore()`, `getScore()` | Tầng lưu trữ và tính toán điểm số (36KB) |
| [`/opt/unetlab/html/themes/default/js/validate.js`](../../../opt/unetlab/html/themes/default/js/validate.js)](../../../html/themes/default/js/validate.js) | `renderScoreboard()`, `updateProgressBar()` | Giao diện hiển thị bảng điểm |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Mảng kết quả sau khi chạy probe.
- **Output**: Cập nhật thanh tiến độ đạt 80% (4/5 tasks passed).
- **Edge Cases**: Học viên bấm kiểm tra liên tục nhiều lần trong 1 giây -> Trả về cảnh báo `Please wait 10 seconds before checking again (Rate limit)`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f47-validation-score-report-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f47-validation-score-report-sequence.md)
