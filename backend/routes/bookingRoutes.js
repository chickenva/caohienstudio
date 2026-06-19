const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC ROUTES - VNPAY RETURN
// ==========================================
// VNPay có thể redirect GET về backend
router.get("/vnpay-return", bookingController.vnpayReturn);

// Frontend cũng có thể POST params về backend để xác thực chữ ký
router.post("/vnpay-return", bookingController.vnpayReturn);

// Lấy danh sách khung giờ bận của thợ chụp
router.get("/photographer-busy-slots", bookingController.getPhotographerBusySlots);

// ==========================================
// CUSTOMER ROUTES
// ==========================================

// Khách tạo đơn + tạo link thanh toán VNPay
router.post(
  "/create-vnpay",
  verifyToken,
  bookingController.createVnpayPayment,
);

// Khách xem danh sách đơn của mình
router.get("/my-bookings", verifyToken, bookingController.getMyBookings);

// Khách kiểm tra trạng thái đơn/thanh toán
router.get(
  "/:id/check-status",
  verifyToken,
  bookingController.checkPaymentStatus,
);

// Khách tạo lại link thanh toán nếu đơn còn PENDING và chưa quá hạn
router.post("/:id/repay", verifyToken, bookingController.repayBooking);

// Khách hủy đơn nếu đơn còn PENDING
router.post("/:id/cancel", verifyToken, bookingController.cancelMyBooking);

// Khách xem chi tiết đơn của mình
router.get("/:id", verifyToken, bookingController.getBookingDetail);

// ==========================================
// ADMIN ROUTES
// Lưu ý: các route admin nên để trước nếu có route dạng /:id dễ trùng.
// Ở đây /admin/all và /admin/create không bị trùng vì đã khai báo rõ.
// ==========================================

// Admin lấy tất cả đơn
router.get(
  "/admin/all",
  verifyAdmin,
  bookingController.getAllBookingsForAdmin,
);

// Admin tạo đơn hộ khách hàng
router.post(
  "/admin/create",
  verifyAdmin,
  bookingController.createBookingForAdmin,
);

// Admin cập nhật trạng thái đơn
router.put("/:id/status", verifyAdmin, bookingController.updateBookingStatus);

module.exports = router;