# 📍 Route Structure Documentation

## Overview

Ứng dụng được chia thành 4 khu vực route chính:

```
/                       → Public Routes (khách vãng lai)
/auth                   → Authentication Routes (Login, Register, Reset Password)
/customer/*             → Customer Routes (khách hàng đã đăng nhập)
/admin/*                → Admin Routes (quản trị viên)
```

---

## 🌐 Public Routes (/)

**Layout:** PublicLayout  
**Yêu cầu xác thực:** ❌ Không  
**Header:** Đăng Nhập | Đăng Ký  

| Route | Component | Mô Tả |
|-------|-----------|-------|
| / | Home | Trang chủ |
| /about | About | Giới thiệu |
| /services | Services | Bảng giá dịch vụ |
| /booking | Booking | Đặt lịch |
| /gallery/:slug | AlbumDetail | Chi tiết album |
| /services/:id | ServiceDetail | Chi tiết dịch vụ |

**Flow:**
- Khách vãng lai có thể xem tất cả các trang
- Không thể truy cập /customer hoặc /admin
- Khi click "Đặt Lịch" hoặc "Xem Chi Tiết", không thể thực hiện (cần đăng nhập)

---

## 🔐 Auth Routes (/login, /register, /forgot-password)

**Layout:** PublicLayout  
**Yêu cầu xác thực:** ❌ Không  
**Header:** Đăng Nhập | Đăng Ký  

| Route | Component | Mô Tả |
|-------|-----------|-------|
| /login | Login | Đăng nhập |
| /register | Register | Đăng ký tài khoản |
| /forgot-password | ForgotPassword | Quên mật khẩu |

**Login Logic:**
```javascript
if (user.role === "admin") {
  navigate("/admin");     // Admin → /admin
} else {
  navigate("/customer");  // Customer → /customer
}
```

---

## 👥 Customer Routes (/customer/*)

**Layout:** CustomerLayout  
**Yêu cầu xác thực:** ✅ Có (role = "customer")  
**Header:** Menu + User Dropdown (Thông tin tài khoản | Quản lý đơn đặt lịch | Đăng xuất)  

| Route | Component | Mô Tả |
|-------|-----------|-------|
| /customer | Home | Trang chủ khách hàng |
| /customer/about | About | Giới thiệu |
| /customer/services | Services | Bảng giá dịch vụ |
| /customer/booking | Booking | Đặt lịch |
| /customer/profile | Profile | Hồ sơ cá nhân |
| /customer/my-bookings | MyBookings | Danh sách đơn đặt lịch |
| /customer/my-bookings/:id | BookingDetail | Chi tiết đơn |
| /customer/gallery/:slug | AlbumDetail | Album ảnh |
| /customer/services/:id | ServiceDetail | Chi tiết dịch vụ |
| /customer/payment/:id | Payment | Thanh toán |
| /customer/booking-success/:id | BookingSuccess | Thanh toán thành công |
| /customer/vnpay-return | VnpayReturn | Callback VNPay |

**Behavior:**
- Chỉ user đã đăng nhập với role="customer" mới truy cập được
- Nếu chưa đăng nhập → redirect /login
- Nếu là admin → redirect /admin
- Header hiển thị menu và user dropdown

---

## 🛡️ Admin Routes (/admin/*)

**Layout:** AdminLayout  
**Yêu cầu xác thực:** ✅ Có (role = "admin")  
**Header:** Logo + Admin Dropdown Menu

### Admin Dropdown Menu Items

```
✓ Thông tin tài khoản
✓ Dashboard Thống Kê
✓ Quản lý Kho tài nguyên
  ├─ Thêm tài nguyên
  └─ Chỉnh sửa thông tin
✓ Quản lý Nhân sự
  ├─ Thêm nhân sự
  └─ Chỉnh sửa thông tin
✓ Quản lý Khách hàng
  └─ Thông tin chi tiết
✓ Quản lý Gói dịch vụ
  ├─ Thêm dịch vụ
  └─ Chỉnh sửa thông tin
✓ Quản lý đơn hàng
  ├─ Danh sách đơn hàng
  ├─ Chi tiết thông tin
  └─ Tạo đơn đặt hộ
✓ Đăng xuất
```

| Route | Component | Mô Tả |
|-------|-----------|-------|
| /admin | Dashboard | Trang chủ admin |
| /admin/dashboard | Dashboard | Thống kê |
| /admin/profile | Profile | Thông tin tài khoản |
| /admin/resources | Resources | Quản lý tài nguyên |
| /admin/resources/add | AddResource | Thêm tài nguyên |
| /admin/staff | Staff | Quản lý nhân sự |
| /admin/staff/add | AddStaff | Thêm nhân sự |
| /admin/customers | Customers | Quản lý khách hàng |
| /admin/services | Services | Quản lý dịch vụ |
| /admin/services/add | AddService | Thêm dịch vụ |
| /admin/orders | Orders | Danh sách đơn |
| /admin/orders/details | OrderDetails | Chi tiết đơn |
| /admin/orders/create | CreateOrder | Tạo đơn |

**Behavior:**
- Chỉ user đã đăng nhập với role="admin" mới truy cập được
- Nếu chưa đăng nhập → redirect /login
- Nếu là customer → redirect /customer
- Header hiển thị dropdown menu phức tạp

---

## 🔄 Route Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Khách Vãng Lai                           │
│  (PublicLayout) /, /about, /services, /booking, /gallery   │
│  Header: Đăng Nhập | Đăng Ký                               │
└──────────────┬──────────────────────────┬──────────────────┘
               │                          │
        Click "Đăng Nhập"           Click "Đăng Ký"
               │                          │
               ▼                          ▼
     ┌──────────────────┐       ┌──────────────────┐
     │    /login        │       │   /register      │
     │  (PublicLayout)  │       │  (PublicLayout)  │
     └────────┬─────────┘       └────────┬─────────┘
              │                         │
              │ ← ← ← ← ← ← ← ← ← ← ←┘
              │ (navigate sau đăng ký)
              │
              ▼ (Submit Login)
      ┌───────────────────┐
      │  Check user.role  │
      └───────┬───────────┘
              │
     ┌────────┴────────┐
     │                 │
     ▼ role="customer" ▼ role="admin"
     │                 │
     ▼                 ▼
/customer/*         /admin/*
(CustomerLayout)    (AdminLayout)
Header: Menu        Header: Dropdown
+ User Dropdown     + Logout
```

---

## 🛡️ Authentication Logic

### PublicLayout (/)
```javascript
if (savedUser) {
  if (user.role === "admin") {
    navigate("/admin");    // Auto redirect
  } else {
    navigate("/customer"); // Auto redirect
  }
}
// Else: Show login/register buttons
```

### CustomerLayout (/customer/*)
```javascript
if (!savedUser) {
  navigate("/login");      // Require login
}
if (user.role === "admin") {
  navigate("/admin");      // Admin shouldn't access customer routes
}
// Else: Allow customer routes
```

### AdminLayout (/admin/*)
```javascript
if (!savedUser) {
  navigate("/login");      // Require login
}
if (user.role !== "admin") {
  navigate("/customer");   // Non-admin shouldn't access admin
}
// Else: Allow admin routes
```

---

## 📝 Header Components

### PublicLayout Header
- Logo (navigate to /)
- Menu: TRANG CHỦ | THƯ VIỆN ẢNH | GIỚI THIỆU | BẢNG GIÁ | ĐẶT LỊCH
- Right: Đăng Nhập | Đăng Ký

### CustomerLayout Header
- Logo (navigate to /customer)
- Menu: TRANG CHỦ | THƯ VIỆN ẢNH | GIỚI THIỆU | BẢNG GIÁ | ĐẶT LỊCH
- Right:
  - User Dropdown:
    - Thông tin tài khoản
    - Quản lý đơn đặt lịch
    - ─────────
    - Đăng xuất

### AdminLayout Header
- Logo (navigate to /admin) [ADMIN]
- Right:
  - Admin Dropdown:
    - Thông tin tài khoản
    - Dashboard Thống Kê
    - ─────────
    - Quản lý Kho tài nguyên
      - Thêm tài nguyên
      - Chỉnh sửa thông tin
    - Quản lý Nhân sự
      - Thêm nhân sự
      - Chỉnh sửa thông tin
    - Quản lý Khách hàng
      - Thông tin chi tiết
    - Quản lý Gói dịch vụ
      - Thêm dịch vụ
      - Chỉnh sửa thông tin
    - Quản lý đơn hàng
      - Danh sách đơn hàng
      - Chi tiết thông tin
      - Tạo đơn đặt hộ
    - ─────────
    - Đăng xuất

---

## 🚀 Quick Start

1. **Khách vãng lai:** Truy cập `/`
2. **Đăng nhập:**
   - Email: `customer@test.com`, Role: `customer` → `/customer`
   - Email: `admin@test.com`, Role: `admin` → `/admin`
3. **Quay lại public:** Click Logo → `/customer` hoặc `/admin` (tuỳ role)

---

**Version:** 1.0  
**Last Updated:** April 23, 2026
