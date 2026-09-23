---
title: "Level 2 — F65: Quản lý Nguồn & Vệ sinh Dữ liệu Rác (Power & Maintenance)"
feature_id: "F65"
feature_group: "12-system-platform"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F65: QUẢN LÝ NGUỒN & VỆ SINH DỮ LIỆU RÁC (POWER & MAINTENANCE)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp các thao tác quản trị hạ tầng phần cứng cấp cao từ giao diện web: Khởi động lại máy chủ (System Reboot), Tắt máy chủ an toàn (Shutdown), và Dọn dẹp rác hệ thống (System Cleanup / Wipe All Temporary Files) xóa bỏ toàn bộ các file đĩa ảo mồ côi, file socket treo và dọn dẹp cgroups rác giải phóng 100% tài nguyên máy chủ.
- **Đối tượng sử dụng**: Quản trị viên máy chủ vật lý.
- **Thời điểm kích hoạt**: Khi cần bảo trì phần cứng, cập nhật kernel hoặc giải phóng ổ cứng bị đầy.

## 2. Cơ chế Chạy (Mechanism)
1. **Lệnh Quản Trị Nguồn (Reboot / Shutdown)**:
   - Gửi `POST /system/api.php?action=reboot` hoặc `shutdown`.
   - Backend kiểm tra quyền Admin tối cao.
   - Ghi nhật ký vào `activity_log`.
   - Gọi lệnh đặc quyền: `sudo /sbin/reboot` hoặc `sudo /sbin/poweroff`.
2. **Kịch bản Dọn Dẹp Rác Toàn Diện (`clean.sh`)**:
   - Khi chọn "System Cleanup": Backend gọi kịch bản [`scripts/clean.sh`](../../../scripts/clean.sh).
   - Kịch bản dừng an toàn tất cả các tiến trình hypervisor còn sót lại (`killall -9 qemu-system-x86_64 i386-exec dynamips`).
   - Xóa bỏ toàn bộ các thư mục tạm: `rm -rf /opt/unetlab/tmp/*`.
   - Xóa các card mạng ảo mồ côi: Gỡ bỏ tất cả các bridge `br-*` và card `tap*`.
   - Dọn dẹp cgroups rác qua các script `remove-empty-cpu-cgroup.sh` và `remove-empty-memory-cgroup.sh`.
   - Xóa bộ đệm RAM hệ thống: `echo 3 > /proc/sys/vm/drop_caches`.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Sudoers Nopasswd Elevation**: Cấu hình sudoers cho phép người dùng www-data thực thi danh sách lệnh quản trị nguồn được kiểm soát chặt chẽ.
- **Linux Kernel Cache Dropping**: Giải phóng PageCache, Dentries và Inodes.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`html/system/api.php`](../../../html/system/api.php) | PHP API | Endpoint tiếp nhận lệnh Reboot, Shutdown, Clean |
| [`scripts/clean.sh`](../../../scripts/clean.sh) | Shell Script | Kịch bản dọn dẹp toàn bộ dữ liệu tạm và tiến trình treo |
| [`html/main/js/system.js`](../../../html/main/js/system.js) | JavaScript | Giao diện điều khiển nút bấm bảo trì hệ thống |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `POST /system/api.php?action=clean`.
- **Output**: `{ "code": 200, "status": "success", "message": "System cleanup completed" }`.
- **Edge Cases**: Người dùng thường gọi API Reboot -> Bị từ chối ngay với mã lỗi `403 Forbidden: Administrator role required`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f65-system-power-maintenance-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f65-system-power-maintenance-sequence.md)
