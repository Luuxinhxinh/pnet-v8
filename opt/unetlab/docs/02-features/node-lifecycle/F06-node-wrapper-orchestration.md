---
title: "Level 2 — F06: Tầng Điều phối Wrapper Nhị phân (Binary Wrappers)"
feature_id: "F06"
feature_group: "01-node-lifecycle"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F06: TẦNG ĐIỀU PHỐI WRAPPER NHỊ PHÂN (BINARY WRAPPERS)

## 1. Mô tả Tính năng
- **Mục đích**: Cung cấp một tầng thực thi trung gian có đặc quyền root (setuid bit) nằm giữa ứng dụng web (chạy dưới quyền user `www-data` bị giới hạn) và nhân hệ điều hành Linux. Tầng này thực hiện các tác vụ nhạy cảm: tạo card mạng TAP, gán vào bridge, tạo tiến trình hypervisor và áp đặt giới hạn cgroups.
- **Đối tượng sử dụng**: Tầng lõi hệ thống tự động gọi.
- **Thời điểm kích hoạt**: Mỗi khi có hành động start, stop, wipe một node bất kỳ.

## 2. Cơ chế Chạy (Mechanism)
1. **Lời gọi Setuid**:
   - `unl_wrapper.php` gọi thực thi các file nhị phân trong [`wrappers`](../../../wrappers)/`:
     - `qemu_wrapper`: Dành cho máy ảo QEMU/KVM.
     - `iol_wrapper`: Dành cho Cisco IOS-on-Linux.
     - `docker_wrapper`: Dành cho container Docker.
     - `dynamips_wrapper`: Dành cho router Cisco cổ điển.
2. **Nâng quyền Thực thi (Setuid Privileges)**:
   - Các file wrapper có quyền `4755` (`-rwsr-xr-x root root`). Khi thực thi, tiến trình được chuyển sang `euid = 0` (Effective UID của root).
3. **Thực thi Tác vụ Đặc quyền**:
   - Mở descriptor `/dev/net/tun` và gọi `ioctl(TUNSETIFF)` để tạo giao diện TAP.
   - Thêm giao diện vào Bridge thông qua `SIOCBRADDIF`.
   - Cấu hình cgroups: Ghi PID của tiến trình vào `/sys/fs/cgroup/cpu/pnetlab/tasks` và `/sys/fs/cgroup/memory/pnetlab/tasks`.
4. **Hạ Quyền (Drop Privileges) & Chuyển giao Tiến trình (`execve`)**:
   - Trước khi gọi `execve()` chạy binary hypervisor (ví dụ `qemu-system-x86_64`), wrapper hạ quyền root xuống user `unl` (UID 32768) để phòng ngừa lỗ hổng leo thang đặc quyền từ bên trong máy ảo.
5. **Ghi Nhận PID & Giám sát**: Wrapper ghi PID của tiến trình vào file `.pid` và theo dõi tín hiệu trả về.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Setuid Bit (SUID)**: Cho phép thực thi file nhị phân với quyền hạn của chủ sở hữu file (root).
- **Linux Kernel ioctl TUN/TAP**: Giao diện lập trình C để tạo và điều khiển card mạng ảo tầng L2/L3.
- **Linux Socket ioctl (`SIOCBRADDIF`, `SIOCBRDELIF`)**: Thao tác nối dây vào Linux Bridge tầng kernel.
- **Principle of Least Privilege**: Hạ đặc quyền sau khi hoàn thành các tác vụ cấu hình mạng để đảm bảo an ninh.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`[`/opt/unetlab/wrappers/qemu_wrapper`](../../../wrappers/qemu_wrapper)](../../../wrappers/qemu_wrapper) | C binary | Wrapper cho QEMU/KVM |
| [`[`/opt/unetlab/wrappers/iol_wrapper`](../../../wrappers/iol_wrapper)](../../../wrappers/iol_wrapper) | C binary | Wrapper cho Cisco IOL |
| [`[`/opt/unetlab/wrappers/docker_wrapper`](../../../wrappers/docker_wrapper)](../../../wrappers/docker_wrapper) | C binary | Wrapper cho Docker container |
| [`[`/opt/unetlab/wrappers/unl_wrapper`](../../../wrappers/unl_wrapper)](../../../wrappers/unl_wrapper) | C binary | Wrapper điều phối chung |
| [`[`/opt/unetlab/scripts/unl_wrapper.php`](../../../scripts/unl_wrapper.php)](../../../scripts/unl_wrapper.php) | PHP CLI | Cầu nối sinh dòng lệnh gọi wrapper |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input CLI**:
  ```bash
  [`[`/opt/unetlab/wrappers/qemu_wrapper`](../../../wrappers/qemu_wrapper)](../../../wrappers/qemu_wrapper) -T 0 -D 1 -t "CSR1000v" -F /opt/qemu/bin/qemu-system-x86_64 -d 1 -- -smp 2 -m 4096 ...
  ```
- **Output**: PID của tiến trình con và descriptor chuyển tiếp console.
- **Edge Cases**: Không thể tạo TAP do cạn kiệt tài nguyên kernel -> Ném lỗi `ioctl(TUNSETIFF) failed: Device or resource busy`.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f06-node-wrapper-orchestration-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f06-node-wrapper-orchestration-sequence.md)
