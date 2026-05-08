# 📸 Cao Hiến Studio - Hệ Thống Đặt Lịch Chụp Ảnh

## 📋 Mục Lục

- [Giới Thiệu](#giới-thiệu)
- [Tính Năng Chính](#tính-năng-chính)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Hướng Dẫn Cài Đặt](#hướng-dẫn-cài-đặt)
- [Hướng Dẫn Chạy Dự Án](#hướng-dẫn-chạy-dự-án)
- [Cấu Hình Biến Môi Trường](#cấu-hình-biến-môi-trường)
- [API Endpoints](#api-endpoints)
- [Cấu Trúc Database](#cấu-trúc-database)
- [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
- [Quản Lý Thư Viện Ảnh](#quản-lý-thư-viện-ảnh)

---

## 🎯 Giới Thiệu

**Cao Hiến Studio** là một ứng dụng web toàn diện để quản lý và đặt lịch chụp ảnh chuyên nghiệp. Hệ thống cho phép khách hàng:

- Xem các dịch vụ chụp ảnh
- Đặt lịch hẹn với các gói dịch vụ khác nhau
- Thực hiện thanh toán trực tuyến
- Quản lý lịch đặt của họ
- Xem bộ sưu tập ảnh từ các buổi chụp trước

Quản trị viên có thể quản lý dịch vụ, xem đơn đặt hàng, quản lý album ảnh và xử lý thanh toán.

---

## ✨ Tính Năng Chính

### 👥 Chức Năng Khách Hàng

- **Xác Thực Người Dùng**
  - Đăng ký tài khoản mới
  - Đăng nhập với email và mật khẩu
  - Khôi phục mật khẩu qua email
  - Xác thực OTP

- **Quản Lý Dịch Vụ**
  - Xem danh sách các gói dịch vụ chụp ảnh
  - Xem chi tiết từng dịch vụ
  - Bộ lọc dịch vụ theo giá

- **Đặt Lịch Hẹn**
  - Chọn dịch vụ và thời gian đặt lịch
  - Xem giá cọc theo loại đặt lịch (Sớm, Bình thường, Gấp)
  - Xem lịch sử đặt hẹn
  - Quản lý trạng thái đặt hẹn (Pending, Confirmed, Completed, Cancelled)

- **Thanh Toán**
  - Thanh toán trực tuyến qua PayOS/VNPay
  - Theo dõi trạng thái thanh toán
  - Thanh toán cọc cho đơn đặt lịch

- **Bộ Sưu Tập Ảnh (Album)**
  - Xem gallery ảnh từ các buổi chụp
  - Xem chi tiết album theo từng dự án

- **Quản Lý Tài Khoản**
  - Xem và cập nhật thông tin cá nhân
  - Thay đổi mật khẩu
  - Xem lịch sử giao dịch

### 👨‍💼 Chức Năng Quản Trị Viên

- Quản lý dịch vụ (Thêm, Sửa, Xóa)
- Xem danh sách tất cả đơn đặt lịch
- Quản lý album và hình ảnh
- Xem thống kê doanh thu
- Xử lý thanh toán

---

## 🛠️ Công Nghệ Sử Dụng

### Backend

| Công Nghệ      | Phiên Bản | Mục Đích                 |
| -------------- | --------- | ------------------------ |
| **Node.js**    | Latest    | Runtime JavaScript       |
| **Express.js** | ^5.2.1    | Framework web server     |
| **MongoDB**    | -         | Cơ sở dữ liệu NoSQL      |
| **Mongoose**   | ^9.5.0    | ODM cho MongoDB          |
| **JWT**        | ^9.0.3    | Xác thực token           |
| **Bcryptjs**   | ^3.0.3    | Mã hóa mật khẩu          |
| **Nodemailer** | ^8.0.5    | Gửi email OTP            |
| **PayOS**      | ^2.0.5    | Gateway thanh toán       |
| **Socket.io**  | ^4.8.3    | Giao tiếp real-time      |
| **Redis**      | ^5.12.1   | Cache và lưu trữ session |
| **Dotenv**     | ^17.4.2   | Quản lý biến môi trường  |

### Frontend

| Công Nghệ            | Phiên Bản | Mục Đích                |
| -------------------- | --------- | ----------------------- |
| **React**            | ^19.2.5   | Thư viện UI             |
| **Vite**             | ^8.0.9    | Build tool              |
| **React Router**     | ^7.14.2   | Routing                 |
| **Ant Design**       | ^6.3.6    | UI Component library    |
| **Axios**            | ^1.15.2   | HTTP client             |
| **Socket.io-client** | ^4.8.3    | Real-time communication |
| **Day.js**           | ^1.11.20  | Xử lý thời gian         |

---

## 📁 Cấu Trúc Dự Án

```
caohienstudio/
│
├── backend/
│   ├── config/
│   │   └── db.js                 # Cấu hình kết nối database
│   ├── controllers/
│   │   ├── authController.js     # Logic xác thực người dùng
│   │   ├── bookingController.js  # Logic quản lý đơn đặt lịch
│   │   ├── serviceController.js  # Logic quản lý dịch vụ
│   │   ├── albumController.js    # Logic quản lý album ảnh
│   │   └── orderController.js    # Logic quản lý đơn hàng
│   ├── middleware/
│   │   └── authMiddleware.js     # Middleware xác thực JWT
│   ├── models/
│   │   ├── User.js               # Schema người dùng
│   │   ├── Booking.js            # Schema đơn đặt lịch
│   │   ├── Service.js            # Schema dịch vụ
│   │   ├── Album.js              # Schema album
│   │   ├── Order.js              # Schema đơn hàng
│   │   └── OTP.js                # Schema OTP
│   ├── routes/
│   │   ├── authRoutes.js         # Routes xác thực
│   │   ├── bookingRoutes.js      # Routes đơn đặt lịch
│   │   ├── serviceRoutes.js      # Routes dịch vụ
│   │   ├── albumRoutes.js        # Routes album
│   │   ├── adminRoutes.js        # Routes quản trị
│   │   └── customerRoutes.js     # Routes khách hàng
│   ├── server.js                 # File khởi chạy server
│   ├── .env.example              # Ví dụ biến môi trường
│   └── package.json              # Dependencies backend
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── CustomerLayout.jsx    # Layout chính
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx             # Trang đăng nhập
│   │   │   │   ├── Register.jsx          # Trang đăng ký
│   │   │   │   └── ForgotPassword.jsx    # Trang khôi phục mật khẩu
│   │   │   ├── customer/
│   │   │   │   ├── Home.jsx              # Trang chủ
│   │   │   │   ├── About.jsx             # Trang giới thiệu
│   │   │   │   ├── Pricing.jsx           # Trang bảng giá
│   │   │   │   ├── Booking.jsx           # Trang đặt lịch
│   │   │   │   ├── BookingDetail.jsx     # Chi tiết đơn đặt lịch
│   │   │   │   ├── MyBookings.jsx        # Danh sách đơn đặt lịch của tôi
│   │   │   │   ├── BookingSuccess.jsx    # Trang thanh toán thành công
│   │   │   │   ├── AlbumDetail.jsx       # Chi tiết album ảnh
│   │   │   │   ├── ServiceDetail.jsx     # Chi tiết dịch vụ
│   │   │   │   ├── Profile.jsx           # Trang hồ sơ người dùng
│   │   │   │   ├── Payment.jsx           # Trang thanh toán
│   │   │   │   ├── VnpayReturn.jsx       # Trang xử lý callback VNPay
│   │   │   │   └── admin/               # Các trang quản trị (nếu có)
│   │   │   └── assets/                   # Ảnh, icon, resources
│   │   ├── App.jsx                       # Component chính
│   │   ├── App.css                       # Style chính
│   │   ├── main.jsx                      # Entry point
│   │   └── index.css                     # CSS global
│   ├── public/                           # Static files
│   ├── vite.config.js                    # Cấu hình Vite
│   ├── eslint.config.js                  # Cấu hình ESLint
│   ├── index.html                        # HTML template
│   ├── package.json                      # Dependencies frontend
│   └── README.md                         # README frontend
│
└── README.md                             # File này
```

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống

- **Node.js**: Phiên bản 16.x trở lên
- **npm** hoặc **yarn**: Package manager
- **MongoDB**: Cơ sở dữ liệu (local hoặc cloud MongoDB Atlas)
- **Git**: Để clone dự án

### Bước 1: Clone Dự Án

```bash
git clone <repository-url>
cd caohienstudio
```

### Bước 2: Cài Đặt Backend

```bash
cd backend
npm install
```

### Bước 3: Cài Đặt Frontend

```bash
cd frontend
npm install
```

---

## 🎮 Hướng Dẫn Chạy Dự Án

### Chạy Backend

```bash
cd backend
npm start
```

Server sẽ chạy trên `http://localhost:5000` (hoặc port được cấu hình trong `.env`)

### Chạy Frontend

Mở terminal mới:

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy trên `http://localhost:5173` (Vite default port)

### Chạy Cả Hai (Tùy Chọn)

Nếu bạn muốn chạy cả backend và frontend cùng lúc, mở 2 terminal riêng biệt:

**Terminal 1:**

```bash
cd backend
npm start
```

**Terminal 2:**

```bash
cd frontend
npm run dev
```

### Các Lệnh Khác

#### Backend

```bash
npm start           # Chạy server với nodemon (auto-reload)
npm test            # Chạy test (chưa cấu hình)
```

#### Frontend

```bash
npm run dev         # Chạy Vite dev server
npm run build       # Build production
npm run preview     # Preview build
npm run lint        # Chạy ESLint
```

---

## ⚙️ Cấu Hình Biến Môi Trường

### Backend (.env file)

Tạo file `.env` trong thư mục `backend`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/caohienstudio
# Hoặc MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/caohienstudio

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@caohienstudio.com

# PayOS Configuration
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# VNPay Configuration
VNPAY_TmnCode=your_vnpay_tmn_code
VNPAY_HashSecret=your_vnpay_hash_secret
VNPAY_Url=https://sandbox.vnpayment.vn/paygate
VNPAY_ReturnUrl=http://localhost:3000/vnpay-return

# Redis Configuration (Tùy chọn)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
```

### Frontend (.env file)

Tạo file `.env` trong thư mục `frontend`:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Environment
VITE_ENV=development
```

---

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint           | Mô Tả                      | Auth |
| ------ | ------------------ | -------------------------- | ---- |
| POST   | `/register`        | Đăng ký tài khoản mới      | ❌   |
| POST   | `/login`           | Đăng nhập                  | ❌   |
| POST   | `/forgot-password` | Yêu cầu khôi phục mật khẩu | ❌   |
| POST   | `/verify-otp`      | Xác thực OTP               | ❌   |
| POST   | `/reset-password`  | Đặt lại mật khẩu           | ❌   |
| GET    | `/profile`         | Lấy hồ sơ người dùng       | ✅   |
| PUT    | `/profile`         | Cập nhật hồ sơ             | ✅   |

### Services Routes (`/api/services`)

| Method | Endpoint | Mô Tả             | Auth |
| ------ | -------- | ----------------- | ---- |
| GET    | `/`      | Danh sách dịch vụ | ❌   |
| GET    | `/:id`   | Chi tiết dịch vụ  | ❌   |
| POST   | `/`      | Tạo dịch vụ mới   | ✅   |
| PUT    | `/:id`   | Cập nhật dịch vụ  | ✅   |
| DELETE | `/:id`   | Xóa dịch vụ       | ✅   |

### Bookings Routes (`/api/bookings`)

| Method | Endpoint | Mô Tả                  | Auth |
| ------ | -------- | ---------------------- | ---- |
| GET    | `/`      | Danh sách đơn đặt lịch | ✅   |
| GET    | `/:id`   | Chi tiết đơn đặt lịch  | ✅   |
| POST   | `/`      | Tạo đơn đặt lịch       | ✅   |
| PUT    | `/:id`   | Cập nhật đơn đặt lịch  | ✅   |
| DELETE | `/:id`   | Hủy đơn đặt lịch       | ✅   |

### Albums Routes (`/api/albums`)

| Method | Endpoint | Mô Tả           | Auth |
| ------ | -------- | --------------- | ---- |
| GET    | `/`      | Danh sách album | ❌   |
| GET    | `/:slug` | Chi tiết album  | ❌   |
| POST   | `/`      | Tạo album mới   | ✅   |
| PUT    | `/:id`   | Cập nhật album  | ✅   |
| DELETE | `/:id`   | Xóa album       | ✅   |

---

## 🗄️ Cấu Trúc Database

### User Collection

```javascript
{
  _id: ObjectId,
  fullName: String,
  phone: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  serviceName: String,
  price: Number,
  appointmentDate: Date,
  location: String,
  status: String (Pending|Confirmed|Completed|Cancelled),
  note: String,
  depositAmount: Number,
  paidAt: Date,
  bookingType: String (Early|Late|Urgent),
  createdAt: Date,
  updatedAt: Date
}
```

### Service Collection

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  duration: Number (phút),
  images: Array,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Album Collection

```javascript
{
  _id: ObjectId,
  title: String,              // Tiêu đề album
  slug: String,               // URL-friendly (unique)
  category: String,           // Wedding, Pre-Wedding, Corporate Event, etc.
  description: String,        // Mô tả chi tiết
  coverImage: String,         // URL ảnh bìa
  images: Array<String>,      // Mảng các URL ảnh
  isPublished: Boolean,       // Hiển thị trên frontend hay không
  createdAt: Date,
  updatedAt: Date
}
```

### OTP Collection

```javascript
{
  _id: ObjectId,
  email: String,
  code: String,
  expiresAt: Date,
  createdAt: Date
}
```

### Order Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  bookingId: ObjectId (ref: Booking),
  amount: Number,
  status: String (Pending|Paid|Failed),
  paymentMethod: String (PayOS|VNPay),
  transactionId: String,
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📚 Hướng Dẫn Sử Dụng

### Quy Trình Khách Hàng

1. **Đăng Ký/Đăng Nhập**
   - Truy cập trang Login/Register
   - Nhập email, mật khẩu và thông tin cá nhân
   - Xác thực qua email (nếu cần)

2. **Xem Dịch Vụ**
   - Vào trang "Pricing" hoặc "Services"
   - Xem chi tiết các gói dịch vụ
   - So sánh giá cả

3. **Đặt Lịch**
   - Chọn dịch vụ từ trang đặt lịch
   - Chọn ngày giờ phù hợp
   - Xác nhận thông tin và địa điểm

4. **Thanh Toán**
   - Chọn phương thức thanh toán (PayOS/VNPay)
   - Nhập thông tin thanh toán
   - Xác nhận giao dịch

5. **Xem Lịch Sử**
   - Vào "My Bookings" để xem tất cả đơn đặt lịch
   - Xem chi tiết, trạng thái thanh toán
   - Xem album ảnh sau khi hoàn thành buổi chụp

### Quy Trình Quản Trị Viên

1. **Quản Lý Dịch Vụ**
   - Thêm/Sửa/Xóa các dịch vụ chụp ảnh
   - Cập nhật giá và mô tả

2. **Xem Đơn Đặt Lịch**
   - Xem danh sách tất cả đơn đặt lịch
   - Cập nhật trạng thái đơn
   - Liên hệ khách hàng nếu cần

3. **Quản Lý Album**
   - Tải ảnh lên sau buổi chụp
   - Tạo album cho khách hàng
   - Công khai album để khách hàng xem

4. **Xem Thống Kê**
   - Xem doanh thu theo tháng
   - Thống kê số lượng đơn đặt lịch
   - Báo cáo hiệu suất

---

## 🔐 Bảo Mật

### Best Practices Được Áp Dụng

1. **Authentication**
   - JWT token cho session management
   - Refresh token rotation
   - Secure password hashing with bcryptjs

2. **Authorization**
   - Role-based access control (RBAC)
   - Middleware validation cho protected routes
   - User ownership verification

3. **Data Protection**
   - CORS configuration
   - Input validation
   - SQL/NoSQL injection prevention
   - XSS protection

4. **Communication**
   - HTTPS recommended for production
   - Secure headers configuration
   - Rate limiting (recommended)

---

## 🐛 Troubleshooting

### Backend Issues

**Lỗi: "MongoDB Connection Failed"**

- Kiểm tra MONGO_URI trong `.env`
- Đảm bảo MongoDB đang chạy hoặc kết nối MongoDB Atlas hoạt động
- Kiểm tra firewall settings

**Lỗi: "JWT Secret not defined"**

- Thêm `JWT_SECRET` vào file `.env`

**Lỗi: "Email service not working"**

- Kiểm tra cấu hình Nodemailer
- Đối với Gmail, sử dụng App Password, không phải mật khẩu tài khoản

### Frontend Issues

**Lỗi: "Cannot GET /"**

- Kiểm tra backend có đang chạy không
- Kiểm tra `VITE_API_URL` trong `.env`

**Lỗi: CORS errors**

- Kiểm tra `CORS_ORIGIN` trong backend `.env`
- Đảm bảo frontend URL khớp với configuration

---

## 🚀 Deployment

### Production Checklist

- [ ] Cập nhật biến môi trường cho production
- [ ] Tắt debug logging
- [ ] Enable HTTPS
- [ ] Configure MongoDB Atlas (không local)
- [ ] Setup email service (SendGrid, mailgun, etc)
- [ ] Configure payment gateway credentials
- [ ] Build frontend: `npm run build`
- [ ] Test tất cả functionality
- [ ] Setup monitoring

### Khuyến Nghị Hosting

**Backend:**

- Heroku, Railway, Render, hoặc Fly.io
- Hoặc VPS (DigitalOcean, Linode)

**Frontend:**

- Vercel, Netlify, hoặc Firebase Hosting
- Hoặc cùng server với backend

**Database:**

- MongoDB Atlas (cloud)
- Hoặc self-hosted MongoDB

---

## 🎨 Quản Lý Thư Viện Ảnh

Thư viện ảnh (Album) đã được cập nhật để **load dữ liệu động từ database** thay vì hardcode. Điều này cho phép admin dễ dàng thêm, sửa, xóa album mà không cần sửa code.

### 🚀 Setup Album Lần Đầu

Chạy script để insert dữ liệu mẫu:

```bash
cd backend
node seeds/albumSeeds.js
```

Điều này sẽ tạo 4 album mẫu có sẵn.

### 📡 API Albums

| Method | Endpoint | Mô Tả | Auth |
|--------|----------|-------|------|
| GET | `/api/albums` | Lấy danh sách album | ❌ |
| GET | `/api/albums/:slug` | Chi tiết album | ❌ |
| POST | `/api/albums` | Tạo album mới | ✅ |
| PUT | `/api/albums/:id` | Cập nhật album | ✅ |
| DELETE | `/api/albums/:id` | Xóa album | ✅ |

### 📋 Cấu Trúc Album

```javascript
{
  _id: ObjectId,
  title: String,           // Tiêu đề
  slug: String,            // URL-friendly (unique)
  category: String,        // Wedding, Pre-Wedding, etc.
  description: String,     // Mô tả chi tiết
  coverImage: String,      // URL ảnh bìa
  images: [String],        // Array các URL ảnh
  isPublished: Boolean,    // Có hiển thị hay không
  createdAt: Date,
  updatedAt: Date
}
```

### 💡 Thêm Album Mới

**Option 1: Sử dụng API (Postman)**

```bash
POST /api/albums
Headers: Authorization: Bearer <JWT_TOKEN>
Body:
{
  "title": "Album Title",
  "slug": "album-slug",
  "category": "Wedding",
  "description": "Description",
  "coverImage": "https://...",
  "images": ["https://...", "https://..."],
  "isPublished": true
}
```

**Option 2: MongoDB Compass**

Thêm document trực tiếp vào collection `albums`

### ⚠️ Lưu Ý

- Slug phải **unique** và chỉ chứa chữ thường, số, dấu `-`
- Images nên là URL HTTPS
- Chỉ album có `isPublished: true` mới hiển thị trên frontend

📖 **Xem chi tiết:** [ALBUM_SETUP.md](ALBUM_SETUP.md)

---

## 📝 License

Dự án này được phát triển cho mục đích học tập.

---

## 👨‍💻 Tác Giả

**Sinh Viên:** Hồ Vũ Anh
**MSSV:** 22110097
**Trường:** Đại Học Công Nghệ

---

## 📞 Hỗ Trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi:

- Kiểm tra phần Troubleshooting trên
- Liên hệ qua email hoặc tạo issue

---

## 📌 Ghi Chú Quan Trọng

1. **Biến Môi Trường:** Luôn tạo file `.env` cục bộ, không commit lên repository
2. **Database:** Sử dụng MongoDB Atlas để dễ quản lý
3. **Payment Gateway:** Setup test account trước khi production
4. **Email Service:** Cấu hình đúng để gửi OTP
5. **CORS:** Cấu hình đúng domain cho production

---

**Cập nhật cuối:** April 23, 2026
