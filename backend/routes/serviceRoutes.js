const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// ==========================================
// ADMIN ROUTES
// ==========================================

// Lấy tất cả dịch vụ, kể cả dịch vụ đã ẩn
router.get("/admin/all", verifyAdmin, serviceController.getAllServicesForAdmin);

// Lấy chi tiết dịch vụ cho admin
router.get("/admin/:id", verifyAdmin, serviceController.getServiceByIdForAdmin);

// Cập nhật thứ tự
router.put("/admin/reorder", verifyAdmin, serviceController.reorderServices);

// Tạo dịch vụ mới
router.post("/admin", verifyAdmin, serviceController.createService);

// Cập nhật dịch vụ
router.put("/admin/:id", verifyAdmin, serviceController.updateService);

// Ẩn / hiện dịch vụ
router.patch(
  "/admin/:id/toggle-active",
  verifyAdmin,
  serviceController.toggleServiceActive,
);

// Xóa mềm dịch vụ
router.delete("/admin/:id", verifyAdmin, serviceController.deleteService);

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Khách xem danh sách dịch vụ đang hoạt động
router.get("/", serviceController.getAllServices);

// Khách xem chi tiết dịch vụ đang hoạt động
router.get("/:id", serviceController.getServiceById);

module.exports = router;
