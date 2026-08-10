/**
 * websiteRoutes.js
 * Định tuyến API cho quản lý hình ảnh website và trạng thái khóa website.
 */
const express = require("express");
const websiteController = require("../controllers/websiteController");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes công khai cho Khách hàng
router.get("/images", websiteController.getPublicImages);
router.get("/site-lock", websiteController.getSiteLockStatus);

// Routes bảo vệ dành cho Admin
router.get("/admin/images", verifyAdmin, websiteController.getAdminImages);
router.post("/admin/images", verifyAdmin, websiteController.saveImage);
router.put("/admin/images/:id", verifyAdmin, websiteController.saveImage);
router.patch("/admin/images/:id/toggle", verifyAdmin, websiteController.toggleActive);
router.delete("/admin/images/:id", verifyAdmin, websiteController.deleteImage);

// Khóa website — chỉ Super Admin (kiểm tra isSuperAdmin trong controller)
router.post("/admin/site-lock", verifyAdmin, websiteController.toggleSiteLock);

module.exports = router;
