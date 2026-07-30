/**
 * Mongoose Schema: Category (Danh mục)
 * Dùng để phân loại dịch vụ (SERVICE) và album (GALLERY).
 * Mỗi danh mục có một slug duy nhất trong từng type.
 */
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    // Tên hiển thị của danh mục
    name: {
      type:     String,
      required: true,
      trim:     true,
    },

    // Định danh dạng URL-friendly (ví dụ: "cuoi-truyen-thong")
    slug: {
      type:     String,
      required: true,
      trim:     true,
    },

    // Loại danh mục: SERVICE (gói dịch vụ) hoặc GALLERY (album ảnh)
    type: {
      type:     String,
      enum:     ["SERVICE", "GALLERY"],
      required: true,
    },

    description: { type: String, default: "" },
    is_active:   { type: Boolean, default: true },

    // Thứ tự hiển thị — số nhỏ hơn hiển thị trước
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Index kết hợp slug + type để đảm bảo slug là duy nhất trong mỗi loại
categorySchema.index({ slug: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
