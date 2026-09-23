---
title: "Level 1 — Nhóm 04: Quản lý Lab, Import/Export & Phân quyền Lab"
group_id: "G04"
group_name: "Lab Management & Collaboration Subsystem"
last_updated: "2026-09-23"
author: "PNet Core Engineering Team"
level: "Level 1"
---

# NHÓM 04: QUẢN LÝ LAB, IMPORT/EXPORT & PHÂN QUYỀN LAB (LAB MANAGEMENT & COLLABORATION SUBSYSTEM)

## 1. Mục đích của Nhóm Tính năng

Nhóm **Quản lý Lab, Import/Export & Phân quyền Lab** đảm nhiệm việc tổ chức, lưu trữ, trao đổi và kiểm soát quyền truy cập đối với các bài thực hành (Lab Files) trong hệ thống PNet v8:
1. **Cấu trúc Cây Thư mục & Quản lý Tệp Lab (File Tree & CRUD Labs)**: Cho phép tổ chức các bài lab theo cấu trúc thư mục lồng nhau không giới hạn cấp độ; thực hiện các thao tác Tạo mới, Xem chi tiết, Đổi tên, Di chuyển (Move/Cut/Paste), Sao chép (Clone) và Xóa lab an toàn.
2. **Bộ Xử lý Định dạng UNetLab XML (XML Serializer & Parser)**: Đọc và ghi toàn bộ cấu trúc dữ liệu của một bài lab (thông số lab, danh sách node, danh sách mạng kết nối, tọa độ dây nối, hình khối, ghi chú, cấu hình ban đầu) vào định dạng chuẩn `.unl` (XML schema).
3. **Đóng gói & Trao đổi Lab (Zip Export & Import)**: Xuất toàn bộ bài lab cùng toàn bộ hình ảnh minh họa, file startup-config và tài liệu workbook thành một tệp nén `.zip` độc lập; hỗ trợ nhập khẩu (Import) lab vào hệ thống tự động giải nén và phân quyền.
4. **Bộ Chuyển đổi Khả chuyển Định dạng (CML/VIRL Converter)**: Tự động chuyển đổi các bài lab được thiết kế từ phần mềm Cisco Modeling Labs (CML / VIRL) sang định dạng `.unl` của PNet v8 để tái sử dụng tài nguyên học liệu.
5. **Kiểm soát Truy cập & Khóa Phiên Lab Đồng thời (Lab Locking & Concurrency Control)**: Ngăn chặn xung đột ghi đè dữ liệu khi nhiều người dùng cùng mở một bài lab bằng cơ chế cờ khóa `F-LOCK` và quản lý phiên trong bảng `lab_sessions`.
6. **Trình đọc Tài liệu Lab Tích hợp (Integrated Workbook Viewer)**: Nhúng trình xem file hướng dẫn thực hành (PDF Workbook / Markdown Guide) ngay bên cạnh Canvas để học viên vừa đọc đề bài vừa thao tác thiết bị.

---

## 2. Danh sách Toàn bộ Tính năng Con Thuộc Nhóm (Dẫn tới Level 2)

Dưới đây là 6 tính năng con độc lập thuộc Nhóm 04, được đặc tả chi tiết tại thư mục `02-features/lab-management/`:

| Mã tính năng | Tên tính năng con | File tài liệu Level 2 | Tóm tắt Chức năng |
| :---: | :--- | :--- | :--- |
| **F20** | **Quản lý Cây Thư mục & Thao tác Lab (Lab & Folder CRUD)** | [`F20-lab-crud-tree.md`](../02-features/lab-management/F20-lab-crud-tree.md) | Thêm, sửa, xóa, di chuyển cây thư mục và tệp lab `.unl` trong thư mục `/opt/unetlab/labs` |
| **F21** | **Bộ Đọc & Ghi Cấu trúc Lab XML (XML Serializer & Parser)** | [`F21-lab-xml-parser-serializer.md`](../02-features/lab-management/F21-lab-xml-parser-serializer.md) | Phân tích cú pháp XML, chuyển đổi sang đối tượng PHP `Lab` và tuần tự hóa ngược lại XML an toàn |
| **F22** | **Đóng gói & Nhập Xuất Lab (ZIP Export & Import)** | [`F22-lab-export-import-zip.md`](../02-features/lab-management/F22-lab-export-import-zip.md) | Đóng gói file `.unl` cùng các tài sản đính kèm (pictures, startup-configs) thành file ZIP và ngược lại |
| **F23** | **Bộ Chuyển đổi Lab Cisco CML / VIRL (Format Converter)** | [`F23-lab-cml-virl-converter.md`](../02-features/lab-management/F23-lab-cml-virl-converter.md) | Phân tích cú pháp YAML/XML của Cisco CML, chuyển đổi các node Cisco và interface mapping sang PNet |
| **F24** | **Khóa Phiên & Kiểm soát Đồng thời (Lab Session Locking)** | [`F24-lab-session-locking.md`](../02-features/lab-management/F24-lab-session-locking.md) | Kiểm soát quyền sửa đổi qua cờ `lock`, theo dõi phiên người dùng đang mở trong bảng `lab_sessions` |
| **F25** | **Trình Xem Tài liệu Thực hành (Integrated Workbook Viewer)** | [`F25-lab-workbook-pdf.md`](../02-features/lab-management/F25-lab-workbook-pdf.md) | Xem tài liệu bài tập PDF và tài liệu markdown trực tiếp bên cạnh màn hình Canvas lab |

---

## 3. Các Module & File Mã nguồn Chịu trách nhiệm Chính

| Đường dẫn File / Thư mục | Ngôn ngữ / Loại | Vai trò chính |
| :--- | :--- | :--- |
| `/opt/unetlab/html/includes/api_labs.php` | PHP | Nghiệp vụ chính: `apiLabAdd()`, `apiLabEdit()`, `apiLabDelete()`, `apiLabGet()`, `apiLabMove()` |
| `/opt/unetlab/html/includes/api_folders.php` | PHP | Quản lý thư mục: `apiFolderGet()`, `apiFolderAdd()`, `apiFolderEdit()`, `apiFolderDelete()` |
| `/opt/unetlab/html/includes/__lab.php` | PHP (OOP) | Domain Object `Lab` (100KB code): Quản lý toàn bộ cấu trúc dữ liệu XML của bài lab, nạp/lưu nodes, networks, textobjects |
| `/opt/unetlab/html/includes/lab-session-access.php` | PHP | Kiểm tra phiên làm việc và quyền sửa đổi bài lab của người dùng |
| `/opt/unetlab/html/import/api.php` | PHP | API tiếp nhận file tải lên, xác thực định dạng và gọi script chuyển đổi |
| `/opt/unetlab/scripts/workers/import.sh` | Shell Script | Script nền giải nén, thiết lập quyền phân phối và di chuyển lab vào thư mục hệ thống |
| `/opt/unetlab/html/main/js/labs.js` | JavaScript | Giao diện quản lý danh sách lab, cây thư mục, dialog tạo mới và chọn thao tác |

---

## 4. Sơ đồ Component Diagram (C4 Level 3: Lab Management Subsystem)

```mermaid
C4Component
    title C4 Level 3: Sơ đồ Thành phần Nhóm 04 (Lab Management & Collaboration Subsystem)

    Container_Boundary(web_client, "Giao diện Web Browser (Client)") {
        Component(labs_js, "labs.js", "Lab Management Controller", "Hiển thị cây thư mục, danh sách lab, các nút Thêm/Sửa/Xóa/Export")
        Component(workbook_ui, "PDF Workbook Modal", "Viewer Component", "Hiển thị tài liệu PDF đề thi / bài lab")
    }

    Container_Boundary(api_service, "Tầng Backend Lab API (PHP)") {
        Component(folder_api, "api_folders.php", "Folder Service", "Quét và trả về cây thư mục từ /opt/unetlab/labs")
        Component(lab_api, "api_labs.php", "Lab Service", "Điều phối các thao tác CRUD bài lab")
        Component(session_access, "lab-session-access.php", "Concurrency Controller", "Kiểm tra phiên đăng nhập và khóa quyền sửa đổi")
        Component(import_api, "import/api.php", "Import/Export Service", "Tiếp nhận file ZIP/CML tải lên")
        Component(lab_model, "__lab.php", "Domain Model (Lab)", "Đọc ghi file XML .unl, tính toán toàn vẹn dữ liệu")
    }

    Container_Boundary(storage_layer, "Tầng Lưu trữ & Cơ sở Dữ liệu") {
        Component(labs_dir, "/opt/unetlab/labs/", "Filesystem Storage", "Chứa toàn bộ các file định dạng .unl được phân thư mục")
        Component(import_worker, "import.sh", "Shell Background Worker", "Giải nén ZIP, sửa quyền sở hữu www-data")
        Component(db_sessions, "MariaDB: lab_sessions", "Database Table", "Lưu trữ pod, user_id, lab_path và trạng thái phiên mở")
    }

    Rel(labs_js, folder_api, "GET /api/folders", "Lấy danh sách thư mục")
    Rel(labs_js, lab_api, "POST /api/labs", "Thao tác Tạo / Đổi tên / Di chuyển")
    Rel(labs_js, import_api, "POST /api/import", "Upload file ZIP hoặc CML")
    Rel(folder_api, labs_dir, "Quét thư mục vật lý", "opendir() / readdir()")
    Rel(lab_api, session_access, "Xác thực phiên làm việc", "checkLabAccess()")
    Rel(session_access, db_sessions, "Đọc ghi trạng thái khóa", "SELECT / INSERT / UPDATE")
    Rel(lab_api, lab_model, "Nạp mô hình Lab", "new Lab('/opt/unetlab/labs/...')")
    Rel(lab_model, labs_dir, "Ghi nội dung file .unl", "file_put_contents()")
    Rel(import_api, import_worker, "Kích hoạt worker nền", "sudo /opt/unetlab/scripts/workers/import.sh")
    Rel(import_worker, labs_dir, "Giải nén file vào đích", "unzip / rsync")
```

---

> 👉 **Xem chi tiết từng tính năng con**:
> 1. [`F20-lab-crud-tree.md`](../02-features/lab-management/F20-lab-crud-tree.md) — Quản lý Cây Thư mục & Thao tác Lab (Lab & Folder CRUD)
> 2. [`F21-lab-xml-parser-serializer.md`](../02-features/lab-management/F21-lab-xml-parser-serializer.md) — Bộ Đọc & Ghi Cấu trúc Lab XML (XML Serializer & Parser)
> 3. [`F22-lab-export-import-zip.md`](../02-features/lab-management/F22-lab-export-import-zip.md) — Đóng gói & Nhập Xuất Lab (ZIP Export & Import)
> 4. [`F23-lab-cml-virl-converter.md`](../02-features/lab-management/F23-lab-cml-virl-converter.md) — Bộ Chuyển đổi Lab Cisco CML / VIRL (Format Converter)
> 5. [`F24-lab-session-locking.md`](../02-features/lab-management/F24-lab-session-locking.md) — Khóa Phiên & Kiểm soát Đồng thời (Lab Session Locking)
> 6. [`F25-lab-workbook-pdf.md`](../02-features/lab-management/F25-lab-workbook-pdf.md) — Trình Xem Tài liệu Thực hành (Integrated Workbook Viewer)
