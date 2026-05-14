import { BrowserRouter, Routes, Route } from "react-router-dom";

import CustomerLayout from "./components/layout/CustomerLayout";
import AdminLayout from "./components/layout/AdminLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Common Pages
import Home from "./pages/customer/Home";
import About from "./pages/customer/About";
import Galleries from "./pages/customer/Galleries";
import GalleryDetail from "./pages/customer/GalleryDetail";
import Photographers from "./pages/customer/Photographers";
import Services from "./pages/customer/Services";
import ServiceDetail from "./pages/customer/ServiceDetail";
import Booking from "./pages/customer/Booking";
import BookingDetail from "./pages/customer/BookingDetail";
import Rentals from "./pages/customer/Rentals";
import Contact from "./pages/customer/Contact";

// Customer Pages
import Profile from "./pages/customer/Profile";
import MyBookings from "./pages/customer/MyBookings";

// Admin Pages
import AdminProfile from "./pages/admin/AdminProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ResourceList from "./pages/admin/ResourceList";
import AddResource from "./pages/admin/AddResource";
import StaffList from "./pages/admin/StaffList";
import AddStaff from "./pages/admin/AddStaff";

// --- Payment VNPay Pages ---
import VnpayReturn from "./pages/customer/VnpayReturn";
// ----------------------------------

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LUỒNG KHÁCH HÀNG */}
        <Route element={<CustomerLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/galleries" element={<Galleries />} />
          <Route path="/galleries/:id" element={<GalleryDetail />} />
          <Route path="/photographers" element={<Photographers />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/customer/profile" element={<Profile />} />
          <Route path="/customer/my-bookings" element={<MyBookings />} />
          <Route path="/customer/my-bookings/:id" element={<BookingDetail />} />

          <Route path="/vnpay-return" element={<VnpayReturn />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="resources" element={<ResourceList />} />
          <Route path="resources/add" element={<AddResource />} />
          <Route
            path="resources/edit/:id"
            element={<div>Trang chỉnh sửa (Làm sau)</div>}
          />
          <Route path="staff" element={<StaffList />} />
          <Route path="staff/add" element={<AddStaff />} />
          <Route
            path="staff/edit/:id"
            element={<div>Trang sửa nhân sự (Làm sau)</div>}
          />
          <Route path="customers" element={<div>Danh sách Khách hàng</div>} />
          <Route path="services" element={<div>Danh sách Dịch vụ</div>} />
          <Route path="services/add" element={<div>Thêm Dịch vụ</div>} />
          <Route path="orders" element={<div>Danh sách Đơn hàng</div>} />
          <Route path="orders/detail" element={<div>Chi tiết Đơn hàng</div>} />
          <Route path="orders/create" element={<div>Tạo đơn đặt hộ</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
