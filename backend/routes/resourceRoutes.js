const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================
// ADMIN ROUTES - PHẢI ĐẶT TRƯỚC /rentals/:id
// ==========================================

// Lấy tất cả tài nguyên, kể cả đã ẩn
router.get(
  "/admin/all",
  verifyToken,
  resourceController.getAllResourcesForAdmin,
);

// Lấy chi tiết tài nguyên cho admin
router.get(
  "/admin/:id",
  verifyToken,
  resourceController.getResourceByIdForAdmin,
);

// Tạo tài nguyên
router.post("/admin", verifyToken, resourceController.createResource);

// Cập nhật tài nguyên
router.put("/admin/:id", verifyToken, resourceController.updateResource);

// Ẩn / hiện tài nguyên
router.patch(
  "/admin/:id/toggle-active",
  verifyToken,
  resourceController.toggleResourceActive,
);

// Xóa mềm tài nguyên
router.delete("/admin/:id", verifyToken, resourceController.deleteResource);

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Khách vãng lai xem đồ cho thuê
router.get("/rentals", resourceController.getRentals);

// Chi tiết 1 thiết bị cho thuê
router.get("/rentals/:id", resourceController.getRentalDetail);

module.exports = router;
