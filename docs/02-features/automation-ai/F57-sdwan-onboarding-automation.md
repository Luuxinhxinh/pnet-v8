---
title: "Level 2 — F57: Tự động hóa Bootstrap & Khởi động SD-WAN (SD-WAN Onboarding)"
feature_id: "F57"
feature_group: "10-automation-ai"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F57: TỰ ĐỘNG HÓA BOOTSTRAP & KHỞI ĐỘNG SD-WAN (SD-WAN ONBOARDING)

## 1. Mô tả Tính năng
- **Mục đích**: Tự động hóa toàn bộ quy trình kích hoạt và xác thực chứng chỉ số (Certificate Onboarding & Fabric Activation) của mạng Cisco SD-WAN — vốn là quy trình thủ công cực kỳ rắc rối mất từ 2-4 tiếng: Tự động tạo Certificate Authority (CA) nội bộ, ký chứng chỉ CSR cho vManage, vSmart, vBond, nạp Root CA Certificate qua API, đồng bộ danh sách thiết bị hợp lệ (Authorized Serial Number File / Chassis List) và kích hoạt đường hầm quản trị Control Connections (DTLS/TLS).
- **Đối tượng sử dụng**: Kỹ sư thực hành chuyên sâu SD-WAN.
- **Thời điểm kích hoạt**: Khi các bộ điều khiển SD-WAN đã khởi động xong.

## 2. Cơ chế Chạy (Mechanism)
1. **Kiểm tra Sẵn sàng của vManage Web API**:
   - Kịch bản `sdwan-onboard.py` (55KB) liên tục gửi request thăm dò cổng HTTPS 8443 của vManage cho đến khi API trả về mã `200 OK`.
2. **Tự động Đăng nhập & Lấy Session Cookie / CSRF Token**:
   - Gửi yêu cầu xác thực `POST /j_security_check` với tài khoản `admin/admin`.
   - Lưu trữ `JSESSIONID` và lấy mã bảo vệ `X-XSRF-TOKEN`.
3. **Sinh và Cài đặt Chứng chỉ CA Nội bộ**:
   - Sử dụng thư viện `cryptography` sinh chứng chỉ Root CA X.509 tự ký.
   - Upload Root CA lên vManage qua REST endpoint `/dataservice/certificate/save/enterprise/rootca`.
4. **Ký Chứng chỉ cho vSmart và vBond**:
   - Tải file CSR của vSmart và vBond từ API vManage.
   - Ký bằng Root CA key nội bộ.
   - Nạp lại chứng chỉ đã ký qua endpoint `/dataservice/certificate/install/signedCert`.
5. **Nạp Danh sách Serial Thiết bị (Chassis List Injection)**:
   - Tự động nạp file `smart-account-device-list.viptela` giả lập để vManage chấp thuận cho các vEdge gia nhập mạng mà không cần tài khoản Cisco Smart Account thật.

## 3. Công nghệ & Cơ sở Sử dụng
- **Cisco vManage REST APIs**: Giao tiếp điều khiển toàn diện hệ thống SD-WAN qua HTTP RESTful.
- **Python Cryptography (OpenSSL Backend)**: Xử lý ký số CSR và sinh chứng chỉ X.509 tự động.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| `/opt/unetlab/scripts/sdwan/sdwan-onboard.py` | Python Script (55KB) | Kịch bản tự động hóa xác thực và cài đặt chứng chỉ |
| `/opt/unetlab/scripts/workers/sdwan.sh` | Shell Script | Worker chạy tiến trình onboarding ngầm |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input**: `python3 sdwan-onboard.py --vmanage 192.168.1.100 --org "Lab_Corp"`
- **Output**: `All controllers onboarded successfully. Control connections: UP.`
- **Edge Cases**: Đồng hồ hệ thống giữa vManage và vSmart bị lệch quá 5 phút khiến SSL Certificate bị từ chối -> Kịch bản tự động đồng bộ thời gian NTP trước khi ký chứng chỉ.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f57-sdwan-onboarding-automation-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f57-sdwan-onboarding-automation-sequence.md)
