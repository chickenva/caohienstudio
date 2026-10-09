/**
 * holidayRoutes.js
 * Định nghĩa route API cho quản lý ngày lễ quốc gia và ngày nghỉ studio.
 */
const express = require("express");
const router = express.Router();
const holidayController = require("../controllers/holidayController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// Public: Khách xem danh sách ngày lễ hiển thị trên lịch
router.get("/", holidayController.getHolidays);

// Admin: Quản lý ngày lễ
router.post("/", verifyToken, verifyAdmin, holidayController.createHoliday);
router.put("/:id", verifyToken, verifyAdmin, holidayController.updateHoliday);
router.delete("/:id", verifyToken, verifyAdmin, holidayController.deleteHoliday);
router.post("/seed", verifyToken, verifyAdmin, holidayController.seedHolidays);

module.exports = router;
