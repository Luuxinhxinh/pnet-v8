---
title: "Level 2 — F66: Tối ưu Hóa Bộ nhớ RAM qua Linux KSM (KSM Memory Tuning)"
feature_id: "F66"
feature_group: "12-system-platform"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F66: TỐI ƯU HÓA BỘ NHỚ RAM QUA LINUX KSM (KSM MEMORY TUNING)

## 1. Mô tả Tính năng
- **Mục đích**: Tận dụng tính năng khử trùng lặp trang nhớ (Kernel Samepage Merging - KSM) của Linux Kernel để quét tìm các trang nhớ RAM có nội dung giống hệt nhau giữa hàng chục máy ảo QEMU/IOL đang chạy (ví dụ 20 router Cisco chạy cùng 1 hệ điều hành IOS-XE thì 80% mã lệnh trong RAM là hoàn toàn giống nhau) và gộp chúng lại thành 1 trang nhớ vật lý duy nhất ở chế độ Copy-On-Write (COW). Tính năng này giúp máy chủ PNet v8 có thể chạy được số lượng máy ảo gấp 2 đến 3 lần dung lượng RAM vật lý thực tế.
- **Đối tượng sử dụng**: Quản trị viên hệ thống tối ưu hiệu năng máy chủ.
- **Thời điểm kích hoạt**: Dịch vụ `pnetlab-ksm.service` khởi động cùng máy và script `pnetlab-ksm-tune.sh`.

## 2. Cơ chế Chạy (Mechanism)
1. **Kích hoạt KSM Daemon Tầng Kernel**:
   - Dịch vụ kích hoạt cờ KSM trong nhân Linux: `echo 1 > /sys/kernel/mm/ksm/run`.
2. **Kích hoạt Vùng Nhớ Có thể Gộp (`ksm_merge_exec`)**:
   - Khi QEMU khởi chạy máy ảo: Tiện ích C [`/opt/unetlab/wrappers/ksm_merge_exec`](../../../opt/unetlab/wrappers/ksm_merge_exec)](../../../wrappers/ksm_merge_exec) gọi hàm hệ thống `madvise(addr, length, MADV_MERGEABLE)` để đánh dấu vùng bộ nhớ RAM ảo của node được phép cho kernel quét gộp.
3. **Thuật toán Tinh chỉnh Thông số Tự động (`pnetlab-ksm-tune.sh`)**:
   - Kịch bản tự động điều chỉnh tốc độ quét dựa trên tổng dung lượng RAM của máy chủ:
     - `/sys/kernel/mm/ksm/pages_to_scan`: Số trang nhớ quét trong 1 chu kỳ (ví dụ 1000 trang).
     - `/sys/kernel/mm/ksm/sleep_millisecs`: Thời gian nghỉ giữa các chu kỳ quét (ví dụ 20ms).
4. **Theo dõi Hiệu quả Tiết kiệm RAM**:
   - Đọc tệp `/sys/kernel/mm/ksm/pages_sharing`:
     $$	ext{RAM\_Saved\_MB} = rac{	ext{pages\_sharing} 	imes 4096}{1024 	imes 1024}$$
   - Hiển thị trực tiếp con số dung lượng RAM đã tiết kiệm được lên thanh điều hướng của PNetLab (ví dụ: *"KSM Saved: 14.8 GB"*).

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Kernel Samepage Merging (KSM)**: Công nghệ ảo hóa bộ nhớ tiên tiến của Linux Kernel từ bản 2.6.32+.
- **POSIX `madvise()` System Call**: Lệnh báo hiệu cho hệ điều hành về hành vi cấp phát bộ nhớ.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`/opt/unetlab/scripts/pnetlab-ksm-tune.sh`](../../../opt/unetlab/scripts/pnetlab-ksm-tune.sh)](../../../scripts/pnetlab-ksm-tune.sh) | Shell Script (2.8KB) | Kịch bản tinh chỉnh thông số KSM theo tải |
| [`/opt/unetlab/wrappers/ksm_merge_exec`](../../../opt/unetlab/wrappers/ksm_merge_exec)](../../../wrappers/ksm_merge_exec) | C Binary (1.5KB) | Binary nhị phân gọi `madvise(MADV_MERGEABLE)` |
| `/etc/default/pnetlab-ksm` | Config file | Tham số cấu hình ngưỡng KSM mặc định |
| `/etc/systemd/system/multi-user.target.wants/pnetlab-ksm.service`| Systemd Service | Quản lý daemon KSM khởi động cùng hệ điều hành |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: Thiết lập tham số KSM: `pages_to_scan = 2000`, `sleep_millisecs = 10`.
- **Output**: Dung lượng RAM trống tăng lên rõ rệt khi khởi động nhiều router giống nhau.
- **Edge Cases**: CPU bị chiếm dụng quá cao do KSM quét liên tục -> Kịch bản `pnetlab-ksm-tune.sh` tự động tăng `sleep_millisecs` lên 50ms để hạ tải CPU cho máy chủ.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f66-ksm-memory-deduplication-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f66-ksm-memory-deduplication-sequence.md)
