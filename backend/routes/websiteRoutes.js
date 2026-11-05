/**
 * websiteRoutes.js
 * Định tuyến API cho quản lý hình ảnh website, QR thanh toán studio và trạng thái khóa website.
 */
const express = require("express");
const multer = require("multer");
const websiteController = require("../controllers/websiteController");
const contractTemplateController = require("../controllers/contractTemplateController");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
const templateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.split(".").pop().toLowerCase();
    if (!["docx", "xlsx"].includes(extension)) {
      return callback(new Error("Chỉ cho phép template hợp đồng DOCX hoặc XLSX."));
    }
    callback(null, true);
  },
});
const handleTemplateUpload = (req, res, next) => templateUpload.single("template")(req, res, (error) => {
  if (error) return res.status(400).json({ message: error.message || "Không thể tải template." });
  next();
});

// Routes công khai cho Khách hàng
router.get("/images", websiteController.getPublicImages);
router.get("/site-lock", websiteController.getSiteLockStatus);
router.get("/payment-qr", websiteController.getPaymentQr);

// Routes bảo vệ dành cho Admin
router.get("/admin/images", verifyAdmin, websiteController.getAdminImages);
router.post("/admin/images", verifyAdmin, websiteController.saveImage);
router.put("/admin/images/:id", verifyAdmin, websiteController.saveImage);
router.patch("/admin/images/:id/toggle", verifyAdmin, websiteController.toggleActive);
router.delete("/admin/images/:id", verifyAdmin, websiteController.deleteImage);

// Cài đặt QR Thanh toán Studio mặc định — Admin
router.post("/admin/payment-qr", verifyAdmin, websiteController.savePaymentQr);
router.get("/admin/contract-template", verifyAdmin, contractTemplateController.getActiveTemplate);
router.post("/admin/contract-template", verifyAdmin, handleTemplateUpload, contractTemplateController.uploadTemplate);

// Khóa website — chỉ Super Admin (kiểm tra isSuperAdmin trong controller)
router.post("/admin/site-lock", verifyAdmin, websiteController.toggleSiteLock);

module.exports = router;
