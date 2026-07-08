const mongoose = require("mongoose");

const publicGallerySchema = new mongoose.Schema(
  {
    // Tên album hiển thị trên web
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Mô tả album, sau này admin có thể bổ sung
    description: {
      type: String,
      default: "",
    },

    // Danh mục album (sử dụng slug động)
    category: {
      type: String,
      required: true,
    },

    // Địa điểm chụp, sau này dùng cho trang chi tiết album
    location: {
      type: String,
      default: "",
    },

    // Folder Google Drive chứa ảnh của album
    drive_folder_id: {
      type: String,
      required: true,
      trim: true,
    },

    drive_folder_url: {
      type: String,
      default: "",
    },

    // Ảnh bìa tùy chọn.
    // Nếu để trống, backend sẽ lấy ảnh đầu tiên trong folder Google Drive làm cover.
    coverImage: {
      type: String,
      default: "",
    },

    // Sau này có thể liên kết album với thợ chụp
    photographer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Các gói dịch vụ liên quan
    service_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      }
    ],

    // Album nổi bật ngoài trang chủ / gallery
    featured: {
      type: Boolean,
      default: false,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PublicGallery", publicGallerySchema);
