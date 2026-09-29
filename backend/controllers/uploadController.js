/**
 * uploadController.js
 * Xử lý tải ảnh & file PDF hợp đồng trực tiếp từ máy tính lên cloud.
 * Ảnh được upload lên Cloudinary (vĩnh viễn) thay vì lưu trên disk Render (tạm thời).
 * File PDF hợp đồng cũng được upload lên Cloudinary để không bị mất khi server restart.
 */
const cloudinary = require("../config/cloudinary");

/**
 * Upload buffer lên Cloudinary, trả về URL vĩnh viễn.
 * @param {Buffer} buffer - Dữ liệu file từ multer memoryStorage
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
};

/**
 * Upload 1 file ảnh từ máy → Cloudinary
 */
exports.uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn 1 file ảnh hợp lệ để tải lên!" });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "caohienstudio/uploads",
      resource_type: "image",
      // Tự động tối ưu chất lượng và format
      quality: "auto",
      fetch_format: "auto",
    });

    const fileUrl = result.secure_url;

    return res.status(200).json({
      message: "Tải ảnh lên thành công!",
      url: fileUrl,
      filename: result.public_id,
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
 * Upload 1 file PDF hợp đồng từ máy → Cloudinary
 */
exports.uploadSinglePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn 1 file PDF hợp đồng hợp lệ để tải lên!" });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "caohienstudio/contracts",
      resource_type: "raw",
    });

    const fileUrl = result.secure_url;

    let originalName = req.file.originalname;
    try {
      originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");
    } catch (e) {
      console.error("Filename decode error:", e);
    }

    return res.status(200).json({
      message: "Tải file PDF hợp đồng lên thành công!",
      url: fileUrl,
      filename: result.public_id,
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

/**
 * Proxy ảnh Google Drive tốc độ cao & chống lỗi CORS/HTTP 403
 */
exports.proxyDriveImage = async (req, res) => {
  try {
    const axios = require("axios");
    const { fileId } = req.params;
    const { sz = "w2560" } = req.query;
    if (!fileId) {
      return res.status(400).send("File ID required");
    }

    const driveUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=${sz}`;

    const response = await axios({
      method: "get",
      url: driveUrl,
      responseType: "stream",
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    res.set({
      "Content-Type": response.headers["content-type"] || "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
      "Access-Control-Allow-Origin": "*",
    });

    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy drive image error:", error.message);
    return res.status(404).send("Image not found or blocked");
  }
};
