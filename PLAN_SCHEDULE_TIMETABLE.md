# KẾ HOẠCH THIẾT KẾ THỜI KHÓA BIỂU QUẢN LÝ LỊCH CHỤP & ĐỒNG BỘ LỊCH ĐẶT KHÁCH HÀNG
## Cao Hiển Studio — Hệ Thống Đặt Lịch & Quản Lý Studio Chụp Ảnh

* **Cơ sở đào tạo:** Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh (HCMUTE) — Khoa CNTT, Bộ môn CNPM.
* **Học phần:** Khóa Luận Tốt Nghiệp (KLTN) — Kỹ thuật Phần mềm (Khóa 2022 – 2026).
* **Sinh viên thực hiện:** Hồ Vũ Anh — MSSV: `22110097`.
* **Giảng viên hướng dẫn:** ThS. Trương Thị Ngọc Phượng.
* **Tài liệu tham chiếu:** [AGENTS.md](AGENTS.md) | [WORD_RUBRIC.md](WORD_RUBRIC.md).

---

## 1. Phân Tích Bài Toán & Tư Vấn Chiến Lược Đồng Bộ Lịch (Trọng Tâm KLTN)

### 1.1. Bối cảnh nghiệp vụ thực tế tại Cao Hiển Studio
1. **Đặc thù thời gian tác nghiệp biến động (Case Study: Chụp ngoại cảnh xa):**
   * Khi khách đặt hoặc Admin tạo đơn chụp ngoại cảnh tại TP.HCM (cách Bến Tre ~85–90 km), gói dịch vụ ghi nhận là **Buổi sáng (`08:00 – 12:00`)**.
   * Tuy nhiên, trên thực tế vận hành, ekip phải xuất phát từ Bến Tre lúc `05:30` sáng và sau khi chụp xong lúc `12:00` phải di chuyển về lại Bến Tre đến `14:30 – 15:00` mới sẵn sàng cho ca tiếp theo.
   * Do đó, **Thời khóa biểu (Timetable)** bắt buộc phải cho phép Admin **tùy chỉnh lại thời gian bắt đầu / kết thúc dự kiến của từng đơn trên lịch** (ví dụ: kéo dài từ `08:00 – 12:00` thành `06:00 – 15:00`) để phản ánh đúng thời gian bận thực tế của ekip mà không làm sai lệch nội dung buổi chụp cam kết trên hợp đồng của khách.
2. **Nhu cầu vừa nhìn Thời khóa biểu vừa tư vấn chốt lịch:**
   * Khi khách gọi điện/nhắn Zalo hoặc vừa gửi yêu cầu đặt lịch (`REQUESTED`), Admin cần mở Thời khóa biểu tuần để nhìn ngay: *"Ngày đó khung giờ nào đã vướng lịch đi tỉnh, khung giờ nào còn trống"* để tư vấn và chốt giờ chính xác với khách.

---

### 1.2. Giải Quyết Điểm Phân Vân: Có Nên Đồng Bộ Thời Khóa Biểu Với Lịch Đặt Của Khách Hàng Không?

Đây là câu hỏi thiết kế hệ thống (System Design Trade-off) rất hay và chắc chắn Hội đồng chấm KLTN sẽ hỏi khi phản biện. Dưới đây là bảng đối sánh 3 phương án:

| Tiêu chí đánh giá | Phương án A: Chặn cứng ngày bận (Hard Block) | Phương án B: Không đồng bộ, chọn tự do 100% (No Sync) | Phương án C (ĐỀ XUẤT): Đồng bộ Cảnh báo mềm & Hiển thị khung giờ bận (Hybrid Smart Sync) |
| :--- | :--- | :--- | :--- |
| **Cách hoạt động** | Ngày nào có đơn trên Thời khóa biểu thì khóa (disable) không cho khách click chọn trên trang `/booking`. | Lịch của khách không liên kết với Thời khóa biểu. Khách chọn ngày nào cũng được, Admin gọi báo bận sau. | **Vẫn cho khách chọn mọi ngày** (trừ ngày Studio đóng cửa nghỉ lễ), nhưng **đồng bộ hiển thị trạng thái lịch & khung giờ đã có đơn** ngay khi khách bấm vào ngày đó. |
| **Góc độ Kinh doanh Studio** | ❌ **Rất bất lợi:**<br>1. Đơn mới chỉ bận buổi sáng (`08:00 – 14:00`), buổi chiều/tối vẫn rảnh nhưng khách bị chặn cả ngày.<br>2. Ngày tốt (Rằm, cuối tuần) studio có thể thuê thêm Freelancer (`external_staff`) để nhận 2–3 show cùng lúc. Chặn cứng sẽ làm mất doanh thu.<br>3. Đơn chưa cọc (`REQUESTED`) nếu khách hủy thì mất luôn khách thứ 2. | ⚠️ **Trung bình:**<br>Giữ được phễu thu thập khách hàng (Lead Capture), nhưng khách chọn ngày đang rất kín lịch mà không biết trước dễ bị hụt hẫng khi studio gọi điện báo đổi ngày. | ✅ **Tối ưu nhất:**<br>1. Không đánh rơi bất kỳ khách hàng nào (100% Lead Capture).<br>2. Khách thấy trước *"Ngày 15/11 đã có ca 08:00 - 15:00, còn trống ca Chiều/Tối"* nên chủ động tâm lý, khi Admin gọi tư vấn chốt giờ hoặc đổi ngày sẽ rất thuận lợi. |
| **Góc độ Bảo vệ KLTN (Hội đồng chấm)** | ⚠️ Dễ bị bắt bẻ: *"Nếu ngày đó mới có 1 đơn chụp 2 tiếng buổi sáng, tại sao hệ thống lại khóa cả ngày không cho khách khác đặt buổi chiều?"* | ❌ Dễ bị trừ điểm kỹ thuật: *"Tại sao Admin chỉnh giờ trên Thời khóa biểu mà bên trang Đặt lịch của khách không có sự liên thông dữ liệu nào?"* | 🌟 **Điểm cộng tuyệt đối:**<br>Chứng minh được **tính liên thông dữ liệu Realtime** giữa Thời khóa biểu Admin (kể cả sau khi Admin chỉnh giờ kết thúc dự kiến do đi xa) với giao diện Khách hàng, đồng thời giải thích thuyết phục bài toán nghiệp vụ linh hoạt của Studio. |

#### 💡 KẾT LUẬN TƯ VẤN: Chọn **Phương Án C (Hybrid Smart Sync — Đồng bộ hiển thị khung giờ bận nhưng KHÔNG chặn cứng khách chọn ngày)**, kết hợp cơ chế:
1. **Trên trang Đặt lịch của khách ([Booking.jsx](frontend/src/pages/customer/Booking.jsx)):**
   * Ô ngày trên lịch tháng có thêm chấm/badge trạng thái nhỏ tinh tế:
     * **Trống hoàn toàn:** Hiển thị bình thường.
     * **Đã có lịch một phần (Có đơn trong Thời khóa biểu):** Hiển thị chấm tròn màu Vàng Gold `#BFA16A` (hoặc nhãn nhỏ `Có lịch`). **Khách vẫn click chọn ngày đó thoải mái!**
   * Ngay khi khách click vào ngày đã có lịch, ở khung thông tin bên phải (cùng chỗ với Dự báo thời tiết), hệ thống hiển thị **Thẻ Trạng Thái Lịch Studio trong ngày** (đồng bộ trực tiếp từ Thời khóa biểu sau khi Admin đã chỉnh giờ):
     > 📅 **Tình trạng lịch ngày 15/11/2026:**
     > * **07:30 – 15:00:** Đã có lịch tác nghiệp *(Ngoại cảnh)*.
     > * **Khung giờ khác:** Đang còn trống.
     > * 💬 *Bạn vẫn có thể gửi yêu cầu đặt lịch vào ngày này. Studio sẽ liên hệ tư vấn khung giờ trống hoặc sắp xếp ekip phù hợp nhất cho bạn!*
2. **Quyền kiểm soát của Admin:**
   * Nếu một ngày thực sự quá tải (hết sạch cả thợ chính lẫn freelancer), Admin có thể bật nút **"Báo kín lịch ngày này"** hoặc tạo ngày nghỉ trong `Holiday` (`is_closed: true`) để chặn nhận đơn mới vào ngày đó.

---

## 2. Thiết Kế Cơ Chế "Giờ Thời Khóa Biểu" vs. "Giờ Hợp Đồng"

Để giải quyết đúng bài toán bạn nêu (*"Đơn chụp ngoại cảnh TP.HCM chọn buổi sáng nhưng thời gian đi lại nhiều hơn, sau khi thêm đơn Admin vào thời khóa biểu chỉnh thời gian kết thúc dự kiến"*), hệ thống cần phân tách thông minh **2 lớp thời gian** trên cùng một đơn hàng (`Booking`):

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           ĐƠN ĐẶT LỊCH (BOOKING)                           │
├─────────────────────────────────────┬──────────────────────────────────────┤
│ 1. GIỜ CHỤP CAM KẾT (HỢP ĐỒNG)      │ 2. GIỜ CHIẾM DỤNG THỜI KHÓA BIỂU     │
│ • shooting_session: "MORNING"       │ • start_time: 2026-11-15 06:30       │
│ • contract_time_label:              │ • end_time:   2026-11-15 15:00       │
│   "Buổi sáng (08:00 - 12:00)"       │ • schedule_note:                     │
│ • Dùng để in lên Hợp đồng PDF       │   "Tính thêm 3h di chuyển TPHCM"     │
│   gửi cho khách hàng.               │ • Dùng để vẽ khối bận trên Thời khóa │
│                                     │   biểu Admin & báo khung bận ở trang │
│                                     │   Đặt lịch khách hàng.               │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

### Quy tắc đồng bộ tự động & tùy chỉnh:
1. **Khi đơn hàng mới được tạo (Khách đặt hoặc Admin tạo đơn):**
   * Đơn hàng tự động xuất hiện ngay trên Thời khóa biểu tại ngày `start_time`.
   * Nếu chưa chọn giờ cụ thể, hệ thống tự gán khung giờ mặc định theo buổi:
     * **Chưa chốt buổi (Khách mới gửi yêu cầu):** Mặc định hiển thị ở hàng **"Chờ xếp ca / Tư vấn"** hoặc khung `08:00 – 12:00` (trạng thái `REQUESTED` màu cam nhạt để Admin biết cần gọi điện chốt giờ).
     * **Buổi sáng (`MORNING`):** `08:00 – 12:00`.
     * **Buổi chiều (`AFTERNOON`):** `13:00 – 17:00`.
     * **Buổi tối (`EVENING`):** `17:30 – 21:30`.
     * **Cả ngày (`FULL_DAY`):** `08:00 – 17:00`.
   * **Gợi ý thông minh theo cự ly OSRM:** Nếu là đơn `OUTDOOR` có `travel_distance_km > 30` (ví dụ đi TP.HCM 85 km), trên Thời khóa biểu sẽ hiện gợi ý nhỏ: *"💡 Đơn ngoại cảnh cách 85 km (~2h di chuyển/chiều). Bạn có muốn cộng thêm giờ di chuyển vào thời gian kết thúc dự kiến?"*.
2. **Khi Admin vào Thời khóa biểu để tùy chỉnh thời gian:**
   * Admin bấm trực tiếp vào thẻ đơn trên Thời khóa biểu ➔ Mở nhanh Modal/Drawer **"Điều chỉnh Thời gian trên Thời khóa biểu"**:
     * Chọn **Ca chụp (`shooting_session`)**: Sáng / Chiều / Tối / Cả ngày.
     * Chỉnh **Giờ bắt đầu (`start_time`)** và **Giờ kết thúc dự kiến (`end_time`)** bằng `TimePicker` (VD: chỉnh giờ kết thúc từ `12:00` thành `15:30`).
     * Nhập **Ghi chú điều phối (`schedule_note`)**: VD *"Tính cả thời gian đi về TP.HCM"*.
     * **Tùy chọn đồng bộ Hợp đồng (`sync_to_contract_time`):**
       * Nếu chỉ là cộng thêm giờ di chuyển nội bộ của ekip ➔ Giữ nguyên nhãn buổi chụp trên hợp đồng PDF là *"Buổi sáng (08:00 - 12:00)"*.
       * Nếu là Admin vừa gọi điện chốt đổi giờ chụp với khách (VD: khách xin chụp từ `09:00 – 13:00`) ➔ Bật công tắc *"Hiển thị khung giờ cụ thể này trên Hợp đồng PDF"*, hệ thống sẽ tự động in đúng `09:00 - 13:00` lên hợp đồng và tự động cập nhật lại file PDF hợp đồng!

---

## 3. Thiết Kế Giao Diện Thời Khóa Biểu Tuần (Admin Weekly Timetable)

### 3.1. Vị trí đặt để tiện dụng nhất cho Admin
1. **Trang Quản lý Đơn hàng ([AdminOrders.jsx](frontend/src/pages/admin/AdminOrders.jsx)):**
   * Đặt thanh chuyển đổi chế độ xem (`Segmented` / `Tabs`) ngay đầu trang:
     * 📋 **Danh sách đơn hàng** (Bảng quản lý chi tiết).
     * 📅 **Thời khóa biểu lịch chụp** (Lịch tuần trực quan theo khung giờ).
2. **Nút "Xem Thời khóa biểu" ngay trong trang Chi tiết đơn ([AdminOrderDetail.jsx](frontend/src/pages/admin/AdminOrderDetail.jsx)) & Tạo đơn ([CreateOrder.jsx](frontend/src/pages/admin/CreateOrder.jsx)):**
   * Khi Admin đang mở 1 đơn để gọi điện tư vấn cho khách, có nút **"📅 Mở Thời khóa biểu tuần này"** (mở Drawer hoặc Modal lớn ngay trên màn hình) để vừa nhìn toàn bộ lịch rảnh/bận trong tuần vừa chốt ngày giờ với khách mà không cần thoát khỏi trang đơn hàng!

### 3.2. Bố cục Thời Khóa Biểu Tuần (Timeline & Session Grid)
* **Thanh công cụ phía trên:**
  * Nút chuyển tuần: `◀ Tuần trước` | `Hôm nay` | `Tuần sau ▶` + Ô chọn ngày bất kỳ (`DatePicker`) để nhảy tới tuần mà khách đang hỏi.
  * Bộ lọc nhanh: `Tất cả đơn` | `🏠 Chụp tại Studio` | `🚗 Chụp Ngoại cảnh` | `Ẩn/Hiện đơn chờ duyệt`.
  * Thống kê nhanh trong tuần: *Tổng số ca chụp, Số ca Studio, Số ca Ngoại cảnh, Số đơn chờ chốt giờ*.
* **Lưới 7 cột (Thứ 2 ➔ Chủ Nhật):**
  * **Header mỗi cột ngày:**
    * Thứ + Ngày dương lịch (VD: **Thứ Bảy, 15/11**).
    * **Ngày Âm lịch** (VD: *06/10 ÂL* — tô vàng nếu là Mùng 1 / Rằm) để tiện tư vấn ngày cưới hỏi.
    * Badge Ngày lễ / Ngày nghỉ Studio (nếu có).
  * **Các thẻ đơn hàng (Schedule Cards) trong ngày:**
    * Sắp xếp theo thứ tự thời gian bắt đầu (`start_time` từ sớm đến muộn).
    * Hiển thị trực quan **Thanh thời gian thực tế**: Ví dụ `08:00 – 15:00 (7 giờ)`.
    * Nếu đơn kéo dài lấn sang buổi chiều (như đơn sáng đi TP.HCM tới `15:00` mới về), thẻ đơn sẽ hiển thị cảnh báo **`⚠️ Lấn sang ca chiều (đến 15:00)`** và tự động đánh dấu cảnh báo nếu có đơn buổi chiều bắt đầu trước `15:00`!
    * Màu sắc phân biệt rõ trạng thái:
      * 🟧 **Chờ tư vấn / Mới gửi (`REQUESTED`):** Viền cam nét đứt (Admin nhìn vào biết ngay đơn này cần gọi điện chốt giờ).
      * 🟨 **Chờ thanh toán cọc (`WAITING_PAYMENT` / `CONTRACT_SENT`):** Màu vàng ấm.
      * 🟩 **Đã chốt cọc (`CONFIRMED`):** Màu xanh lá đậm (Lịch cứng).
      * 🟦 **Đang thực hiện / Hoàn thành (`IN_PROGRESS` / `COMPLETED`):** Màu xanh dương / xám.
    * **Thao tác 1-Click trên thẻ đơn:**
      * 🕒 **Nút "Chỉnh giờ":** Mở ngay popup chỉnh giờ bắt đầu, giờ kết thúc dự kiến (cộng giờ đi lại), đổi ngày hoặc đổi buổi chụp ngay trên Thời khóa biểu.
      * 📄 **Nút "Chi tiết / Hợp đồng":** Chuyển tới trang biên tập đơn & hợp đồng (`/admin/orders/:id`).
  * **Nút `+ Thêm đơn vào ngày này`** ở cuối mỗi cột ngày: Bấm vào chuyển sang trang Tạo đơn với ngày chụp được điền sẵn.

---

## 4. Kiến Trúc Kỹ Thuật & Thay Đổi Mã Nguồn Dự Kiến

### 4.1. Backend (`backend/`)
1. **Model [Booking.js](backend/models/Booking.js):**
   * Mở rộng `shooting_session` enum: `["MORNING", "AFTERNOON", "EVENING", "FULL_DAY", "CUSTOM"]`.
   * Bổ sung các trường phục vụ Thời khóa biểu:
     * `custom_Time_Display` / `use_custom_time_on_contract` (`Boolean`, mặc định `false`): Cho phép Admin chọn có in giờ tùy chỉnh (`start_time` – `end_time`) lên hợp đồng hay giữ nguyên giờ chuẩn của buổi chụp (khi chỉ cộng giờ di chuyển nội bộ).
     * `schedule_note` (`String`, mặc định `""`): Ghi chú riêng trên thời khóa biểu (VD: *"Cộng 3 tiếng di chuyển Bến Tre - TP.HCM"*).
2. **Controller [bookingController.js](backend/controllers/bookingController.js) & Routes [bookingRoutes.js](backend/routes/bookingRoutes.js):**
   * **`GET /api/bookings/admin/timetable?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`**:
     * Trả về danh sách các đơn hàng hiệu lực (không tính `CANCELED`) trong khoảng thời gian, kèm thông tin gói chụp, khách hàng, thợ chụp, khoảng cách di chuyển, và danh sách ngày lễ/nghỉ (`Holiday`).
     * Tự động phát hiện xung đột thời gian (`conflicts`) nếu 2 đơn trùng khung giờ `[start_time, end_time]`.
   * **`PUT /api/bookings/:id/schedule`**:
     * API chuyên dụng để Admin cập nhật nhanh trên Thời khóa biểu: `shoot_date`, `shooting_session`, `start_time`, `end_time`, `schedule_note`, `use_custom_time_on_contract`.
     * Nếu `use_custom_time_on_contract = true` và đơn đã phát hành hợp đồng, tự động đồng bộ lại file PDF hợp đồng.
   * **`GET /api/bookings/public-schedule?month=YYYY-MM` (API Public an toàn cho trang Đặt lịch khách hàng):**
     * **Bảo mật thông tin tuyệt đối:** Không trả về tên khách, SĐT hay giá tiền.
     * Chỉ trả về danh sách các khung giờ bận theo từng ngày trong tháng (VD: `{ "2026-11-15": [{ start: "08:00", end: "15:00", shooting_type: "OUTDOOR", session: "MORNING" }] }`).

### 4.2. Frontend (`frontend/src/`)
1. **Component mới `frontend/src/components/admin/StudioTimetable.jsx`:**
   * Giao diện Thời khóa biểu tuần 7 ngày (Chuẩn màu Studio Luxury: Gold `#BFA16A`, Kem `#FAF7F2`, Đen `#1F1F1F`, không dùng TailwindCSS).
   * Tích hợp Modal **"Tùy chỉnh thời gian Thời khóa biểu"** (chỉnh giờ bắt đầu/kết thúc dự kiến, gợi ý cộng giờ di chuyển theo số km của đơn ngoại cảnh, ghi chú điều phối).
   * Phát hiện và hiển thị cảnh báo nếu giờ kết thúc dự kiến của đơn sáng (VD: `15:00`) bị chồng lấn với giờ bắt đầu của đơn chiều (VD: `13:00`).
2. **Tích hợp vào [AdminOrders.jsx](frontend/src/pages/admin/AdminOrders.jsx) và [AdminOrderDetail.jsx](frontend/src/pages/admin/AdminOrderDetail.jsx):**
   * Tại `AdminOrders.jsx`: Chuyển đổi mượt mà giữa **Danh sách đơn** và **Thời khóa biểu**.
   * Tại `AdminOrderDetail.jsx`: Có nút mở nhanh Thời khóa biểu trong Drawer để đối chiếu lịch rảnh ngay lúc đang sửa đơn / chốt hợp đồng với khách.
3. **Đồng bộ sang trang Đặt lịch Khách hàng ([Booking.jsx](frontend/src/pages/customer/Booking.jsx)):**
   * Gọi `GET /api/bookings/public-schedule?month=YYYY-MM` khi khách xem lịch tháng.
   * Hiển thị chấm báo hiệu tinh tế trên các ngày đã có lịch.
   * Khi khách chọn ngày đó, hiển thị khung **"Tình trạng lịch trong ngày"** liệt kê các khung giờ đã có ekip tác nghiệp (bao gồm cả giờ kết thúc dự kiến mà Admin đã điều chỉnh trên Thời khóa biểu), nhưng **vẫn cho phép khách bấm Tiếp tục đặt lịch** để Studio gọi điện tư vấn khung giờ trống hoặc sắp xếp ekip phụ trách.

---

## 5. Lộ Trình Thực Hiện (4 Bước Gọn Gàng)

1. **Bước 1 — Nâng cấp Schema & API Thời khóa biểu (Backend):** Cập nhật `Booking.js`, viết API lấy Thời khóa biểu Admin, API chỉnh nhanh khung giờ dự kiến `PUT /api/bookings/:id/schedule`, và API lấy khung giờ bận ẩn danh cho khách `GET /api/bookings/public-schedule`.
2. **Bước 2 — Xây dựng Component Thời khóa biểu Tuần (`StudioTimetable.jsx`):** Thiết kế bảng lịch 7 ngày trong tuần kèm Âm lịch, thẻ đơn hàng trực quan, cảnh báo lấn ca/trùng giờ, và Modal chỉnh giờ kết thúc dự kiến (hỗ trợ gợi ý giờ di chuyển ngoại cảnh).
3. **Bước 3 — Tích hợp vào trang Quản lý Đơn & Chi tiết Đơn:** Nhúng Thời khóa biểu vào `AdminOrders.jsx` và nút tra cứu nhanh trong `AdminOrderDetail.jsx`.
4. **Bước 4 — Đồng bộ Cảnh báo Mềm lên Lịch Đặt Khách Hàng (`Booking.jsx`):** Hiển thị các khung giờ bận trong ngày khi khách chọn ngày chụp mà không chặn cứng thao tác đặt lịch của khách.
