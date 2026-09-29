/**
 * cloudinary.js
 * Cấu hình kết nối Cloudinary để lưu trữ ảnh vĩnh viễn trên cloud.
 * Thay thế lưu file trên disk (ephemeral) của Render.com.
 */
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
