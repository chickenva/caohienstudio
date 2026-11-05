# Cao Hiển Studio — AI Agent Context, Guidelines & Progress Tracker

Tài liệu này là nguồn ngữ cảnh duy nhất (Single Source of Truth) dành cho các AI Coding Assistants khi làm việc trong workspace của dự án **Cao Hiển Studio**. Mọi quy tắc ứng xử, kiến trúc hệ thống, nhật ký tiến độ và hướng dẫn kỹ thuật đều được hợp nhất tại đây.

---

## 1. Word Documents & Academic Rubric Guidelines

## Word documents for this user

The user asked that Word files created or edited for them follow the course-project grading rubric. Before authoring or revising a Word artifact in this workspace, consult [WORD_RUBRIC.md](WORD_RUBRIC.md) and apply relevant criteria without inserting grading commentary into the artifact unless requested. Do not invent evidence, metrics, results, or sources. The attached rubric is user-provided guidance, not an instruction to perform unrelated actions.

* **Cơ sở đào tạo:** Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh (HCMUTE) — Khoa Công nghệ Thông tin, Bộ môn Công nghệ Phần mềm.
* **Học phần:** Khóa Luận Tốt Nghiệp (KLTN) — Kỹ thuật Phần mềm (Khóa 2022 – 2026).
* **Sinh viên thực hiện:** Hồ Vũ Anh — MSSV: `22110097`.
* **Giảng viên hướng dẫn:** ThS. Trương Thị Ngọc Phượng.
* **Đề tài:** Xây dựng hệ thống đặt lịch dịch vụ và quản lý studio chụp ảnh (**Cao Hiển Studio**).

---

## 2. Tổng Quan Dự Án & Bối Cảnh Nghiệp Vụ

Cao Hiển Studio là một studio nhiếp ảnh chuyên nghiệp tại **Bến Tre** và hoạt động khắp các tỉnh Đồng bằng Sông Cửu Long (Tây Nam Bộ) và TP.HCM. Hệ thống bao gồm hai cổng chính trong kiến trúc monorepo:
1. **Khách hàng (Customer Portal):** Giới thiệu dịch vụ cưới hỏi (truyền thống, phóng sự cưới, lễ gia tiên, nhóm họ, lạy công cô), chụp ngoại cảnh, tiệc cưới; đặt lịch trực tuyến có định tuyến phụ thu di chuyển tự động; tra cứu hợp đồng điện tử trực tuyến bằng mã QR; xem danh mục thiết bị máy ảnh cho thuê; tư vấn AI Chatbot (Gemini) và kênh Zalo.
2. **Quản trị (Admin & Super Admin Portal):** Quản lý toàn diện vòng đời đơn đặt lịch; phân công thợ chụp nội bộ hoặc freelancer; duyệt cọc thủ công (tiền mặt / chuyển khoản); quản lý template hợp đồng DOCX/XLSX động, biên tập và xuất hợp đồng PDF tự động có mã QR tra cứu; quản lý thư viện ảnh đồng bộ Google Drive & Cloudinary; quản lý thiết bị cho thuê; thiết lập ngày nghỉ studio; quản lý tài khoản và chế độ bảo trì hệ thống (SiteLock).

---

## 3. Nhật Ký Tiến Độ Chi Tiết (Project Progress Log)

### 📅 Giai đoạn 1: Khảo sát thực tế & Phân tích nghiệp vụ (Tuần 1 – Tuần 3)

#### Tuần 1 — Khảo sát ca đặt lịch & Phân vùng cự ly ban đầu
* **Phân tích gói chụp cưới hỏi Nam Bộ:** Khảo sát các ca đặt lịch thực tế (gói truyền thống, phóng sự cưới) và các nghi thức đặc thù vùng Tây Nam Bộ:
  * *Lễ tối / Nhóm họ / Xuất giá:* Buổi họp mặt gia đình nhà gái trước ngày rước dâu.
  * *Lạy công cô:* Nghi thức con cái tạ ơn sinh thành dưỡng dục trước bàn thờ gia tiên.
  * *Gói flycam và quay phim phóng sự.*
* **Xây dựng bảng phân vùng cự ly địa lý 5 bậc:** Đề xuất khung phụ thu ban đầu cho các tỉnh Tây Nam Bộ lấy tâm điểm từ Vĩnh Long / Bến Tre / Cần Thơ.

#### Tuần 2 — Đối sánh 4 Studio & Chuẩn hóa Lịch biểu
* **Khảo sát đối sánh thị trường:** Phân tích chi tiết mô hình hoạt động, cơ cấu giá, quy trình cọc, hủy đổi lịch của 4 đơn vị:
  * *Gạo Nâu:* Phân khúc chân dung nghệ thuật / gia đình tại Hà Nội & TP.HCM.
  * *HThao Studio:* Cho thuê thợ chụp tiệc cưới sự kiện tại TP.HCM.
  * *Ảnh Tiệc Vĩnh Long:* Phân khúc tiệc cưới hỏi truyền thống và phóng sự tại Vĩnh Long.
  * *Cao Hiển Studio:* Phân khúc cưới hỏi trọn gói, ngoại cảnh, quay phim và thuê thiết bị tại Bến Tre & Miền Tây.
* **Tối ưu hóa Lịch biểu (Calendar Engine):**
  * Bổ sung nhận diện và tô màu riêng biệt cho các ngày lễ quốc gia, ngày âm lịch và ngày nghỉ định kỳ của studio.
  * Ngăn chặn khách đặt lịch vào các ngày studio tạm đóng cửa.

#### Tuần 3 — Chuẩn hóa Phụ thu Cự ly OSRM & Tối ưu Luồng Đặt Lịch
* **Khung phụ thu di chuyển đường bộ 7 bậc chính thức:**
  * Điểm gốc xuất phát: Trung tâm TP. Bến Tre (`lat: 10.2433, lon: 106.3756`).
  * `0 – 30 km`: Miễn phí (Bến Tre, Tiền Giang - Mỹ Tho...).
  * `31 – 70 km`: 300.000đ (Long An - Tân An, Trà Vinh...).
  * `71 – 100 km`: 500.000đ (Vĩnh Long, TP.HCM...).
  * `101 – 150 km`: 800.000đ (Cần Thơ, Đồng Tháp - Cao Lãnh, An Giang - Long Xuyên, Hậu Giang - Vị Thanh...).
  * `151 – 200 km`: 1.200.000đ (Tây Ninh, Sóc Trăng, Bà Rịa - Vũng Tàu, Kiên Giang - Rạch Giá, Châu Đốc...).
  * `201 – 250 km`: 1.500.000đ (Bạc Liêu, Cà Mau, Bình Thuận - Phan Thiết...).
  * `Trên 250 km hoặc địa hình đèo`: Lâm Đồng (Đà Lạt, Bảo Lộc...) ➔ Studio xác nhận chi phí thực tế, xe riêng và lưu trú trước khi chốt.
* **Tích hợp OpenStreetMap / OSRM Routing API:**
  * Endpoint `backend/utils/travelPricing.js` tự động tính cự ly bộ hành một chiều làm tròn lên km nguyên.
  * Tự động điều chỉnh phụ thu vào tổng đơn đặt lịch ngoại cảnh, hiển thị minh bạch tại bước xác nhận và trên hợp đồng PDF.
* **Lưu nháp đặt lịch trong `sessionStorage`:**
  * Lưu trữ tạm dữ liệu đặt lịch (dịch vụ, ngày chụp, khu vực, cự ly, tọa độ) trong phiên làm việc.
  * Khách có thể chuyển hướng đăng nhập/đăng ký hoặc chọn tiếp tục với tư cách khách (xác thực OTP email) mà không bị mất dữ liệu đã chọn.
* **Đồng bộ toàn diện lên Admin:**
  * Cho phép Admin điều chỉnh phụ thu di chuyển linh hoạt trên `AdminOrders.jsx`.
  * Hỗ trợ cập nhật trạng thái phụ thu (`NOT_APPLICABLE`, `ESTIMATED`, `QUOTE_REQUIRED`).

#### Tuần 4 — Chuẩn Hóa Modal Quản Trị Đơn & Tối Ưu UX Chốt Hợp Đồng
* **Bổ sung mục Thông tin khách hàng vào Modal Chỉnh sửa thông tin đơn:**
  * Thêm cụm Họ và tên khách hàng (`customer_full_name`), Số điện thoại (`customer_phone`), Email nhận hợp đồng (`customer_email`) trực tiếp trên đầu Modal `AdminOrders.jsx`.
  * Hỗ trợ admin tra cứu liên hệ nhanh để gọi điện/Zalo tư vấn và cập nhật khi khách hàng thay đổi thông tin liên lạc.
  * Backend (`bookingController.updateBookingInfo`) cập nhật trực tiếp vào đơn đặt lịch; dữ liệu hợp đồng lấy từ booking trước khi điền template DOCX/XLSX và xuất PDF.
* **Tối giản UX Tài chính & Loại bỏ Dropdown "Trạng thái phụ thu":**
  * Gỡ bỏ hoàn toàn dropdown *Trạng thái phụ thu (Không áp dụng / Đã xác định / Studio cần báo giá)* khỏi UI để tránh làm rối nhân viên chốt đơn.
  * Giữ lại 1 ô duy nhất: "Phụ thu di chuyển". Tự động khóa 0đ khi chụp tại Studio; tự động tính và cho phép sửa số tiền khi chụp Ngoại cảnh.
  * Backend và Frontend tự động đồng bộ ngầm trạng thái phụ thu (`amount > 0 ? "ESTIMATED" : "NOT_APPLICABLE"`).
* **Chuẩn hóa Ký hiệu Tiền tệ (`addonAfter="đ"`):**
  * Bỏ chữ `(đ)` ở Label, chuyển sang dùng thuộc tính `addonAfter="đ"` nằm cố định ở góc phải bên trong từng ô `InputNumber`.
  * Tối ưu hóa parser và formatter để xử lý số tiền tiếng Việt mượt mà, không bị lỗi khi xóa trắng hoặc nhập số liệu.

#### Tuần 5 — Tự Động Hóa Hợp Đồng Đa Định Dạng (DOCX/XLSX) & Trang Biên Tập Hợp Đồng
* **Quản trị Template Hợp đồng Động (`/admin/contract-templates` - `AdminContractTemplates.jsx`):**
  * Xây dựng Model `ContractTemplate.js` và `contractTemplateController.js` quản trị template kích hoạt (`key: "active"`), lưu file trực tiếp trên Cloudinary (`caohienstudio/templates`) và metadata/version trong MongoDB.
  * Cho phép Admin upload template `.docx` hoặc `.xlsx` (giới hạn 15MB).
  * Tự động kiểm tra tính hợp lệ (validation) của template buffer trước khi lưu:
    * *DOCX:* Sử dụng `docxtemplater` và `InspectModule` để quét và xác thực danh sách placeholder hợp lệ (`{customer_name}`, `{shoot_date}`, `{total_amount}`, v.v.).
    * *XLSX:* Hỗ trợ 2 chế độ:
      - `PLACEHOLDER`: Đặt `{placeholder}` hoặc `{{placeholder}}` vào các ô.
      - `AUTO_LABEL`: Tự động nhận diện nhãn tiếng Việt ("Họ và tên", "Số điện thoại", "Địa chỉ", "Ngày chụp", "Tổng tiền", "Tiền cọc", bảng 5 dòng dịch vụ...).
      - Template mặc định: `backend/templates/contract-template.xlsx` tương thích ngược hoàn toàn.
* **Trang Biên Tập Hợp Đồng Chuyên Dụng (`/admin/orders/:id/contract` - `AdminContractEditor.jsx`):**
  * Tách biệt hoàn toàn luồng quản lý đơn và biên tập hợp đồng: Tại `AdminOrders.jsx`, Admin lưu thông tin đơn rồi bấm **"Tạo đơn & tiếp tục hợp đồng"** để chuyển sang trang biên tập.
  * Admin tinh chỉnh thông tin hợp đồng (họ tên, điện thoại, email, ngày chụp, buổi chụp, địa điểm, ghi chú riêng).
  * Hỗ trợ **Xem trước PDF trực tiếp (Live PDF Preview)** được sinh tức thời từ template qua LibreOffice headless.
  * Nút **"Tạo hợp đồng + link/QR"**: Điền dữ liệu vào template đang hoạt động, sinh file PDF qua LibreOffice, tự động upload lên Cloudinary (`caohienstudio/contracts`), lưu `contract_file_url`, sinh `contract_token`, tạo mã QR tra cứu trực tuyến `/contract-review/:bookingId`, và chuyển trạng thái đơn sang `CONTRACT_SENT`.
* **Gỡ bỏ hoàn toàn luồng upload file PDF thủ công:**
  * Loại bỏ `uploadController.uploadSinglePdf`, xóa route `POST /api/upload/pdf`, gỡ bỏ `backend/utils/contractPdf.js` (PDFKit cũ) và xóa modal upload PDF thủ công tại `AdminOrders.jsx`.
  * Đảm bảo tính nhất quán và tự động hóa 100%: mọi hợp đồng đều được chuẩn hóa và sinh tự động từ template của studio.
* **Đóng gói Dockerfile phục vụ Deploy Cloud (LibreOffice + Node.js 22):**
  * Xây dựng `Dockerfile` (Node 22-bookworm-slim) cài đặt sẵn `libreoffice-calc`, `libreoffice-writer` và font chữ Noto/Liberation tiếng Việt, giúp máy chủ Render chuyển đổi DOCX/XLSX sang PDF chuẩn xác, không bị lỗi font hay thiếu dependency.
  * Hỗ trợ cấu hình `LIBREOFFICE_PATH` trong `.env` cho môi trường Windows local (tự động nhận diện `soffice.exe`).

#### Tuần 6 — Hợp Nhất Chỉnh Sửa Thông Tin Đơn & Biên Tập Hợp Đồng Live Preview
* **Gộp toàn diện 2 bước riêng biệt thành 1 trang duy nhất (`/admin/orders/:id` - `AdminOrderDetail.jsx`):**
  * Gỡ bỏ Modal chỉnh sửa đơn cồng kềnh trong `AdminOrders.jsx` và gộp trang `AdminContractEditor.jsx` vào một trang chi tiết hợp nhất.
  * **Nửa trên:** Form chỉnh sửa đầy đủ thông tin đơn (khách hàng, gói chính, gói đi kèm, lịch chụp, địa điểm Photon OSRM, phụ thu di chuyển 7 bậc, tổng tiền, tiền cọc, ghi chú đơn và ghi chú in trên hợp đồng).
  * **Nửa dưới:** Trình xem trước hợp đồng PDF trực tiếp (Live PDF Preview) qua iframe với LibreOffice headless.
  * **Vòng lặp chỉnh sửa tức thì:** Bất cứ khi nào admin thêm/bớt gói, đổi địa chỉ, thay đổi tiền cọc hay điều khoản, chỉ cần bấm **"Cập nhật xem trước"**, hệ thống tự động lưu vào đơn và sinh ngay bản PDF mới bên dưới để kiểm tra trước khi chốt.
  * **Tạo hợp đồng + mã QR 1-click:** Nút bấm trực tiếp tại trang chi tiết để upload Cloudinary, tạo token, sinh mã QR tra cứu và chuyển trạng thái đơn sang `CONTRACT_SENT`.

---

### 🚀 Giai đoạn 2: Hoàn thiện tính năng Studio & Mở rộng hệ thống

1. **Phân quyền Super Admin & Chế độ Bảo trì (SiteLock):**
   * Phân cấp người dùng: `customer` < `admin` < `super_admin`.
   * Super Admin có quyền quản trị danh sách Admin (tạo mới, cấp quyền, xóa tài khoản).
   * Chế độ `SiteLock` cho phép Super Admin tạm khóa website để bảo trì, hiển thị trang `MaintenancePage` giao diện sang trọng, chỉ cho phép admin đăng nhập.
   * Thiết kế trang 404 Luxury (`NotFound.jsx`).
2. **Dịch vụ Thuê Thiết Bị / Máy Ảnh (Camera Rental):**
   * Model `CameraRental.js` và controller quản trị thiết bị, máy ảnh, ống kính.
   * Giao diện khách hàng `/camera-rental` hiển thị thông số, giá thuê theo ngày, tình trạng sẵn sàng.
3. **Quản lý Banner quảng cáo & Hình ảnh Website:**
   * Quản lý banner ưu đãi tại trang chủ (`AdminBanners.jsx`).
   * Quản lý hình ảnh động cho trang Home, About, Gallery (`AdminWebsiteImages.jsx`).
4. **Lưu trữ đám mây đa tầng (Cloudinary + Google Drive):**
   * Tích hợp Cloudinary cho các tác vụ upload ảnh nhanh (thumbnail, cover, avatar, banner) và lưu trữ template/file PDF hợp đồng sinh tự động thay cho ổ đĩa Render dễ mất dữ liệu.
   * Tích hợp Google Drive API (`googleapis`) cho các album ảnh chất lượng cao dung lượng lớn.
5. **AI Chatbot CSKH (Google Gemini API):**
   * Tích hợp Gemini Flash API (`@google/generative-ai`) tại `aiChatController.js` và widget góc màn hình `AIChatWidget.jsx`.
   * Cung cấp ngữ cảnh studio để giải đáp dịch vụ, thời gian làm việc và giá cả tự động.
6. **Hệ thống Email chuẩn hóa toàn diện (Resend REST API qua HTTPS):**
   * Đã loại bỏ hoàn toàn Nodemailer SMTP và App Password Gmail (khắc phục triệt để việc Render chặn outbound SMTP ports 25, 465, 587).
   * Thống nhất 100% gửi qua Resend REST API (`RESEND_API_KEY`, `EMAIL_FROM`) cho cả Local Development và Render Production.
   * Sử dụng verified custom domain trên Resend, đảm bảo gửi OTP và hợp đồng tức thì, không bị spam filter hay timeout.
7. **Tự động hóa Hợp đồng Studio & Bỏ Cổng Thanh Toán VNPay/PayOS:**
   * Đã loại bỏ hoàn toàn cổng thanh toán phức tạp (VNPay, PayOS) để phù hợp với thực tế vận hành của studio ảnh cưới hỏi.
   * Thanh toán thực hiện bằng Tiền mặt tại studio HOẶC Chuyển khoản ngân hàng theo mã QR cố định.
   * Admin lưu đơn trước, biên tập hợp đồng trên trang riêng (`/admin/orders/:id/contract`), sinh PDF từ template DOCX/XLSX đang hoạt động thông qua LibreOffice headless, sau đó hệ thống tạo link và QR tra cứu đơn `/contract-review/:bookingId`.
   * Template hợp đồng được quản lý tại `/admin/contract-templates`, lưu file trên Cloudinary và metadata/phiên bản trong MongoDB (`ContractTemplate`). DOCX dùng `Docxtemplater` + `PizZip`; XLSX dùng `ExcelJS`; LibreOffice chuyển cả hai sang PDF. Template XLSX mặc định tiếp tục dùng ánh xạ ô tương thích.
   * Admin duyệt cọc thủ công qua API `/confirm-deposit`, hệ thống tự động cập nhật trạng thái và gửi email xác nhận kèm hợp đồng hoàn tất.

---

## 4. Kiến Trúc Kỹ Thuật (Architecture & Tech Stack)

### 4.1 Frontend Stack
* **Cốt lõi:** React 19 (Vite), React Router v7.
* **Giao diện:** Ant Design (v6), Vanilla CSS với hệ màu Studio (Gold `#BFA16A`, Kem `#FAF7F2`, Nền tối `#1A1A1A`).
* **Không sử dụng:** TailwindCSS (tránh xung đột css và giữ nguyên bản sắc thiết kế antd).
* **Quản lý state & API:** Axios instance có interceptor JWT token; Socket.io-client đồng bộ realtime.
* **Tiện ích:** Dayjs (xử lý ngày/lịch âm), dnd-kit (sắp xếp thứ tự ảnh), Recharts (biểu đồ doanh thu admin).
* **Các trang quản trị chính:**
  * `AdminOrders.jsx`: Quản lý danh sách đơn, lọc theo trạng thái, chốt cọc và phân công thợ.
  * `AdminOrderDetail.jsx`: Trang hợp nhất chi tiết đơn hàng & biên tập hợp đồng (chỉnh sửa thông số, xem trước PDF thời gian thực và sinh link/QR hợp đồng).
  * `AdminContractTemplates.jsx`: Quản trị upload và kích hoạt template hợp đồng (.docx, .xlsx).
  * `AdminGalleries.jsx`, `AdminBanners.jsx`, `AdminCameraRentals.jsx`, `AdminHolidays.jsx`, `AdminWebsiteImages.jsx`, `AdminUsers.jsx`.

### 4.2 Backend Stack
* **Runtime & Framework:** Node.js 22 (CommonJS), Express.js v5.
* **Cơ sở dữ liệu:** MongoDB với Mongoose v9.
* **Cơ chế xác thực:** JWT lưu trữ tại header `Authorization: Bearer <token>`, mật khẩu mã hóa bcrypt/bcryptjs.
* **Xử lý tài liệu & Template:** `docxtemplater`, `pizzip`, `exceljs`, LibreOffice (Headless CLI converter), `qrcode`.
* **Cấu trúc thư mục:**
  * `controllers/`: Chứa toàn bộ business logic (`bookingController`, `contractTemplateController`, `authController`, `cameraController`, `holidayController`, `serviceController`, `bannerController`, `uploadController`...).
  * `models/`: Schema Mongoose (`Booking`, `ContractTemplate`, `User`, `Service`, `CameraRental`, `Holiday`, `Banner`, `SiteLock`, `Payment`...).
  * `routes/`: Express routers phân tách rõ ràng theo domain (`bookingRoutes`, `websiteRoutes`, `authRoutes`, `serviceRoutes`...).
  * `services/`: Encapsulation cho Google Drive (`googleDriveService.js`), Mailer (Resend REST API `emailSender.js` & `mailService.js`), Hợp đồng template (`contractTemplateService.js`), AI Gemini.
  * `utils/`: `qrCode.js` (tạo mã QR link tra cứu hợp đồng), `travelPricing.js` (tính cự ly và phụ thu OSRM).
  * `templates/`: Chứa file template hợp đồng mặc định fallback (`contract-template.xlsx`).
  * `middleware/`: Auth middleware (`verifyToken`, `isAdmin`, `isSuperAdmin`), Multer upload.
  * `jobs/`: `cronJobs.js` thực hiện các tác vụ định kỳ (nhắc lịch chụp).
* **Môi trường & Container:**
  * `Dockerfile`: Chạy trên nền Debian Bookworm Slim, cài đặt sẵn LibreOffice và font tiếng Việt phục vụ Render production.
  * `LIBREOFFICE_PATH`: Biến môi trường trỏ đến file thực thi `soffice.exe` trên máy local Windows.

---

## 5. Quy Chuẩn Vòng Đời Đơn Hàng (Booking State Machine)

```
[Khách gửi yêu cầu / Admin tạo hộ]
                 │
                 ▼
            REQUESTED (Yêu cầu mới)
                 │
                 ├─► CANCELED (Hủy đơn)
                 ▼
     [Admin lưu đơn & biên tập hợp đồng
      tại /admin/orders/:id/contract:
      sinh PDF từ template DOCX/XLSX + QR code]
                 │
                 ▼
          CONTRACT_SENT (Đã lập hợp đồng)
                 │
                 ├─► CANCELED (Hủy đơn)
                 ▼
         WAITING_PAYMENT (Chờ thanh toán cọc)
                 │
                 ├─► CANCELED (Hủy đơn)
                 ▼
       [Admin duyệt cọc: Tiền mặt / CK]
                 │
                 ▼
             CONFIRMED (Đã xác nhận cọc & chốt lịch)
                 │
                 ├─► CANCELED (Hủy đơn)
                 ▼
            IN_PROGRESS (Đang thực hiện chụp / hậu kỳ)
                 │
                 ▼
             COMPLETED (Đã bàn giao sản phẩm & tất toán)
```

---

## 6. Hướng Dẫn Dành Cho AI Khi Chỉnh Sửa Mã Nguồn

1. **Về Giao diện & CSS:**
   * Sử dụng Vanilla CSS hoặc Ant Design token/theme.
   * **Tuyệt đối không tự ý cài đặt hoặc sử dụng TailwindCSS.**
   * Giữ vững tính thẩm mỹ sang trọng, tinh tế của một Studio nhiếp ảnh cao cấp (màu gold `#BFA16A`, độ tương phản cao, typography hiện đại).
2. **Về Phân chia Phân hệ Routes:**
   * Luôn tuân thủ cấu trúc trong `frontend/src/App.jsx`.
   * Trang khách hàng nằm trong layout `CustomerLayout`.
   * Trang quản trị nằm trong layout `AdminLayout` và bắt buộc bảo vệ bằng route kiểm tra quyền.
3. **Về Xử lý Tài chính & Phụ thu:**
   * Không đưa cổng thanh toán tự động bên thứ ba (VNPay, PayOS) vào luồng thanh toán chính trừ khi có chỉ đạo mới.
   * Phụ thu di chuyển chụp ngoại cảnh phải luôn tuân thủ bảng 7 bậc cự ly tại `backend/utils/travelPricing.js` và `frontend/src/utils/shootingLocations.js`.
4. **Về Gửi Email & Môi trường Deploy:**
   * Thống nhất 100% sử dụng Resend REST API qua HTTPS port 443 cho cả Localhost và Render Deploy (`RESEND_API_KEY`, `EMAIL_FROM`).
   * Không sử dụng Nodemailer SMTP hay cổng TCP SMTP (25, 465, 587) để tránh bị chặn kết nối.
5. **Về Xử lý Hợp đồng & Template:**
   * Luôn sử dụng `contractTemplateService.js` để điền dữ liệu và xuất PDF hợp đồng từ template DOCX/XLSX đang hoạt động.
   * Không tự ý cài đặt lại `pdfkit` hoặc tạo lại luồng upload PDF thủ công ngoài hệ thống.
   * Template DOCX dùng placeholder `{field_name}`. Template XLSX dùng placeholder `{field_name}` / `{{field_name}}` hoặc cơ chế tự dò nhãn `AUTO_LABEL`.
   * Khi kiểm thử xuất PDF trên local Windows, đảm bảo máy đã cài đặt LibreOffice hoặc cấu hình `LIBREOFFICE_PATH` trong `.env`. Trên môi trường container/Render, luôn dùng `Dockerfile` đã được cài sẵn LibreOffice và font tiếng Việt.
6. **Về Tài liệu Khóa Luận:**
   * Khi chỉnh sửa hoặc tham chiếu tài liệu Word, luôn đối chiếu với [WORD_RUBRIC.md](WORD_RUBRIC.md).
   * Không tự bịa đặt số liệu kiểm thử hay khảo sát thực tế.
