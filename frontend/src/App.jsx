import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import CustomerLayout from "./components/layout/CustomerLayout";
import AdminLayout from "./components/layout/AdminLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Common Pages
import Home from "./pages/customer/Home";
import About from "./pages/customer/About";
import FAQ from "./pages/customer/FAQ";
import Galleries from "./pages/customer/Galleries";
import Services from "./pages/customer/Services";
import Booking from "./pages/customer/Booking";
import Contact from "./pages/customer/Contact";
import RefundPolicy from "./pages/policies/RefundPolicy";
import Contract from "./pages/policies/Contract";

import GalleryDetail from "./pages/customer/GalleryDetail";
import ServiceDetail from "./pages/customer/ServiceDetail";
import BookingDetail from "./pages/customer/BookingDetail";
import BookingConfirm from "./pages/customer/BookingConfirm";

// Customer Pages
import Profile from "./pages/customer/Profile";
import MyBookings from "./pages/customer/MyBookings";

// Admin Pages
import AdminProfile from "./pages/admin/AdminProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminGalleries from "./pages/admin/AdminGalleries";
import AdminServices from "./pages/admin/AdminServices";
import AdminPhotographers from "./pages/admin/AdminPhotographers";
import AdminCustomers from "./pages/admin/AdminCustomers";

import CreateOrder from "./pages/admin/CreateOrder";
import PhotographerForm from "./pages/admin/PhotographerForm";
import ServiceForm from "./pages/admin/ServiceForm";
import GalleryForm from "./pages/admin/GalleryForm";

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
          <Route path="/faq" element={<FAQ />} />
          <Route path="/galleries" element={<Galleries />} />
          <Route path="/galleries/:id" element={<GalleryDetail />} />
          <Route path="/photographers" element={<Navigate to="/services" replace />} />
          <Route path="/photographers/:id" element={<Navigate to="/services" replace />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/confirm" element={<BookingConfirm />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/contract" element={<Contract />} />

          <Route path="/customer/profile" element={<Profile />} />
          <Route path="/customer/my-bookings" element={<MyBookings />} />
          <Route path="/customer/my-bookings/:id" element={<BookingDetail />} />

          <Route path="/vnpay-return" element={<VnpayReturn />} />
        </Route>

        {/* LUỒNG ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="profile" element={<AdminProfile />} />

          {/* <Route path="staff" element={<StaffList />} />
          <Route path="staff/add" element={<AddStaff />} />
          <Route
            path="staff/edit/:id"
            element={<div>Trang sửa nhân sự (Làm sau)</div>}
          />
          <Route path="orders/detail" element={<div>Chi tiết Đơn hàng</div>} /> */}
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/create" element={<CreateOrder />} />

          <Route path="galleries" element={<AdminGalleries />} />
          <Route path="galleries/create" element={<GalleryForm />} />
          <Route path="galleries/edit/:id" element={<GalleryForm />} />

          <Route path="services" element={<AdminServices />} />
          <Route path="services/add" element={<ServiceForm />} />
          <Route path="services/edit/:id" element={<ServiceForm />} />

          <Route path="photographers" element={<AdminPhotographers />} />
          <Route path="photographers/add" element={<PhotographerForm />} />
          <Route path="photographers/edit/:id" element={<PhotographerForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
