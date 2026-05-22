const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// ==========================================
// 1. PUBLIC ROUTES - Tuyệt đối không dùng verifyToken
// ==========================================
router.get("/vnpay-return", bookingController.vnpayReturn);
router.post("/vnpay-return", bookingController.vnpayReturn);

// ==========================================
// 2. CUSTOMER ROUTES - Khách hàng đăng nhập
// ==========================================
router.post("/create-vnpay", verifyToken, bookingController.createVnpayPayment);
router.get("/my-bookings", verifyToken, bookingController.getMyBookings);

// ==========================================
// 3. ADMIN ROUTES - Phải đặt trước /:id
// ==========================================
router.get("/admin/all", verifyAdmin, bookingController.getAllBookingsForAdmin);

router.post(
  "/admin/create",
  verifyAdmin,
  bookingController.createBookingForAdmin,
);

router.put("/:id/status", verifyAdmin, bookingController.updateBookingStatus);

// ==========================================
// 4. CUSTOMER DETAIL ROUTES - Đặt sau /admin/...
// ==========================================
router.get("/:id", verifyToken, bookingController.getBookingDetail);

router.get(
  "/:id/check-status",
  verifyToken,
  bookingController.checkPaymentStatus,
);

router.post("/:id/repay", verifyToken, bookingController.repayBooking);

module.exports = router;
