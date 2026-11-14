// Router booking: đặt lịch, hợp đồng, thanh toán thủ công và quản trị đơn.
const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { verifyToken, verifyAdmin, optionalAuth } = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Lấy danh sách khung giờ bận của studio (dùng cho booking mới)
router.get("/studio-busy-slots", bookingController.getStudioBusySlots);

// Public: Lấy lịch bận ẩn danh theo tháng (đồng bộ từ Thời khóa biểu Admin sang lịch đặt của khách)
router.get("/public-schedule", bookingController.getPublicSchedule);

// Tính phụ thu di chuyển một chiều theo khu vực/địa chỉ khách chọn.
router.post("/travel-estimate", bookingController.getTravelEstimate);

// Public: Khách xem hợp đồng bằng token (không cần đăng nhập)
// GET /api/bookings/contract/:bookingId?token=...
router.get("/contract/:bookingId/pdf", bookingController.getContractPdfByToken);
router.get("/contract/:bookingId", bookingController.getContractByToken);

// ==========================================
// CUSTOMER ROUTES
// ==========================================

// Khách gửi yêu cầu đặt lịch (không thanh toán ngay)
router.post(
  "/request",
  optionalAuth,
  bookingController.createBookingRequest,
);

// Giữ endpoint xác nhận hợp đồng cho client cũ; luồng hiện tại không cần bước này.
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

// Khách hủy đơn nếu đơn còn REQUESTED hoặc đang chờ cọc (kể cả trạng thái legacy).
router.post("/:id/cancel", verifyToken, bookingController.cancelMyBooking);

// Admin xem lại QR/link hợp đồng của đơn đã có contract_token
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

// Admin lấy dữ liệu Thời khóa biểu lịch chụp theo tuần/tháng
router.get(
  "/admin/timetable",
  verifyAdmin,
  bookingController.getAdminTimetable,
);

// Admin tùy chỉnh nhanh ngày/buổi/giờ bắt đầu & giờ kết thúc dự kiến trên Thời khóa biểu
router.put(
  "/:id/schedule",
  verifyAdmin,
  bookingController.updateBookingSchedule,
);

// Admin tạo đơn hộ khách hàng
router.post(
  "/admin/create",
  verifyAdmin,
  bookingController.createBookingForAdmin,
);

// Admin gửi hợp đồng cho khách (chuyển sang WAITING_PAYMENT, tạo contract_token)
router.post(
  "/:id/generate-contract-pdf",
  verifyAdmin,
  bookingController.generateContractPdfFromTemplate,
);
router.post(
  "/:id/preview-contract-pdf",
  verifyAdmin,
  bookingController.previewContractPdfFromTemplate,
);
router.get(
  "/admin/:id/contract-editor",
  verifyAdmin,
  bookingController.getBookingForContractEditor,
);
router.post("/:id/send-contract", verifyAdmin, bookingController.sendContract);

// Admin xác nhận đã nhận cọc (tiền mặt/chuyển khoản) → chuyển WAITING_PAYMENT → CONFIRMED
router.post("/:id/confirm-deposit", verifyAdmin, bookingController.adminConfirmDeposit);

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
