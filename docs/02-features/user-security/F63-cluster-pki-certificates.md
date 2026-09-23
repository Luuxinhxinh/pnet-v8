---
title: "Level 2 — F63: Quản lý Chứng chỉ Số Cụm (Cluster PKI & Certificates)"
feature_id: "F63"
feature_group: "11-user-security"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 2"
---

# F63: QUẢN LÝ CHỨNG CHỈ SỐ CỤM (CLUSTER PKI & CERTIFICATES)

## 1. Mô tả Tính năng
- **Mục đích**: Tự động quản lý toàn bộ vòng đời của hệ thống chứng chỉ số X.509 (Public Key Infrastructure - PKI) phục vụ cho việc mã hóa và xác thực hai chiều (Mutual TLS / mTLS) giữa máy chủ Master và các máy chủ vệ tinh Satellite: Khởi tạo Root Certificate Authority (CA) nội bộ, Sinh cặp khóa riêng RSA 4096-bit, Ký duyệt các yêu cầu cấp phát chứng chỉ (Certificate Signing Requests - CSR), Thu hồi chứng chỉ (Revocation), và Gia hạn chứng chỉ khi sắp hết hạn.
- **Đối tượng sử dụng**: Tầng bảo mật truyền thông nội bộ cụm PNetLab.
- **Thời điểm kích hoạt**: Khi thiết lập cụm lần đầu hoặc khi kết nạp thêm vệ tinh mới.

## 2. Cơ chế Chạy (Mechanism)
1. **Khởi tạo Root CA Hệ thống**:
   - Khi cài đặt PNet v8, kịch bản `pnet-pki.py` (22KB) khởi tạo thư mục `/etc/pnetlab/pki/ca/`.
   - Sinh private key `ca.key` (RSA 4096-bit, AES-256) và chứng chỉ tự ký `ca.crt` với thời hạn 10 năm.
2. **Quy trình Phát hành Chứng chỉ Vệ tinh (Satellite Cert Issuance)**:
   - Khi có vệ tinh mới yêu cầu tham gia cụm:
   - Vệ tinh sinh cặp khóa và file yêu cầu cấp chứng chỉ `satellite.csr`.
   - `pki/api.php` chuyển file CSR cho script `pnet-pki.py sign --csr ...`.
   - Root CA ký duyệt CSR, nhúng các trường Subject Alternative Name (SAN: IP và FQDN của vệ tinh), tạo ra file chứng chỉ `satellite.crt`.
3. **Phân phối An toàn & Áp dụng**:
   - Master trả file `satellite.crt` và `ca.crt` về cho vệ tinh qua kênh HTTPS được bảo vệ bởi Token gia nhập cụm.
   - Vệ tinh và Master sử dụng chứng chỉ này để bắt tay TLS Handshake trên cổng điều phối `8088`. Nếu một máy chủ lạ không có chứng chỉ do CA này ký, kết nối lập tức bị ngắt.

## 3. Công nghệ & Cơ sở Sử dụng
- **X.509 v3 Digital Certificates**: Tiêu chuẩn chứng chỉ số mật mã học quốc tế.
- **OpenSSL Library & Cryptography Python Toolkit**: Động cơ sinh số ngẫu nhiên chuẩn an toàn mật mã (CSPRNG) và thuật toán mã hóa bất đối xứng RSA/ECDSA.

## 4. File / Hàm Liên quan
| Đường dẫn File | Hàm / Class | Vai trò |
| :--- | :--- | :--- |
| [`scripts/pki/pnet-pki.py`](../../../scripts/pki/pnet-pki.py) | Python Script (22KB) | Quản lý CA và ký chứng chỉ số |
| [`html/pki/api.php`](../../../html/pki/api.php) | PHP API | Endpoint tiếp nhận yêu cầu ký chứng chỉ |
| `/etc/pnetlab/pki/` | Filesystem Directory | Nơi lưu trữ chứng chỉ và khóa bảo mật |

## 5. Input / Output & Xử lý Ngoại lệ
- **Input CLI**: `python3 pnet-pki.py sign --csr /tmp/sat2.csr --hostname sat2.pnet.local`
- **Output**: File chứng chỉ X.509 `sat2.crt` được ký bởi PNet Root CA.
- **Edge Cases**: File private key bị lộ hoặc nghi ngờ bị tấn công -> Quản trị viên kích hoạt lệnh `pnet-pki.py revoke` để thu hồi chứng chỉ và loại vệ tinh ra khỏi cụm.

## 6. Liên kết Sơ đồ Level 3
- [Sơ đồ Gọi hàm (Call Graph)](../../03-diagrams/f63-cluster-pki-certificates-callgraph.md)
- [Sơ đồ Trình tự (Sequence Diagram)](../../03-diagrams/f63-cluster-pki-certificates-sequence.md)
