/**
 * Mongoose Schema: PublicGallery (Album ảnh công khai)
 * Lưu thông tin album ảnh liên kết với folder Google Drive.
 * Ảnh bìa được tự động lấy từ ảnh đầu tiên trong folder nếu không có coverImage.
 */
const mongoose = require("mongoose");

const publicGallerySchema = new mongoose.Schema(
  {
    // Tên album hiển thị trên website
    title: {
      type:     String,
      required: true,
      trim:     true,
    },

    description: { type: String, default: "" },

    // Danh mục album (slug từ bảng Category)
    category: { type: String, required: true },

    // Địa điểm chụp
    location: { type: String, default: "" },

    // ID folder Google Drive chứa ảnh của album
    drive_folder_id: {
      type:     String,
      required: true,
      trim:     true,
    },

    // Link đầy đủ folder Google Drive (để admin tiện mở)
    drive_folder_url: { type: String, default: "" },

    // Ảnh bìa tùy chọn.
    // Nếu để trống, backend sẽ lấy ảnh đầu tiên trong folder Drive.
    coverImage: { type: String, default: "" },

    // Nhiếp ảnh gia phụ trách album (tùy chọn)
    photographer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    },

    // Các gói dịch vụ liên quan đến album
    service_ids: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    ],

    // Đánh dấu album nổi bật trên trang chủ/gallery
    featured: { type: Boolean, default: false },

    is_active: { type: Boolean, default: true },

    // Thứ tự hiển thị — số nhỏ hơn ưu tiên trước
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PublicGallery", publicGallerySchema);
