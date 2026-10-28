# KẾ HOẠCH THIẾT KẾ LOGIC GIỜ CHỤP & THỜI KHÓA BIỂU QUẢN LÝ LỊCH STUDIO
## Cao Hiển Studio — Hệ Thống Đặt Lịch & Quản Lý Studio Chụp Ảnh

* **Cơ sở đào tạo:** Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh (HCMUTE) — Khoa CNTT, Bộ môn CNPM.
* **Học phần:** Khóa Luận Tốt Nghiệp (KLTN) — Kỹ thuật Phần mềm (Khóa 2022 – 2026).
* **Sinh viên thực hiện:** Hồ Vũ Anh — MSSV: `22110097`.
* **Giảng viên hướng dẫn:** ThS. Trương Thị Ngọc Phượng.
* **Tài liệu tham chiếu:** [AGENTS.md](AGENTS.md) | [WORD_RUBRIC.md](WORD_RUBRIC.md).

---

## 1. Đặt Vấn Đề & Khảo Sát Nghiệp Vụ Thực Tế

### 1.1. Bối cảnh đặc thù ngành ảnh cưới hỏi & ngoại cảnh Miền Tây
Cao Hiển Studio hoạt động chủ lực tại Bến Tre và các tỉnh Tây Nam Bộ. Quy trình tổ chức cưới hỏi vùng Đồng bằng Sông Cửu Long có tính phong tục và giờ giấc rất nghiêm ngặt:
1. **Lễ Xuất giá / Rước dâu / Lễ gia tiên sáng sớm (06:00 – 09:30):** Nhà trai qua nhà gái rước dâu đúng giờ hoàng đạo (thường rất sớm để kịp giờ làm lễ gia tiên và di chuyển qua phà/cầu).
2. **Tiệc cưới buổi trưa (10:30 – 13:30):** Đón khách và làm lễ tại nhà hàng hoặc tư gia.
3. **Tiệc cưới / Đêm nhạc buổi tối (17:30 – 21:30):** Khung giờ tiệc đãi bạn bè, đối tác phổ biến tại các trung tâm tiệc cưới.
4. **Lễ Nhóm họ / Xuất giá đêm trước (18:00 – 21:00):** Nghi thức họ hàng quây quần trước ngày rước dâu.
5. **Chụp ngoại cảnh nghệ thuật (Bến Tre, Cần Thơ, Vũng Tàu, Đà Lạt):** Đón ánh sáng bình minh (`05:00 – 08:30`) hoặc săn hoàng hôn (`15:30 – 18:30`).

### 1.2. Điểm nghẽn (Pain Points) của hệ thống hiện tại
* **Chỉ hỗ trợ 3 buổi cứng nhắc:** Hệ thống hiện chỉ có 3 buổi: Sáng (08:00 - 12:00), Chiều (13:00 - 17:00), Cả ngày (08:00 - 17:00). Thiếu hoàn toàn ca **Buổi Tối** và không có ô chọn **Giờ bấm máy cụ thể** (ví dụ: 06:30 sáng).
* **Hợp đồng PDF in sai giờ thực tế:** Do hệ thống tự gán `08:00` hoặc `13:00`, hợp đồng in ra không thể hiện đúng giờ thợ phải có mặt tại nhà khách.
* **Khó khăn khi tư vấn khách gọi điện:** Khách hỏi: *"Chủ nhật tuần này studio còn rảnh thợ chụp sáng không?"*. Nhân viên phải mở bảng Table 100 đơn dò từng dòng ngày tháng, rất dễ nhầm lẫn hoặc bỏ lỡ ca trống.
* **Nguy cơ trùng lịch (Conflict):** Chưa có công cụ cảnh báo trực quan khi một phòng chụp tại Studio bị đặt trùng giờ hoặc thiếu thợ chụp.

---

## 2. Chuẩn Hóa Logic Về "Giờ Chụp Cho Khách"

Hệ thống sẽ chuyển dịch từ mô hình *"Buổi chụp cứng nhắc"* sang mô hình **"2 Tầng Thời Gian: Buổi Chụp Tổng Quan + Khung Giờ Bấm Máy Cụ Thể"**.

```
[Chọn Ngày Chụp] ──► [Chọn Buổi Chụp] ──► [Tự động gợi ý] ──► [Admin/Khách chỉnh Giờ cụ thể]
                                      (VD: Sáng)               (VD: 06:30 - 10:30)
```

### 2.1. Phân loại Buổi chụp mở rộng (`shooting_session`)
Bổ sung các ca chụp phản ánh đúng 100% ca chụp thực tế:

| Mã Buổi (`enum`) | Tên hiển thị | Khung giờ gợi ý mặc định | Mục đích sử dụng thực tế |
| :--- | :--- | :--- | :--- |
| `MORNING` | **Sáng** | `08:00 – 12:00` *(tùy chỉnh từ 05:30)* | Lễ gia tiên, rước dâu sáng sớm, chụp studio sáng. |
| `AFTERNOON` | **Chiều** | `13:00 – 17:00` | Tiệc trưa muộn, ngoại cảnh hoàng hôn, tiệc chiều. |
| `EVENING` | **Tối** *(Mới)* | `17:30 – 21:30` | Lễ nhóm họ đêm trước, tiệc cưới nhà hàng tối. |
| `FULL_DAY` | **Cả ngày** | `08:00 – 17:00` *(hoặc trọn gói cưới)* | Lễ sáng + Tiệc trưa, hoặc đi ngoại cảnh xa cả ngày. |
| `CUSTOM` | **Linh hoạt** *(Mới)* | Cho phép chọn tự do | Các ca chụp phóng sự ngắn, chụp sự kiện theo giờ. |

### 2.2. Khung giờ chụp cụ thể (`exact_start_time` & `exact_end_time`)
* **Giao diện chọn giờ:** Sử dụng component `TimePicker.RangePicker` (Ant Design):
  * Định dạng: `HH:mm`.
  * Bước nhảy: 15 phút hoặc 30 phút.
* **Cơ chế gợi ý tự động (Smart Default):**
  * Khi chọn Buổi `Sáng` ➔ Tự động điền `08:00 – 12:00`.
  * Khi chọn Buổi `Chiều` ➔ Tự động điền `13:00 – 17:00`.
  * Khi chọn Buổi `Tối` ➔ Tự động điền `17:30 – 21:30`.
  * Khi chọn Buổi `Cả ngày` ➔ Tự động điền `08:00 – 17:00`.
  * Admin hoặc khách có thể chỉnh sửa lại giờ bất kỳ (ví dụ: `06:30 – 10:30`).
* **Đồng bộ vào Backend:**
  * `start_time = Ngày chụp + Giờ bắt đầu` (lưu chuẩn ISO UTC+7).
  * `end_time = Ngày chụp + Giờ kết thúc` (lưu chuẩn ISO UTC+7).
* **Đồng bộ lên Hợp đồng PDF (`contractPdf.js`):**
  * Hợp đồng sẽ in rõ:  
    *Thời gian thực hiện: Từ **06:30** đến **10:30**, ngày **15/11/2026** (Buổi sáng).*

---

## 3. Mô Hình Quản Lý Lịch Rảnh Studio (Studio Availability & Capacity)

Để nhân viên studio có thể tư vấn cho khách nhanh chóng và chính xác, hệ thống cần quản lý năng lực phục vụ theo 2 nhóm tài nguyên chính:

### 3.1. Phân định năng lực phục vụ (Resource Capacity)
1. **Tại Studio (`STUDIO`):**
   * Giới hạn: **1 ca chụp tại một thời điểm** (trừ khi studio mở rộng phòng chụp thứ 2).
   * Quy tắc bận: Nếu trong cùng một ngày, khung giờ `[start_time, end_time]` có một đơn Studio khác đang ở trạng thái hiệu lực (`REQUESTED`, `CONTRACT_SENT`, `WAITING_PAYMENT`, `CONFIRMED`, `IN_PROGRESS`) thì khung giờ đó bị **BẬN**.
2. **Ngoại cảnh / Tiệc cưới (`OUTDOOR`):**
   * Phụ thuộc vào **số lượng ekip thợ** (Photographer + Videographer).
   * Giai đoạn 1: Giới hạn tối đa **2 ekip ngoại cảnh song song** trong cùng một buổi.
   * Giai đoạn 2: Cho phép gán trực tiếp thợ chụp (`assigned_staff_ids`), thợ nào đã có lịch thì không thể gán vào đơn khác cùng giờ.

### 3.2. Trợ lý kiểm tra lịch rảnh trực tiếp trong Modal (Live Availability Checker)
Khi Admin mở Modal Chỉnh sửa thông tin đơn hoặc Tạo đơn hộ và chọn Ngày chụp:
* Hệ thống tự động quét các đơn trong ngày đó và hiển thị **Hộp tóm tắt tình trạng ngày (Mini Availability Badge)** ngay dưới ô Ngày chụp:
  * 🟢 **Ca Sáng:** Còn trống (Chưa có lịch).
  * 🟡 **Ca Chiều:** Đã có 1 ca Studio (*#A1B2C3 · 14:00 - 16:30 · Chân dung nghệ thuật*).
  * 🟢 **Ca Tối:** Còn trống.
* Nếu Admin chọn giờ bị trùng đè lên ca đã có:
  * Hiển thị cảnh báo viền đỏ thời gian thực:  
    *⚠️ Cảnh báo: Khung giờ 14:00 - 16:00 đã có đơn #A1B2C3 đã chốt cọc. Bạn có muốn đổi giờ khác không?*

---

## 4. Thiết Kế Thời Khóa Biểu Studio (Interactive Studio Timetable)

> **CÓ NÊN LÀM THỜI KHÓA BIỂU KHÔNG?**  
> **Khẳng định: RẤT NÊN VÀ BẮT BUỘC!** Đây là "bộ não" điều phối toàn bộ hoạt động tác nghiệp của Studio, mang lại trải nghiệm WOW cho giảng viên chấm KLTN và giá trị ứng dụng thực tiễn cao cho Cao Hiển Studio.

### 4.1. Vị trí đặt Thời khóa biểu
* Trong trang Quản lý đơn hàng ([AdminOrders.jsx](frontend/src/pages/admin/AdminOrders.jsx)), bổ sung thanh chuyển đổi góc trên:
  * **Tab 1: Danh sách đơn hàng (Bảng Table phẳng)** — Dùng để tìm kiếm, lọc tiền, xuất báo cáo.
  * **Tab 2: Thời khóa biểu lịch chụp (Weekly / Monthly Calendar)** — Dùng để theo dõi lịch tác nghiệp, tư vấn khách và xếp lịch nhanh.
* Bổ sung mục truy cập trực tiếp trên sidebar menu: `Đơn đặt lịch -> Lịch chụp Studio`.

---

### 4.2. Giao diện Thời khóa biểu Tuần (Weekly Timetable View) — Trực quan nhất
Đây là giao diện mô phỏng một **Thời khóa biểu chuyên nghiệp**, chia theo 7 ngày trong tuần:

```
┌───────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   CA CHỤP     │  THỨ 2 (10)  │  THỨ 3 (11)  │  THỨ 4 (12)  │  THỨ 5 (13)  │  THỨ 6 (14)  │  THỨ 7 (15)  │  CHỦ NHẬT(16)│
│               │ (01/10 Âm)   │ (02/10 Âm)   │ (03/10 Âm)   │ (04/10 Âm)   │ (05/10 Âm)   │ (06/10 Âm)   │ (07/10 Âm)   │
├───────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│               │ 🟢 CÒN TRỐNG │ 🟦 ĐƠN #A1B2 │ 🟢 CÒN TRỐNG │ 🟢 CÒN TRỐNG │ 🟨 ĐƠN #C3D4 │ 🟥 ĐƠN #E5F6 │ 🟥 ĐƠN #G7H8 │
│  CA SÁNG      │ [ + Xếp ca ] │ 08:30-11:30  │ [ + Xếp ca ] │ [ + Xếp ca ] │ 09:00-11:00  │ 06:30-10:30  │ 07:00-11:30  │
│ 07:30 - 12:00 │              │ Studio       │              │              │ Ngoại cảnh   │ Phóng sự cưới│ Cưới truyền  │
│               │              │ Anh Tuấn     │              │              │ Chị Lan      │ Thảo & Minh  │ thống        │
├───────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│               │ 🟢 CÒN TRỐNG │ 🟢 CÒN TRỐNG │ 🟦 ĐƠN #K9L0 │ 🟢 CÒN TRỐNG │ 🟢 CÒN TRỐNG │ 🟨 ĐƠN #M1N2 │ 🟢 CÒN TRỐNG │
│  CA CHIỀU     │ [ + Xếp ca ] │ [ + Xếp ca ] │ 14:00-16:30  │ [ + Xếp ca ] │ [ + Xếp ca ] │ 13:30-16:00  │ [ + Xếp ca ] │
│ 13:00 - 17:30 │              │              │ Studio       │              │              │ Ngoại cảnh   │              │
├───────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│               │ 🟢 CÒN TRỐNG │ 🟢 CÒN TRỐNG │ 🟢 CÒN TRỐNG │ 🟢 CÒN TRỐNG │ 🟢 CÒN TRỐNG │ 🟥 ĐƠN #P3Q4 │ 🟨 ĐƠN #R5S6 │
│  CA TỐI       │ [ + Xếp ca ] │ [ + Xếp ca ] │ [ + Xếp ca ] │ [ + Xếp ca ] │ [ + Xếp ca ] │ 18:00-21:30  │ 18:30-21:00  │
│ 17:30 - 21:30 │              │              │              │              │              │ Tiệc tối     │ Nhóm họ      │
└───────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

#### Các thành phần chi tiết của ô lịch:
1. **Tiêu đề cột ngày:**
   * Thứ trong tuần + Ngày dương lịch (VD: *Thứ 7, 15/11*).
   * **Ngày âm lịch** (VD: *06/10 Âm lịch*) — Tích hợp thư viện [lunarSolar.js](frontend/src/utils/lunarSolar.js). Người Miền Tây xem ngày cưới rất chuộng ngày hoàng đạo âm lịch.
   * Nếu là ngày hôm nay: Nổi bật viền vàng Gold `#BFA16A`.
2. **Khi ô CÒN TRỐNG (Available):**
   * Nền xanh nhạt thanh lịch (`#F6FFED`), viền đứt nét (`border: 1px dashed #B7EB8F`).
   * Nút bấm `+ Xếp lịch nhanh`: Bấm vào mở ngay modal Tạo đơn với ngày và buổi đã được chọn sẵn.
3. **Khi ô ĐÃ CÓ ĐƠN (Booked):**
   * Thẻ Card Studio Luxury bo góc bo mềm:
     * Header thẻ: Mã đơn (`#A1B2C3`) + Giờ bấm máy cụ thể (`06:30 - 10:30`).
     * Body thẻ: Tên khách hàng + SĐT liên hệ.
     * Tên gói dịch vụ (VD: *Phóng sự cưới 2 máy*).
     * Tag hình thức: `🏠 Studio` (Màu xanh cyan) hoặc `🚗 Ngoại cảnh` (Màu cam/gold).
     * Tag trạng thái: `CONFIRMED` (Xanh lá), `WAITING_PAYMENT` (Vàng), `IN_PROGRESS` (Xanh dương).
   * Thao tác: Bấm vào thẻ để mở Drawer xem chi tiết đơn hoặc nút "Chỉnh sửa đơn".
4. **Khi là NGÀY NGHỈ STUDIO (Studio Holiday / Off-day):**
   * Toàn bộ cột hoặc ca đó được phủ sọc mờ xám đỏ (`#FFF2F0`), hiển thị badge `Studio Nghỉ: [Tên ngày lễ/nghỉ]`.
   * Vô hiệu hóa nút xếp lịch để tránh xung đột lịch đóng cửa studio.

---

### 4.3. Giao diện Lịch Tháng (Monthly Heatmap View)
* Cung cấp cái nhìn bao quát 30–31 ngày trong tháng.
* Mỗi ô ngày hiển thị mật độ bận theo 4 mức độ:
  * 🟢 **Xanh lá (Rảnh):** Trống hoàn toàn cả 3 ca ➔ Ngày lý tưởng để mời khách đặt.
  * 🟡 **Vàng (Còn chỗ):** Đã nhận 1 hoặc 2 ca ➔ Vẫn có thể nhận thêm ca còn lại.
  * 🔴 **Đỏ (Kín lịch):** Đã kín cả 3 ca hoặc hết thợ tác nghiệp.
  * ⛔ **Xám/Đỏ nhạt (Ngày nghỉ):** Studio tạm đóng cửa (Lễ Tết, du lịch nội bộ...).

---

### 4.4. Bộ lọc nhanh trên Thời khóa biểu
* **Lọc theo hình thức:** *Tất cả* | *Chỉ xem tại Studio* | *Chỉ xem Ngoại cảnh*.
* **Điều hướng thời gian:**
  * Nút `Hôm nay`, `Tuần trước`, `Tuần tới`.
  * Bộ chọn ngày nhanh `DatePicker` để nhảy ngay tới tuần của ngày khách hỏi.

---

## 5. Kiến Trúc Kỹ Thuật & CSDL (Technical Implementation)

### 5.1. Cập nhật Mongoose Schema ([Booking.js](backend/models/Booking.js))
```javascript
// Mở rộng enum shooting_session:
shooting_session: {
  type: String,
  enum: ["MORNING", "AFTERNOON", "EVENING", "FULL_DAY", "CUSTOM"],
  default: null,
},

// Giờ bắt đầu và kết thúc cụ thể (chính xác đến phút):
exact_start_time: { type: String, default: "" }, // VD: "06:30"
exact_end_time:   { type: String, default: "" }, // VD: "10:30"
```

### 5.2. Backend API Endpoints Mới
1. **Lấy dữ liệu thời khóa biểu theo tuần/tháng:**
   * `GET /api/bookings/admin/timetable?startDate=2026-11-10&endDate=2026-11-16`
   * Trả về danh sách đơn kèm theo thông tin ngày nghỉ studio ([Holiday.js](backend/models/Holiday.js)) trong cùng dải ngày để frontend vẽ bảng thời khóa biểu trong 1 request duy nhất.
2. **Kiểm tra ca trống thông minh (Smart Availability Check):**
   * `GET /api/bookings/admin/check-availability?date=2026-11-15&type=STUDIO&start=08:00&end=11:30`
   * Trả về: `{ isAvailable: true/false, conflictingBookings: [...], message: "..." }`.

### 5.3. Frontend Components Architecture
1. **`StudioTimetable.jsx` (Thành phần Thời khóa biểu chính):**
   * Đặt tại: `frontend/src/pages/admin/StudioTimetable.jsx`.
   * Sử dụng CSS Grid / Flexbox kết hợp Ant Design Card & Tag.
   * Kết hợp thư viện [lunarSolar.js](frontend/src/utils/lunarSolar.js) để tính ngày âm lịch tự động.
2. **Tích hợp vào [AdminOrders.jsx](frontend/src/pages/admin/AdminOrders.jsx):**
   * Thêm `Segmented` hoặc `Tabs`:
     ```jsx
     <Segmented
       options={[
         { label: 'Danh sách đơn hàng', value: 'table', icon: <UnorderedListOutlined /> },
         { label: 'Thời khóa biểu lịch chụp', value: 'timetable', icon: <CalendarOutlined /> },
       ]}
       value={viewMode}
       onChange={setViewMode}
     />
     ```
3. **Nâng cấp Modal "Chỉnh sửa thông tin đơn":**
   * Thêm `shooting_session` ("Tối" & "Linh hoạt").
   * Thêm `TimePicker.RangePicker` chọn giờ cụ thể.
   * Thêm badge cảnh báo lịch bận trực tiếp.

---

## 6. Lộ Trình Triển Khai Chi Tiết (Roadmap)

| Giai đoạn | Nội dung công việc | Đầu ra mong đợi |
| :--- | :--- | :--- |
| **Giai đoạn 1** | **Backend Schema & API**<br>• Bổ sung enum `EVENING`, `CUSTOM` và giờ cụ thể vào `Booking`.<br>• Viết API `GET /api/bookings/admin/timetable`.<br>• Cập nhật [contractPdf.js](backend/utils/contractPdf.js) in giờ chi tiết. | API trả dữ liệu thời khóa biểu chuẩn xác, PDF in đúng giờ cụ thể. |
| **Giai đoạn 2** | **Nâng cấp Modal Chỉnh sửa & Tạo đơn**<br>• Bổ sung ô chọn giờ cụ thể (`TimePicker.RangePicker`).<br>• Tích hợp Live Availability Badge báo tình trạng ngày. | Modal sửa đơn có đầy đủ thông tin khách, giờ cụ thể và cảnh báo lịch. |
| **Giai đoạn 3** | **Xây dựng Thời khóa biểu Tuần (Weekly Timetable)**<br>• Xây dựng giao diện 7 cột x 3 ca chụp.<br>• Hiển thị song song ngày Âm lịch & Dương lịch.<br>• Thẻ đơn sang trọng, có nút tạo đơn nhanh tại ô trống. | Admin có giao diện thời khóa biểu trực quan để tư vấn cho khách. |
| **Giai đoạn 4** | **Kiểm thử & Tích hợp hoàn thiện**<br>• Tích hợp vào Tabs của `AdminOrders.jsx`.<br>• Kiểm thử luồng tư vấn, chốt giờ và xuất hợp đồng thực tế. | Tính năng vận hành mượt mà, sẵn sàng demo nghiệm thu KLTN. |

---

*Tài liệu được lập ngày 28/10/2026 bởi Hồ Vũ Anh dành riêng cho dự án Cao Hiển Studio.*
