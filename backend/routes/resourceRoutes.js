const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// ==========================================
// ADMIN ROUTES
// ==========================================

// Lấy tất cả tài nguyên, kể cả đã ẩn
router.get(
  "/admin/all",
  verifyAdmin,
  resourceController.getAllResourcesForAdmin,
);

// Lấy chi tiết tài nguyên cho admin
router.get(
  "/admin/:id",
  verifyAdmin,
  resourceController.getResourceByIdForAdmin,
);

// Tạo tài nguyên
router.post("/admin", verifyAdmin, resourceController.createResource);

// Cập nhật tài nguyên
router.put("/admin/:id", verifyAdmin, resourceController.updateResource);

// Ẩn / hiện tài nguyên
router.patch(
  "/admin/:id/toggle-active",
  verifyAdmin,
  resourceController.toggleResourceActive,
);

// Xóa mềm tài nguyên
router.delete("/admin/:id", verifyAdmin, resourceController.deleteResource);

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Khách vãng lai xem đồ cho thuê
router.get("/rentals", resourceController.getRentals);

// Chi tiết 1 thiết bị cho thuê
router.get("/rentals/:id", resourceController.getRentalDetail);

module.exports = router;
