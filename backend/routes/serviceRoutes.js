const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================
// ADMIN ROUTES - PHẢI ĐẶT TRƯỚC /:id
// ==========================================

// Lấy tất cả dịch vụ, kể cả dịch vụ đã ẩn
router.get("/admin/all", verifyToken, serviceController.getAllServicesForAdmin);

// Lấy chi tiết dịch vụ cho admin
router.get("/admin/:id", verifyToken, serviceController.getServiceByIdForAdmin);

// Tạo dịch vụ mới
router.post("/admin", verifyToken, serviceController.createService);

// Cập nhật dịch vụ
router.put("/admin/:id", verifyToken, serviceController.updateService);

// Ẩn / hiện dịch vụ
router.patch(
  "/admin/:id/toggle-active",
  verifyToken,
  serviceController.toggleServiceActive,
);

// Xóa mềm dịch vụ
router.delete("/admin/:id", verifyToken, serviceController.deleteService);

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Khách xem danh sách dịch vụ đang hoạt động
router.get("/", serviceController.getAllServices);

// Khách xem chi tiết dịch vụ đang hoạt động
router.get("/:id", serviceController.getServiceById);

module.exports = router;
