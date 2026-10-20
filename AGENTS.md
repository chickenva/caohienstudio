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
1. **Khách hàng (Customer Portal):** Giới thiệu dịch vụ cưới hỏi (truyền thống, phóng sự cưới, lễ gia tiên, nhóm họ, lạy công cô), chụp ngoại cảnh, tiệc cưới; đặt lịch trực tuyến có định tuyến phụ thu di chuyển tự động; tra cứu hợp đồng điện tử; xem danh mục thiết bị máy ảnh cho thuê; tư vấn AI Chatbot (Gemini) và kênh Zalo.
2. **Quản trị (Admin & Super Admin Portal):** Quản lý toàn diện vòng đời đơn đặt lịch; phân công thợ chụp nội bộ hoặc freelancer; duyệt cọc thủ công (tiền mặt / chuyển khoản); sinh hợp đồng PDF tự động có mã QR; quản lý thư viện ảnh đồng bộ Google Drive & Cloudinary; quản lý thiết bị cho thuê; thiết lập ngày nghỉ studio; quản lý tài khoản và chế độ bảo trì hệ thống (SiteLock).

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
   * Tích hợp Cloudinary cho các tác vụ upload ảnh nhanh (thumbnail, cover, avatar, banner) thay cho ổ đĩa Render dễ mất dữ liệu.
   * Tích hợp Google Drive API (`googleapis`) cho các album ảnh chất lượng cao dung lượng lớn.
5. **AI Chatbot CSKH (Google Gemini API):**
   * Tích hợp Gemini Flash API (`@google/generative-ai`) tại `aiChatController.js` và widget góc màn hình `AIChatWidget.jsx`.
   * Cung cấp ngữ cảnh studio để giải đáp dịch vụ, thời gian làm việc và giá cả tự động.
6. **Hệ thống Email linh hoạt (Resend API + SMTP Gmail):**
   * Local development: dùng SMTP Gmail (`EMAIL_USER`, `EMAIL_PASS`).
   * Render Free Hosting: tự động chuyển sang Resend API (`RESEND_API_KEY`, `EMAIL_FROM`) qua HTTPS để không bị chặn outbound SMTP port.
   * Hỗ trợ gửi mã OTP xác thực email và gửi hợp đồng PDF đính kèm.
7. **Tự động hóa Hợp đồng Studio & Bỏ Cổng Thanh Toán VNPay/PayOS:**
   * Đã loại bỏ hoàn toàn cổng thanh toán phức tạp (VNPay, PayOS) để phù hợp với thực tế vận hành của studio ảnh cưới hỏi.
   * Thanh toán thực hiện bằng Tiền mặt tại studio HOAC Chuyển khoản ngân hàng theo mã QR cố định.
   * Tự động sinh file PDF Hợp đồng (`PDFKit`) chứa đầy đủ điều khoản pháp lý, chi tiết dịch vụ, phụ thu di chuyển và mã QR tra cứu đơn `/contract-review/:bookingId`.
   * Admin duyệt cọc thủ công qua API `/confirm-deposit`, hệ thống tự động cập nhật trạng thái và gửi email xác nhận kèm hợp đồng hoàn tất.

---

## 4. Kiến Trúc Kỹ Thuật (Architecture & Tech Stack)

### 4.1 Frontend Stack
* **Cốt lõi:** React 19 (Vite), React Router v7.
* **Giao diện:** Ant Design (v6), Vanilla CSS với hệ màu Studio (Gold `#BFA16A`, Kem `#FAF7F2`, Nền tối `#1A1A1A`).
* **Không sử dụng:** TailwindCSS (tránh xung đột css và giữ nguyên bản sắc thiết kế antd).
* **Quản lý state & API:** Axios instance có interceptor JWT token; Socket.io-client đồng bộ realtime.
* **Tiện ích:** Dayjs (xử lý ngày/lịch âm), dnd-kit (sắp xếp thứ tự ảnh), Recharts (biểu đồ doanh thu admin).

### 4.2 Backend Stack
* **Runtime & Framework:** Node.js (CommonJS), Express.js v5.
* **Cơ sở dữ liệu:** MongoDB với Mongoose v9.
* **Cơ chế xác thực:** JWT lưu trữ tại header `Authorization: Bearer <token>`, mật khẩu mã hóa bcrypt/bcryptjs.
* **Cấu trúc thư mục:**
  * `controllers/`: Chứa toàn bộ business logic (booking, auth, camera, holiday, service, banner, upload...).
  * `models/`: Schema Mongoose (`Booking`, `User`, `Service`, `CameraRental`, `Holiday`, `Banner`, `SiteLock`, `Payment`...).
  * `routes/`: Express routers phân tách rõ ràng theo domain.
  * `services/`: Encapsulation cho Google Drive, Mailer (SMTP & Resend), AI Gemini.
  * `utils/`: `contractPdf.js` (sinh PDF hợp đồng), `travelPricing.js` (tính cự ly và phụ thu OSRM).
  * `middleware/`: Auth middleware (`verifyToken`, `isAdmin`, `isSuperAdmin`), Multer upload.
  * `jobs/`: `cronJobs.js` thực hiện các tác vụ định kỳ.

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
   * Luôn hỗ trợ cả hai phương thức: `smtp` cho máy local và `resend` qua HTTP API cho môi trường Render production.
5. **Về Tài liệu Khóa Luận:**
   * Khi chỉnh sửa hoặc tham chiếu tài liệu Word, luôn đối chiếu với [WORD_RUBRIC.md](WORD_RUBRIC.md).
   * Không tự bịa đặt số liệu kiểm thử hay khảo sát thực tế.
