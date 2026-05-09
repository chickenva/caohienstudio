const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
// Lưu ý: Đảm bảo authMiddleware của bạn bóc được req.user.id từ Token nhé
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create-vnpay", verifyToken, bookingController.createVnpayPayment);
router.get("/my-bookings", verifyToken, bookingController.getMyBookings);
router.get("/:id", verifyToken, bookingController.getBookingDetail);
router.post("/:id/repay", verifyToken, bookingController.repayBooking);
router.put("/:id/status", verifyToken, bookingController.updateBookingStatus); // Đáng ra cái này nên là verifyAdmin

module.exports = router;
