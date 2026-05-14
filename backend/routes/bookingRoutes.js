const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================
// 1. PUBLIC ROUTES - Tuyệt đối không dùng verifyToken
// ==========================================
// Tuyến đường hứng kết quả từ VNPay. Phải public, không dùng verifyToken.
// VNPay thường redirect bằng GET, giữ thêm POST để frontend/test gọi nếu cần.
router.get("/vnpay-return", bookingController.vnpayReturn);
router.post("/vnpay-return", bookingController.vnpayReturn);

// ==========================================
// 2. PROTECTED ROUTES - Khách hàng đăng nhập
// ==========================================
router.post("/create-vnpay", verifyToken, bookingController.createVnpayPayment);
router.get("/my-bookings", verifyToken, bookingController.getMyBookings);
router.get("/:id", verifyToken, bookingController.getBookingDetail);
router.get(
  "/:id/check-status",
  verifyToken,
  bookingController.checkPaymentStatus,
);
router.post("/:id/repay", verifyToken, bookingController.repayBooking);

// ==========================================
// 3. ADMIN ROUTES - Quản trị viên
// ==========================================
// Tạm thời dùng verifyToken để test, sau này xong middleware verifyAdmin thì thay vào
router.put("/:id/status", verifyToken, bookingController.updateBookingStatus);

module.exports = router;
