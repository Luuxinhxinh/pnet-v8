---
title: "Level 2 — F19: Bắt Gói tin Wireshark Trực tiếp Từ xa"
feature_id: "F19"
feature_group: "03-console-access"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F19: BẮT GÓI TIN WIRESHARK TRỰC TIẾP TỪ XA (REMOTE WIRESHARK CAPTURE)

## 1. Mô tả Tính năng
- **Mục đích**: Cho phép kỹ sư mạng bắt và phân tích toàn bộ luồng gói tin thực tế đang truyền qua bất kỳ giao diện mạng ảo (interface) nào của một thiết bị trong lab, và truyền luồng pcap đó trực tiếp vào phần mềm Wireshark cài trên máy tính cá nhân theo thời gian thực.
- **Đối tượng sử dụng**: Chuyên gia phân tích giao thức mạng, Kỹ sư xử lý sự cố kết nối (Troubleshooting).
- **Thời điểm kích hoạt**: Nhấn chuột phải vào một đường dây mạng hoặc cổng thiết bị chọn "Capture" -> Chọn interface (ví dụ `e0/0`).

## 2. Cơ chế Chạy (Mechanism)
1. **Yêu cầu Bắt Gói tin**:
   - Client gọi `GET /html/console/capture_native.php?node_id=X&interface_id=Y`.
2. **Xác định Giao diện Mạng TAP Thật**:
   - `capture_native.php` ánh xạ `node_id` và `interface_id` thành tên card TAP tương ứng trong Linux Kernel: `tap<pod>_<node_id>_<port_id>`.
3. **Thiết lập Kênh Named Pipe qua SSH**:
   - Trình duyệt trả về một file kịch bản chạy (ví dụ `capture.cmd` trên Windows hoặc `capture.sh` trên macOS/Linux).
   - Khi người dùng chạy file này: Kịch bản mở một đường hầm SSH kết nối vào máy chủ PNet v8.
   - Trên máy chủ, lệnh sau được thực thi: `sudo /opt/unetlab/wrappers/simple_forwarder -i tap...`.
4. **Bộ Chuyển tiếp Nhị phân Tốc độ Cao (`simple_forwarder`)**:
   - Binary C `simple_forwarder` mở một raw socket ở chế độ `ETH_P_ALL` để lắng nghe mọi frame Ethernet đi qua card TAP.
   - Đóng gói frame theo cấu dạng chuẩn PCAP (Global Header + Packet Headers) và ghi thẳng ra luồng đầu ra tiêu chuẩn `stdout`.
5. **Đẩy Luồng Dữ liệu vào Wireshark**:
   - Phía máy người dùng, đầu ra của lệnh SSH được nối qua đường ống (pipe `|`) trực tiếp vào phần mềm Wireshark: `ssh ... | wireshark -k -i -`.
   - Wireshark bung mở và hiển thị các gói tin đang bay trên đường dây theo từng milli-giây.

## 3. Công nghệ & Cơ sở Sử dụng
- **Linux Raw Sockets (`PF_PACKET`, `SOCK_RAW`, `ETH_P_ALL`)**: Bắt trực tiếp frame L2 thô không qua xử lý của ngăn xếp TCP/IP.
- **Libpcap Header Format**: Cấu trúc dữ liệu chuẩn quốc tế cho các file lưu trữ gói tin mạng.
- **Standard Input Piping (`wireshark -k -i -`)**: Cơ chế của Wireshark cho phép nhận luồng pcap liên tục từ stdin.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/unetlab/html/console/capture_native.php` | PHP API | Sinh file script kịch bản bắt gói tin |
| `/opt/unetlab/wrappers/simple_forwarder` | C binary (39KB) | Bắt raw socket và xuất dữ liệu pcap ra stdout |
| `/opt/unetlab/html/themes/default/js/pnetlab-capture-console.js`| JavaScript | Menu chọn cổng mạng cần capture |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `GET /console/capture_native.php?node=1&port=0`
- **Output**: Tải về file kịch bản `pnetlab_capture_r1_e0_0.cmd`.
- **Edge Cases**: Cổng mạng đang ở trạng thái shutdown hoặc node bị tắt -> Wireshark mở lên nhưng không có gói tin nào bay qua.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f19-native-wireshark-capture-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f19-native-wireshark-capture-sequence.md)
