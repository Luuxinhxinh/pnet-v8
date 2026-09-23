---
title: "Level 2 — F23: Bộ Chuyển đổi Lab Cisco CML / VIRL (Format Converter)"
feature_id: "F23"
feature_group: "04-lab-management"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F23: BỘ CHUYỂN ĐỔI LAB CISCO CML / VIRL (FORMAT CONVERTER)

## 1. Mô tả Tính năng
- **Mục đích**: Tự động chuyển đổi các bài lab được thiết kế từ phần mềm Cisco Modeling Labs (Cisco CML v2 định dạng YAML) hoặc Cisco VIRL (định dạng `.virl` XML) sang định dạng chuẩn `.unl` của PNet v8.
- **Đối tượng sử dụng**: Kỹ sư mạng có sẵn học liệu từ Cisco CML muốn đưa vào PNetLab để tận dụng tài nguyên cụm máy chủ.
- **Thời điểm kích hoạt**: Khi tải lên một file có đuôi `.yaml`, `.yml` hoặc `.virl` trong trang Import.

## 2. Cơ chế Chạy (Mechanism)
1. **Phát hiện Định dạng Nguồn**:
   - `import/api.php` đọc tiêu đề file tải lên: nếu chứa cú pháp `topology:` và `nodes:` của Cisco CML -> Kích hoạt bộ phân tích CML YAML.
2. **Ánh xạ Mô hình Thiết bị (Device Mapping Matrix)**:
   - Chuyển đổi các định danh node của Cisco sang template PNet tương ứng:
     - `iosv` -> `iol` hoặc `qemu: vios`
     - `iosvl2` -> `iol` (L2 switch) hoặc `qemu: viosl2`
     - `csr1000v` / `cat8000v` -> `qemu: csr1000v`
     - `asav` -> `qemu: asav`
     - `server` / `desktop` -> `qemu: linux` / `docker`
3. **Ánh xạ Cổng & Dây Nối (Interface Translation)**:
   - Chuyển đổi cú pháp cổng Cisco (ví dụ `GigabitEthernet0/0`) sang chỉ số interface integer trong PNet (`0`, `1`, `2`).
   - Tự động sinh các liên kết Point-to-Point Bridge tương ứng.
4. **Trích xuất Cấu hình Khởi tạo (Day-0 Config Extraction)**:
   - Đọc các khối `configuration:` trong file YAML và nhúng vào thẻ `<config>` của node trong file `.unl`.

## 3. Công nghệ & Cơ sở Sử dụng
- **YAML Parser (Symfony YAML / Spyc PHP)**: Đọc và phân tích cú pháp YAML phức tạp của Cisco CML.
- **Interface Naming Heuristics**: Thuật toán quy đổi tên giao diện mạng giữa các hệ điều hành mạng khác nhau.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/html/import/api.php`](../../../opt/unetlab/html/import/api.php)](../../../html/import/api.php) | `convertCmlToUnl()` | Điều phối chuyển đổi file CML sang UNL |
| [`[`/opt/unetlab/html/includes/__lab.php`](../../../opt/unetlab/html/includes/__lab.php)](../../../html/includes/__lab.php) | `buildFromCmlArray()` | Dựng cây đối tượng Lab từ dữ liệu CML |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: File `campus_network.yaml` (Cisco CML v2 export).
- **Output**: File `campus_network.unl` sẵn sàng mở trên Canvas PNet v8.
- **Edge Cases**: File CML sử dụng node loại lạ không có image trên máy chủ -> Tạo node với template tương thích gần nhất kèm cảnh báo trên màn hình.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f23-lab-cml-virl-converter-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f23-lab-cml-virl-converter-sequence.md)
