---
title: "Level 2 — F44: Định nghĩa Nhiệm vụ & Cấu trúc Tiêu chí Lab (Task Definition)"
feature_id: "F44"
feature_group: "08-lab-validation"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F44: ĐỊNH NGHĨA NHIỆM VỤ & CẤU TRÚC TIÊU CHÍ LAB (TASK DEFINITION)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp cấu trúc dữ liệu cho phép giảng viên hoặc người tạo đề thi định nghĩa danh sách các nhiệm vụ kiểm tra (Tasks) bên trong file XML `.unl` của bài lab. Mỗi nhiệm vụ bao gồm: Tiêu đề bài tập, Hướng dẫn, Điểm số tối đa, Câu lệnh kiểm tra cần thực thi trên thiết bị, và Biểu thức chính quy (Regex) hoặc điều kiện logic để đối chiếu kết quả đạt (Pass) hay trượt (Fail).
- **Đối tượng sử dụng**: Giảng viên, Chuyên gia ra đề thi sát hạch chứng chỉ.
- **Thời điểm kích hoạt**: Khi tác giả thiết kế bài lab soạn thảo bộ đề bài thực hành.

## 2. Cơ chế Chạy (Mechanism)
1. **Cấu trúc Thẻ XML `<tasks>` trong File `.unl`**:
   - `lab_tasks_unl.php` định nghĩa schema cho khối `<tasks>`:
     ```xml
     <tasks>
       <task id="1" points="20" name="Cấu hình OSPF trên R1">
         <description>Cấu hình OSPF Process 1 và quảng bá mạng 10.1.1.0/24 vào Area 0</description>
         <node_id>1</node_id>
         <command>show ip ospf interface brief</command>
         <match_type>regex</match_type>
         <pattern>GigabitEthernet0/0\s+1\s+0\s+10\.1\.1\.1/24</pattern>
         <success_msg>R1 đã tham gia OSPF Area 0 chính xác!</success_msg>
         <fail_msg>Chưa tìm thấy interface trong OSPF Area 0.</fail_msg>
       </task>
     </tasks>
     ```
2. **Quản lý Thao tác CRUD Tasks**:
   - Backend cung cấp các hàm `getLabTasks()`, `saveLabTasks()`, `addTask()`, `deleteTask()` để chỉnh sửa trực tiếp danh sách câu hỏi kiểm tra.
3. **Mã hóa An toàn Tiêu chí**:
   - Các biểu thức regex và câu lệnh kiểm tra được lưu trữ an toàn trong XML để học viên không thể xem trước đáp án khi chỉ mở giao diện Canvas thông thường.

## 3. Công nghệ & Cơ sở Sử dụng
- **XML Schema Extensibility**: Mở rộng định dạng UNetLab gốc mà vẫn giữ tương thích ngược.
- **Regular Expressions (PCRE)**: Cung cấp độ linh hoạt tối đa trong việc bắt các mẫu cú pháp cấu hình mạng phức tạp.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/html/includes/lab_tasks_unl.php`](../../../opt/unetlab/html/includes/lab_tasks_unl.php)](../../../html/includes/lab_tasks_unl.php) | `class LabTasks`, `getTasks()`, `setTasks()` | Phân tích và quản lý thẻ `<tasks>` |
| [`/opt/unetlab/html/includes/__lab.php`](../../../opt/unetlab/html/includes/__lab.php)](../../../html/includes/__lab.php) | `Lab::getTasks()` | Tích hợp vào đối tượng Lab chính |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Chuỗi XML hoặc mảng JSON định nghĩa danh sách tasks.
- **Output**: Lưu trữ thành công vào file `.unl` của bài lab.
- **Edge Cases**: Cú pháp Regex của câu hỏi bị sai (Invalid PCRE) -> `lab_tasks_unl.php` kiểm tra bằng `preg_match()` trước khi lưu, ném lỗi `Invalid regex pattern in task definition`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f44-validation-task-definition-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f44-validation-task-definition-sequence.md)
