// Router booking: đặt lịch, hợp đồng, VNPay và quản trị đơn.
const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC ROUTES
// ==========================================

// VNPay có thể redirect GET về backend
router.get("/vnpay-return", bookingController.vnpayReturn);

// Frontend cũng có thể POST params về backend để xác thực chữ ký
router.post("/vnpay-return", bookingController.vnpayReturn);

// Lấy danh sách khung giờ bận của studio (dùng cho booking mới)
router.get("/studio-busy-slots", bookingController.getStudioBusySlots);

// Public: Khách xem hợp đồng bằng token (không cần đăng nhập)
// GET /api/bookings/contract/:bookingId?token=...
router.get("/contract/:bookingId", bookingController.getContractByToken);

// ==========================================
// CUSTOMER ROUTES
// ==========================================

// Khách gửi yêu cầu đặt lịch (luồng mới — không thanh toán ngay)
router.post(
  "/request",
  verifyToken,
  bookingController.createBookingRequest,
);

// Khách xác nhận hợp đồng → tạo Payment VNPay
// POST /api/bookings/:id/confirm-contract  { token: "..." }
router.post("/:id/confirm-contract", bookingController.confirmContract);

// Khách xem danh sách đơn của mình
router.get("/my-bookings", verifyToken, bookingController.getMyBookings);

// Khách kiểm tra trạng thái đơn/thanh toán
router.get(
  "/:id/check-status",
  verifyToken,
  bookingController.checkPaymentStatus,
);

// Khách tạo lại link thanh toán (dùng cho WAITING_PAYMENT hoặc legacy PENDING)
router.post("/:id/repay", verifyToken, bookingController.repayBooking);

// Khách hủy đơn nếu đơn còn REQUESTED hoặc CONTRACT_SENT
router.post("/:id/cancel", verifyToken, bookingController.cancelMyBooking);

// Admin xem lại QR/link hợp đồng của đơn đã có contract_token (không phụ thuộc state tạm thời)
// Phải đặt TRƯỚC route /:id của customer để Express không nhầm route
router.get("/:id/contract-info", verifyAdmin, bookingController.getContractInfo);

// Khách xem chi tiết đơn của mình
router.get("/:id", verifyToken, bookingController.getBookingDetail);

// ==========================================
// ADMIN ROUTES
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

// Admin gửi hợp đồng cho khách (chuyển sang CONTRACT_SENT, tạo contract_token)
router.post("/:id/send-contract", verifyAdmin, bookingController.sendContract);

// Admin chỉnh thông tin đơn (trước khi gửi hợp đồng)
router.put("/:id/info", verifyAdmin, bookingController.updateBookingInfo);

// Admin cập nhật trạng thái đơn
router.put("/:id/status", verifyAdmin, bookingController.updateBookingStatus);

// Admin phân ekip phụ trách cho đơn
router.put("/:id/staff", verifyAdmin, bookingController.updateBookingStaff);

// Admin dời lịch/địa điểm cho đơn CONFIRMED (khách đã xác nhận HĐ và thanh toán cọc)
// Chỉ cập nhật: shoot_date, shooting_session, location, note, contract_note
// Regenerate PDF hợp đồng; trạng thái đơn vẫn CONFIRMED
router.put("/:id/reschedule", verifyAdmin, bookingController.rescheduleBooking);

module.exports = router;