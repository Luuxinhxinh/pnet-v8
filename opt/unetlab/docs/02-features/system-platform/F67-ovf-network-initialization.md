---
title: "Level 2 — F67: Khởi tạo Mạng Máy ảo OVF Đầu tiên (OVF Firstboot Network)"
feature_id: "F67"
feature_group: "12-system-platform"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F67: KHỞI TẠO MẠNG MÁY ẢO OVF ĐẦU TIÊN (OVF FIRSTBOOT NETWORK)

## 1. Mô tả Tính năng
- **Mục đích**: Tự động phát hiện và khởi tạo toàn bộ cấu hình mạng của máy chủ PNet v8 khi người dùng import file máy ảo OVF/OVA vào VMware ESXi, VMware Workstation hoặc Proxmox VE: Hiển thị màn hình cấu hình mạng đồ họa console (Ncurses Text-based Setup Wizard), thiết lập mật khẩu root, cấu hình địa chỉ IP quản trị (DHCP hoặc IP Tĩnh, Subnet Mask, Gateway, DNS), và khởi tạo các card mạng Cloud.
- **Đối tượng sử dụng**: Người dùng mới cài đặt hệ thống PNet v8 lần đầu.
- **Thời điểm kích hoạt**: Khi khởi động máy ảo lần đầu tiên sau khi cài đặt (First Boot).

## 2. Cơ chế Chạy (Mechanism)
1. **Kiểm tra Cờ Lần Khởi Động Đầu (Firstboot Detection)**:
   - Dịch vụ `pnetlab-netcfg-firstboot.service` kiểm tra sự tồn tại của file cờ `/opt/ovf/.configured`.
   - Nếu chưa có file cờ, hệ thống tự động kích hoạt kịch bản `/opt/ovf/pnetlab-netcfg.sh` (25KB).
2. **Giao diện Cấu hình Đồ họa Console (Ncurses Wizard)**:
   - Sử dụng công cụ `dialog` hoặc `whiptail` hiển thị màn hình xanh chữ trắng trực quan:
     - Bước 1: Đổi mật khẩu tài khoản `root`.
     - Bước 2: Nhập Hostname cho máy chủ (mặc định `pnetlab`).
     - Bước 3: Nhập Domain Name.
     - Bước 4: Chọn chế độ cấp IP: `DHCP` hoặc `Static IP`.
     - Nếu chọn Static: Nhập IP, Netmask, Gateway, DNS 1, DNS 2.
     - Bước 5: Cấu hình NTP Time Server.
3. **Áp dụng Cấu hình vào Hệ thống**:
   - Kịch bản ghi file cấu hình `/etc/netplan/01-netcfg.yaml` (hoặc `/etc/network/interfaces`).
   - Gọi lệnh `netplan apply` để áp dụng cấu hình mạng ngay lập tức.
4. **Khởi tạo File Cờ Hoàn tất**:
   - Tạo file `/opt/ovf/.configured`. Từ các lần khởi động sau, máy sẽ boot thẳng vào giao diện đăng nhập Linux bình thường.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Ncurses Dialog / Whiptail**: Giao diện người dùng dạng văn bản đồ họa (TUI) chạy trên console tty1.
- **Ubuntu Netplan Network Configuration**: Bộ trừu tượng hóa cấu hình mạng hiện đại của Linux.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/ovf/pnetlab-netcfg.sh` | Shell Script (25KB) | Kịch bản hướng dẫn cài đặt mạng qua console |
| `/opt/ovf/ovfstartup.sh` | Shell Script (14KB) | Kịch bản nạp thông số OVF Environment từ VMware Tools |
| `/etc/systemd/system/multi-user.target.wants/pnetlab-netcfg-firstboot.service`| Systemd Service | Kích hoạt script khi boot lần đầu |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input TUI**: Nhập IP tĩnh `192.168.1.100/24`, Gateway `192.168.1.1`.
- **Output**: Máy chủ nhận IP, mở cổng web 443 và in ra màn hình banner URL đăng nhập: `https://192.168.1.100`.
- **Edge Cases**: Cắm nhầm card mạng hoặc không có DHCP -> Wizard cho phép chọn lại card mạng vật lý đang có tín hiệu Link Up.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f67-ovf-network-initialization-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f67-ovf-network-initialization-sequence.md)
