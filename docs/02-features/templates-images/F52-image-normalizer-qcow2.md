---
title: "Level 2 — F52: Bộ Chuẩn hóa Tên & Chuyển đổi Đĩa Ảo (Image Normalizer)"
feature_id: "F52"
feature_group: "09-templates-images"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F52: BỘ CHUẨN HÓA TÊN & CHUYỂN ĐỔI ĐĨA ẢO (IMAGE NORMALIZER)

## 1. Mô tả Tính năng
- **Mục đích**: Tự động phát hiện và khắc phục các lỗi phổ biến khi người dùng tự tải image từ bên ngoài vào: Tên thư mục sai quy cách (không đúng tiền tố template yêu cầu), tên file đĩa ảo không đúng chuẩn PNetLab (phải là `virtioa.qcow2`), hoặc file đĩa đang ở định dạng không tối ưu của VMware (`.vmdk`) hoặc ISO cần chuyển đổi sang định dạng nén QCOW2 tối ưu cho KVM.
- **Đối tượng sử dụng**: Quản trị viên cài đặt image thủ công.
- **Thời điểm kích hoạt**: Khi truy cập công cụ "Normalize Images" hoặc gọi API `image_normalize.php`.

## 2. Cơ chế Chạy (Mechanism)
1. **Kiểm tra Quy tắc Đặt tên Thư mục (Naming Convention Verification)**:
   - `image_normalize.php` duyệt qua các thư mục trong `/opt/unetlab/addons/qemu/`.
   - Phân tích cú pháp: Tên thư mục bắt buộc phải có dạng `<template_prefix>-<version_name>` (ví dụ `csr1000v-universalk9.17.03`).
   - Nếu thư mục đặt sai (ví dụ `Cisco_Router/`), hệ thống tự đề xuất đổi tên thành `csr1000v-custom/`.
2. **Kiểm tra và Chuyển đổi Định dạng Đĩa Ảo**:
   - Nếu phát hiện file có đuôi `.vmdk` hoặc `.raw`:
   - Hệ thống thực thi công cụ dòng lệnh:
     ```bash
     /usr/bin/qemu-img convert -f vmdk -O qcow2 disk.vmdk virtioa.qcow2
     ```
   - Xóa bỏ file VMDK cũ sau khi chuyển đổi thành công để tiết kiệm dung lượng đĩa cứng.
3. **Đổi tên File Đĩa Đạt Chuẩn**:
   - Nếu trong thư mục có file tên `hda.qcow2` hoặc `system.qcow2`, kịch bản tự động đổi tên thành `virtioa.qcow2` để wrapper nhận diện đúng bus virtio tốc độ cao.

## 3. Công nghệ & Cơ sở Sử dụng
- **QEMU Disk Image Utility (`qemu-img`)**: Công cụ chuyển đổi và tối ưu hóa các định dạng đĩa máy ảo chuẩn công nghiệp.
- **Regex Pattern Normalization**: Quy tắc kiểm tra chuỗi định danh thư mục.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`html/ishare2/image_normalize.php`](../../../html/ishare2/image_normalize.php) | PHP Script | Logic kiểm tra và chuẩn hóa image |
| `/usr/bin/qemu-img` | Linux Binary | Công cụ chuyển đổi đĩa ảo sang qcow2 |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Thư mục `/opt/unetlab/addons/qemu/fortinet-v7.0/` chứa file `image.vmdk`.
- **Output**: File `virtioa.qcow2` được tạo ra, file `.vmdk` bị xóa, thư mục sẵn sàng khởi chạy.
- **Edge Cases**: File VMDK bị lỗi phân vùng hỏng -> `qemu-img` báo lỗi, kịch bản giữ nguyên file gốc và ghi cảnh báo vào log.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f52-image-normalizer-qcow2-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f52-image-normalizer-qcow2-sequence.md)
