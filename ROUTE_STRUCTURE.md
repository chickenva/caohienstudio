# 🛣️ Route Structure - Cao Hiến Studio

## Tổng Quan

Ứng dụng có 4 loại route chính:

### 1. **Landing Route** (`/`) - Dành cho khách vãng lai
- **URL**: `/`
- **Layout**: `LandingLayout` (đơn giản, không header/footer)
- **Pages**:
  - Landing page - giới thiệu studio
- **Đặc điểm**: 
  - Không cần login
  - Có button đăng nhập/đăng ký
  - Dùng để landings, marketing

### 2. **Auth Routes** (`/auth/*`) - Xác thực
- **URLs**: 
  - `/auth/login` - Đăng nhập
  - `/auth/register` - Đăng ký
  - `/auth/forgot-password` - Quên mật khẩu
- **Layout**: `SharedLayout` (có header/footer)
- **Đặc điểm**:
  - Không cần login
  - User chưa login có thể truy cập
  - Header hiển thị button "Đăng Nhập" / "Đăng Ký"

### 3. **Customer Routes** (`/customer/*`) - Khách hàng
- **URLs**:
  - `/customer` - Trang chủ
  - `/customer/about` - Giới thiệu
  - `/customer/services` - Bảng giá
  - `/customer/booking` - Đặt lịch
  - `/customer/profile` - Hồ sơ cá nhân
  - `/customer/my-bookings` - Danh sách đơn đặt lịch
  - `/customer/my-bookings/:id` - Chi tiết đơn đặt lịch
  - `/customer/gallery/:slug` - Album ảnh
  - `/customer/services/:id` - Chi tiết dịch vụ
  - `/customer/payment/:id` - Thanh toán
  - `/customer/booking-success/:id` - Xác nhận thành công
  - `/customer/vnpay-return` - Callback VNPay
- **Layout**: `SharedLayout` (có header/footer)
- **Protection**: ✅ `ProtectedRoute` - chỉ login user có thể vào
- **Redirect**: 
  - Nếu chưa login → `/auth/login`
  - Nếu login nhưng role=admin → `/admin/dashboard`
- **Header**:
  - Menu: Trang chủ, Thư viện ảnh, Giới thiệu, Bảng giá, Đặt lịch
  - User dropdown: Thông tin tài khoản, Quản lý đơn đặt lịch, Đăng xuất

### 4. **Admin Routes** (`/admin/*`) - Quản trị viên
- **URLs**:
  - `/admin/dashboard` - Dashboard thống kê
  - `/admin/profile` - Hồ sơ admin
  - `/admin/resources` - Danh sách tài nguyên
  - `/admin/resources/add` - Thêm tài nguyên
  - `/admin/staff` - Danh sách nhân sự
  - `/admin/staff/add` - Thêm nhân sự
  - `/admin/customers` - Quản lý khách hàng
  - `/admin/services` - Danh sách dịch vụ
  - `/admin/services/add` - Thêm dịch vụ
  - `/admin/orders` - Danh sách đơn hàng
  - `/admin/orders/create` - Tạo đơn hộ
- **Layout**: `SharedLayout` (có header nhưng không show menu customer)
- **Protection**: ✅ `ProtectedRoute` - chỉ admin user có thể vào
- **Redirect**:
  - Nếu chưa login → `/auth/login`
  - Nếu login nhưng role=customer → `/customer`
- **Header**:
  - Chỉ hiển thị: "ADMIN DASHBOARD"
  - Admin dropdown: Thông tin tài khoản, Dashboard, Quản lý tài nguyên, Quản lý nhân sự, Quản lý khách hàng, Quản lý dịch vụ, Quản lý đơn hàng, Đăng xuất

---

## 🔐 Protection Logic

### `ProtectedRoute` Component

```javascript
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

**Behavior**:
- ❌ Chưa login? → Redirect `/auth/login`
- ❌ Login nhưng role không match? → Redirect `/customer` hoặc `/admin/dashboard`
- ✅ Login + role match? → Render component

---

## 📊 User Role System

Backend cần lưu `role` field trong User model:

```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String,
  password: String,
  role: String,  // "customer" hoặc "admin"
  createdAt: Date,
  updatedAt: Date
}
```

**Login Response**:
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"  // hoặc "admin"
  }
}
```

---

## 🔀 Navigation Examples

### Khách vãng lai
```
/ (Landing)
  ↓ Click "Đăng Ký"
/auth/register
  ↓ Complete registration
/auth/login (auto redirect)
  ↓ Login success
/customer (auto redirect)
```

### Customer
```
/customer
  ↓ Navigate menu
/customer/services
  ↓ Click "ĐẶT LỊCH"
/customer/booking
  ↓ Complete booking
/customer/payment/:id
  ↓ Payment success
/customer/booking-success/:id
```

### Admin
```
/auth/login
  ↓ Login with admin account
/admin/dashboard (auto redirect)
  ↓ Navigate admin menu
/admin/orders
  ↓ Click "Tạo đơn hộ"
/admin/orders/create
```

---

## 🚀 Key Features

✅ **Landing page** cho khách vãng lai  
✅ **Protected routes** với role-based access  
✅ **Auto redirect** dựa vào login status  
✅ **Shared layout** nhưng hiển thị khác nhau  
✅ **Admin menu** với sub-items lồng nhau  
✅ **Responsive** trên tất cả devices  

---

## 📝 Lưu Ý Phát Triển

1. **Backend**: Cần thêm `role` field vào User model
2. **Login API**: Đảm bảo trả về `role` trong response
3. **Validation**: Backend cũng cần kiểm tra role (frontend protection chỉ là UX)
4. **Default Landing**: Nếu user chưa login, `/` sẽ show Landing page
5. **Protected Routes**: Nếu user cố vào route không hợp lệ, sẽ redirect

---

**Cập nhật:** April 23, 2026
