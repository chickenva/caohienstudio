/**
 * uploadRoutes.js
 * Route upload file ảnh từ máy tính lên Cloudinary.
 * Sử dụng memoryStorage (buffer) thay vì diskStorage để tương thích với Cloudinary
 * và tránh mất file khi Render.com restart (ephemeral filesystem).
 */
const express = require("express");
const multer = require("multer");
const uploadController = require("../controllers/uploadController");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Cấu hình lưu file trong bộ nhớ (Memory Storage) — file sẽ được upload thẳng lên Cloudinary
const storage = multer.memoryStorage();

// Multer cho file ảnh
const imageUpload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ cho phép tải lên file ảnh (JPEG, PNG, WEBP, GIF, SVG)!"));
    }
    cb(null, true);
  },
});

// Middleware bọc bắt lỗi Multer để trả về JSON 400 thay vì crash HTML 500
const handleMulter = (multerSingle) => (req, res, next) => {
  multerSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || "Lỗi tải file lên server",
      });
    }
    next();
  });
};

// Route POST /api/upload/image (Upload ảnh thumbnail/album/QR → Cloudinary)
router.post("/image", verifyAdmin, handleMulter(imageUpload.single("image")), uploadController.uploadSingleImage);

// Route GET /api/upload/drive-proxy/:fileId (Proxy ảnh Google Drive công khai, không cần auth)
router.get("/drive-proxy/:fileId", uploadController.proxyDriveImage);

module.exports = router;
