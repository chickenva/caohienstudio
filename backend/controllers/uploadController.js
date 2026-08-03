/**
 * uploadController.js
 * Xử lý tải ảnh trực tiếp từ máy tính lên server (dành cho thumbnail gói dịch vụ & thumbnail album).
 * Ảnh được lưu trong thư mục public/uploads/ và trả về URL để hiển thị.
 */
const path = require("path");
const fs = require("fs");

/**
 * Upload 1 file ảnh từ máy
 */
exports.uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn 1 file ảnh hợp lệ để tải lên!" });
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const backendUrl = process.env.BACKEND_URL || `${protocol}://${host}`;
    
    // URL truy cập ảnh tĩnh
    const fileUrl = `${backendUrl}/public/uploads/${req.file.filename}`;

    return res.status(200).json({
      message: "Tải ảnh lên thành công!",
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Upload image error:", error);
    return res.status(500).json({
      message: "Lỗi khi tải ảnh lên server",
      error: error.message,
    });
  }
};
