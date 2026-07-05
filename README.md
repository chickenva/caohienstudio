# CAO HIEN STUDIO - Hệ thống quản lý studio chụp ảnh

![React](https://img.shields.io/badge/React-19.2-blue?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant%20Design-6.3-0170FE?logo=antdesign&logoColor=white)

> Cập nhật: 03/07/2026  
> Trạng thái: đang phát triển  
> Tên thương hiệu tiếng Việt có dấu: **Cao Hiển Studio**  
> Tên logo/không dấu: **CAOHIENSTUDIO**  
> Lưu ý: tên đúng là **Cao Hiển**, không phải **Cao Hiền**.

## 1. Gioi thieu

Cao Hiển Studio la ung dung web full-stack ho tro van hanh studio chup anh. He thong phuc vu hai nhom nguoi dung chinh:

- **Khach hang**: xem gioi thieu studio, goi chup, album, nhiep anh gia, lien he, dat lich, thanh toan coc va theo doi don.
- **Admin**: quan ly dashboard, khach hang, dich vu, nhiep anh gia, gallery, don dat lich va thanh toan.

Du an da bo sung **AI Chatbot tu van nguoi dung** bang Google Gemini API. Chatbot lay du lieu that tu database de tu van goi chup, thue may anh/thiet bi, chon tho chup, concept, trang phuc, dia diem, checklist truoc buoi chup va ngay tot/phong tuc o muc tham khao.

## 2. Tinh nang noi bat

- Giao dien khach hang theo phong cach luxury/light premium.
- Xem danh sach va chi tiet dich vu chup anh.
- Bo loc nang cao cho tung danh muc dich vu, loc cac goi dang bi an, va loai bo chuc nang xoa o trang admin de bao ve du lieu.
- Trang FAQ doc lap voi thiet ke Light Luxury dong bo trang chu, ho tro deep-linking cuon muot va mo rong tu trang chi tiet goi dich vu.
- Toi uu nut quay lai trang danh sach goi dich vu giu nguyen danh muc bo loc thong qua Router state.
- Xem danh sach album/gallery cong khai, co lien ket Google Drive folder.
- Xem danh sach va chi tiet nhiep anh gia.
- Dat lich chup anh truc tuyen, chon dich vu, tho chup, ngay gio va dia diem.
- Goi y dia chi Viet Nam bang Photon Komoot API trong man hinh dat lich.
- Du bao thoi tiet bang Open-Meteo Forecast va Archive API.
- Thanh toan coc qua VNPay, ho tro coc 30%, 50% hoac thanh toan 100%.
- Booking PENDING co thoi han 15 phut, qua han se bi huy de tranh giu lich ao.
- Khach hang xem don cua minh, huy don PENDING, tao lai link thanh toan va polling trang thai.
- Admin tao don ho khach hang, chon khach co san hoac tao khach moi/tam.
- Admin quan ly service, gallery, photographer, customer va booking.
- Dashboard admin thong ke don, doanh thu, khach hang, nhiep anh gia, dich vu va gallery.
- Form lien he luu MongoDB va gui email thong bao.
- OTP email cho dang ky, quen mat khau, doi email va doi mat khau trong profile.
- AI Chat Widget noi o giao dien customer.

## 3. Cong nghe su dung

### Backend

| Thành phần | Công nghệ | Ghi chú |
| --- | --- | --- |
| Runtime | Node.js | Khuyến nghị 18+ |
| Framework | Express.js 5.2 | REST API |
| Database | MongoDB + Mongoose 9 | Lưu user, booking, payment, service, resource, gallery |
| Auth | JWT | Header `Authorization: Bearer <token>` |
| Password | bcrypt/bcryptjs | Hash mật khẩu |
| Email | Nodemailer | Gửi OTP và thông báo liên hệ |
| Payment | VNPay | Tạo link thanh toán và verify callback |
| Payment SDK | `@payos/node` | Đã cài dependency, chưa thấy route PayOS riêng |
| AI | `@google/generative-ai` | Gemini chatbot tư vấn |
| Upload | Multer | Upload ảnh tạm vào `uploads/` |
| Google Drive | googleapis | Lấy ảnh từ Google Drive folder |
| Realtime | Socket.IO 4.8 | Cài dependency, chờ tích hợp socket server |
| Cache | Redis | Cài dependency, chờ cấu hình cache layer |

### Frontend

| Thành phần | Công nghệ | Ghi chú |
| --- | --- | --- |
| Framework | React 19.2 | Functional components + hooks |
| Build tool | Vite 8.0 | Dev server mặc định `5173` |
| Routing | React Router DOM 7.14 | Routes tập trung trong `App.jsx` |
| UI library | Ant Design 6.3 | Admin UI, form, table, buttons |
| Icons | `@ant-design/icons` | Header, footer, dashboard, chatbot |
| HTTP client | Axios | Gọi REST API |
| Charts | Recharts 3.8 | Dashboard |
| Date | Day.js | Xử lý ngày giờ frontend |
| Realtime client | Socket.IO Client 4.8 | Dependency sẵn sàng |
| External APIs | Photon, Open-Meteo | Gọi trực tiếp từ trang Booking |

## 4. Cau truc thu muc

```txt
caohienstudio/
  backend/
    server.js                  # Entry point Express
    seedAdmin.js               # Tao/cap nhat admin tu .env
    config/db.js               # Cau hinh DB rieng, hien server.js dang connect truc tiep
    controllers/               # Business logic
    middleware/                # Auth middleware
    models/                    # Mongoose schemas
    routes/                    # REST routes
    services/                  # Google Drive service
    uploads/                   # File upload tam
  frontend/
    src/
      App.jsx                  # Khai bao routes
      components/              # Layout, Logo, AIChatWidget, ProtectedRoute
      pages/auth/              # Login/Register/ForgotPassword
      pages/customer/          # Trang public/customer
      pages/admin/             # Trang admin
  postman/                     # Request mau
  menu/                        # Anh/tai lieu tham khao

Mo hinh xu ly chung:

```txt
React/Vite -> Axios -> Express Routes -> Controllers -> Mongoose Models -> MongoDB
```

## 5. Backend overview

File `backend/server.js` hien dang:

- Load `.env` bang `dotenv`.
- Khoi tao Express.
- Bat `express.json()`.
- Bat CORS bang `app.use(cors())`.
- Ket noi MongoDB bang `mongoose.connect(process.env.MONGO_URI)`.
- Mount cac route:
  - `/api/auth`
  - `/api/galleries`
  - `/api/services`
  - `/api/bookings`
  - `/api/resources`
  - `/api/contacts`
  - `/api/users`
  - `/api/drive`
  - `/api/dashboard`
  - `/api/ai-chat`

Middleware trong `backend/middleware/authMiddleware.js`:

- `verifyToken`: kiem tra JWT tu header `Authorization`.
- `verifyAdmin`: verify token, doc user that tu DB, bat buoc role `ADMIN` va `is_active=true`.
- `verifyAdminOrPhotographer`: du phong cho dashboard photographer sau nay.

## 6. Frontend overview

### Layout/components chinh

| File | Vai tro |
| --- | --- |
| `CustomerLayout.jsx` | Header, footer, user menu, scroll top va AI Chat Widget |
| `AdminLayout.jsx` | Layout trang quan tri |
| `Logo.jsx` | Logo SVG dang code |
| `AIChatWidget.jsx` | Widget chatbot noi |
| `AIChatWidget.css` | Style chatbot |
| `ProtectedRoute.jsx` | Bao ve route theo localStorage |

### Routes public/customer

| Duong dan | Component | Mo ta |
| --- | --- | --- |
| `/` | `Home` | Trang chu |
| `/about` | `About` | Gioi thieu |
| `/faq` | `FAQ` | Cau hoi thuong gap (FAQ) |
| `/galleries` | `Galleries` | Danh sach album |
| `/galleries/:id` | `GalleryDetail` | Chi tiet album |
| `/photographers` | N/A | Chuyen huong (Redirect) den `/services` |
| `/photographers/:id` | N/A | Chuyen huong (Redirect) den `/services` |
| `/services` | `Services` | Goi chup |
| `/services/:id` | `ServiceDetail` | Chi tiet goi chup |
| `/booking` | `Booking` | Dat lich |
| `/contact` | `Contact` | Lien he |
| `/customer/profile` | `Profile` | Tai khoan |
| `/customer/my-bookings` | `MyBookings` | Don cua toi |
| `/customer/my-bookings/:id` | `BookingDetail` | Chi tiet don |
| `/vnpay-return` | `VnpayReturn` | Xu ly ket qua VNPay |

### Routes auth

| Duong dan | Component |
| --- | --- |
| `/login` | `Login` |
| `/register` | `Register` |
| `/forgot-password` | `ForgotPassword` |

### Routes admin

| Duong dan | Component | Mo ta |
| --- | --- | --- |
| `/admin/profile` | `AdminProfile` | Ho so admin |
| `/admin/dashboard` | `AdminDashboard` | Dashboard |
| `/admin/customers` | `AdminCustomers` | Khach hang |
| `/admin/orders` | `AdminOrders` | Don dat lich |
| `/admin/orders/create` | `CreateOrder` | Tao don ho khach |
| `/admin/galleries` | `AdminGalleries` | Album |
| `/admin/galleries/create` | `GalleryForm` | Tao album |
| `/admin/galleries/edit/:id` | `GalleryForm` | Sua album |
| `/admin/services` | `AdminServices` | Dich vu |
| `/admin/services/add` | `ServiceForm` | Tao dich vu |
| `/admin/services/edit/:id` | `ServiceForm` | Sua dich vu |
| `/admin/photographers` | `AdminPhotographers` | Nhiep anh gia |
| `/admin/photographers/add` | `PhotographerForm` | Tao tho chup |
| `/admin/photographers/edit/:id` | `PhotographerForm` | Sua tho chup |
| `/admin/resources` | `AdminResources` | Thiet bi/tai nguyen |
| `/admin/resources/add` | `ResourceForm` | Tao thiet bi |
| `/admin/resources/edit/:id` | `ResourceForm` | Sua thiet bi |

## 7. Database schema

### User - `backend/models/User.js`

| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| `email` | String | Bat buoc, unique |
| `password_hash` | String | Bat buoc |
| `full_name` | String | Bat buoc |
| `phone` | String | So dien thoai |
| `role` | Enum | `ADMIN`, `PHOTOGRAPHER`, `CUSTOMER` |
| `portfolio.avatar` | String | Anh dai dien photographer |
| `portfolio.bio` | String | Gioi thieu photographer |
| `portfolio.specialties` | Array String | Chuyen mon |
| `portfolio.years_of_experience` | Number | So nam kinh nghiem |
| `portfolio.featured_images` | Array String | Anh noi bat |
| `portfolio.google_drive_folder_id` | String | Folder Drive portfolio |
| `portfolio.google_drive_folder_url` | String | URL Drive |
| `is_active` | Boolean | Khoa/mo tai khoan |

### Service - `backend/models/Service.js`

| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| `name` | String | Ten goi chup |
| `description` | String | Mo ta |
| `base_price` | Number | Gia co ban |
| `duration_hours` | Number | Thoi luong tinh theo gio |
| `thumbnail` | String | Anh dai dien |
| `is_active` | Boolean | An/hien |

### PublicGallery - `backend/models/PublicGallery.js`

| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| `title` | String | Ten album |
| `description` | String | Mo ta |
| `category` | Enum | `WEDDING`, `PORTRAIT`, `EVENT`, `GRADUATION` |
| `location` | String | Dia diem chup |
| `drive_folder_id` | String | Folder Google Drive chua anh |
| `drive_folder_url` | String | Link folder Drive |
| `coverImage` | String | Anh bia tuy chon |
| `photographer_id` | ObjectId User | Photographer lien quan |
| `service_id` | ObjectId Service | Service lien quan |
| `featured` | Boolean | Album noi bat |
| `is_active` | Boolean | An/hien |

### Booking - `backend/models/Booking.js`

| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| `customer_id` | ObjectId User | Khach dat lich |
| `service_id` | ObjectId Service | Goi chup |
| `photographer_ids` | Array ObjectId User | Nhiep anh gia |
| `start_time` | Date | Gio bat dau |
| `end_time` | Date | Gio ket thuc |
| `location` | String | Dia diem chup |
| `total_amount` | Number | Tong tien |
| `status` | Enum | `PENDING`, `DEPOSITED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED` |
| `expires_at` | Date | Han thanh toan cua don PENDING |
| `note` | String | Ghi chu |

Trang thai hop le:

```txt
PENDING -> DEPOSITED -> CONFIRMED -> IN_PROGRESS -> COMPLETED
PENDING -> CANCELED
DEPOSITED -> CANCELED
CONFIRMED -> CANCELED
```

### Payment - `backend/models/Payment.js`

| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| `reference_id` | ObjectId Booking | Booking lien quan |
| `reference_type` | String | Mac dinh `BOOKING` |
| `amount` | Number | So tien |
| `payment_method` | String | `VNPAY`, `MANUAL`, ... |
| `payment_type` | String | `DEPOSIT_30`, `DEPOSIT_50`, `FULL_100`, `ADMIN_CREATED`, ... |
| `transaction_id` | String | Ma giao dich VNPay |
| `status` | Enum | `PENDING`, `SUCCESS`, `FAILED`, `EXPIRED` |
| `paid_at` | Date | Thoi diem thanh toan |
| `expires_at` | Date | Han link thanh toan |

### OTP - `backend/models/OTP.js`

| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| `email` | String | Email nhan OTP |
| `otp` | String | Ma OTP 4 so |
| `createdAt` | Date TTL | Tu xoa sau 300 giay |

### Contact - `backend/models/Contact.js`

| Truong | Kieu | Ghi chu |
| --- | --- | --- |
| `name` | String | Ten khach |
| `phone` | String | So dien thoai |
| `email` | String | Email tuy chon |
| `message` | String | Noi dung |
| `status` | Enum | `UNREAD`, `READ`, `CONTACTED` |

### Order - `backend/models/Order.js`

`Order` van con trong codebase nhu schema cu/phu tro. Luong hien tai dang dung `Booking` + `Payment` la chinh cho don dat lich.

## 8. API endpoints

Base URL:

```txt
http://localhost:5000/api
```

### Auth

| Method | Endpoint | Auth | Mo ta |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Dang nhap |
| POST | `/auth/register` | Public | Dang ky tai khoan |
| POST | `/auth/verify-otp` | Public | Xac thuc OTP chung |
| POST | `/auth/send-register-otp` | Public | Gui OTP dang ky |
| POST | `/auth/forgot-password` | Public | Gui OTP quen mat khau |
| POST | `/auth/reset-password` | Public | Dat lai mat khau |
| GET | `/auth/me` | User | Lay profile hien tai |
| POST | `/auth/send-update-otp` | User | Gui OTP doi email/mat khau |
| PUT | `/auth/update-profile` | User | Cap nhat ho ten, phone, email |
| PUT | `/auth/reset-password-profile` | User | Doi mat khau trong profile |

Payload dang ky:

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0979767602",
  "email": "user@example.com",
  "password": "Password@123"
}
```

Payload dang nhap:

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

### Services

| Method | Endpoint | Auth | Mo ta |
| --- | --- | --- | --- |
| GET | `/services` | Public | Lay service active |
| GET | `/services/:id` | Public | Chi tiet service active |
| GET | `/services/admin/all` | Admin | Lay tat ca service |
| GET | `/services/admin/:id` | Admin | Chi tiet service cho admin |
| POST | `/services/admin` | Admin | Tao service |
| PUT | `/services/admin/:id` | Admin | Cap nhat service |
| PATCH | `/services/admin/:id/toggle-active` | Admin | An/hien service |
| DELETE | `/services/admin/:id` | Admin | Xoa mem/an service |

Payload tao/sua service:

```json
{
  "name": "Goi chup cuoi premium",
  "description": "Chup cuoi ngoai canh",
  "base_price": 5000000,
  "duration_hours": 6,
  "thumbnail": "https://..."
}
```



### Users, photographers, customers

| Method | Endpoint | Auth | Mo ta |
| --- | --- | --- | --- |
| GET | `/users/photographers` | Public | Danh sach photographer active |
| GET | `/users/photographers/:id` | Public | Chi tiet photographer |
| GET | `/users/admin/photographers` | Admin | Tat ca photographer |
| GET | `/users/admin/photographers/:id` | Admin | Chi tiet photographer cho admin |
| POST | `/users/admin/photographers` | Admin | Tao photographer |
| PUT | `/users/admin/photographers/:id` | Admin | Cap nhat photographer |
| PATCH | `/users/admin/photographers/:id/toggle-active` | Admin | Khoa/mo photographer |
| GET | `/users/admin/customers` | Admin | Danh sach customer |
| GET | `/users/admin/customers/search?keyword=` | Admin | Tim customer |
| GET | `/users/admin/customers/:id` | Admin | Chi tiet customer |
| PATCH | `/users/admin/customers/:id/toggle-active` | Admin | Khoa/mo customer |

### Galleries

| Method | Endpoint | Auth | Mo ta |
| --- | --- | --- | --- |
| GET | `/galleries?category=ALL` | Public | Danh sach album |
| GET | `/galleries/:id` | Public | Chi tiet album |
| POST | `/galleries/admin` | Admin | Tao album |
| PUT | `/galleries/admin/:id` | Admin | Cap nhat album |
| PATCH | `/galleries/admin/:id/toggle-active` | Admin | An/hien album |
| DELETE | `/galleries/admin/:id` | Admin | Xoa album |

Payload tao/sua gallery:

```json
{
  "title": "Pre-wedding Da Lat",
  "description": "Album cuoi ngoai canh",
  "category": "WEDDING",
  "location": "Da Lat",
  "drive_folder_id": "google-drive-folder-id",
  "drive_folder_url": "https://drive.google.com/...",
  "coverImage": "https://...",
  "photographer_id": "user_id",
  "service_id": "service_id",
  "featured": true
}
```

### Bookings and VNPay

| Method | Endpoint | Auth | Mo ta |
| --- | --- | --- | --- |
| GET | `/bookings/vnpay-return` | Public | VNPay redirect GET |
| POST | `/bookings/vnpay-return` | Public | Frontend gui params VNPay de verify |
| GET | `/bookings/photographer-busy-slots` | Public | Lay khung gio ban cua photographer |
| POST | `/bookings/create-vnpay` | User | Tao booking + payment link VNPay |
| GET | `/bookings/my-bookings` | User | Danh sach booking cua toi |
| GET | `/bookings/:id` | User | Chi tiet booking cua toi |
| GET | `/bookings/:id/check-status` | User | Kiem tra trang thai booking/payment |
| POST | `/bookings/:id/repay` | User | Tao lai link thanh toan PENDING |
| POST | `/bookings/:id/cancel` | User | Huy booking PENDING |
| GET | `/bookings/admin/all?status=ALL` | Admin | Tat ca booking |
| POST | `/bookings/admin/create` | Admin | Tao booking ho khach |
| PUT | `/bookings/:id/status` | Admin | Cap nhat trang thai booking |

Payload customer tao booking VNPay:

```json
{
  "service_id": "service_id",
  "photographer_ids": ["photographer_id"],
  "start_time": "2026-06-30T08:00:00.000Z",
  "end_time": "2026-06-30T12:00:00.000Z",
  "location": "TP. Ho Chi Minh",
  "note": "Chup concept Han Quoc",
  "deposit_percent": 30
}
```

`deposit_percent` hop le: `30`, `50`, `100`.

Payload admin tao booking ho:

```json
{
  "customer_id": "optional_existing_customer_id",
  "customer_full_name": "Khach moi",
  "customer_email": "customer@example.com",
  "customer_phone": "0900000000",
  "service_id": "service_id",
  "photographer_ids": ["photographer_id"],
  "start_time": "2026-06-30T08:00:00.000Z",
  "end_time": "2026-06-30T12:00:00.000Z",
  "location": "Vinh Long",
  "note": "Admin tao ho",
  "total_amount": 5000000,
  "status": "DEPOSITED",
  "paid_amount": 1500000,
  "payment_method": "MANUAL"
}
```

### Contact

| Method | Endpoint | Auth | Mo ta |
| --- | --- | --- | --- |
| POST | `/contacts` | Public | Gui form lien he |

Payload:

```json
{
  "name": "Nguyen Van A",
  "phone": "0979767602",
  "email": "user@example.com",
  "message": "Toi can tu van goi chup cuoi"
}
```

### Dashboard

| Method | Endpoint | Auth | Mo ta |
| --- | --- | --- | --- |
| GET | `/dashboard/admin/overview` | Admin | So lieu dashboard tong quan |

Response gom:

- `cards`: tong don, don theo trang thai, khach hang, photographer, service, resource, gallery.
- `revenue`: doanh thu du kien, doanh thu da coc, doanh thu hoan thanh, doanh thu thang, tien thanh toan thuc te.
- `bookingStatus`: thong ke booking theo status.
- `recentBookings`: 6 don moi nhat.

### Google Drive

| Method | Endpoint | Auth | Mo ta |
| --- | --- | --- | --- |
| POST | `/drive/folders` | Admin | Tao folder Google Drive |
| GET | `/drive/folders/:folderId/images` | Public | Lay anh trong folder |
| POST | `/drive/folders/:folderId/images` | Admin | Upload anh vao folder |

Luu y ky thuat hien tai:

- `googleDriveService.js` hien co `listImagesInFolder`.
- `driveController.js` dang goi them `createFolder` va `uploadImageToFolder`.
- Truoc khi dung tao folder/upload trong production, can dam bao hai ham nay duoc implement trong service.
- Scope hien tai la `https://www.googleapis.com/auth/drive.readonly`, phu hop doc anh, chua phu hop tao folder/upload.

### AI Chat

| Method | Endpoint | Auth | Mo ta |
| --- | --- | --- | --- |
| POST | `/ai-chat` | Public | Gui cau hoi den chatbot tu van |

Payload:

```json
{
  "message": "Toi muon chup anh cuoi ngoai canh thi nen chon goi nao?",
  "history": [
    { "role": "user", "content": "Xin chao" },
    { "role": "assistant", "content": "Xin chao, toi co the ho tro gi?" }
  ]
}
```

Response thanh cong:

```json
{
  "reply": "Noi dung tu van cua AI...",
  "timestamp": "2026-06-22T00:00:00.000Z"
}
```

Gioi han hien tai:

- 20 tin nhan/phut/IP.
- Tin nhan toi da 1000 ky tu.
- Chi lay 20 message gan nhat tu `history`.
- Can `GEMINI_API_KEY` trong backend `.env`.

## 9. AI Chatbot tu van nguoi dung

File backend: `backend/controllers/aiChatController.js`  
File frontend: `frontend/src/components/AIChatWidget.jsx`, `frontend/src/components/AIChatWidget.css`

### Nguon du lieu AI dang doc

Ham `getStudioContext()` lay:

- `Service.find({ is_active: true })`
- `User.find({ role: "PHOTOGRAPHER", is_active: true })`

Sau do format thanh context cho Gemini.

### Pham vi tu van

AI co the tu van:

- Goi chup anh va gia/thoi luong theo data `Service`.
- Lua chon photographer theo chuyen mon, bio va so nam kinh nghiem.
- Concept chup: wedding, pre-wedding, portrait, family, graduation, event, fashion.
- Trang phuc, mau sac, phu kien, makeup, kieu toc theo concept.
- Dia diem chup tai TP.HCM, Vinh Long va cac dia diem pho bien.
- Checklist chuan bi truoc buoi chup.
- Ngay tot, ngay cuoi, tuoi va phong tuc Viet Nam o muc tham khao.

### Quy tac nen giu

- Uu tien du lieu trong database truoc.
- Khong bia gia neu database khong co.
- Khong khang dinh lich con trong neu chua goi API kiem tra lich.
- Tu van phong tuc/xem ngay/xem tuoi phai ghi ro la thong tin tham khao theo quan niem dan gian.
- AI chi tu van va dieu huong, chua nen tu tao booking/thanh toan truc tiep neu user chua xac nhan.

### Luu y frontend

`AIChatWidget.jsx` dang hardcode:

```js
const API_URL = "http://localhost:5000/api/ai-chat";
```

Neu deploy nen doi thanh:

```js
const API_URL = `${import.meta.env.VITE_API_URL}/ai-chat`;
```

## 10. Luong nghiep vu chinh

### Dang ky

```txt
User nhap email
  -> POST /auth/send-register-otp
  -> Nhan OTP email
  -> POST /auth/verify-otp
  -> POST /auth/register
  -> Backend hash password
  -> Luu User role CUSTOMER
```

### Dang nhap

```txt
POST /auth/login
  -> Kiem tra email/password
  -> Tao JWT
  -> Frontend luu token va user vao localStorage
```

JWT payload hien tai chi gom:

```js
{ id: user._id }
```

Role duoc frontend lay tu response login va luu trong `localStorage`. Middleware admin doc user that tu DB de kiem tra role.

### Dat lich va thanh toan VNPay

```txt
Customer chon goi chup, photographer, ngay gio, dia diem
  -> Frontend check busy slots
  -> POST /bookings/create-vnpay
  -> Backend kiem tra user/service/photographer/thoi gian/trung lich
  -> Tao Booking status PENDING, expires_at = now + 15 phut
  -> Tao Payment status PENDING
  -> Tao paymentUrl VNPay
  -> User thanh toan tren VNPay
  -> Backend verify chu ky HMAC SHA512
  -> Thanh cong: Payment SUCCESS, Booking DEPOSITED
  -> That bai/huy/qua han: Payment FAILED/EXPIRED, Booking CANCELED
```

### Admin tao don ho

```txt
Admin vao /admin/orders/create
  -> Chon customer co san hoac nhap khach moi
  -> Chon service, photographer, thoi gian, dia diem
  -> Backend kiem tra trung lich
  -> Tao Booking voi status tuy chon
  -> Neu status DEPOSITED/COMPLETED co paid_amount thi tao Payment MANUAL SUCCESS
```

### Lay lich ban photographer

```txt
GET /api/bookings/photographer-busy-slots?photographer_id=...&date=YYYY-MM-DD
GET /api/bookings/photographer-busy-slots?photographer_id=...&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

Chi tinh booking `DEPOSITED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, va `PENDING` con han.

## 11. Bien moi truong

### Backend `.env`

Tao file:

```bash
cd backend
cp .env.example .env
```

Mau cau hinh nen co:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/caohienstudio

JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

ADMIN_EMAIL=admin@caohienstudio.com
ADMIN_PASSWORD=Admin@123456
ADMIN_FULL_NAME=Cao Hien Admin
ADMIN_PHONE=0979767602

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_SECRET_KEY=YOUR_SECRET_KEY
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/vnpay-return
VNP_TMNCODE=YOUR_TMN_CODE
VNP_HASHSECRET=YOUR_SECRET_KEY
VNP_RETURNURL=http://localhost:5173/vnpay-return

PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_WEBHOOK_SECRET=your_webhook_secret

GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=your_root_folder_id
GEMINI_API_KEY=your_gemini_api_key_here

REDIS_URL=redis://:password@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
LOG_LEVEL=debug
```

Luu y:

- Khong commit `.env`.
- Khong commit service account that len public repo.
- `seedAdmin.js` can `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`; `ADMIN_PHONE` tuy chon.
- `googleDriveService.js` dang doc `GOOGLE_APPLICATION_CREDENTIALS`.
- AI Chat bat buoc can `GEMINI_API_KEY`.

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_ENV=development
```

Luu y: nhieu file frontend hien dang hardcode `http://localhost:5000/api`; nen refactor sang `import.meta.env.VITE_API_URL` khi deploy.

## 12. Cai dat va chay du an

### Yeu cau

- Node.js 18+
- npm 9+
- MongoDB local hoac MongoDB Atlas
- Gmail App Password neu muon gui OTP/email
- VNPay sandbox credentials neu test thanh toan
- Gemini API key neu dung AI chat
- Google service account neu dung gallery Drive

### Cai dependencies

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

### Tao admin

Dam bao `.env` co `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`, sau do chay:

```bash
cd backend
node seedAdmin.js
```

### Chay backend

```bash
cd backend
npm run dev
```

Backend chay tai:

```txt
http://localhost:5000
```

### Chay frontend

```bash
cd frontend
npm run dev
```

Frontend chay tai:

```txt
http://localhost:5173
```

## 13. Scripts

### Backend

```json
{
  "dev": "nodemon server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

### Frontend

```json
{
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

## 14. Test nhanh

### Test backend

Backend hien chua co `/health`; co the test endpoint public:

```bash
curl http://localhost:5000/api/services
```

### Test AI Chat

Can co `GEMINI_API_KEY` trong `backend/.env`.

```bash
curl -X POST http://localhost:5000/api/ai-chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"Studio co nhung goi chup nao?\",\"history\":[]}"
```

### Test Postman

- Import request YAML tu `postman/collections/caohienstudio`.
- Dung `base_url = http://localhost:5000/api`.
- Sau khi login, copy token vao bien `token`.
- Endpoint admin can header `Authorization: Bearer <token>`.

## 15. Bao mat va validation

### Mat khau

Backend yeu cau mat khau 8-16 ky tu, co chu thuong, chu hoa, so va ky tu dac biet.

Regex hien tai:

```js
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()>\.]).{8,16}$/
```

### OTP

- OTP 4 chu so.
- Luu vao MongoDB collection `OTP`.
- TTL 300 giay.
- Sau khi dang ky/reset thanh cong, xoa OTP theo email.

### JWT

- Frontend luu `token` va `user` trong `localStorage`.
- Protected endpoint gui `Authorization: Bearer <token>`.

### VNPay signature

- Tao chu ky bang HMAC SHA512.
- Sap xep params theo alphabet.
- Remove `vnp_SecureHash` va `vnp_SecureHashType` truoc khi verify.
- Neu sai chu ky, return 400 va khong cap nhat DB.

### AI Chat

- API key chi nam o backend.
- Public endpoint co in-memory rate limit.
- Khong nen gui thong tin nhay cam cua user vao AI trong buoc hien tai.
- Chatbot hien chi tu van, khong tao booking/thanh toan truc tiep.

## 16. Tich hop ngoai

### Photon Komoot API

Dung trong `Booking.jsx` de goi y dia chi Viet Nam:

```txt
https://photon.komoot.io/api/?q=...&bbox=102.14,8.56,109.46,23.39
```

### Open-Meteo

Dung trong `Booking.jsx`:

- Forecast API cho 14 ngay toi.
- Archive API de lay thoi tiet lich su cung ky nam truoc.

### Google Gemini

Dung package:

```js
const { GoogleGenerativeAI } = require("@google/generative-ai");
```

Thu model theo thu tu:

```js
["gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash"]
```

### Google Drive

Doc anh trong folder:

```txt
GET /api/drive/folders/:folderId/images
```

Service account path:

```env
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
```

## 17. Quy uoc code

### Backend

- Dung CommonJS: `require`, `module.exports`.
- Route chi khai bao endpoint va middleware.
- Controller xu ly business logic.
- Model chi khai bao schema.
- Endpoint nhay cam/admin dung `verifyAdmin`.
- Endpoint customer dung `verifyToken`.
- Response loi nen co `message` ro rang.
- Khi them bien moi truong moi, cap nhat `backend/.env.example` va README.
- Khi them collection/model moi, cap nhat README muc database schema.

### Frontend

- Dung functional components va hooks.
- Uu tien Ant Design cho form/table/admin UI.
- Routes tap trung trong `App.jsx`.
- Nen chuyen API URL hardcoded sang `import.meta.env.VITE_API_URL` khi chuan bi deploy.
- Logo/thuong hieu dung thong nhat `Cao Hiển Studio`/`CAOHIENSTUDIO`.
- AI Chat Widget la component dung chung trong `CustomerLayout`.

## 18. Trang thai hien tai va luu y ky thuat

### Da co trong code

- Auth customer/admin.
- OTP email.
- CRUD service.
- CRUD gallery.
- Quan ly photographer/customer.
- Booking + VNPay.
- Admin tao booking ho khach.
- Dashboard overview.
- Contact form.
- AI Chatbot Gemini.
- Frontend public/customer/admin pages.
- Logo SVG code trong `Logo.jsx`.
- Trang FAQ doc lap voi giao dien luxury, ho tro deep-linking va dong bo style.
- Toi uu dieu huong quay lai bang gia giu nguyen danh muc da loc thong qua Router state.

### Can kiem tra/hoan thien tiep

- `backend/services/googleDriveService.js` can bo sung `createFolder` va `uploadImageToFolder` neu muon dung endpoint tao folder/upload.
- Scope Google Drive hien la readonly; can doi scope neu upload.
- Socket.IO dependency da cai nhung server chua khoi tao socket instance.
- Redis dependency/env da co nhung chua thay module cache thuc su.
- PayOS dependency/env da co nhung chua thay route PayOS rieng.
- Frontend con nhieu URL hardcoded localhost.
- Chua co automated test.
- `backend/package.json` test script hien chi la placeholder.
- README cu/terminal co hien tuong mojibake do encoding/console; file README moi co gang giam emoji de tranh loi hien thi.

## 19. Troubleshooting

### MongoDB Connection Failed

Kiem tra `MONGO_URI`, MongoDB local/Atlas, whitelist IP va credentials.

```bash
mongosh "mongodb://localhost:27017/caohienstudio"
```

### Khong gui duoc OTP/email

Kiem tra Gmail 2FA, App Password, `EMAIL_USER`, `EMAIL_PASS` va firewall SMTP.

### VNPay sai chu ky

Kiem tra `VNPAY_TMN_CODE`, `VNPAY_SECRET_KEY`, return URL va logic sort params.

### Booking bi CANCELED sau 15 phut

Day la logic hien tai: booking PENDING co `expires_at = now + 15 minutes`. Qua han thi booking sang `CANCELED`, payment PENDING sang `EXPIRED`.

### AI Chat bao chua cau hinh

Them `GEMINI_API_KEY` vao `backend/.env`, sau do restart backend.

### Google Drive khong lay duoc anh

Kiem tra `GOOGLE_APPLICATION_CREDENTIALS`, quyen cua service account, `drive_folder_id` va folder co anh.

### CORS error

Backend hien dang `app.use(cors())`. Neu deploy production nen cau hinh chat hon:

```js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

## 20. Dinh huong phat trien

- Hoan thien Google Drive upload/tai khoan service account.
- Chuyen toan bo URL frontend sang bien moi truong.
- Them endpoint `/health` cho backend.
- Them Socket.IO realtime notification cho admin khi co booking/contact moi.
- Luu lich su AI chat vao MongoDB neu can quan ly hoi thoai.
- Cho AI goi tool noi bo de check lich trong, nhung khong tu tao booking neu user chua xac nhan.
- Them dashboard cho photographer.
- Quan ly lich ban/nghi phep cua photographer.
- Them test cho booking/VNPay/auth/AI chat.
- Lam sach encoding tieng Viet trong console/log neu can.

## 21. Thong tin lien he hien trong code

Footer/customer UI hien co:

- Dia chi: `34B4 TL 887, phuong An Hoi, Vinh Long`
- Dien thoai: `(+84) 979 7676 02`
- Email: `caohienstudio@gmail.com`
- Gio mo cua: `09:00 AM - 05:00 PM`
- Facebook: `https://www.facebook.com/caohienstudio`
- Instagram: `https://www.instagram.com/caohien.photojournalism`

## 22. License / muc dich

Du an duoc phat trien cho muc dich hoc tap, khoa luan/tieu luan chuyen nganh va mo phong quan ly studio chup anh thuc te.

Sinh vien: Ho Vu Anh  
MSSV: 22110097  
Thuong hieu: Cao Hiển Studio

## 23. Nhat ky cap nhat (Update History)

### Cap nhat ngay 03/07/2026:
- **Bo dropdown menu "DICH VU"**:
  - Menu "DICH VU" tren navbar truoc day hien dropdown chon danh muc (Truyen thong, Phong su, Ket hop, Anh/Photobook, Thue may anh).
  - Da doi thanh link thang: bam vao "DICH VU" se dieu huong truc tiep den trang `/services` (tat ca dich vu).
  - Xoa bo `serviceMenuItems` array va thay the `<Dropdown>` bang `<span onClick>`.
- **Xoa hoan toan chuc nang Thue may anh (Rentals/Resources)**:
  - Frontend:
    - Xoa cac trang `Rentals.jsx`, `RentalDetail.jsx`, `AdminResources.jsx`, `ResourceForm.jsx`.
    - Xoa routes `/rentals`, `/rentals/:id`, `/admin/resources`, `/admin/resources/add`, `/admin/resources/edit/:id` khoi `App.jsx`.
    - Xoa menu "Tai nguyen / thiet bi" khoi sidebar `AdminLayout.jsx`.
    - Xoa card thong ke "Thiet bi cho thue" khoi `AdminDashboard.jsx`.
    - Xoa link "Thue thiet bi" khoi footer `CustomerLayout.jsx`.
    - Xoa muc "Quan ly Kho tai nguyen" khoi `SharedLayout.jsx`.
  - Backend:
    - Xoa `backend/routes/resourceRoutes.js`.
    - Xoa `backend/controllers/resourceController.js`.
    - Xoa `backend/models/Resource.js`.
    - Xoa mount `/api/resources` khoi `server.js`.
    - Xoa query `activeResources`, `activeRentalResources` khoi `dashboardController.js`.
    - Xoa Resource query va phan tu van thue thiet bi khoi `aiChatController.js`.

### Cap nhat ngay 26/06/2026:
- **Trang Dat lich (Booking.jsx)**:
  - Cho phep chon nhieu Goi dich vu chinh tren mot dong (khong wrap xuong dong).
  - O goi dich vu di kem cung hien thi tren 1 dong va rut gon: Hien thi goi dau tien, neu chon them se hien thi dang "+1, +2..." (vi du: "Goi le toi... +3").
  - Loai bo hoan toan mau nen xanh cua checkbox khi duoc check; thay bang duong vien vang Luxury va checkmark vang tren nen trong suot (su dung High-Specificity CSS).
  - Chỉnh font chu cua tieu de "TOM TAT CHI PHI" thanh font Outfit dong bo voi tieu de lich chup, in hoa toan bo, in dam va tang kich co (fontSize: 20).
  - Them o nhap Ma giam gia (Voucher/Coupon) va nut Ap dung trong card Tom tat chi phi. To mau do noi bat cho phan giam gia (vi du: "Giam gia (CAOHIEN50): -50.000d").
  - Luoc bo tieu de H3 cua "Muc ap dung thanh toan" ben cot phai, chi giu lai card thong tin ben trong va can giua dep mat.
  - Khoi phuc va hoan thien nut Switch chon chup "1 ngay" hoac "Nhieu ngay" nhu cu: Khac phuc triet de loi chon khung gio chup va custom gio o che do nhieu ngay (range mode); dong thoi highlight duong vien va nen `.cal-cell-range` cho cac o ngay tren lich nam trong khoang giua nhat.
- **Trang Xac nhan (BookingConfirm.jsx)**:
  - Ho tro hien thi ro rang khoang thoi gian dat lich tu ngay bat dau den ngay ket thuc neu khach hang chon dat lich nhieu ngay.

