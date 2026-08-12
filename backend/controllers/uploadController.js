/**
 * uploadController.js
 * Xử lý tải ảnh & file PDF hợp đồng trực tiếp từ máy tính lên server.
 * File được lưu trong thư mục public/uploads/ và trả về URL để hiển thị.
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
    const rawBackendUrl = process.env.BACKEND_URL || `${protocol}://${host}`;
    const backendUrl = rawBackendUrl.replace(/\/+$/, "");
    
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

/**
 * Upload 1 file PDF hợp đồng từ máy
 */
exports.uploadSinglePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn 1 file PDF hợp đồng hợp lệ để tải lên!" });
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const rawBackendUrl = process.env.BACKEND_URL || `${protocol}://${host}`;
    const backendUrl = rawBackendUrl.replace(/\/+$/, "");
    
    // URL truy cập file PDF
    const fileUrl = `${backendUrl}/public/uploads/${req.file.filename}`;

    let originalName = req.file.originalname;
    try {
      originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");
    } catch (e) {
      console.error("Filename decode error:", e);
    }

    return res.status(200).json({
      message: "Tải file PDF hợp đồng lên thành công!",
      url: fileUrl,
      filename: req.file.filename,
      originalName: originalName,
    });
  } catch (error) {
    console.error("Upload PDF error:", error);
    return res.status(500).json({
      message: "Lỗi khi tải file PDF hợp đồng lên server",
      error: error.message,
    });
  }
};
