/**
 * uploadRoutes.js
 * Route upload file ảnh & file PDF từ máy tính lên server.
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

// Multer cho file PDF hợp đồng
const pdfUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype !== "application/pdf" && ext !== ".pdf") {
      return cb(new Error("Chỉ cho phép tải lên file hợp đồng định dạng PDF (.pdf)!"));
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

// Route POST /api/upload/image (Upload ảnh thumbnail/album/QR)
router.post("/image", verifyAdmin, handleMulter(imageUpload.single("image")), uploadController.uploadSingleImage);

// Route POST /api/upload/pdf (Upload PDF hợp đồng)
router.post("/pdf", verifyAdmin, handleMulter(pdfUpload.single("pdf")), uploadController.uploadSinglePdf);

// Route GET /api/upload/drive-proxy/:fileId (Proxy ảnh Google Drive công khai, không cần auth)
router.get("/drive-proxy/:fileId", uploadController.proxyDriveImage);

module.exports = router;
