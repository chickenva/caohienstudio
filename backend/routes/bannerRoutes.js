/**
 * bannerRoutes.js
 * Định tuyến API cho Banner quảng cáo / khuyến mãi.
 */
const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const { verifyAdmin } = require("../middleware/authMiddleware");

// Public: Lấy banner đang hiển thị
router.get("/", bannerController.getActiveBanners);

// Admin: Lấy tất cả banner
router.get("/admin/all", verifyAdmin, bannerController.getAllBanners);

// Admin: Tạo banner mới
router.post("/admin", verifyAdmin, bannerController.createBanner);

// Admin: Cập nhật thứ tự hiển thị (kéo thả)
router.put("/admin/reorder", verifyAdmin, bannerController.reorderBanners);

// Admin: Cập nhật banner
router.put("/admin/:id", verifyAdmin, bannerController.updateBanner);

// Admin: Bật/tắt banner
router.patch("/admin/:id/toggle", verifyAdmin, bannerController.toggleBanner);

// Admin: Xóa banner
router.delete("/admin/:id", verifyAdmin, bannerController.deleteBanner);

module.exports = router;
