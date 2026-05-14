# 📸 CAO HIẾN STUDIO - Hệ Thống Quản Lý Studio Chụp Ảnh

**Phiên bản**: 1.0.2 | **Cập nhật**: Tháng 5 năm 2026 | **Status**: Đang phát triển ✅

## 📋 Mục Lục

1. [Giới Thiệu Chung](#giới-thiệu-chung)
2. [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
3. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
4. [Cơ Sở Dữ Liệu - Collections](#cơ-sở-dữ-liệu---collections)
5. [API Endpoints & Request/Response](#api-endpoints--requestresponse)
6. [Giao Diện & Tính Năng](#giao-diện--tính-năng)
7. [Luồng Hoạt Động Chi Tiết](#luồng-hoạt-động-chi-tiết)
8. [Authentication & Security](#authentication--security)
9. [Cài Đặt & Chạy Ứng Dụng](#cài-đặt--chạy-ứng-dụng)
10. [Deployment & Production](#deployment--production)
11. [Troubleshooting & Error Handling](#troubleshooting--error-handling)
12. [Development Notes](#development-notes)
13. [Tài Liệu Bổ Sung](#tài-liệu-bổ-sung)

---

## 🎯 Giới Thiệu Chung

**Cao Hiến Studio** là một hệ thống quản lý toàn diện dành cho studio chụp ảnh hiện đại. Hệ thống cung cấp các tính năng:

- ✅ **Quản lý dịch vụ** (Cưới, Sự kiện, Gia đình)
- ✅ **Đặt lịch và thanh toán** (Hỗ trợ PayOS, VNPay)
- ✅ **Quản lý nhân viên** (Nhiếp ảnh gia, Trang điểm, Biên tập)
- ✅ **Quản lý tài nguyên** (Thiết bị, Props, Địa điểm)
- ✅ **Quản lý album** (Lưu trữ hình ảnh)
- ✅ **Hệ thống tài khoản** (Xác thực OTP, JWT)
- ✅ **Dashboard admin** (Báo cáo, Thống kê)

---

## 💻 Công Nghệ Sử Dụng

### Backend

- **Framework**: Node.js + Express.js 5.2.1
- **Database**: MongoDB 9.5.0 (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **Email**: Nodemailer 8.0.5
- **Cache**: Redis 5.12.1
- **Real-time**: Socket.IO 4.8.3
- **Payment**: PayOS SDK 2.0.5
- **Security**: Bcrypt/Bcryptjs 6.0.0
- **Server**: Nodemon (Development)

### Frontend

- **Framework**: React 19.2.5 + Vite 8.0.9
- **Routing**: React Router DOM 7.14.2
- **HTTP Client**: Axios 1.15.2
- **UI Library**: Ant Design 6.3.6
- **Icons**: Ant Design Icons 6.1.1
- **Charts**: Recharts 3.8.1
- **Date**: Day.js 1.11.20
- **Real-time**: Socket.IO Client 4.8.3

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Admin | Customer | Landing | Auth Pages           │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ API & WebSocket
┌──────────────────────▼──────────────────────────────────┐
│              Backend (Express.js)                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Routes | Controllers | Middleware | Services      │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Auth | Booking | Service | Resource | Admin       │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────┐  ┌─────▼────┐  ┌─────▼────┐
    │ MongoDB│  │ Redis    │  │ PayOS    │
    │ (Data) │  │ (Cache)  │  │ (Payment)│
    └────────┘  └──────────┘  └──────────┘
```

---

## 📊 Cơ Sở Dữ Liệu - Collections

### 1️⃣ **User Collection** (Người Dùng)

```javascript
{
  _id: ObjectId,
  fullName: String,          // Tên đầy đủ
  phone: String,             // Số điện thoại
  email: String,             // Email (unique)
  password: String,          // Mật khẩu (mã hóa bcrypt)
  role: String,              // "admin" hoặc "customer"
  createdAt: Date,
  updatedAt: Date
}
```

**Vai trò**:

- **Admin**: Quản lý hệ thống, tạo đơn hàng, quản lý tài nguyên
- **Customer**: Đặt dịch vụ, thanh toán, xem đơn hàng

---

### 2️⃣ **Service Collection** (Dịch Vụ/Gói Chụp)

```javascript
{
  _id: ObjectId,
  name: String,              // Tên gói (vd: "Gói Cưới Truyền Thống")
  price: Number,             // Giá gốc (VND)
  thumbnail: String,         // URL ảnh đại diện
  description: String,       // Mô tả ngắn
  details: String,           // Nội dung chi tiết
  features: [String],        // Danh sách tính năng
  category: String,          // "Wedding", "Event", "Family"
  createdAt: Date,
  updatedAt: Date
}
```

**Ví dụ các gói**:

- Gói Cưới: 10-15 triệu
- Gói Sự kiện: 3-5 triệu
- Gói Gia đình: 1-2 triệu

---

### 3️⃣ **Booking Collection** (Lịch Đặt)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // Tham chiếu User
  serviceName: String,       // Tên dịch vụ
  price: Number,             // Giá tại thời điểm đặt
  appointmentDate: Date,     // Ngày giờ chụp
  location: String,          // Địa điểm
  status: String,            // "Pending" | "Confirmed" | "Completed" | "Cancelled"
  note: String,              // Ghi chú thêm
  depositAmount: Number,     // Số tiền cọc đã trả
  paidAt: Date,              // Thời điểm thanh toán
  bookingType: String,       // "Early", "Late", "Urgent"
  createdAt: Date,
  updatedAt: Date
}
```

**Trạng thái**:

- Pending: Chờ xác nhận
- Confirmed: Đã xác nhận
- Completed: Hoàn tất
- Cancelled: Hủy

---

### 4️⃣ **Order Collection** (Đơn Hàng)

```javascript
{
  _id: ObjectId,
  customerID: ObjectId,      // Tham chiếu User
  packageID: ObjectId,       // Tham chiếu Service
  staffID: ObjectId,         // Nhân viên phụ trách (tùy chọn)
  shootDate: Date,           // Ngày chụp
  totalAmount: Number,       // Tổng tiền
  depositAmount: Number,     // Tiền cọc
  status: String,            // "Pending" | "Deposited" | "Completed" | "Cancelled"
  resources: [ObjectId],     // Danh sách Resource sử dụng
  payments: [                // Lịch sử thanh toán
    {
      amount: Number,
      paymentMethod: String, // "PayOS", "VNPay", "Cash"
      transactionID: String,
      status: String,
      date: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

### 5️⃣ **Staff Collection** (Nhân Viên)

```javascript
{
  _id: ObjectId,
  fullName: String,          // Tên nhân viên
  role: String,              // "Photographer", "Makeup Artist", "Editor"
  specialization: String,    // Chuyên môn (vd: "Chụp ngoại cảnh")
  phone: String,
  email: String,
  status: String,            // "Đang làm việc", "Nghỉ phép", "Đã nghỉ việc"
  avatar: String,            // URL ảnh đại diện
  createdAt: Date,
  updatedAt: Date
}
```

---

### 6️⃣ **Resource Collection** (Tài Nguyên)

```javascript
{
  _id: ObjectId,
  name: String,              // Tên tài nguyên (vd: "Canon 5D Mark IV")
  type: String,              // "Camera", "Lens", "Light", "Props", "Location"
  quantity: Number,          // Số lượng có sẵn
  status: String,            // "Available", "In Use", "Maintenance"
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 7️⃣ **Album Collection** (Album Ảnh)

```javascript
{
  _id: ObjectId,
  orderID: ObjectId,         // Tham chiếu Order
  title: String,             // Tiêu đề album
  description: String,
  images: [String],          // Mảng URL ảnh
  createdAt: Date,
  updatedAt: Date
}
```

---

### 8️⃣ **OTP Collection** (Xác Thực OTP)

```javascript
{
  _id: ObjectId,
  email: String,
  otp: String,               // Mã OTP (4-6 chữ số)
  expiresAt: Date,           // Thời gian hết hạn (5-10 phút)
  attempts: Number,          // Số lần nhập sai
  verified: Boolean,         // Đã xác thực?
  createdAt: Date
}
```

---

## 🔗 API Endpoints & Request/Response

### **Authentication API** (`/api/auth`)

#### 1. Đăng Ký Tài Khoản

```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0912345678",
  "password": "Password123!@"
}

Response (200):
{
  "message": "Đăng ký thành công!",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "0912345678",
    "role": "customer",
    "createdAt": "2026-05-14T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Đăng Nhập

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!@"
}

Response (200):
{
  "message": "Đăng nhập thành công!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "customer"
  }
}

Response (401):
{
  "message": "Email hoặc mật khẩu không chính xác!"
}
```

#### 3. Gửi OTP Verify

```http
POST /api/auth/send-register-otp
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "message": "Mã OTP đã được gửi đến email của bạn!"
}
```

#### 4. Xác Thực OTP

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response (200):
{
  "message": "Xác thực thành công!",
  "verified": true
}

Response (400):
{
  "message": "Mã OTP không chính xác hoặc hết hạn!"
}
```

#### 5. Lấy Thông Tin Cá Nhân

```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200):
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0912345678",
  "role": "customer",
  "createdAt": "2026-05-14T10:30:00Z",
  "updatedAt": "2026-05-14T11:45:00Z"
}
```

#### 6. Cập Nhật Thông Tin Cá Nhân (Có Condition OTP)

```http
PUT /api/auth/update-profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "fullName": "Nguyễn Văn B",
  "phone": "0987654321"
}

Response (200) - Cập nhật trực tiếp (không cần OTP):
{
  "message": "Cập nhật thành công!",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "Nguyễn Văn B",
    "phone": "0987654321",
    "email": "user@example.com"
  }
}

Request (thay đổi email):
{
  "fullName": "Nguyễn Văn A",
  "phone": "0912345678",
  "email": "newemail@example.com"
}

Response (200) - Yêu cầu OTP:
{
  "message": "Cần xác thực email mới",
  "requiresOtp": true,
  "pendingEmail": "newemail@example.com"
}
```

---

### **Service API** (`/api/services`)

#### 1. Danh Sách Dịch Vụ

```http
GET /api/services?category=Wedding&page=1&limit=10

Response (200):
{
  "total": 3,
  "page": 1,
  "limit": 10,
  "services": [
    {
      "_id": "507f191e810c19729de860ea",
      "name": "Gói Cưới Truyền Thống",
      "price": 15000000,
      "thumbnail": "https://example.com/wedding.jpg",
      "description": "Gói chụp cưới 1 ngày đầy đủ",
      "category": "Wedding",
      "features": [
        "8 giờ chụp",
        "1 Photographer",
        "500+ ảnh edited",
        "Album in 4x6"
      ],
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

#### 2. Chi Tiết Dịch Vụ

```http
GET /api/services/507f191e810c19729de860ea

Response (200):
{
  "_id": "507f191e810c19729de860ea",
  "name": "Gói Cưới Truyền Thống",
  "price": 15000000,
  "thumbnail": "https://example.com/wedding.jpg",
  "description": "Gói chụp cưới 1 ngày đầy đủ",
  "details": "Nội dung chi tiết về dịch vụ...",
  "features": [
    "8 giờ chụp",
    "1 Photographer",
    "1 Videographer",
    "500+ ảnh edited",
    "Album in 4x6",
    "USB + Backup"
  ],
  "category": "Wedding",
  "createdAt": "2026-01-15T10:00:00Z"
}
```

---

### **Booking API** (`/api/bookings`)

#### 1. Tạo Lịch Đặt

```http
POST /api/bookings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "serviceId": "507f191e810c19729de860ea",
  "serviceName": "Gói Cưới Truyền Thống",
  "price": 15000000,
  "appointmentDate": "2026-08-15",
  "location": "Nhà hàng Tiệc Cưới, Q.1, TP.HCM",
  "note": "Yêu cầu chụp ảnh ngoài trời lúc chiều"
}

Response (201):
{
  "message": "Lịch đặt đã được tạo!",
  "booking": {
    "_id": "507f191e810c19729de860eb",
    "userId": "507f1f77bcf86cd799439011",
    "serviceName": "Gói Cưới Truyền Thống",
    "price": 15000000,
    "appointmentDate": "2026-08-15",
    "location": "Nhà hàng Tiệc Cưới, Q.1, TP.HCM",
    "status": "Pending",
    "depositAmount": 0,
    "createdAt": "2026-05-14T14:20:00Z"
  }
}
```

#### 2. Danh Sách Lịch Đặt của Khách

```http
GET /api/bookings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200):
{
  "total": 2,
  "bookings": [
    {
      "_id": "507f191e810c19729de860eb",
      "userId": "507f1f77bcf86cd799439011",
      "serviceName": "Gói Cưới Truyền Thống",
      "price": 15000000,
      "appointmentDate": "2026-08-15",
      "location": "Nhà hàng Tiệc Cưới, Q.1, TP.HCM",
      "status": "Pending",
      "depositAmount": 0,
      "createdAt": "2026-05-14T14:20:00Z"
    }
  ]
}
```

---

### **Payment API** (`/api/bookings/create-vnpay`)

#### 1. Tạo Thanh Toán VNPay

```http
POST /api/bookings/{bookingId}/create-vnpay
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "amount": 5000000,
  "orderInfo": "Cọc cho gói Cưới Truyền Thống"
}

Response (200):
{
  "message": "Tạo link thanh toán thành công!",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "paymentId": "507f191e810c19729de860ec",
  "transactionId": "VNP20260514123456789"
}

Khách hàng click vào paymentUrl → Nhập thông tin thẻ → VNPay xử lý
```

#### 2. Return từ VNPay

```http
GET /api/bookings/vnpay-return?vnp_Amount=5000000&vnp_TxnRef=VNP20260514123456789&...
(Tự động redirect từ VNPay)

Backend xử lý:
1. Verify chữ ký SHA512
2. Update Payment status → "SUCCESS"
3. Update Booking status → "Confirmed"
4. Redirect frontend → BookingSuccess page
```

#### 3. Check Status Thanh Toán (Real-time Polling)

```http
GET /api/bookings/{bookingId}/check-status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200):
{
  "booking": {
    "_id": "507f191e810c19729de860eb",
    "status": "Confirmed",
    "depositAmount": 5000000
  },
  "payment": {
    "_id": "507f191e810c19729de860ec",
    "status": "SUCCESS",
    "transactionId": "VNP20260514123456789",
    "amount": 5000000,
    "paidAt": "2026-05-14T14:25:00Z"
  }
}
```

---

### **Resource API** (`/api/resources`)

#### 1. Tạo Tài Nguyên (Admin)

```http
POST /api/resources
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Canon 5D Mark IV",
  "type": "Camera",
  "quantity": 3,
  "status": "Available",
  "description": "DSLR camera chuyên nghiệp"
}

Response (201):
{
  "message": "Tài nguyên đã được tạo!",
  "resource": {
    "_id": "507f191e810c19729de860ed",
    "name": "Canon 5D Mark IV",
    "type": "Camera",
    "quantity": 3,
    "status": "Available"
  }
}
```

#### 2. Danh Sách Tài Nguyên

```http
GET /api/resources?type=Camera&status=Available

Response (200):
{
  "total": 3,
  "resources": [
    {
      "_id": "507f191e810c19729de860ed",
      "name": "Canon 5D Mark IV",
      "type": "Camera",
      "quantity": 3,
      "status": "Available",
      "description": "DSLR camera chuyên nghiệp"
    }
  ]
}
```

---

### **Staff API** (`/api/staff`)

#### 1. Tạo Nhân Viên (Admin)

```http
POST /api/staff
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "fullName": "Trần Minh Anh",
  "role": "Photographer",
  "specialization": "Chụp ngoại cảnh",
  "phone": "0901234567",
  "email": "tma@studio.com",
  "status": "Đang làm việc",
  "avatar": "https://example.com/avatar.jpg"
}

Response (201):
{
  "message": "Nhân viên đã được tạo!",
  "staff": {
    "_id": "507f191e810c19729de860ee",
    "fullName": "Trần Minh Anh",
    "role": "Photographer",
    "specialization": "Chụp ngoại cảnh"
  }
}
```

#### 2. Danh Sách Nhân Viên

```http
GET /api/staff?role=Photographer

Response (200):
{
  "total": 5,
  "staff": [
    {
      "_id": "507f191e810c19729de860ee",
      "fullName": "Trần Minh Anh",
      "role": "Photographer",
      "specialization": "Chụp ngoại cảnh",
      "status": "Đang làm việc"
    }
  ]
}
```

---

### **Order API** (`/api/orders`)

#### 1. Tạo Đơn Hàng (Admin từ Booking)

```http
POST /api/orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "customerId": "507f1f77bcf86cd799439011",
  "bookingId": "507f191e810c19729de860eb",
  "serviceName": "Gói Cưới Truyền Thống",
  "staffId": "507f191e810c19729de860ee",
  "resourceIds": ["507f191e810c19729de860ed", "507f191e810c19729de860ef"],
  "totalAmount": 15000000,
  "depositAmount": 5000000
}

Response (201):
{
  "message": "Đơn hàng đã được tạo!",
  "order": {
    "_id": "507f191e810c19729de860f0",
    "customerId": "507f1f77bcf86cd799439011",
    "serviceName": "Gói Cưới Truyền Thống",
    "staffId": "507f191e810c19729de860ee",
    "status": "Pending",
    "totalAmount": 15000000,
    "depositAmount": 5000000,
    "createdAt": "2026-05-14T15:00:00Z"
  }
}
```

#### 2. Danh Sách Đơn Hàng (Admin)

```http
GET /api/orders?status=Deposited&page=1

Response (200):
{
  "total": 12,
  "page": 1,
  "orders": [
    {
      "_id": "507f191e810c19729de860f0",
      "customerId": "507f1f77bcf86cd799439011",
      "serviceName": "Gói Cưới Truyền Thống",
      "status": "Deposited",
      "totalAmount": 15000000,
      "depositAmount": 5000000,
      "shootDate": "2026-08-15",
      "staffName": "Trần Minh Anh"
    }
  ]
}
```

---

### **Album API** (`/api/albums`)

#### 1. Tạo Album (Admin)

```http
POST /api/albums
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "orderId": "507f191e810c19729de860f0",
  "title": "Album Cưới Nguyễn Văn A - Lê Thị B",
  "description": "Ảnh cưới ngày 15/08/2026 tại TP.HCM",
  "images": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg",
    "https://example.com/photo3.jpg"
  ]
}

Response (201):
{
  "message": "Album đã được tạo!",
  "album": {
    "_id": "507f191e810c19729de860f1",
    "orderId": "507f191e810c19729de860f0",
    "title": "Album Cưới Nguyễn Văn A - Lê Thị B",
    "imageCount": 3,
    "createdAt": "2026-08-20T10:00:00Z"
  }
}
```

#### 2. Xem Album (Public)

```http
GET /api/albums/{albumId}

Response (200):
{
  "_id": "507f191e810c19729de860f1",
  "title": "Album Cưới Nguyễn Văn A - Lê Thị B",
  "description": "Ảnh cưới ngày 15/08/2026 tại TP.HCM",
  "images": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg",
    "https://example.com/photo3.jpg"
  ],
  "createdAt": "2026-08-20T10:00:00Z"
}
```

---

## 🎨 Giao Diện & Tính Năng

### **Frontend Structure**

```
frontend/src/
├── pages/
│   ├── Landing.jsx              # Trang chủ công khai
│   ├── auth/
│   │   ├── Login.jsx            # Đăng nhập
│   │   ├── Register.jsx         # Đăng ký
│   │   └── ForgotPassword.jsx   # Quên mật khẩu
│   ├── customer/
│   │   ├── Home.jsx             # Trang chủ khách hàng
│   │   ├── Services.jsx         # Danh sách dịch vụ
│   │   ├── ServiceDetail.jsx    # Chi tiết dịch vụ
│   │   ├── Booking.jsx          # Đặt lịch chụp
│   │   ├── BookingDetail.jsx    # Chi tiết lịch đặt
│   │   ├── BookingSuccess.jsx   # Xác nhận đặt lịch
│   │   ├── MyBookings.jsx       # Lịch đặt của tôi
│   │   ├── Payment.jsx          # Trang thanh toán
│   │   ├── VnpayReturn.jsx      # Return VNPay
│   │   ├── AlbumDetail.jsx      # Xem album
│   │   ├── About.jsx            # Giới thiệu
│   │   └── Profile.jsx          # Cá nhân
│   └── admin/
│       ├── AdminDashboard.jsx   # Dashboard chính
│       ├── Dashboard.jsx        # Thống kê
│       ├── Orders.jsx           # Quản lý đơn hàng
│       ├── OrdersCreate.jsx     # Tạo đơn hàng
│       ├── OrdersDetail.jsx     # Chi tiết đơn hàng
│       ├── Services.jsx         # Quản lý dịch vụ
│       ├── ServicesCreate.jsx   # Tạo dịch vụ
│       ├── Resources.jsx        # Quản lý tài nguyên
│       ├── ResourcesCreate.jsx  # Tạo tài nguyên
│       ├── Staff.jsx            # Quản lý nhân viên
│       ├── StaffCreate.jsx      # Tạo nhân viên
│       ├── Customers.jsx        # Quản lý khách hàng
│       ├── Revenue.jsx          # Báo cáo doanh thu
│       ├── Reports.jsx          # Các báo cáo khác
│       └── Profile.jsx          # Cá nhân admin
├── components/
│   ├── ProtectedRoute.jsx       # Bảo vệ route (yêu cầu auth)
│   └── layout/
│       ├── AdminLayout.jsx      # Layout admin
│       ├── CustomerLayout.jsx   # Layout khách hàng
│       ├── LandingLayout.jsx    # Layout trang chủ
│       ├── PublicLayout.jsx     # Layout công khai
│       └── SharedLayout.jsx     # Layout chung
└── assets/                      # Hình ảnh, icon, ...
```

---

### **Main Features by Role**

#### 👥 **Customer (Khách Hàng)**

- ✅ Đăng ký/Đăng nhập tài khoản
- ✅ Xem danh sách dịch vụ theo danh mục (Cưới, Sự kiện, Gia đình)
- ✅ Xem chi tiết dịch vụ (tính năng, giá, ảnh)
- ✅ Đặt lịch chụp với ngày tháng và địa điểm
- ✅ Thanh toán cọc (PayOS hoặc VNPay)
- ✅ Theo dõi trạng thái lịch đặt
- ✅ Xem album ảnh đã chụp
- ✅ Quản lý thông tin cá nhân

#### 👨‍💼 **Admin (Quản Trị Viên)**

- ✅ Quản lý dịch vụ (tạo, sửa, xóa)
- ✅ Quản lý đơn hàng từ khách hàng
- ✅ Gán nhân viên cho đơn hàng
- ✅ Quản lý tài nguyên (thiết bị, props, địa điểm)
- ✅ Quản lý nhân viên (thêm, sửa, xóa)
- ✅ Quản lý khách hàng
- ✅ Xem báo cáo doanh thu
- ✅ Tạo và quản lý album ảnh
- ✅ Xác nhận lịch đặt
- ✅ Xử lý hoàn tất đơn hàng

---

---

## 🔐 Authentication & Security

### **JWT Token Flow**

```javascript
// 1. Sau khi đăng nhập thành công:
const token = jwt.sign(
  { id: user._id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }, // Token hết hạn sau 7 ngày
);

// 2. Frontend lưu token vào localStorage:
localStorage.setItem("token", token);

// 3. Gửi trong mỗi request có auth:
headers: {
  Authorization: `Bearer ${token}`;
}

// 4. Backend verify token:
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // Gán user info vào request
```

### **Password Security**

```javascript
// Hashing: Bcrypt rounds = 10 (mất ~100ms để hash 1 password)
const hashedPassword = await bcrypt.hash(password, 10);

// So sánh:
const isMatch = await bcrypt.compare(inputPassword, hashedPassword);

// Requirements:
// - Minimum 8 characters
// - Ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
// Regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()>\.]).{8,16}$/
```

### **OTP Verification Flow**

```
1. User request OTP → Generate random 4-6 digits
2. Save OTP vào MongoDB với expiry = hiện tại + 5-10 phút
3. Gửi OTP qua email (Nodemailer)
4. User nhập OTP → Kiểm tra:
   - OTP có chính xác?
   - OTP có còn hạn?
   - Số lần nhập sai < 3?
5. Nếu pass → Mark OTP as verified → Tiến hành thao tác tiếp theo
6. Nếu fail → Reject và yêu cầu OTP mới

// Backend code:
const otp = await OTP.findOne({ email, otp });
if (!otp || otp.expiresAt < new Date()) {
  return res.status(400).json({ message: "OTP không hợp lệ!" });
}
await OTP.deleteOne({ _id: otp._id });
```

### **Conditional OTP for Profile Updates**

```javascript
// Backend: authController.updateProfile()
const isEmailChanged = email && email !== currentUser.email;
const isNameChanged = fullName && fullName !== currentUser.fullName;
const isPhoneChanged = phone && phone !== currentUser.phone;

if ((isNameChanged || isPhoneChanged) && !isEmailChanged) {
  // ✅ Cập nhật trực tiếp (không cần OTP)
  return updateDirectly(req.user.id, { fullName, phone });
}

if (isEmailChanged) {
  // ❌ Yêu cầu OTP trước khi đổi email
  return res.status(200).json({
    message: "Cần xác thực email mới",
    requiresOtp: true,
    pendingEmail: email,
  });
}
```

---

## 🔄 Luồng Hoạt Động Chi Tiết

### **1️⃣ Luồng Đăng Ký Toàn Bộ**

```
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: KHÁCH HÀNG TRUY CẬP REGISTER PAGE                       │
├─────────────────────────────────────────────────────────────────┤
│ • Frontend: /auth/register                                      │
│ • Hiển thị form: Họ tên, Email, SĐT, Password, Confirm Password│
│                                                                  │
│ BƯỚC 2: NHẬP THÔNG TIN & VALIDATE PHÍA FRONTEND                 │
├─────────────────────────────────────────────────────────────────┤
│ • Regex validation:                                             │
│   - Họ tên: Chữ cái + dấu (không số, ký tự đặc biệt)          │
│   - SĐT: Bắt đầu 0, 10-11 chữ số                                │
│   - Email: Format email hợp lệ                                 │
│   - Password: Có chữ hoa, thường, số, ký tự đặc biệt, 8-16 ký │
│ • Nếu fail → Hiển thị lỗi, không gửi backend                    │
│                                                                  │
│ BƯỚC 3: SUBMIT ĐẾN BACKEND                                      │
├─────────────────────────────────────────────────────────────────┤
│ • POST /api/auth/register                                       │
│ • Body: { fullName, email, phone, password }                    │
│                                                                  │
│ BƯỚC 4: BACKEND VALIDATE & TẠO USER                              │
├─────────────────────────────────────────────────────────────────┤
│ • Kiểm tra email đã tồn tại?                                    │
│ • Hash password với bcrypt (rounds=10)                          │
│ • Tạo User record trong MongoDB                                 │
│ • Trả về user object (không có password)                        │
│                                                                  │
│ BƯỚC 5: GỬI OTP XÁC THỰC                                        │
├─────────────────────────────────────────────────────────────────┤
│ • Generate OTP: Math.random() 4-6 chữ số                        │
│ • Lưu vào OTP collection: { email, otp, expiresAt: now+5min }  │
│ • Gửi email qua Nodemailer:                                     │
│   From: no-reply@caohienstudio.com                              │
│   To: user email                                                │
│   Subject: "Mã OTP xác thực đăng ký"                            │
│   Body: "Mã OTP của bạn: XXXXXX (Hiệu lực 5 phút)"             │
│                                                                  │
│ BƯỚC 6: KHÁCH HÀNG NHẬP OTP                                     │
├─────────────────────────────────────────────────────────────────┤
│ • Frontend: Modal nhập OTP                                      │
│ • Giao diện: Input 4 ô tự động focus ô tiếp theo               │
│ • Button: "Xác nhận"                                            │
│                                                                  │
│ BƯỚC 7: BACKEND VERIFY OTP                                      │
├─────────────────────────────────────────────────────────────────┤
│ • POST /api/auth/verify-otp                                     │
│ • Kiểm tra:                                                     │
│   - OTP có đúng?                                                │
│   - OTP có trong hạn?                                           │
│   - Số lần nhập sai < 3?                                        │
│ • Nếu pass: Xóa OTP, trả về verified: true                     │
│ • Nếu fail: Tăng attempts, reject                               │
│                                                                  │
│ BƯỚC 8: SINH JWT TOKEN                                          │
├─────────────────────────────────────────────────────────────────┤
│ • Payload: { id: user._id, email, role: 'customer' }           │
│ • Secret: process.env.JWT_SECRET                                │
│ • Expiry: 7 days                                                │
│ • Trả về token cho frontend                                    │
│                                                                  │
│ BƯỚC 9: LƯUTOKEN & REDIRECT                                     │
├─────────────────────────────────────────────────────────────────┤
│ • localStorage.setItem('token', token)                          │
│ • localStorage.setItem('user', JSON.stringify(user))            │
│ • Redirect to /customer/home                                    │
└─────────────────────────────────────────────────────────────────┘
```

### **2️⃣ Luồng Đặt Lịch & Thanh Toán VNPay**

```
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: KHÁCH XEM DỊCH VỤ VÀ BOOK                                │
├─────────────────────────────────────────────────────────────────┤
│ • Vào /customer/services → Lọc theo category                    │
│ • Click vào 1 service → Xem chi tiết                            │
│ • Click "Đặt lịch ngay" → Form booking                          │
│ • Form: serviceId, appointmentDate, location, note              │
│                                                                  │
│ BƯỚC 2: SUBMIT BOOKING TỚI BACKEND                               │
├─────────────────────────────────────────────────────────────────┤
│ • POST /api/bookings                                            │
│ • Body: { serviceId, serviceName, price, appointmentDate, ... }│
│ • Backend tạo Booking record (status: "Pending")                │
│ • Gửi email xác nhận lịch đặt                                   │
│ • Trả về booking._id                                            │
│                                                                  │
│ BƯỚC 3: KHÁCH CHỌN THANH TOÁN CỌC                                │
├─────────────────────────────────────────────────────────────────┤
│ • Tính cọc: 30-50% giá dịch vụ                                  │
│ • Hiển thị form: Chọn phương thức (PayOS/VNPay)                │
│ • Click "Thanh toán qua VNPay"                                  │
│                                                                  │
│ BƯỚC 4: TẠO LINK THANH TOÁN VNPAY                                │
├─────────────────────────────────────────────────────────────────┤
│ • POST /api/bookings/{bookingId}/create-vnpay                   │
│ • Body: { amount: depositAmount, orderInfo: "..." }             │
│                                                                  │
│ Backend:                                                         │
│ 1. Tạo Payment record:                                          │
│    {                                                             │
│      bookingId,                                                 │
│      amount: 5000000,                                           │
│      method: "VNPAY",                                           │
│      status: "PENDING",                                         │
│      createdAt: now                                             │
│    }                                                             │
│ 2. Build VNPay URL với parameters:                              │
│    - vnp_Amount (amount * 100)                                  │
│    - vnp_CreateDate (yyyyMMddHHmmss)                            │
│    - vnp_OrderInfo (payment description)                        │
│    - vnp_Locale (vi)                                            │
│    - vnp_ReturnUrl (http://localhost:5173/vnpay-return)        │
│ 3. Tạo checksum SHA512(sorted_params + secret_key)              │
│ 4. Redirect URL = VNPay Gateway + checksum                      │
│                                                                  │
│ BƯỚC 5: KHÁCH NHẬP THÔNG TIN THẺ                                 │
├─────────────────────────────────────────────────────────────────┤
│ • Redirect to VNPay payment gateway                             │
│ • Test card: 4111111111111111                                   │
│ • Expiry: 12/25                                                 │
│ • OTP: 123456                                                   │
│ • VNPay xử lý giao dịch                                         │
│                                                                  │
│ BƯỚC 6: VNPAY CALLBACK RETURN                                   │
├─────────────────────────────────────────────────────────────────┤
│ • VNPay gửi callback kèm response codes                         │
│ • Redirect: GET /api/bookings/vnpay-return?vnp_*parameters      │
│                                                                  │
│ Backend xử lý:                                                  │
│ 1. Verify signature:                                            │
│    - Lấy checksum từ response                                   │
│    - Tính lại checksum từ params                                │
│    - So sánh (phải match 100%)                                  │
│ 2. Kiểm tra response code:                                      │
│    - vnp_ResponseCode === "00" → Thành công                     │
│    - Khác → Thất bại                                            │
│ 3. Update Payment status → "SUCCESS"                            │
│ 4. Update Booking status → "Confirmed"                          │
│ 5. Gửi email xác nhận                                           │
│ 6. Redirect frontend → /BookingSuccess?bookingId=...            │
│                                                                  │
│ BƯỚC 7: KHÁCH XEM TRANG SUCCESS                                  │
├─────────────────────────────────────────────────────────────────┤
│ • Hiển thị: "Thanh toán thành công!"                            │
│ • Thông tin: Booking details, payment amount, next steps        │
│ • Có option: In hoặc lưu PDF                                    │
│                                                                  │
│ BƯỚC 8: ADMIN XÁC NHẬN ĐƠN HÀNG                                  │
├─────────────────────────────────────────────────────────────────┤
│ • Admin đăng nhập → Dashboard                                   │
│ • Xem danh sách Booking cần xác nhận                            │
│ • Click "Confirm" → Tạo Order record                            │
│ • Gán nhân viên (Photographer, Makeup, Editor)                  │
│ • Gán tài nguyên (Camera, Lens, Light, Props)                  │
│ • Update Order status → "Deposited"                             │
│ • Gửi email cho khách: "Đơn hàng đã được xác nhận"             │
└─────────────────────────────────────────────────────────────────┘
```

### **3️⃣ Luồng Admin Quản Lý Đơn Hàng & Tài Nguyên**

```
DASHBOARD ADMIN:
┌──────────────────────────────────────────┐
│ Orders Section                           │
├──────────────────────────────────────────┤
│ • Danh sách orders với status filter      │
│ • Pending → Xác nhận                      │
│ • Confirmed → Gán staff & resources       │
│ • Completed → Upload album & close        │
│                                          │
│ Resources Section                        │
├──────────────────────────────────────────┤
│ • Danh sách tài nguyên                    │
│ • Thêm mới: Tên, loại, số lượng, status   │
│ • Khi assign: status → "In Use"          │
│ • Khi trả: status → "Available" or "Maintenance" │
│                                          │
│ Staff Section                            │
├──────────────────────────────────────────┤
│ • Danh sách nhân viên                     │
│ • Thêm mới: Tên, role, specialization     │
│ • Xem công việc của từng person          │
│                                          │
│ Revenue Section                          │
├──────────────────────────────────────────┤
│ • Biểu đồ doanh thu                       │
│ • Phân tích theo gói dịch vụ              │
│ • Báo cáo theo tháng/quý/năm              │
└──────────────────────────────────────────┘
```

### **4️⃣ Luồng Upload Album & Hoàn Tất Đơn Hàng**

```
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: SAU NGÀY CHỤP (Vài ngày sau)                             │
├─────────────────────────────────────────────────────────────────┤
│ • Biên tập viên edit ảnh, tạo album                             │
│ • Admin vào Edit Order → Upload Album                           │
│ • Form: Title, Description, Images array                        │
│                                                                  │
│ BƯỚC 2: TẠO ALBUM RECORD                                        │
├─────────────────────────────────────────────────────────────────┤
│ • POST /api/albums                                              │
│ • Body: {                                                       │
│     orderId: "...",                                             │
│     title: "Album Cưới A-B",                                    │
│     description: "...",                                         │
│     images: ["url1", "url2", ...]                              │
│   }                                                             │
│ • Lưu Album record → Link với Order                             │
│                                                                  │
│ BƯỚC 3: UPDATE ORDER STATUS                                     │
├─────────────────────────────────────────────────────────────────┤
│ • PUT /api/orders/{orderId}                                     │
│ • Update: status → "Completed"                                  │
│ • Lưu completedDate: new Date()                                 │
│ • Update Resources: status → "Available"                        │
│                                                                  │
│ BƯỚC 4: GỬI THÔNG BÁO CHO KHÁCH                                 │
├─────────────────────────────────────────────────────────────────┤
│ • Gửi email: "Album ảnh sẵn sàng!"                              │
│ • Đính kèm link: /customer/albums/{albumId}                    │
│ • Ghi chú: Có hạn lưu trữ (thường 1 năm)                        │
│                                                                  │
│ BƯỚC 5: KHÁCH XEM ALBUM                                         │
├─────────────────────────────────────────────────────────────────┤
│ • Vào /customer/albums → Xem danh sách albums                   │
│ • Click album → Xem chi tiết & download ảnh                    │
│ • Tính năng: Slideshow, download ZIP, in ảnh                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Cài Đặt & Chạy Ứng Dụng

### **Yêu Cầu Hệ Thống**

- Node.js 16+
- MongoDB (local hoặc cloud)
- Redis (optional, cho cache)
- npm hoặc yarn

---

### **Backend Setup**

```bash
# 1. Vào thư mục backend
cd backend

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env
cat > .env << EOF
PORT=5000
MONGO_URI=mongodb://localhost:27017/caohienstudio
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
VNPAY_TmnCode=your_vnpay_code
REDIS_URL=redis://localhost:6379
EOF

# 4. Chạy seed để tạo admin
node seeds/createAdmin.js

# 5. Chạy server
npm start
# Server chạy trên http://localhost:5000
```

---

### **Frontend Setup**

```bash
# 1. Vào thư mục frontend
cd frontend

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
EOF

# 4. Chạy dev server
npm run dev
# Frontend chạy trên http://localhost:5173

# 5. Build cho production
npm run build
```

---

### **Biến Môi Trường (.env Backend)**

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/caohienstudio

# Security
JWT_SECRET=your_very_secret_key_here
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

# Email (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Payment Gateways
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_WEBHOOK_SECRET=your_webhook_secret

VNPAY_TmnCode=TMNCODE
VNPAY_HashSecret=your_vnpay_hash_secret
VNPAY_Url=https://sandbox.vnpayment.vn/paygate

# Redis
REDIS_URL=redis://:password@localhost:6379

# Frontend URL
FRONTEND_URL=http://localhost:5173

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

---

### **Database MongoDB Schema**

```javascript
// Collections sẽ được tự động tạo khi chạy ứng dụng
// Trong MongoDB Compass, bạn sẽ thấy:
db.users; // Người dùng
db.services; // Dịch vụ
db.bookings; // Lịch đặt
db.orders; // Đơn hàng
db.staff; // Nhân viên
db.resources; // Tài nguyên
db.albums; // Album ảnh
db.otps; // Mã OTP
```

---

## � Tài Liệu Bổ Sung & Hướng Dẫn Chi Tiết

### 📌 **Mới Sửa (Phiên Bản 1.0.2) - Profile Update OTP Logic**

Hệ thống profile update đã được cập nhật với OTP logic có điều kiện:

- ✅ Chỉ yêu cầu OTP khi đổi email hoặc mật khẩu
- ✅ Không cần OTP khi chỉ đổi tên hoặc SĐT
- ✅ Frontend kiểm tra loại thay đổi, tự động xử lý
- ✅ Backend validate field nào thay đổi
- ✅ Gửi OTP đến email mới khi đổi email

---

## 📌 **Phần Trước (Phiên Bản 1.0.1) - Fix Lỗi Thanh Toán VNPay**

Hệ thống thanh toán VNPay được sửa đầy đủ:

- ✅ Routes hỗ trợ cả GET (callback VNPay) và POST (confirm frontend)
- ✅ Payment.jsx gọi API thực tế `/create-vnpay` thay vì hiển thị QR tĩnh
- ✅ Thêm endpoint `/check-status` để frontend polling trạng thái thanh toán
- ✅ Fix Booking model `customer_id` tham chiếu đúng `User`
- ✅ Xử lý callback VNPay verify chữ ký SHA512 chuẩn

### **Quick Setup VNPay**

```bash
cd backend
cp .env.example .env

# Sửa 2 dòng:
# VNPAY_TMN_CODE=TMNCODE_TỪ_VNPAY
# VNPAY_SECRET_KEY=SECRET_KEY_TỪ_VNPAY

npm start
```

**Test Sandbox:** Số thẻ `4111111111111111`, Ngày hết hạn `12/25`, OTP `123456`

---

## �📱 Các Tính Năng Nâng Cao

### ✨ **Real-time Features (Socket.IO)**

- Cập nhật trạng thái đơn hàng real-time
- Thông báo instant cho admin khi có booking mới
- Chat trực tiếp admin-khách hàng (nếu implement)

### 💳 **Thanh Toán Nhiều Cổng**

- **PayOS**: API modern, hỗ trợ QR code
- **VNPay**: Phổ biến tại Việt Nam
- **Cash**: Thanh toán tại studio

### 🔐 **Security**

- JWT authentication
- Password hashing (bcrypt)
- OTP verification
- CORS protection
- Rate limiting (nên implement)

### 📊 **Analytics & Reporting**

- Doanh thu theo thời gian
- Phân tích gói dịch vụ
- Danh sách khách hàng
- Báo cáo hoạt động nhân viên

---

## � Deployment & Production

### **Environment Variables Checklist**

```env
# .env (Backend)
PORT=5000
NODE_ENV=production

# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/caohienstudio

# JWT
JWT_SECRET=your_long_random_secret_key_at_least_32_characters
JWT_EXPIRE=7d

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=app_specific_password_not_regular_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Payment - VNPay
VNPAY_TMN_CODE=TMNCODE (lấy từ VNPay merchant account)
VNPAY_SECRET_KEY=SECRET_KEY (lấy từ VNPay merchant account)
VNPAY_URL=https://sandbox.vnpayment.vn/paygate (sandbox)
VNPAY_RETURN_URL=https://yourdomain.com/api/bookings/vnpay-return

# Payment - PayOS (nếu dùng)
PAYOS_CLIENT_ID=xxxxx
PAYOS_API_KEY=xxxxx

# Redis (optional)
REDIS_URL=redis://:password@localhost:6379

# Frontend
FRONTEND_URL=https://yourdomain.com
```

### **VNPay Setup (Sandbox → Production)**

#### 1️⃣ **Sandbox Testing (Không cần tiền)**

```
1. Đăng ký tài khoản Sandbox: https://sandbox.vnpayment.vn
2. Lấy TMN_CODE và SECRET_KEY
3. Nhập vào .env:
   VNPAY_TMN_CODE=TMNCODE
   VNPAY_SECRET_KEY=SECRET_KEY
   VNPAY_URL=https://sandbox.vnpayment.vn/paygate
4. Test thẻ:
   • Số thẻ: 4111111111111111
   • Tên: APPROVED
   • Ngày hết hạn: 12/25
   • CVV: 123
   • OTP: 123456
```

#### 2️⃣ **Production Deployment**

```
1. Đăng ký tài khoản thật: https://vnpayment.vn
2. Cấp chứng chỉ SSL (HTTPS)
3. Update biến môi trường:
   VNPAY_URL=https://pay.vnpayment.vn/paygate (production)
   FRONTEND_URL=https://yourdomain.com
4. Kiểm tra whitelist IP, callback URL
```

### **Deploy to Heroku**

```bash
# 1. Login to Heroku
heroku login

# 2. Create app
heroku create your-app-name

# 3. Set environment variables
heroku config:set MONGO_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your_secret
heroku config:set EMAIL_USER=your_email@gmail.com
heroku config:set EMAIL_PASS=your_app_password
...

# 4. Deploy
git push heroku main

# 5. Check logs
heroku logs --tail
```

---

## 🐛 Troubleshooting & Error Handling

### **Common Errors & Solutions**

#### 1️⃣ **"Invalid OTP" Error**

```
Nguyên nhân:
• OTP hết hạn (>5 phút)
• Nhập sai OTP
• OTP đã bị xóa trong DB

Giải pháp:
1. Kiểm tra thời gian server có đúng không
2. Set OTP expiry = NOW + 5 MINUTES
3. Gửi OTP mới thay vì reuse OTP cũ
4. Limit attempts to 3
```

#### 2️⃣ **"Email not sent" Error**

```
Nguyên nhân:
• EMAIL_USER hoặc EMAIL_PASS sai
• 2FA Google bắt buộc sử dụng App Password
• SMTP port bị firewall block
• Email limit (Gmail: 100/ngày)

Giải pháp:
1. Sử dụng Gmail App Password:
   https://myaccount.google.com/apppasswords
2. Kiểm tra EMAIL_HOST, EMAIL_PORT
3. Test manual:
   const transporter = nodemailer.createTransport({...});
   transporter.verify((error, success) => {
     console.log(error ? error : "Ready to send!");
   });
```

#### 3️⃣ **"MongoDB Connection Failed"**

```
Nguyên nhân:
• MONGO_URI sai
• MongoDB server không chạy
• IP whitelist not configured (Atlas)
• Network timeout

Giải pháp:
1. Test MONGO_URI:
   mongosh "mongodb+srv://user:pass@cluster.mongodb.net"
2. Đảm bảo IP được whitelist (Atlas dashboard)
3. Tăng connection timeout
```

#### 4️⃣ **"VNPay Signature Verification Failed"**

```
Nguyên nhân:
• Tính checksum sai
• Secret key sai
• Parameter bị truyền sai loại dữ liệu

Backend Code (đúng):
const crypto = require('crypto');
const hmac = crypto.createHmac('sha512', secretKey);
hmac.update(Buffer.from(paramString, 'utf-8'));
const signature = hmac.digest('hex');
```

#### 5️⃣ **"CORS Error"**

```
Giải pháp (backend server.js):
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 📝 Development Notes

### **Project Structure Explanation**

```
backend/
├── server.js              # Entry point
├── config/db.js           # MongoDB connection
├── models/                # Mongoose schemas
├── controllers/           # Business logic
├── routes/                # API endpoints
├── middleware/            # JWT verification
├── seeds/                 # Initialize admin
└── package.json

frontend/
├── src/
│   ├── main.jsx           # Entry point
│   ├── App.jsx            # Router setup
│   ├── pages/             # Page components
│   ├── components/        # Reusable components
│   ├── services/          # API calls
│   └── utils/             # Helpers
└── package.json
```

### **Code Standards**

#### 1️⃣ **Error Handling**

```javascript
// ✅ Good
try {
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ message: "Server error" });
}
```

#### 2️⃣ **Validation**

```javascript
// ✅ Good
if (!email || !email.includes("@")) {
  return res.status(400).json({ message: "Invalid email" });
}
```

#### 3️⃣ **API Response Format**

```javascript
{
  "message": "Success or error message",
  "data": { /* actual data */ }
}
```

### **Testing Endpoints**

```bash
# With cURL
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# With Postman
# 1. Set method: POST
# 2. URL: http://localhost:5000/api/auth/login
# 3. Body (JSON): {...}
```

---

## 📌 Mới Sửa (Phiên Bản 1.0.2) - Profile Update OTP Logic

Hệ thống profile update đã được cập nhật với OTP logic có điều kiện:

- ✅ Chỉ yêu cầu OTP khi đổi email hoặc mật khẩu
- ✅ Không cần OTP khi chỉ đổi tên hoặc SĐT
- ✅ Frontend kiểm tra loại thay đổi, tự động xử lý
- ✅ Backend validate field nào thay đổi
- ✅ Gửi OTP đến email mới khi đổi email

---

## Liên Hệ & Support

- **Email**: info@caohienstudio.com
- **Website**: www.caohienstudio.com
- **Hotline**: 0xxx-xxx-xxx

---

## 📄 License

Dự án này được phát triển cho mục đích quản lý studio chụp ảnh.

**Phiên bản**: 1.0.2  
**Cập nhật**: Tháng 5 năm 2026
