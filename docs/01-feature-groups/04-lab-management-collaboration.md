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
2. **Bộ Xử lý Định dạng Lab XML (XML Serializer & Parser)**: Đọc và ghi toàn bộ cấu trúc dữ liệu của một bài lab (thông số lab, danh sách node, danh sách mạng kết nối, tọa độ dây nối, hình khối, ghi chú, cấu hình ban đầu) vào định dạng chuẩn `.unl` (XML schema).
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
| [`/opt/unetlab/html/includes/api_labs.php`](../../opt/unetlab/html/includes/api_labs.php)](../../html/includes/api_labs.php) | PHP | Nghiệp vụ chính: `apiAddLab()`, `apiEditLab()`, `apiDeleteLab()`, `apiGetLab()`, `apiMoveLab()` |
| [`/opt/unetlab/html/includes/api_folders.php`](../../opt/unetlab/html/includes/api_folders.php)](../../html/includes/api_folders.php) | PHP | Quản lý thư mục: `apiGetFolders()`, `apiAddFolder()`, `apiEditFolder()`, `apiDeleteFolder()` |
| [`/opt/unetlab/html/includes/__lab.php`](../../opt/unetlab/html/includes/__lab.php)](../../html/includes/__lab.php) | PHP (OOP) | Domain Object `Lab` (100KB code): Quản lý toàn bộ cấu trúc dữ liệu XML của bài lab, nạp/lưu nodes, networks, textobjects |
| [`/opt/unetlab/html/includes/lab-session-access.php`](../../opt/unetlab/html/includes/lab-session-access.php)](../../html/includes/lab-session-access.php) | PHP | Kiểm tra phiên làm việc và quyền sửa đổi bài lab của người dùng |
| [`/opt/unetlab/html/import/api.php`](../../opt/unetlab/html/import/api.php)](../../html/import/api.php) | PHP | API tiếp nhận file tải lên, xác thực định dạng và gọi script chuyển đổi |
| [`/opt/unetlab/scripts/workers/import.sh`](../../opt/unetlab/scripts/workers/import.sh)](../../scripts/workers/import.sh) | Shell Script | Script nền giải nén, thiết lập quyền phân phối và di chuyển lab vào thư mục hệ thống |
| [`/opt/unetlab/html/main/js/labs.js`](../../opt/unetlab/html/main/js/labs.js)](../../html/main/js/labs.js) | JavaScript | Giao diện quản lý danh sách lab, cây thư mục, dialog tạo mới và chọn thao tác |

---

## 4. Sơ đồ Component Diagram (C4 Level 3: Lab Management Subsystem)

```mermaid
flowchart TD
    %% Styling classes
    classDef ui fill:#1f6feb,stroke:#58a6ff,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef api fill:#238636,stroke:#3fb950,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef wrap fill:#d29922,stroke:#f0883e,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef kernel fill:#8957e5,stroke:#a371f7,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
    classDef storage fill:#21262d,stroke:#8b949e,stroke-width:1.5px,color:#c9d1d9,rx:6px,ry:6px;

    subgraph SG_web_client [" 📦 Giao diện Web Browser (Client) "]
        direction TB
        labs_js["<b>labs.js</b><br/><i>(Lab Management Controller)</i><br/>Hiển thị cây thư mục, danh sách lab, các nút Thêm/Sửa/Xóa/Export"]:::ui
        workbook_ui["<b>PDF Workbook Modal</b><br/><i>(Viewer Component)</i><br/>Hiển thị tài liệu PDF đề thi / bài lab"]:::ui
    end

    subgraph SG_api_service [" 📦 Tầng Backend Lab API (PHP) "]
        direction TB
        folder_api["<b>api_folders.php</b><br/><i>(Folder Service)</i><br/>Quét và trả về cây thư mục từ /opt/unetlab/labs"]:::api
        lab_api["<b>api_labs.php</b><br/><i>(Lab Service)</i><br/>Điều phối các thao tác CRUD bài lab"]:::api
        session_access["<b>lab-session-access.php</b><br/><i>(Concurrency Controller)</i><br/>Kiểm tra phiên đăng nhập và khóa quyền sửa đổi"]:::api
        import_api["<b>import/api.php</b><br/><i>(Import/Export Service)</i><br/>Tiếp nhận file ZIP/CML tải lên"]:::api
        lab_model["<b>__lab.php</b><br/><i>(Domain Model (Lab))</i><br/>Đọc ghi file XML .unl, tính toán toàn vẹn dữ liệu"]:::api
    end

    subgraph SG_storage_layer [" 📦 Tầng Lưu trữ & Cơ sở Dữ liệu "]
        direction TB
        labs_dir["<b>/opt/unetlab/labs/</b><br/><i>(Filesystem Storage)</i><br/>Chứa toàn bộ các file định dạng .unl được phân thư mục"]:::wrap
        import_worker["<b>import.sh</b><br/><i>(Shell Background Worker)</i><br/>Giải nén ZIP, sửa quyền sở hữu www-data"]:::wrap
        db_sessions["<b>MariaDB: lab_sessions</b><br/><i>(Database Table)</i><br/>Lưu trữ pod, user_id, lab_path và trạng thái phiên mở"]:::wrap
    end

    %% Quan hệ giữa các thành phần
    labs_js -->|"GET /api/folders<br/><i>[Lấy danh sách thư mục]</i>"| folder_api
    labs_js -->|"POST /api/labs<br/><i>[Thao tác Tạo / Đổi tên / Di chuyển]</i>"| lab_api
    labs_js -->|"POST /api/import<br/><i>[Upload file ZIP hoặc CML]</i>"| import_api
    folder_api -->|"Quét thư mục vật lý<br/><i>[opendir() / readdir()]</i>"| labs_dir
    lab_api -->|"Xác thực phiên làm việc<br/><i>[checkLabAccess()]</i>"| session_access
    session_access -->|"Đọc ghi trạng thái khóa<br/><i>[SELECT / INSERT / UPDATE]</i>"| db_sessions
    lab_api -->|"Nạp mô hình Lab<br/><i>[new Lab('/opt/unetlab/labs/...')]</i>"| lab_model
    lab_model -->|"Ghi nội dung file .unl<br/><i>[file_put_contents()]</i>"| labs_dir
    import_api -->|"Kích hoạt worker nền<br/><i>[sudo [`[`/opt/unetlab/scripts/workers/import.sh`](../../opt/unetlab/scripts/workers/import.sh)](../../scripts/workers/import.sh)]</i>"| import_worker
    import_worker -->|"Giải nén file vào đích<br/><i>[unzip / rsync]</i>"| labs_dir
```

---

> 👉 **Xem chi tiết từng tính năng con**:
> 1. [`F20-lab-crud-tree.md`](../02-features/lab-management/F20-lab-crud-tree.md) — Quản lý Cây Thư mục & Thao tác Lab (Lab & Folder CRUD)
> 2. [`F21-lab-xml-parser-serializer.md`](../02-features/lab-management/F21-lab-xml-parser-serializer.md) — Bộ Đọc & Ghi Cấu trúc Lab XML (XML Serializer & Parser)
> 3. [`F22-lab-export-import-zip.md`](../02-features/lab-management/F22-lab-export-import-zip.md) — Đóng gói & Nhập Xuất Lab (ZIP Export & Import)
> 4. [`F23-lab-cml-virl-converter.md`](../02-features/lab-management/F23-lab-cml-virl-converter.md) — Bộ Chuyển đổi Lab Cisco CML / VIRL (Format Converter)
> 5. [`F24-lab-session-locking.md`](../02-features/lab-management/F24-lab-session-locking.md) — Khóa Phiên & Kiểm soát Đồng thời (Lab Session Locking)
> 6. [`F25-lab-workbook-pdf.md`](../02-features/lab-management/F25-lab-workbook-pdf.md) — Trình Xem Tài liệu Thực hành (Integrated Workbook Viewer)
