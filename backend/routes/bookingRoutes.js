const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/my-bookings", verifyToken, bookingController.getMyBookings);
router.get("/:id", verifyToken, bookingController.getBookingDetail);
router.put("/:id/status", verifyToken, bookingController.updateBookingStatus);
router.post("/create-vnpay", verifyToken, bookingController.createVnpayPayment);
router.post("/:id/repay", verifyToken, bookingController.repayBooking);

module.exports = router;
