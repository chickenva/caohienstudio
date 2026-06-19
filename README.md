# 📸 CAO HIẾN STUDIO — Hệ Thống Quản Lý Studio Chụp Ảnh

> **Phiên bản**: 1.0.2 | **Cập nhật**: Tháng 6 năm 2026 | **Trạng thái**: Đang phát triển ✅

Cao Hiến Studio là một ứng dụng web **full-stack** quản lý toàn diện hoạt động của một studio chụp ảnh chuyên nghiệp, bao gồm: đặt lịch, thanh toán trực tuyến, quản lý nhân sự, tài nguyên thiết bị, gallery ảnh và báo cáo doanh thu.

---

## 📋 Mục Lục

1. [Tổng Quan Hệ Thống](#-tổng-quan-hệ-thống)
2. [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
3. [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
4. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
5. [Cơ Sở Dữ Liệu — MongoDB Collections](#-cơ-sở-dữ-liệu--mongodb-collections)
6. [API Endpoints](#-api-endpoints)
7. [Tính Năng Theo Vai Trò](#-tính-năng-theo-vai-trò)
8. [Luồng Hoạt Động Chi Tiết](#-luồng-hoạt-động-chi-tiết)
9. [Authentication & Security](#-authentication--security)
10. [Cài Đặt & Chạy Ứng Dụng](#-cài-đặt--chạy-ứng-dụng)
11. [Biến Môi Trường](#-biến-môi-trường)
12. [Troubleshooting](#-troubleshooting)
13. [Changelog](#-changelog)

---

## 🎯 Tổng Quan Hệ Thống

Hệ thống phục vụ **2 nhóm người dùng chính**:

| Vai trò | Mô tả | Truy cập |
|---------|-------|----------|
| **Customer** (Khách hàng) | Xem dịch vụ, đặt lịch, thanh toán, theo dõi đơn | `/` → `/customer/*` |
| **Admin** (Quản trị viên) | Quản lý toàn bộ hệ thống, duyệt đơn, gán nhân sự | `/admin/*` |

### Tính năng nổi bật

- ✅ **Giao diện Khách hàng Luxury & Premium** — Thiết kế lại toàn bộ giao diện khách hàng (Trang chủ, Giới thiệu, Dịch vụ, Album, Nhiếp ảnh gia, Cho thuê, Liên hệ) theo phong cách sang trọng, sử dụng panel kính mờ (glassmorphism), hiệu ứng ánh sáng (spotlight) và các hiệu ứng chuyển động mượt mà (scroll reveal).
- ✅ **Đặt lịch & Thanh toán online** — Đặt lịch chụp tiện lợi kết hợp thanh toán cọc online VNPay + PayOS (30%, 50% hoặc 100% tuỳ thuộc vào thời gian đặt sớm hay gấp).
- ✅ **Lịch thông minh & Dự báo thời tiết** — Chọn ngày chụp trên lưới lịch trực quan tích hợp API Open-Meteo. Hệ thống tự động lấy dự báo 14 ngày thực tế hoặc truy vấn dữ liệu lịch sử cùng kỳ năm ngoái để đưa ra lời khuyên chụp ảnh tối ưu nhất.
- ✅ **Tự động gợi ý địa chỉ (Photon API)** — Tìm kiếm địa điểm chụp thông minh với tính năng tự động gợi ý địa chỉ Việt Nam qua API Photon (Komoot).
- ✅ **Xác thực OTP qua email** — Đăng ký tài khoản, thay đổi email liên hệ và khôi phục mật khẩu thông qua mã OTP bảo mật.
- ✅ **Quản lý dịch vụ** — Admin quản lý và cấu hình linh hoạt các gói dịch vụ (Wedding, Event, Family...) kèm theo hiển thị chi tiết các đặc điểm/tính năng dịch vụ.
- ✅ **Quản lý nhân sự (Photographer)** — Quản lý thông tin thợ chụp, chuyên môn, mô tả bản thân và trạng thái hoạt động.
- ✅ **Quản lý tài nguyên** — Theo dõi và quản lý thiết bị chụp, ống kính, thiết bị ánh sáng, props và các địa điểm/thiết bị cho thuê.
- ✅ **Gallery công khai** — Trưng bày các album ảnh dự án nổi bật của studio, hỗ trợ tìm kiếm và phân loại danh mục.
- ✅ **Dashboard Admin** — Thống kê trực quan đơn hàng, doanh thu, khách hàng mới theo thời gian thực.
- ✅ **Google Drive Integration** — Tích hợp Google Drive API (Service Account) để tự động upload và đồng bộ kho ảnh của từng đơn hàng.
- ✅ **Real-time** — Tích hợp Socket.IO giúp truyền tải dữ liệu và cập nhật trạng thái tức thì.

---

## 💻 Công Nghệ Sử Dụng

### Backend

| Thành phần | Công nghệ | Phiên bản |
|-----------|-----------|-----------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | ^5.2.1 |
| Database | MongoDB (Mongoose) | ^9.5.0 |
| Authentication | JSON Web Token | ^9.0.3 |
| Password Hash | bcrypt / bcryptjs | ^6.0.0 / ^3.0.3 |
| Email | Nodemailer | ^8.0.5 |
| Cache | Redis | ^5.12.1 |
| Real-time | Socket.IO | ^4.8.3 |
| Payment | @payos/node | ^2.0.5 |
| File Upload | Multer | ^2.1.1 |
| Cloud Storage | Google Drive API (googleapis) | ^171.4.0 |
| Dev Server | Nodemon | ^3.1.14 |

### Frontend

| Thành phần | Công nghệ | Phiên bản |
|-----------|-----------|-----------|
| Framework | React | ^19.2.5 |
| Build Tool | Vite | ^8.0.9 |
| Routing | React Router DOM | ^7.14.2 |
| HTTP Client | Axios | ^1.15.2 |
| UI Library | Ant Design | ^6.3.6 |
| Icons | @ant-design/icons | ^6.1.1 |
| Charts | Recharts | ^3.8.1 |
| Date | Day.js | ^1.11.20 |
| Real-time | Socket.IO Client | ^4.8.3 |
| Address API | Photon (Komoot) API | REST (Tự động gợi ý địa chỉ Việt Nam) |
| Weather API | Open-Meteo API | REST (Dự báo thời tiết 14 ngày & Lưu trữ lịch sử) |

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌───────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   CustomerLayout  │  AdminLayout  │  Auth Pages         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                    http://localhost:5173                        │
└─────────────────────────────┬─────────────────────────────────┘
                              │ REST API (Axios) + WebSocket
┌─────────────────────────────▼─────────────────────────────────┐
│                   BACKEND (Express.js)                         │
│                    http://localhost:5000                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  authRoutes  │ bookingRoutes │ serviceRoutes            │   │
│  │  userRoutes  │ resourceRoutes│ galleryRoutes            │   │
│  │  contactRoutes│ driveRoutes  │ dashboardRoutes          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │ Middleware   │  │ Controllers   │  │ Services           │  │
│  │ verifyToken  │  │ Business      │  │ Email, Payment,    │  │
│  │ verifyAdmin  │  │ Logic         │  │ Drive, Redis       │  │
│  └──────────────┘  └───────────────┘  └────────────────────┘  │
└──────────┬─────────────────────┬────────────────┬─────────────┘
           │                     │                │
    ┌──────▼──────┐       ┌──────▼──────┐  ┌──────▼──────┐
    │  MongoDB    │       │   Redis     │  │  Google     │
    │  (Data)     │       │  (Cache /   │  │  Drive      │
    │             │       │   Session)  │  │  (Storage)  │
    └─────────────┘       └─────────────┘  └─────────────┘
           │
    ┌──────▼──────────────────────────────┐
    │  External Payment Gateways          │
    │  VNPay Sandbox / PayOS              │
    └─────────────────────────────────────┘
```

---

## 📁 Cấu Trúc Thư Mục

```
caohienstudio/
├── backend/
│   ├── server.js                  # Entry point — khởi động Express + MongoDB
│   ├── .env                       # Biến môi trường (không commit)
│   ├── .env.example               # Mẫu biến môi trường
│   ├── seedAdmin.js               # Tạo tài khoản admin ban đầu
│   ├── google-service-account.json# Credentials Google Drive (không commit)
│   ├── config/
│   │   └── db.js                  # Cấu hình kết nối MongoDB
│   ├── models/                    # Mongoose Schemas
│   │   ├── User.js                # Người dùng (customer + photographer)
│   │   ├── Booking.js             # Lịch đặt dịch vụ
│   │   ├── Order.js               # Đơn hàng (Admin tạo từ Booking)
│   │   ├── Payment.js             # Lịch sử giao dịch thanh toán
│   │   ├── Service.js             # Gói dịch vụ chụp ảnh
│   │   ├── Resource.js            # Tài nguyên / thiết bị cho thuê
│   │   ├── PublicGallery.js       # Album gallery công khai
│   │   ├── Contact.js             # Liên hệ từ khách
│   │   └── OTP.js                 # Mã OTP xác thực
│   ├── controllers/               # Business Logic
│   │   ├── authController.js      # Đăng nhập, đăng ký, OTP, profile
│   │   ├── bookingController.js   # Booking, VNPay payment flow
│   │   ├── serviceController.js   # CRUD dịch vụ
│   │   ├── resourceController.js  # CRUD tài nguyên / rentals
│   │   ├── galleryController.js   # CRUD gallery công khai
│   │   ├── userController.js      # Quản lý photographer + customer
│   │   ├── dashboardController.js # Thống kê, báo cáo
│   │   ├── driveController.js     # Upload Google Drive
│   │   └── contactController.js   # Nhận form liên hệ
│   ├── routes/                    # API Route Definitions
│   │   ├── authRoutes.js          # /api/auth
│   │   ├── bookingRoutes.js       # /api/bookings
│   │   ├── serviceRoutes.js       # /api/services
│   │   ├── resourceRoutes.js      # /api/resources
│   │   ├── galleryRoutes.js       # /api/galleries
│   │   ├── userRoutes.js          # /api/users
│   │   ├── dashboardRoutes.js     # /api/dashboard
│   │   ├── driveRoutes.js         # /api/drive
│   │   └── contactRoutes.js       # /api/contacts
│   ├── middleware/
│   │   └── authMiddleware.js      # verifyToken, verifyAdmin
│   ├── services/                  # Utility Services (email, payment, ...)
│   └── uploads/                   # File uploads (local)
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx               # Entry point React
│       ├── App.jsx                # Định nghĩa toàn bộ routes
│       ├── App.css / index.css    # Global styles
│       ├── components/
│       │   ├── ProtectedRoute.jsx # Bảo vệ route yêu cầu đăng nhập
│       │   └── layout/
│       │       ├── CustomerLayout.jsx  # Layout với Navbar + Footer
│       │       └── AdminLayout.jsx     # Layout sidebar admin
│       └── pages/
│           ├── auth/
│           │   ├── Login.jsx
│           │   ├── Register.jsx
│           │   └── ForgotPassword.jsx
│           ├── customer/          # Trang cho khách hàng & công khai
│           │   ├── Home.jsx           # Trang chủ
│           │   ├── About.jsx          # Giới thiệu studio
│           │   ├── Services.jsx       # Danh sách gói dịch vụ
│           │   ├── ServiceDetail.jsx  # Chi tiết gói dịch vụ
│           │   ├── Booking.jsx        # Form đặt lịch
│           │   ├── BookingDetail.jsx  # Chi tiết lịch đặt + thanh toán
│           │   ├── BookingSuccess.jsx # Xác nhận đặt thành công
│           │   ├── MyBookings.jsx     # Danh sách lịch đặt của tôi
│           │   ├── Payment.jsx        # Trang thanh toán
│           │   ├── VnpayReturn.jsx    # Callback xử lý VNPay return
│           │   ├── Galleries.jsx      # Xem gallery công khai
│           │   ├── GalleryDetail.jsx  # Chi tiết album gallery
│           │   ├── Photographers.jsx  # Danh sách nhiếp ảnh gia
│           │   ├── PhotographerDetail.jsx # Chi tiết photographer
│           │   ├── Rentals.jsx        # Danh sách thiết bị cho thuê
│           │   ├── RentalDetail.jsx   # Chi tiết thiết bị cho thuê
│           │   ├── AlbumDetail.jsx    # Xem album ảnh đơn hàng
│           │   ├── Contact.jsx        # Form liên hệ
│           │   └── Profile.jsx        # Trang cá nhân khách hàng
│           └── admin/             # Trang quản trị
│               ├── AdminDashboard.jsx    # Dashboard tổng quan
│               ├── AdminOrders.jsx       # Danh sách đơn hàng
│               ├── CreateOrder.jsx       # Tạo đơn hàng từ booking
│               ├── AdminServices.jsx     # Danh sách dịch vụ
│               ├── ServiceForm.jsx       # Tạo / sửa dịch vụ
│               ├── AdminPhotographers.jsx # Danh sách photographer
│               ├── PhotographerForm.jsx  # Tạo / sửa photographer
│               ├── AdminResources.jsx    # Danh sách tài nguyên
│               ├── ResourceForm.jsx      # Tạo / sửa tài nguyên
│               ├── AdminGalleries.jsx    # Danh sách gallery
│               ├── GalleryForm.jsx       # Tạo / sửa gallery
│               ├── AdminCustomers.jsx    # Danh sách khách hàng
│               └── AdminProfile.jsx      # Trang cá nhân admin
│
├── postman/                       # Postman collection để test API
└── README.md
```

---

## 📊 Cơ Sở Dữ Liệu — MongoDB Collections

### 1. `users` — Người Dùng

```javascript
{
  _id: ObjectId,
  fullName: String,          // Tên đầy đủ
  phone: String,             // Số điện thoại
  email: String,             // Email (unique, index)
  password: String,          // Bcrypt hash, rounds=10
  role: String,              // "admin" | "customer" | "photographer"
  isActive: Boolean,         // Admin có thể khoá tài khoản
  // Các trường riêng cho Photographer
  specialization: String,    // Chuyên môn (vd: "Chụp ngoại cảnh")
  bio: String,               // Mô tả bản thân
  avatar: String,            // URL ảnh đại diện
  createdAt: Date,
  updatedAt: Date
}
```

> **Lưu ý**: Model `User` dùng chung cho cả `customer` và `photographer`. Admin được seed riêng qua `seedAdmin.js`.

---

### 2. `services` — Gói Dịch Vụ Chụp Ảnh

```javascript
{
  _id: ObjectId,
  name: String,              // "Gói Cưới Truyền Thống"
  price: Number,             // Giá VND (vd: 15000000)
  thumbnail: String,         // URL ảnh đại diện
  description: String,       // Mô tả ngắn (hiển thị card)
  details: String,           // Nội dung chi tiết (trang detail)
  features: [String],        // ["8 giờ chụp", "500+ ảnh edited", ...]
  category: String,          // "Wedding" | "Event" | "Family"
  isActive: Boolean,         // false = ẩn khỏi danh sách công khai
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3. `bookings` — Lịch Đặt Dịch Vụ

```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // ref: User
  serviceId: ObjectId,       // ref: Service
  serviceName: String,       // Lưu snapshot tên dịch vụ lúc đặt
  price: Number,             // Giá lúc đặt
  appointmentDate: Date,     // Ngày giờ chụp
  location: String,          // Địa điểm chụp
  note: String,              // Ghi chú của khách
  bookingType: String,       // "Early" | "Late" | "Urgent"
  status: String,            // "Pending" | "Confirmed" | "Completed" | "Cancelled"
  depositAmount: Number,     // Số tiền cọc đã thanh toán
  paidAt: Date,              // Thời điểm thanh toán cọc thành công
  createdAt: Date,
  updatedAt: Date
}
```

**Vòng đời trạng thái Booking:**
```
[Tạo] → Pending → [Admin xác nhận] → Confirmed → [Hoàn tất] → Completed
                                                → [Huỷ] → Cancelled
```

---

### 4. `orders` — Đơn Hàng (Admin quản lý)

```javascript
{
  _id: ObjectId,
  bookingId: ObjectId,       // ref: Booking (nguồn gốc)
  customerId: ObjectId,      // ref: User (customer)
  photographerId: ObjectId,  // ref: User (photographer được gán)
  serviceName: String,
  totalAmount: Number,
  depositAmount: Number,
  status: String,            // "Pending" | "Deposited" | "Completed" | "Cancelled"
  shootDate: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 5. `payments` — Lịch Sử Thanh Toán

```javascript
{
  _id: ObjectId,
  bookingId: ObjectId,       // ref: Booking
  amount: Number,
  paymentMethod: String,     // "VNPAY" | "PAYOS" | "CASH"
  transactionId: String,     // Mã giao dịch từ cổng thanh toán
  status: String,            // "PENDING" | "SUCCESS" | "FAILED"
  paidAt: Date,
  createdAt: Date
}
```

---

### 6. `resources` — Tài Nguyên / Thiết Bị

```javascript
{
  _id: ObjectId,
  name: String,              // "Canon 5D Mark IV"
  type: String,              // "Camera" | "Lens" | "Light" | "Props" | "Location"
  description: String,
  price: Number,             // Giá cho thuê (nếu là rental)
  quantity: Number,          // Số lượng
  status: String,            // "Available" | "In Use" | "Maintenance"
  isRental: Boolean,         // true = hiển thị cho khách thuê
  isActive: Boolean,         // Ẩn/hiện
  images: [String],          // Mảng URL ảnh
  createdAt: Date,
  updatedAt: Date
}
```

---

### 7. `publicgalleries` — Album Gallery Công Khai

```javascript
{
  _id: ObjectId,
  title: String,             // Tên album
  description: String,
  category: String,          // "Wedding" | "Event" | "Family" | ...
  coverImage: String,        // Ảnh bìa
  images: [String],          // Mảng URL ảnh
  isActive: Boolean,         // Ẩn/hiện
  createdAt: Date,
  updatedAt: Date
}
```

---

### 8. `otps` — Mã OTP Xác Thực

```javascript
{
  _id: ObjectId,
  email: String,             // Email nhận OTP
  otp: String,               // Mã 4–6 chữ số
  purpose: String,           // "register" | "forgot-password" | "update-email"
  expiresAt: Date,           // Hết hạn sau 5–10 phút
  attempts: Number,          // Số lần nhập sai (tối đa 3)
  verified: Boolean,
  createdAt: Date
}
```

---

### 9. `contacts` — Form Liên Hệ

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  message: String,
  createdAt: Date
}
```

---

## 🔗 API Endpoints

> Base URL: `http://localhost:5000/api`
> Header xác thực: `Authorization: Bearer <JWT_TOKEN>`

### `/api/auth` — Xác Thực & Tài Khoản

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/register` | Public | Đăng ký tài khoản mới |
| POST | `/login` | Public | Đăng nhập, nhận JWT |
| POST | `/send-register-otp` | Public | Gửi OTP xác thực email đăng ký |
| POST | `/verify-otp` | Public | Xác thực mã OTP |
| POST | `/forgot-password` | Public | Gửi OTP reset mật khẩu |
| POST | `/reset-password` | Public | Đặt lại mật khẩu mới |
| GET | `/me` | Token | Lấy thông tin cá nhân |
| POST | `/send-update-otp` | Token | Gửi OTP khi đổi email |
| PUT | `/update-profile` | Token | Cập nhật thông tin cá nhân |
| PUT | `/reset-password-profile` | Token | Đổi mật khẩu khi đã đăng nhập |

**Ví dụ — Đăng nhập:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!@"
}

// Response 200:
{
  "message": "Đăng nhập thành công!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "_id": "...", "fullName": "...", "role": "customer" }
}
```

---

### `/api/services` — Dịch Vụ Chụp Ảnh

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/` | Public | Danh sách dịch vụ đang hoạt động |
| GET | `/:id` | Public | Chi tiết 1 dịch vụ |
| GET | `/admin/all` | Admin | Tất cả dịch vụ (kể cả đã ẩn) |
| GET | `/admin/:id` | Admin | Chi tiết 1 dịch vụ (admin view) |
| POST | `/admin` | Admin | Tạo dịch vụ mới |
| PUT | `/admin/:id` | Admin | Cập nhật dịch vụ |
| PATCH | `/admin/:id/toggle-active` | Admin | Ẩn/hiện dịch vụ |
| DELETE | `/admin/:id` | Admin | Xóa mềm dịch vụ |

---

### `/api/bookings` — Đặt Lịch & Thanh Toán

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/vnpay-return` | Public | VNPay redirect callback (GET) |
| POST | `/vnpay-return` | Public | VNPay xác thực từ frontend (POST) |
| POST | `/create-vnpay` | Token | Tạo link thanh toán VNPay |
| GET | `/my-bookings` | Token | Lịch đặt của khách đang đăng nhập |
| GET | `/:id/check-status` | Token | Kiểm tra trạng thái booking + payment |
| POST | `/:id/repay` | Token | Tạo lại link thanh toán (nếu PENDING) |
| POST | `/:id/cancel` | Token | Huỷ lịch đặt (nếu còn PENDING) |
| GET | `/:id` | Token | Chi tiết 1 lịch đặt |
| GET | `/admin/all` | Admin | Tất cả booking |
| POST | `/admin/create` | Admin | Admin tạo booking hộ khách |
| PUT | `/:id/status` | Admin | Admin cập nhật trạng thái booking |

**Ví dụ — Tạo link thanh toán VNPay:**
```http
POST /api/bookings/create-vnpay
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "507f191e810c19729de860ea",
  "serviceName": "Gói Cưới Truyền Thống",
  "price": 15000000,
  "appointmentDate": "2026-08-15",
  "location": "Nhà hàng Tiệc Cưới, Q.1, TP.HCM",
  "note": "Yêu cầu chụp ngoài trời buổi chiều",
  "depositAmount": 5000000
}

// Response 200:
{
  "message": "Tạo link thanh toán thành công!",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "bookingId": "507f191e810c19729de860eb"
}
```

---

### `/api/resources` — Tài Nguyên & Thiết Bị Cho Thuê

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/rentals` | Public | Danh sách thiết bị cho thuê công khai |
| GET | `/rentals/:id` | Public | Chi tiết thiết bị cho thuê |
| GET | `/admin/all` | Admin | Tất cả tài nguyên |
| GET | `/admin/:id` | Admin | Chi tiết tài nguyên |
| POST | `/admin` | Admin | Tạo tài nguyên mới |
| PUT | `/admin/:id` | Admin | Cập nhật tài nguyên |
| PATCH | `/admin/:id/toggle-active` | Admin | Ẩn/hiện tài nguyên |
| DELETE | `/admin/:id` | Admin | Xóa mềm tài nguyên |

---

### `/api/galleries` — Gallery Công Khai

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/` | Public | Danh sách album gallery đang hoạt động |
| GET | `/:id` | Public | Chi tiết album gallery |
| POST | `/admin` | Admin | Tạo album mới |
| PUT | `/admin/:id` | Admin | Cập nhật album |
| PATCH | `/admin/:id/toggle-active` | Admin | Ẩn/hiện album |
| DELETE | `/admin/:id` | Admin | Xóa album |

---

### `/api/users` — Quản Lý Người Dùng

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/photographers` | Public | Danh sách photographer công khai |
| GET | `/photographers/:id` | Public | Chi tiết photographer |
| GET | `/admin/photographers` | Admin | Tất cả photographer (admin) |
| GET | `/admin/photographers/:id` | Admin | Chi tiết photographer (admin) |
| POST | `/admin/photographers` | Admin | Tạo photographer mới |
| PUT | `/admin/photographers/:id` | Admin | Cập nhật photographer |
| PATCH | `/admin/photographers/:id/toggle-active` | Admin | Khoá/mở tài khoản |
| GET | `/admin/customers` | Admin | Danh sách khách hàng |
| GET | `/admin/customers/search` | Admin | Tìm kiếm khách hàng |
| GET | `/admin/customers/:id` | Admin | Chi tiết khách hàng |
| PATCH | `/admin/customers/:id/toggle-active` | Admin | Khoá/mở tài khoản khách |

---

### `/api/dashboard` — Thống Kê & Báo Cáo

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/` | Admin | Thống kê tổng quan (đơn, doanh thu, khách hàng) |

---

### `/api/contacts` — Liên Hệ

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/` | Public | Gửi form liên hệ |

---

### `/api/drive` — Google Drive Upload

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/upload` | Admin | Upload file lên Google Drive |

---

## 👥 Tính Năng Theo Vai Trò

### 🌐 Khách vãng lai (Chưa đăng nhập)

| Tính năng | URL |
|-----------|-----|
| Xem trang chủ giới thiệu | `/` |
| Xem giới thiệu studio | `/about` |
| Xem danh sách dịch vụ | `/services` |
| Xem chi tiết dịch vụ | `/services/:id` |
| Xem gallery ảnh | `/galleries`, `/galleries/:id` |
| Xem danh sách nhiếp ảnh gia | `/photographers`, `/photographers/:id` |
| Xem thiết bị cho thuê | `/rentals`, `/rentals/:id` |
| Gửi form liên hệ | `/contact` |
| Đăng ký / Đăng nhập | `/register`, `/login` |
| Quên mật khẩu | `/forgot-password` |

---

### 👤 Khách hàng (Đã đăng nhập, role: `customer`)

| Tính năng | URL | Ghi chú |
|-----------|-----|---------|
| Đặt lịch chụp | `/booking` | Lịch thông minh chọn ngày, chọn khung giờ chụp & dự báo thời tiết Open-Meteo |
| Thanh toán cọc VNPay | `/customer/my-bookings/:id` | 30–50% giá dịch vụ |
| Tạo lại link thanh toán | BookingDetail → Repay | Nếu đơn vẫn PENDING |
| Huỷ lịch đặt | BookingDetail → Cancel | Chỉ khi status = PENDING |
| Xem danh sách lịch đặt | `/customer/my-bookings` | Filter theo trạng thái |
| Xem chi tiết lịch đặt | `/customer/my-bookings/:id` | Trạng thái, tiến trình, payment |
| Xem album ảnh đã chụp | Từ BookingDetail | Sau khi đơn Completed |
| Cập nhật hồ sơ cá nhân | `/customer/profile` | Tên, SĐT không cần OTP |
| Đổi email | `/customer/profile` | Yêu cầu OTP xác thực email mới |
| Đổi mật khẩu | `/customer/profile` | Yêu cầu OTP |

---

### 👨‍💼 Admin (role: `admin`)

| Nhóm | Tính năng | URL |
|------|-----------|-----|
| **Dashboard** | Thống kê tổng: đơn hàng, doanh thu, khách hàng mới | `/admin/dashboard` |
| **Đơn hàng** | Xem tất cả booking, lọc theo trạng thái | `/admin/orders` |
| | Tạo đơn hàng hộ khách (gán photographer, ngày chụp) | `/admin/orders/create` |
| | Cập nhật trạng thái booking | Orders table → Actions |
| **Dịch vụ** | Xem, tạo, sửa, ẩn/hiện, xóa dịch vụ | `/admin/services` |
| | Form tạo/sửa dịch vụ | `/admin/services/add`, `/admin/services/edit/:id` |
| **Photographer** | Xem, tạo, sửa, khoá/mở tài khoản | `/admin/photographers` |
| | Form tạo/sửa photographer | `/admin/photographers/add`, `.../edit/:id` |
| **Tài nguyên** | Xem, tạo, sửa, ẩn/hiện, xóa tài nguyên & rental | `/admin/resources` |
| | Form tạo/sửa tài nguyên | `/admin/resources/add`, `.../edit/:id` |
| **Gallery** | Xem, tạo, sửa, ẩn/hiện, xóa album | `/admin/galleries` |
| | Form tạo/sửa album | `/admin/galleries/create`, `.../edit/:id` |
| **Khách hàng** | Xem danh sách, tìm kiếm, khoá/mở tài khoản | `/admin/customers` |
| **Profile** | Cập nhật thông tin admin | `/admin/profile` |

---

## 🔄 Luồng Hoạt Động Chi Tiết

### 1️⃣ Luồng Đăng Ký Tài Khoản

```
Khách nhập form (họ tên, email, SĐT, password)
    │
    ▼ Validation frontend (regex)
    │   - Họ tên: Chỉ chữ cái + dấu
    │   - SĐT: Bắt đầu 0, 10–11 chữ số
    │   - Email: Format hợp lệ
    │   - Password: 8–16 ký tự, có CHỮ HOA, chữ thường, số, ký tự đặc biệt
    │
    ▼ POST /api/auth/send-register-otp
    │   Backend tạo OTP 4–6 số, lưu DB (expiresAt = now + 5 phút)
    │   Gửi email qua Nodemailer
    │
    ▼ Khách nhập OTP → POST /api/auth/verify-otp
    │   Kiểm tra: OTP đúng? Còn hạn? Attempts < 3?
    │   Nếu đúng → mark verified, xóa OTP
    │
    ▼ POST /api/auth/register
    │   Hash password (bcrypt, rounds=10)
    │   Tạo User record, role = "customer"
    │   Sinh JWT (payload: id, email, role; expires: 7d)
    │
    ▼ Frontend nhận token → lưu localStorage
    └── Redirect → /
```

---

### 2️⃣ Luồng Đặt Lịch & Thanh Toán VNPay

```
Khách vào /services → Chọn dịch vụ → /booking
    │
    ▼ Chọn ngày trên Lịch thông minh & truy vấn thời tiết
    │   - Ngày trong vòng 14 ngày tới: Gọi Open-Meteo Forecast API lấy dự báo thời gian thực
    │   - Ngày ngoài 14 ngày/quá khứ: Gọi Open-Meteo Archive API lấy dữ liệu lịch sử cùng kỳ năm ngoái
    │   - Hệ thống hiển thị nhiệt độ, khả năng mưa, gió, độ ẩm và đưa ra lời khuyên chụp ảnh phù hợp
    │   - Chọn khung giờ chụp (Time Slots) phù hợp còn trống
    │
    ▼ Nhập thông tin đặt lịch & gợi ý địa điểm chụp
    │   - Nhập thợ chụp (Photographer) mong muốn
    │   - Nhập địa điểm chụp chi tiết: Tích hợp Photon (Komoot) API tự động gợi ý địa chỉ tại Việt Nam khi gõ tìm kiếm
    │   - Nhập ghi chú thêm cho ê-kíp
    │
    ▼ POST /api/bookings/create-vnpay
    │   Backend:
    │   1. Tạo Booking record (status: "Pending")
    │   2. Tạo Payment record (status: "PENDING")
    │   3. Build URL VNPay với các params:
    │      - vnp_Amount = depositAmount × 100
    │      - vnp_TxnRef = payment._id
    │      - vnp_ReturnUrl = VNPAY_RETURN_URL
    │      - vnp_CreateDate, vnp_ExpireDate
    │   4. Tạo checksum HMAC-SHA512
    │   5. Trả về paymentUrl
    │
    ▼ Frontend redirect → VNPay sandbox
    │   Test card: 4111111111111111 | Exp: 12/25 | OTP: 123456
    │
    ▼ VNPay redirect → GET /vnpay-return?vnp_*params
    │   Backend:
    │   1. Verify chữ ký SHA512
    │   2. Kiểm tra vnp_ResponseCode === "00"
    │   3. Update Payment status → "SUCCESS"
    │   4. Update Booking depositAmount, status → "Confirmed"
    │   5. Redirect frontend → /vnpay-return?bookingId=...
    │
    ▼ /vnpay-return (frontend) → Đọc bookingId từ query
    └── Hiển thị trang xác nhận thành công
```

> **Polling fallback**: Frontend gọi `GET /api/bookings/:id/check-status` mỗi 3 giây để kiểm tra nếu redirect bị lỗi.

---

### 3️⃣ Luồng Admin Xử Lý Đơn Hàng

```
Admin → /admin/orders → Xem danh sách Booking
    │
    ▼ Click "Tạo đơn hàng" → /admin/orders/create
    │   Điền: Gán photographer, ngày chụp, ghi chú
    │   POST /api/bookings/admin/create
    │
    ▼ Sau ngày chụp → Upload ảnh lên Google Drive
    │   POST /api/drive/upload
    │   Lấy URL → tạo/cập nhật Gallery record
    │
    ▼ PUT /api/bookings/:id/status (status: "Completed")
    │
    └── Gửi email thông báo cho khách
```

---

### 4️⃣ Luồng Cập Nhật Profile (OTP Có Điều Kiện)

```javascript
// Đổi tên, SĐT → KHÔNG cần OTP → Cập nhật trực tiếp
if (chỉ thay đổi fullName || phone) {
  PUT /api/auth/update-profile → { fullName, phone }
  // Response: 200, cập nhật ngay
}

// Đổi email → CẦN OTP
if (email thay đổi) {
  POST /api/auth/send-update-otp  // Gửi OTP đến email MỚI
  // Khách nhập OTP
  POST /api/auth/verify-otp
  PUT /api/auth/update-profile → { email, otp }
  // Response: 200, cập nhật email
}
```

---

## 🔐 Authentication & Security

### JWT Token

```javascript
// Payload sau khi đăng nhập:
{
  id: user._id,
  email: user.email,
  role: "customer" | "admin" | "photographer",
  iat: <issued at>,
  exp: <now + 7 ngày>
}

// Frontend gửi trong header:
Authorization: Bearer <token>

// Backend middleware verifyToken:
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;

// Backend middleware verifyAdmin:
if (req.user.role !== "admin") return 403;
```

### Password Security

```javascript
// Tạo hash khi đăng ký:
const hash = await bcrypt.hash(password, 10); // ~100ms

// Validate khi đăng nhập:
const isMatch = await bcrypt.compare(inputPassword, storedHash);

// Yêu cầu mật khẩu:
// Regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+]).{8,16}$/
// - 8–16 ký tự
// - Ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
```

### OTP Security

- Sinh ngẫu nhiên 4–6 chữ số
- Lưu MongoDB với `expiresAt = now + 5 phút`
- Tối đa **3 lần** nhập sai → reject, yêu cầu OTP mới
- Xóa OTP khỏi DB sau khi xác thực thành công

### VNPay Signature Verification

```javascript
const crypto = require("crypto");
const hmac = crypto.createHmac("sha512", process.env.VNPAY_SECRET_KEY);
hmac.update(Buffer.from(sortedParamString, "utf-8"));
const signature = hmac.digest("hex");
// So sánh với vnp_SecureHash từ VNPay
```

---

## 🚀 Cài Đặt & Chạy Ứng Dụng

### Yêu Cầu Hệ Thống

| Công cụ | Phiên bản tối thiểu |
|---------|---------------------|
| Node.js | 18+ |
| npm | 9+ |
| MongoDB | 6+ (local hoặc Atlas) |
| Redis | 7+ (tuỳ chọn) |

---

### Bước 1 — Clone & Cài Dependencies

```bash
# Clone project
git clone <repository-url>
cd caohienstudio

# Cài backend
cd backend
npm install

# Cài frontend
cd ../frontend
npm install
```

---

### Bước 2 — Cấu Hình Backend (.env)

```bash
cd backend
cp .env.example .env
# Mở .env và điền các giá trị thực tế (xem mục Biến Môi Trường bên dưới)
```

---

### Bước 3 — Tạo Tài Khoản Admin

```bash
cd backend
node seedAdmin.js
# Tạo tài khoản admin mặc định vào MongoDB
```

---

### Bước 4 — Chạy Backend

```bash
cd backend
npm run dev
# Nodemon khởi động → http://localhost:5000
# Log: ✅ MongoDB Connected | 🚀 Server running on port 5000
```

---

### Bước 5 — Cấu Hình & Chạy Frontend

```bash
cd frontend
cp .env.example .env
# Sửa .env:
# VITE_API_URL=http://localhost:5000/api

npm run dev
# Vite khởi động → http://localhost:5173
```

---

### Truy Cập Ứng Dụng

| Đường dẫn | Mô tả |
|-----------|-------|
| `http://localhost:5173/` | Trang chủ (public) |
| `http://localhost:5173/login` | Đăng nhập |
| `http://localhost:5173/register` | Đăng ký |
| `http://localhost:5173/services` | Xem dịch vụ |
| `http://localhost:5173/admin/dashboard` | Trang Admin |
| `http://localhost:5000/api/auth/me` | Test API |

---

## ⚙️ Biến Môi Trường

### Backend (`backend/.env`)

```env
# ========================================
# SERVER
# ========================================
PORT=5000
NODE_ENV=development

# ========================================
# DATABASE
# ========================================
# Local:
MONGO_URI=mongodb://localhost:27017/caohienstudio
# Atlas (production):
# MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/caohienstudio

# ========================================
# AUTHENTICATION
# ========================================
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

# ========================================
# EMAIL (Nodemailer via Gmail)
# ========================================
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_app_specific_password   # Tạo tại: myaccount.google.com/apppasswords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# ========================================
# VNPAY PAYMENT GATEWAY
# ========================================
# Đăng ký sandbox: https://sandbox.vnpayment.vn/devreg
VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_SECRET_KEY=YOUR_SECRET_KEY
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/vnpay-return
# Alias (tương thích):
VNP_TMNCODE=YOUR_TMN_CODE
VNP_HASHSECRET=YOUR_SECRET_KEY

# ========================================
# PAYOS PAYMENT GATEWAY
# ========================================
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_WEBHOOK_SECRET=your_webhook_secret

# ========================================
# REDIS (Tuỳ chọn)
# ========================================
REDIS_URL=redis://:password@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# ========================================
# FRONTEND URL
# ========================================
FRONTEND_URL=http://localhost:5173

# ========================================
# FILE UPLOAD
# ========================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🐛 Troubleshooting

### ❌ "MongoDB Connection Failed"

```
Nguyên nhân:
- MONGO_URI sai format hoặc sai credentials
- MongoDB chưa chạy (local)
- IP chưa được whitelist (Atlas)

Giải pháp:
1. Kiểm tra MongoDB local: mongosh "mongodb://localhost:27017"
2. Atlas: Vào Network Access → Add IP Address → 0.0.0.0/0 (development)
3. Kiểm tra MONGO_URI trong .env không có ký tự thừa
```

### ❌ "OTP không hợp lệ hoặc hết hạn"

```
Nguyên nhân:
- OTP hết hạn (> 5 phút)
- Nhập sai OTP quá 3 lần
- Đồng hồ server lệch múi giờ

Giải pháp:
1. Request OTP mới
2. Đảm bảo server timezone đúng: process.env.TZ = "Asia/Ho_Chi_Minh"
3. Tăng thời gian hết hạn OTP nếu cần (chỉnh expiresAt trong controller)
```

### ❌ "Email không gửi được"

```
Nguyên nhân:
- EMAIL_PASS dùng mật khẩu thông thường (phải dùng App Password)
- Google block đăng nhập từ "ứng dụng kém bảo mật"
- SMTP port bị firewall block

Giải pháp:
1. Bật 2FA Google Account
2. Tạo App Password: myaccount.google.com/apppasswords
3. Dán App Password vào EMAIL_PASS (không có dấu cách)
4. Test: nodemailer.createTransport({...}).verify()
```

### ❌ "VNPay Signature Verification Failed"

```
Nguyên nhân:
- VNPAY_SECRET_KEY sai
- Params không được sort đúng theo alphabet
- Có ký tự encode lỗi trong query string

Giải pháp:
1. Kiểm tra lại VNPAY_SECRET_KEY = VNPAY_TMN_CODE = đúng từ dashboard VNPay
2. Đảm bảo dùng Buffer.from(paramString, "utf-8") khi tạo HMAC
3. Log toàn bộ sorted params để so sánh với VNPay docs
```

### ❌ "CORS Error"

```
Giải pháp (backend/server.js):
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
```

### ❌ "Token hết hạn / Unauthorized 401"

```
Giải pháp (frontend):
1. Kiểm tra token trong localStorage còn không
2. JWT hết hạn sau 7 ngày → yêu cầu đăng nhập lại
3. Implement interceptor Axios để auto redirect /login khi nhận 401
```

---

## 📝 Changelog

### v1.0.2 (Tháng 6/2026) — Hiện tại
- ✅ **Luxury & Premium UI Redesign (Toàn bộ phía Khách hàng)**: Thiết kế lại toàn bộ giao diện khách hàng bao gồm Trang chủ, Giới thiệu (About), Dịch vụ (Services), Album (Galleries), Nhiếp ảnh gia (Photographers), Cho thuê thiết bị (Rentals), Liên hệ (Contact) và Đặt lịch (Booking). Giao diện mang ngôn ngữ thiết kế sang trọng, hiện đại với panel kính mờ (glassmorphism), hiệu ứng ánh sáng (spotlight), font chữ Outfit & Serif-Luxury quý phái, các hiệu ứng hover mượt mà và animation scroll reveal.
- ✅ **Smart Calendar & Weather Integration**: Tích hợp lưới lịch trực quan chọn ngày chụp và khung giờ (Time Slots) trống. Hệ thống tự động kết nối API Open-Meteo Forecast (dự báo 14 ngày) và Open-Meteo Archive (truy vấn thời tiết lịch sử cùng kỳ năm ngoái) để đưa ra chỉ số thời tiết (nhiệt độ, gió, độ ẩm, khả năng mưa) cùng các lời khuyên chụp ảnh tương ứng cho khách hàng.
- ✅ **Address Auto-Suggestion (Photon Komoot API)**: Tích hợp thành công thanh gợi ý địa chỉ tự động dựa trên Photon API, giới hạn phạm vi tìm kiếm trong bản đồ Việt Nam để nâng cao trải nghiệm điền thông tin địa điểm chụp.
- ✅ **Profile Update OTP Logic**: Tối ưu hóa trải nghiệm đổi thông tin cá nhân. Chỉ yêu cầu mã OTP khi khách hàng thay đổi email hoặc mật khẩu; các thay đổi họ tên, số điện thoại được cập nhật trực tiếp không cần OTP.
- ✅ **Endpoint `/send-update-otp`**: Gửi OTP xác thực đến địa chỉ email mới trước khi tiến hành cập nhật trong hệ thống.
- ✅ **Endpoint `/reset-password-profile`**: Cho phép khách hàng đổi mật khẩu trực tiếp trong trang cá nhân (yêu cầu xác thực OTP).
- ✅ **Google Drive Integration**: Hỗ trợ admin upload album ảnh hoàn thiện của đơn hàng lên Google Drive thông qua Service Account.
- ✅ **Contact Form**: Khách hàng gửi biểu mẫu liên hệ trực tiếp từ giao diện mới, tự động lưu thông tin vào cơ sở dữ liệu MongoDB.

### v1.0.1 (Tháng 5/2026)
- ✅ **Fix thanh toán VNPay**: Hỗ trợ cả GET/POST callback từ VNPay
- ✅ **Endpoint `/check-status`**: Polling trạng thái thanh toán real-time
- ✅ **Endpoint `/repay`**: Tạo lại link thanh toán cho đơn PENDING
- ✅ **Endpoint `/cancel`**: Khách tự huỷ đơn khi còn PENDING
- ✅ **Admin create booking**: Admin tạo booking hộ khách

### v1.0.0 (Tháng 4/2026)
- ✅ Khởi tạo dự án: Backend Express + Frontend React/Vite
- ✅ Xác thực JWT + OTP email
- ✅ CRUD Services, Resources, Galleries
- ✅ Flow đặt lịch cơ bản
- ✅ Dashboard Admin thống kê

---

## 📌 Ghi Chú Phát Triển

### Test API với Postman
- Import collection từ thư mục `/postman`
- Set biến `base_url = http://localhost:5000/api`
- Set biến `token` = JWT nhận được sau đăng nhập
- Test VNPay sandbox: card `4111111111111111`, Exp `12/25`, OTP `123456`

### Seed Admin mặc định
```bash
node backend/seedAdmin.js
# Email: admin@caohienstudio.com
# Password: Admin@123456 (hoặc xem trong seedAdmin.js)
```

### Hot reload (Development)
- Backend: `npm run dev` → Nodemon tự reload khi sửa file
- Frontend: `npm run dev` → Vite HMR tự reload tức thì

---

## 📬 Liên Hệ & Hỗ Trợ

- **Studio**: Cao Hiến Studio
- **Email**: info@caohienstudio.com
- **Website**: www.caohienstudio.com

---

## 📄 License

Dự án này được phát triển cho mục đích học thuật (Tiểu luận chuyên ngành / Khóa luận tốt nghiệp) và quản lý thực tế studio chụp ảnh.

**Sinh viên**: Hồ Vũ Anh — MSSV: 22110097  
**Phiên bản**: 1.0.2 | **Cập nhật**: Tháng 6 năm 2026

---

## 🤖 Hướng Dẫn Dành Cho AI Assistant (AI Context & Guidelines)

Phần này được thiết kế đặc biệt dành cho các công cụ AI Coding Assistant (như Gemini, Copilot, Cursor) để dễ dàng đọc hiểu, nắm bắt ngữ cảnh dự án và đưa ra những đóng góp chính xác nhất.

### 1. Style Guide & Quy Ước Code (Coding Conventions)

**Backend (Node.js/Express):**
- **Kiến trúc:** Bám sát mô hình MVC. Routes chỉ định nghĩa endpoint -> Controller xử lý business logic -> Models chứa schema MongoDB. KHÔNG viết logic xử lý dữ liệu phức tạp vào file Route.
- **Module System:** Sử dụng CommonJS (`require` / `module.exports`).
- **Error Handling:** Mọi async function trong Controller phải được bọc bởi `try/catch`. Response lỗi hoặc thành công phải tuân theo format JSON đồng nhất: `{ message: "...", data: ... }`.
- **Bảo mật:** Tất cả các endpoint trả dữ liệu nhạy cảm hoặc thao tác admin đều phải đi qua middleware `verifyToken` và `verifyAdmin`. Mật khẩu lưu vào DB luôn phải được hash bằng `bcrypt`.

**Frontend (React/Vite):**
- **Component:** 100% sử dụng Functional Components và Hooks (`useState`, `useEffect`, `useMemo`).
- **UI Framework:** Hệ thống sử dụng thư viện **Ant Design (antd)** làm chuẩn thiết kế. Sử dụng các component có sẵn của antd (Table, Form, Input, Button) trước khi quyết định viết custom CSS để giữ UI đồng nhất và chuyên nghiệp.
- **Routing:** Quản lý tập trung trong `App.jsx`. Route bảo mật cần nằm trong layout phân quyền (`AdminLayout`, `CustomerLayout`).
- **API Call:** Luôn sử dụng `axios`. Nên tận dụng interceptors để xử lý lỗi 401 (token hết hạn) và tự động đính kèm header `Authorization`.

### 2. Trạng Thái Hiện Tại (Current Status) & Tiến Độ Cập Nhật

Hệ thống đang ở giai đoạn **Phiên bản 1.0.2** (Đang phát triển & hoàn thiện). Dưới đây là bức tranh tổng thể:
- **Đã hoàn thiện:** Khung giao diện UI cho Khách hàng & Admin; Luồng Auth (Đăng nhập, Đăng ký, OTP, Quên mật khẩu); Đặt lịch Booking & Thanh toán cọc qua cổng VNPay; Quản lý Services, Galleries, Resources cho Admin. Upload ảnh lưu trữ vào Google Drive.
- **Điểm nóng (Hotspots):** Luồng xử lý thanh toán (VNPay IPN/Return) là luồng nhạy cảm nhất. Đã support cả GET/POST request do khác biệt giữa callback của các môi trường. TUYỆT ĐỐI CẨN THẬN khi refactor code trong `bookingController.js`.
- **Mục tiêu tiếp theo (TODOs):**
  1. Hoàn thiện module Real-time Chat bằng `Socket.IO` (đã setup server, cần build UI frontend).
  2. Nâng cấp luồng Giao việc (Assign Photographer): Gửi thông báo real-time/email khi Admin gán đơn hàng (Order) cho Photographer.
  3. Hoàn thiện tính năng Quản lý Nghỉ phép/Lịch bận của Photographer để tránh trùng lặp khi đặt lịch.
  4. Trực quan hóa Dashboard: Bổ sung các biểu đồ Recharts sâu hơn về tỷ lệ chuyển đổi dịch vụ.

### 3. Sơ Đồ Quan Hệ Cơ Sở Dữ Liệu (Database Relationships)

Dưới đây là các quan hệ cốt lõi cần nhớ để populate (join) không bị lỗi:
- `Booking` 1-n `User` (Ref tới userId - Khách đặt) và `Service` (Ref tới serviceId).
- `Order` (Đơn hàng chính thức) được sinh ra từ `Booking` sau khi duyệt. `Order` có 3 Refs quan trọng: `bookingId`, `customerId` (Khách), và `photographerId` (Nhân sự chụp).
- `Payment` 1-1 `Booking`. Khi webhook VNPay trả về trạng thái giao dịch SUCCESS, **phải** đồng thời cập nhật `status` của `Payment` và `status` + `depositAmount` của `Booking`.

### 4. Quy Tắc "Cứng" Khi Viết Code Mới
- **Biến môi trường:** Nếu yêu cầu logic sinh ra biến môi trường mới (vd: API Key mới), AI **phải** tự động bổ sung biến đó vào file `backend/.env.example` VÀ danh sách biến môi trường trong file `README.md` này.
- **Database Schema:** Nếu tạo collection MongoDB mới, AI **phải** cập nhật cấu trúc bảng vào mục `Cơ Sở Dữ Liệu` trong file `README.md` để giữ tài liệu luôn sống (living documentation).
- **Phá vỡ cấu trúc:** Tránh tối đa việc thay đổi luồng thanh toán hoặc cấu trúc Auth hiện có trừ khi có yêu cầu tái cấu trúc toàn diện từ User.
