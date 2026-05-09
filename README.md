# 📸 CAO HIẾN STUDIO - Hệ Thống Quản Lý Studio Chụp Ảnh

## 📋 Mục Lục

1. [Giới Thiệu Chung](#giới-thiệu-chung)
2. [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
3. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
4. [Cơ Sở Dữ Liệu - Collections](#cơ-sở-dữ-liệu---collections)
5. [API Endpoints](#api-endpoints)
6. [Giao Diện & Tính Năng](#giao-diện--tính-năng)
7. [Luồng Hoạt Động Chính](#luồng-hoạt-động-chính)
8. [Cài Đặt & Chạy Ứng Dụng](#cài-đặt--chạy-ứng-dụng)

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

## 🔗 API Endpoints

### **1. Authentication API** (`/api/auth`)

| Method | Endpoint           | Mô Tả                 | Auth |
| ------ | ------------------ | --------------------- | ---- |
| POST   | `/register`        | Đăng ký tài khoản     | ❌   |
| POST   | `/login`           | Đăng nhập             | ❌   |
| POST   | `/forgot-password` | Quên mật khẩu         | ❌   |
| POST   | `/verify-otp`      | Xác thực OTP          | ❌   |
| POST   | `/reset-password`  | Đặt lại mật khẩu      | ❌   |
| POST   | `/logout`          | Đăng xuất             | ✅   |
| GET    | `/profile`         | Lấy thông tin cá nhân | ✅   |
| PUT    | `/profile`         | Cập nhật thông tin    | ✅   |

---

### **2. Service API** (`/api/services`)

| Method | Endpoint | Mô Tả               | Auth |
| ------ | -------- | ------------------- | ---- |
| GET    | `/`      | Danh sách dịch vụ   | ❌   |
| GET    | `/:id`   | Chi tiết dịch vụ    | ❌   |
| POST   | `/`      | Tạo dịch vụ (Admin) | ✅   |
| PUT    | `/:id`   | Cập nhật dịch vụ    | ✅   |
| DELETE | `/:id`   | Xóa dịch vụ         | ✅   |

---

### **3. Booking API** (`/api/bookings`)

| Method | Endpoint       | Mô Tả                     | Auth |
| ------ | -------------- | ------------------------- | ---- |
| GET    | `/`            | Danh sách lịch đặt        | ✅   |
| GET    | `/:id`         | Chi tiết lịch đặt         | ✅   |
| POST   | `/`            | Tạo lịch đặt mới          | ✅   |
| PUT    | `/:id`         | Cập nhật lịch đặt         | ✅   |
| DELETE | `/:id`         | Hủy lịch đặt              | ✅   |
| POST   | `/:id/confirm` | Xác nhận lịch đặt (Admin) | ✅   |
| POST   | `/:id/payment` | Xử lý thanh toán          | ✅   |

---

### **4. Order API** (Route: `/api/orders`)

| Method | Endpoint        | Mô Tả                | Auth |
| ------ | --------------- | -------------------- | ---- |
| GET    | `/`             | Danh sách đơn hàng   | ✅   |
| GET    | `/:id`          | Chi tiết đơn hàng    | ✅   |
| POST   | `/`             | Tạo đơn hàng (Admin) | ✅   |
| PUT    | `/:id`          | Cập nhật đơn hàng    | ✅   |
| DELETE | `/:id`          | Xóa đơn hàng         | ✅   |
| POST   | `/:id/deposit`  | Thanh toán cọc       | ✅   |
| POST   | `/:id/complete` | Hoàn tất đơn hàng    | ✅   |

---

### **5. Resource API** (`/api/resources`)

| Method | Endpoint | Mô Tả                | Auth |
| ------ | -------- | -------------------- | ---- |
| GET    | `/`      | Danh sách tài nguyên | ✅   |
| GET    | `/:id`   | Chi tiết tài nguyên  | ✅   |
| POST   | `/`      | Tạo tài nguyên       | ✅   |
| PUT    | `/:id`   | Cập nhật tài nguyên  | ✅   |
| DELETE | `/:id`   | Xóa tài nguyên       | ✅   |

---

### **6. Staff API** (Route: `/api/staff`)

| Method | Endpoint | Mô Tả               | Auth |
| ------ | -------- | ------------------- | ---- |
| GET    | `/`      | Danh sách nhân viên | ✅   |
| GET    | `/:id`   | Chi tiết nhân viên  | ✅   |
| POST   | `/`      | Tạo nhân viên       | ✅   |
| PUT    | `/:id`   | Cập nhật nhân viên  | ✅   |
| DELETE | `/:id`   | Xóa nhân viên       | ✅   |

---

### **7. Album API** (Route: `/api/albums`)

| Method | Endpoint | Mô Tả             | Auth |
| ------ | -------- | ----------------- | ---- |
| GET    | `/`      | Danh sách album   | ❌   |
| GET    | `/:id`   | Chi tiết album    | ❌   |
| POST   | `/`      | Tạo album (Admin) | ✅   |
| PUT    | `/:id`   | Cập nhật album    | ✅   |
| DELETE | `/:id`   | Xóa album         | ✅   |

---

### **8. Payment Callback API**

| Method | Endpoint                      | Mô Tả             |
| ------ | ----------------------------- | ----------------- |
| POST   | `/api/payment/payos-callback` | Callback từ PayOS |
| GET    | `/api/payment/vnpay-return`   | Return từ VNPay   |

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

## 🔄 Luồng Hoạt Động Chính

### **1️⃣ Luồng Đăng Ký & Đăng Nhập**

```
┌─────────────────────────────────────────────────────────────┐
│ Khách hàng truy cập trang Register                          │
├─────────────────────────────────────────────────────────────┤
│ • Điền form: Họ tên, Email, Số điện thoại, Mật khẩu       │
│ • Backend validate và hash mật khẩu (bcrypt)               │
│ • Lưu vào User collection (role: "customer")               │
│ • Gửi email xác thực OTP                                   │
│ • Khách hàng nhập OTP → Xác thực thành công                │
│ • Sinh JWT token → Login thành công                        │
└─────────────────────────────────────────────────────────────┘
```

---

### **2️⃣ Luồng Đặt Lịch & Thanh Toán**

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. KHÁCH HÀNG XEM DỊCH VỤ                                            │
├──────────────────────────────────────────────────────────────────────┤
│ • Vào trang Services → Lọc theo danh mục (Wedding/Event/Family)      │
│ • Nhấp Service → Xem chi tiết (tính năng, giá, đánh giá)            │
│                                                                       │
│ 2. KHÁCH HÀNG ĐẶT LỊCH                                               │
├──────────────────────────────────────────────────────────────────────┤
│ • Chọn ngày chụp, địa điểm, ghi chú                                 │
│ • Backend tạo Booking (status: "Pending")                           │
│ • Gửi email xác nhận lịch đặt                                       │
│                                                                       │
│ 3. THANH TOÁN CỌC (Payment Flow)                                    │
├──────────────────────────────────────────────────────────────────────┤
│ • Khách chọn phương thức thanh toán (PayOS/VNPay)                   │
│ • Nhấp "Thanh toán" → Redirect đến gateway thanh toán              │
│ • Nhập thông tin thanh toán                                         │
│ • Gateway xử lý & gửi callback                                      │
│ • Backend update Booking status → "Confirmed"                       │
│ • Redirect về trang "BookingSuccess"                                │
│ • Khách hàng nhận email xác nhận                                    │
│                                                                       │
│ 4. ADMIN XÁC NHẬN & TẠO ĐƠN HÀNG (Order)                            │
├──────────────────────────────────────────────────────────────────────┤
│ • Admin xem danh sách Booking cần xác nhận                          │
│ • Nhấp "Confirm" → Tạo Order từ Booking đó                         │
│ • Order lưu thông tin: khách, dịch vụ, ngày chụp, tiền cọc         │
│ • Gán nhân viên (Photographer, Makeup Artist, Editor)               │
│ • Gán tài nguyên (Camera, Lens, Light, Props)                      │
│ • Update Order status → "Deposited" (sau khi nhận cọc)             │
│                                                                       │
│ 5. HOÀN TẤT ĐƠN HÀNG                                                │
├──────────────────────────────────────────────────────────────────────┤
│ • Sau ngày chụp, admin upload album ảnh                             │
│ • Tạo Album record liên kết với Order                               │
│ • Update Order status → "Completed"                                 │
│ • Gửi thông báo khách hàng có thể xem album                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

### **3️⃣ Luồng Quản Lý Tài Nguyên**

```
┌──────────────────────────────────────────────────────────────┐
│ ADMIN TẠO/QUẢN LÝ TÀI NGUYÊN                                 │
├──────────────────────────────────────────────────────────────┤
│ • Vào Admin → Resources → "Thêm Tài Nguyên"                  │
│ • Điền: Tên, Loại (Camera/Lens/Light/Props/Location),       │
│   Số lượng, Trạng thái                                       │
│ • Lưu vào Resource collection                               │
│                                                               │
│ GIAO DỊCH TÀI NGUYÊN CHO ĐƠN HÀNG                             │
├──────────────────────────────────────────────────────────────┤
│ • Khi tạo Order, admin chọn tài nguyên cần sử dụng           │
│ • Thêm vào mảng Order.resources                              │
│ • Update Resource status → "In Use"                          │
│ • Sau khi hoàn tất Order → Resource status → "Available"    │
│ • Nếu Resource cần bảo trì → status "Maintenance"           │
└──────────────────────────────────────────────────────────────┘
```

---

### **4️⃣ Luồng Quản Lý Nhân Viên**

```
┌──────────────────────────────────────────────────────────────┐
│ ADMIN QUẢN LÝ NHÂN VIÊN                                      │
├──────────────────────────────────────────────────────────────┤
│ • Vào Admin → Staff → "Thêm Nhân Viên"                       │
│ • Điền: Họ tên, Chức vụ (Photographer/Makeup/Editor),       │
│   Chuyên môn, Số điện thoại, Email, Avatar                  │
│ • Lưu vào Staff collection                                  │
│                                                               │
│ GIAO NHIỆM VỤ CHO NHÂN VIÊN                                  │
├──────────────────────────────────────────────────────────────┤
│ • Khi tạo Order, admin gán staffID                           │
│ • System ghi nhận nhân viên phụ trách đơn hàng              │
│ • Nhân viên có thể xem dashboard với công việc của mình      │
│ • Admin theo dõi tải công việc của từng nhân viên           │
└──────────────────────────────────────────────────────────────┘
```

---

### **5️⃣ Luồng Báo Cáo & Thống Kê**

```
┌──────────────────────────────────────────────────────────────┐
│ ADMIN XEM DASHBOARD                                          │
├──────────────────────────────────────────────────────────────┤
│ • Dashboard: Tổng doanh thu, số khách, số đơn, xu hướng     │
│ • Revenue: Doanh thu theo ngày/tháng/năm, phân tích gói      │
│ • Reports: Danh sách khách hàng, tỷ lệ hoàn tất, v.v        │
│ • Sử dụng Recharts để visualize dữ liệu                      │
└──────────────────────────────────────────────────────────────┘
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

## 📱 Các Tính Năng Nâng Cao

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

## 🐛 Troubleshooting

### Backend không kết nối MongoDB

```bash
# Kiểm tra MONGO_URI trong .env
# Đảm bảo MongoDB server đang chạy
mongod --version

# Nếu dùng MongoDB Atlas, kiểm tra IP whitelist
```

### Frontend API calls thất bại

```bash
# Kiểm tra VITE_API_URL trong .env
# Đảm bảo backend server đang chạy trên cổng 5000
# Kiểm tra CORS settings trong backend server.js
```

### Email OTP không gửi

```bash
# Kiểm tra EMAIL_USER và EMAIL_PASS trong .env
# Sử dụng App Password (không phải password Gmail thường)
# Settings → 2-Step Verification → App Passwords
```

---

## 📞 Liên Hệ & Support

- **Email**: info@caohienstudio.com
- **Website**: www.caohienstudio.com
- **Hotline**: 0xxx-xxx-xxx

---

## 📄 License

Dự án này được phát triển cho mục đích quản lý studio chụp ảnh.

**Phiên bản**: 1.0.0  
**Cập nhật**: Tháng 5 năm 2026
