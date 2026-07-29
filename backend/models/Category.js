const mongoose = require("mongoose");

// Schema danh mục dùng để lọc dịch vụ và album.
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["SERVICE", "GALLERY"],
      required: true,
    },
    description: {
      type: String,
      default: "",
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

// Tạo index kết hợp slug và type để đảm bảo duy nhất
categorySchema.index({ slug: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
