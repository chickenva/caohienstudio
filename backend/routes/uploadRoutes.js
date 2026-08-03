/**
 * uploadRoutes.js
 * Route upload file ảnh từ máy tính lên server.
 */
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadController = require("../controllers/uploadController");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Tự động tạo thư mục public/uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình lưu file đĩa (Disk Storage) với multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ cho phép tải lên file ảnh (JPEG, PNG, WEBP, GIF, SVG)!"));
    }
    cb(null, true);
  },
});

// Route POST /api/upload/image
router.post("/image", verifyAdmin, upload.single("image"), uploadController.uploadSingleImage);

module.exports = router;
