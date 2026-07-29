// Router Google Drive phục vụ quản lý ảnh album.
const express = require("express");
const multer = require("multer");
const driveController = require("../controllers/driveController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB/file
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ cho phép upload file ảnh"));
    }

    cb(null, true);
  },
});

// Admin tạo folder Google Drive
router.post("/folders", verifyAdmin, driveController.createFolder);

// Public lấy ảnh từ folder
router.get("/folders/:folderId/images", driveController.listImages);

// Admin upload ảnh vào folder
router.post(
  "/folders/:folderId/images",
  verifyAdmin,
  upload.array("images", 20),
  driveController.uploadImages,
);

module.exports = router;
