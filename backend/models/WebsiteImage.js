/**
 * WebsiteImage.js
 * Model quản lý hình ảnh hiển thị trên các trang của website (Trang chủ, Trang giới thiệu, Cài đặt...).
 */
const mongoose = require("mongoose");

const websiteImageSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      enum: ["HOME", "ABOUT", "SETTINGS"],
      required: [true, "Trang hiển thị là bắt buộc (HOME, ABOUT hoặc SETTINGS)"],
      index: true,
    },
    key: {
      type: String,
      required: [true, "Mã vị trí ảnh là bắt buộc"],
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    altText: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index hợp nhất cho (page, key) để dễ truy vấn vị trí
websiteImageSchema.index({ page: 1, key: 1 });

module.exports = mongoose.model("WebsiteImage", websiteImageSchema);
