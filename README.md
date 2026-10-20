# Cao Hiển Studio — Hệ Thống Đặt Lịch Dịch Vụ & Quản Lý Studio Chụp Ảnh

Hệ thống ứng dụng web chuyên nghiệp phục vụ hoạt động vận hành của **Cao Hiển Studio** (Bến Tre và khu vực Đồng bằng Sông Cửu Long). Dự án bao gồm website đặt lịch, tham khảo dịch vụ dành cho khách hàng và cổng quản trị (Admin Dashboard) tối ưu cho việc điều phối nhân sự, hợp đồng, thiết bị và tài chính.

> **Đề tài Khóa Luận Tốt Nghiệp** — Ngành Công nghệ Thông tin, Chuyên ngành Kỹ thuật Phần mềm  
> **Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh (HCMUTE)**  
> **Sinh viên thực hiện:** Hồ Vũ Anh — MSSV: 22110097  
> **Giảng viên hướng dẫn:** ThS. Trương Thị Ngọc Phượng  

---

## 📌 Bảng Tóm Tắt Tiến Độ Dự Án (Cập nhật 10/2026)

| Giai đoạn / Mốc | Nội dung thực hiện | Trạng thái |
| :--- | :--- | :---: |
| **Tuần 1: Nghiệp vụ & Khảo sát ban đầu** | Khảo sát nhu cầu khách hàng cưới hỏi, phân loại gói chụp truyền thống, phóng sự, lễ tối/lạy công cô. Xây dựng bảng cự ly địa lý 5 bậc sơ bộ cho khu vực Tây Nam Bộ. | Hoàn thành |
| **Tuần 2: Đối sánh thị trường & Lịch biểu** | Khảo sát đối sánh 4 studio (Gạo Nâu, HThao Studio, Ảnh Tiệc Vĩnh Long, Cao Hiển). Cải tiến giao diện chọn lịch có hiển thị ngày lễ, ngày âm lịch và ngày studio tạm nghỉ. | Hoàn thành |
| **Tuần 3: Định tuyến OSRM & Phụ thu cự ly** | Chuẩn hóa bảng phụ thu di chuyển 7 bậc cự ly (0–30 km miễn phí đến trên 250 km báo phí riêng). Tích hợp OSRM Road Distance API tính tuyến thực tế từ Studio Bến Tre. Lưu nháp `sessionStorage` cho luồng đăng ký/đăng nhập/khách vãng lai. | Hoàn thành |
| **Mở rộng tính năng Studio** | Thêm phân hệ cho thuê thiết bị/máy ảnh (`CameraRental`), quản lý Banner quảng cáo, chế độ bảo trì `SiteLock`, phân quyền `Super Admin`, đồng bộ ảnh Cloudinary & Google Drive API. | Hoàn thành |
| **Tự động hóa Hợp đồng & Mail** | Sinh hợp đồng PDF tự động (`PDFKit`) tích hợp mã QR tra cứu đơn; quy trình xác nhận cọc tiền mặt / chuyển khoản thủ công (thay thế VNPay/PayOS); gửi email OTP & thông báo qua Resend/SMTP. | Hoàn thành |

---

## 🌟 Tính Năng Hệ Thống

### 1. Phân hệ Khách hàng (Customer Portal)
* **Trang chủ & Giới thiệu:** Trình bày không gian studio, đội ngũ nhiếp ảnh gia, phong cách chụp ảnh tiệc cưới, chân dung, phóng sự cưới. Tích hợp Banner quảng cáo khuyến mãi linh hoạt.
* **Bộ sưu tập (Galleries):** Xem các album ảnh chất lượng cao phân loại theo chủ đề (Cưới hỏi, Ngoại cảnh, Tiệc, Chân dung), tối ưu tải mượt mà trên cả máy tính và di động.
* **Danh mục Dịch vụ:** Xem thông tin chi tiết các gói chụp chính, gói đi kèm (nhóm họ, lạy công cô, flycam, makeup...) cùng bảng giá rõ ràng.
* **Đặt lịch thông minh (Smart Booking Engine):**
  * **Hình thức chụp:** Tại Studio hoặc Ngoại cảnh ngoài trời.
  * **Dự báo thời tiết & Phân vùng địa lý:** Tự động hiển thị thời tiết tương ứng theo khu vực chụp (Bến Tre, Tiền Giang, Long An, TP.HCM, Cần Thơ, Vũng Tàu, Đà Lạt...).
  * **Định tuyến đường bộ OSRM:** Tự động tính khoảng cách đường bộ thực tế từ trung tâm Bến Tre đến địa điểm chụp của khách để đưa ra mức phụ thu di chuyển chuẩn xác theo 7 bậc giá.
  * **Lịch tháng trực quan:** Đánh dấu màu riêng biệt cho ngày thường, ngày lễ quốc gia, ngày âm lịch và ngày studio đóng cửa nghỉ ngơi.
  * **Đặt lịch không cần tài khoản (Guest Booking):** Cho phép khách gửi yêu cầu đặt lịch nhanh chóng thông qua xác thực mã OTP email an toàn.
  * **Lưu giữ phiên làm việc:** Dữ liệu đặt lịch được lưu trữ tạm trong `sessionStorage`, không bị mất khi khách chuyển sang luồng Đăng nhập/Đăng ký.
* **Hợp đồng điện tử & Xem trước:** Khách hàng có thể truy cập liên kết xem hợp đồng dịch vụ đã sinh tự động dưới dạng PDF, chứa chi tiết quyền lợi, thời gian, điều khoản cọc và mã QR.
* **Dịch vụ Thuê Thiết Bị / Máy Ảnh (Camera Rental):** Khách hàng có thể tham khảo danh sách máy ảnh, ống kính chuyên nghiệp cho thuê, kiểm tra tình trạng còn/hết và gửi yêu cầu thuê thiết bị.
* **Hỗ trợ khách hàng đa kênh:**
  * **AI Chatbot (Google Gemini):** Trợ lý ảo tư vấn tự động các thắc mắc về gói dịch vụ, giá cả, thời gian làm việc 24/7.
  * **Zalo Floating Widget:** Nút liên hệ nhanh qua số Zalo chính thức của studio.

---

### 2. Phân hệ Quản trị (Admin & Super Admin Dashboard)
* **Bảng điều khiển (Dashboard):** Thống kê trực quan doanh thu, số lượng đơn theo tháng, tỷ lệ chuyển đổi và đơn hàng cần xử lý qua biểu đồ Recharts.
* **Quản lý Đơn đặt lịch (Bookings Management):**
  * Theo dõi vòng đời đơn theo state machine:  
    `REQUESTED` ➔ `CONTRACT_SENT` ➔ `WAITING_PAYMENT` ➔ `CONFIRMED` ➔ `IN_PROGRESS` ➔ `COMPLETED` (hoặc `CANCELED`).
  * Điều chỉnh dịch vụ, cộng trừ phụ thu di chuyển đường bộ, chiết khấu hoặc ghi chú bổ sung.
  * Phân công ekip thợ chụp nội bộ (staff) hoặc thợ đối tác ngoài (freelancer).
  * Xác nhận đã nhận tiền cọc (tiền mặt trực tiếp tại studio hoặc chuyển khoản ngân hàng qua mã QR) và tự động kích hoạt gửi hợp đồng chính thức cho khách.
  * Tạo đơn hộ cho khách gọi điện hoặc đến trực tiếp studio.
* **Quản lý Dịch vụ & Gói chụp:** Thêm, sửa, xóa các gói chụp chính và gói phụ, thiết lập giá gốc, mô tả chi tiết và hình ảnh đại diện.
* **Quản lý Bộ sưu tập & Hình ảnh:** Tải ảnh lên Cloudinary và đồng bộ Google Drive API, quản lý thư viện ảnh hiển thị trên toàn trang web.
* **Quản lý Thiết bị cho thuê:** Danh mục máy ảnh, giá thuê theo ngày, thông số kỹ thuật và trạng thái khả dụng.
* **Quản lý Ngày nghỉ (Holidays):** Thiết lập lịch nghỉ lễ hoặc ngày studio tạm ngừng nhận chụp để hệ thống tự động khóa ngày trên lịch đặt hẹn của khách.
* **Quản trị Tài khoản & Phân quyền (Super Admin):**
  * Quản lý danh sách tài khoản Admin, cấp quyền hoặc thu hồi tài khoản.
  * **SiteLock (Bảo trì hệ thống):** Chế độ khóa website để bảo trì với trang thông báo sang trọng, chỉ cho phép tài khoản Admin truy cập quản trị.

---

## 🛠️ Công Nghệ Sử Dụng (Technology Stack)

### Frontend
* **Core:** React 19, JavaScript (ESNext), Vite 8
* **Routing:** React Router v7
* **UI Component Framework:** Ant Design (`antd` v6)
* **Biểu đồ & Hiển thị:** Recharts
* **Tương tác kéo thả:** `@dnd-kit/core`, `@dnd-kit/sortable`
* **Xử lý ngày giờ:** Dayjs
* **Giao tiếp API & Realtime:** Axios, Socket.io-client
* **Phong cách giao diện:** Vanilla CSS tối ưu theo bảng màu nhận diện Studio (Tone màu Gold `#BFA16A`, Kem `#FAF7F2` và Đen sang trọng).

### Backend
* **Runtime & Framework:** Node.js (CommonJS), Express.js (v5)
* **Cơ sở dữ liệu:** MongoDB với ODM Mongoose (v9)
* **Xác thực & Bảo mật:** JSON Web Token (JWT), bcrypt / bcryptjs
* **Định tuyến đường bộ:** OpenStreetMap / Project OSRM Routing API
* **Trí tuệ nhân tạo:** Google Generative AI (Gemini Flash API `@google/generative-ai`)
* **Xử lý tài liệu:** PDFKit (tạo file PDF hợp đồng studio), QRCode
* **Lưu trữ đám mây:** Cloudinary API (ảnh upload linh hoạt), Google Drive API (`googleapis`)
* **Gửi Email:** Nodemailer (SMTP Gmail local) & Resend HTTPS API (cho cloud hosting Render)
* **Tác vụ ngầm:** Node-cron (nhắc lịch hẹn và dọn dẹp dữ liệu)

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
caohienstudio/
├── AGENTS.md                  # Hướng dẫn, quy chuẩn và nhật ký tiến độ chi tiết cho AI Agent
├── README.md                  # Tài liệu tổng quan và hướng dẫn sử dụng dự án
├── WORD_RUBRIC.md             # Tiêu chuẩn và rubric chấm đồ án Word cho hệ thống
├── baocao/                    # Hồ sơ báo cáo tiến độ các tuần (tuan1.docx, tuan2.docx, tuan3.docx)
├── doc/                       # Tài liệu đặc tả use case, khảo sát thị trường, đề cương TLCN/KLTN
│   ├── Bao_cao_khao_sat_thi_truong_va_dat_lich_studio_2026.docx
│   └── Bao_cao_use_case_trang_dat_lich.docx
├── backend/
│   ├── config/                # Cấu hình kết nối MongoDB, biến môi trường
│   ├── controllers/           # Xử lý logic nghiệp vụ (Booking, Service, Camera, Holiday...)
│   ├── middleware/            # Xác thực JWT, phân quyền Admin, upload file
│   ├── models/                # Mongoose Models (Booking, User, Service, Holiday, SiteLock...)
│   ├── routes/                # Định nghĩa toàn bộ REST API endpoints
│   ├── services/              # Dịch vụ bên ngoài (Google Drive, Mailer, AI Gemini)
│   ├── utils/                 # Tiện ích sinh PDF hợp đồng, tính phụ thu OSRM (travelPricing.js)
│   ├── server.js              # Điểm khởi chạy máy chủ Express
│   └── .env.example           # Mẫu cấu hình môi trường backend
└── frontend/
    ├── src/
    │   ├── assets/            # Hình ảnh tĩnh, logo, banner
    │   ├── components/        # UI components dùng chung (Layout, AIChatWidget, ZaloWidget...)
    │   ├── config/            # Cấu hình Axios instance và URL môi trường
    │   ├── pages/
    │   │   ├── admin/         # Các trang quản trị (Orders, Dashboard, Services, Holidays...)
    │   │   ├── auth/          # Đăng nhập, đăng ký, quên mật khẩu
    │   │   ├── customer/      # Các trang khách hàng (Home, Booking, Confirm, CameraRental...)
    │   │   └── policies/      # Điều khoản hợp đồng và chính sách hoàn/hủy cọc
    │   ├── utils/             # Dữ liệu phân vùng cự ly (shootingLocations.js), format tiền tệ
    │   ├── App.jsx            # Định nghĩa toàn bộ hệ thống Routes
    │   └── main.jsx           # Entry point của ứng dụng React
    └── .env.example           # Mẫu cấu hình môi trường frontend
```

---

## 🚀 Cài Đặt Và Chạy Thử (Getting Started)

### 1. Yêu cầu môi trường
* **Node.js:** Phiên bản `>= 18.x` (Đã kiểm thử hoạt động mượt mà trên Node v24)
* **MongoDB:** Bản cài đặt local hoặc MongoDB Atlas URI
* **Tài khoản / Khóa API (Tùy chọn cho các dịch vụ nâng cao):**
  * Google Gemini API Key
  * Cloudinary credentials
  * Tài khoản Gmail App Password hoặc Resend API Key

---

### 2. Cài đặt các gói phụ thuộc (Dependencies)

Mở terminal tại thư mục gốc của dự án:

```bash
# Cài đặt thư viện cho Backend
cd backend
npm install

# Cài đặt thư viện cho Frontend
cd ../frontend
npm install
```

---

### 3. Cấu hình biến môi trường (.env)

Tạo file `.env` tại thư mục `backend/` dựa trên `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/caohienstudio
JWT_SECRET=your_jwt_super_secret_key

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Dịch vụ gửi email (SMTP Local hoặc Resend trên cloud)
EMAIL_PROVIDER=smtp
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
CONTACT_RECEIVER_EMAIL=your_email@gmail.com

# Cấu hình Super Admin tự khởi tạo
ADMIN_EMAIL=admin@caohienstudio.com
ADMIN_PASSWORD=Admin@123
ADMIN_FULL_NAME=Quản Trị Viên Cao Hiển
ADMIN_PHONE=0948997984

# Tích hợp dịch vụ ngoài (Tùy chọn)
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Định tuyến phụ thu đường bộ (OSRM)
OSRM_ROUTER_URL=https://router.project-osrm.org
STUDIO_ORIGIN_LAT=10.2433
STUDIO_ORIGIN_LON=106.3756
```

Tạo file `.env` tại thư mục `frontend/` dựa trên `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_ENV=development
VITE_ZALO_PHONE=0979767602
VITE_ZALO_URL=https://zalo.me/0979767602
```

---

### 4. Khởi động ứng dụng

Mở 2 cửa sổ terminal riêng biệt:

**Terminal 1 — Khởi động Backend (Port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Khởi động Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

Truy cập website tại: `http://localhost:5173`  
Truy cập trang quản trị viên tại: `http://localhost:5173/admin` (đăng nhập bằng tài khoản Admin đã cấu hình).

---

## 📋 Chính Sách Phụ Thu Di Chuyển (Ngoại cảnh Tây Nam Bộ)

Điểm xuất phát: **Trung tâm TP. Bến Tre** (Tọa độ: `10.2433, 106.3756`)  
Khoảng cách tính theo đường bộ một chiều, làm tròn lên kilomet nguyên và áp dụng một lần cho mỗi đơn:

* **0 – 30 km:** Miễn phí di chuyển (Bến Tre, Tiền Giang/Mỹ Tho...).
* **31 – 70 km:** Phụ thu `300.000đ` (Long An/Tân An, Trà Vinh...).
* **71 – 100 km:** Phụ thu `500.000đ` (Vĩnh Long, TP.HCM...).
* **101 – 150 km:** Phụ thu `800.000đ` (Cần Thơ, Đồng Tháp, An Giang, Hậu Giang...).
* **151 – 200 km:** Phụ thu `1.200.000đ` (Tây Ninh, Sóc Trăng, Vũng Tàu, Rạch Giá...).
* **201 – 250 km:** Phụ thu `1.500.000đ` (Bạc Liêu, Cà Mau, Phan Thiết...).
* **Trên 250 km hoặc địa hình đèo (Đà Lạt, Bảo Lộc...):** Studio xác nhận chi phí thực tế, phương tiện riêng và lưu trú trước khi chốt hợp đồng.

---

## 📄 Bản Quyền & Giấy Phép
Dự án được thực hiện phục vụ cho Khóa Luận Tốt Nghiệp và hoạt động thực tế của Studio Cao Hiển. Mọi quyền sở hữu mã nguồn thuộc về tác giả và studio đối tác.
