const mongoose = require("mongoose");

const publicGallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    coverImage: { type: String, required: true }, // Ảnh đại diện hiển thị ngoài lưới
    images: [{ type: String }], // Mảng các ảnh bên trong album (dùng cho Lightbox)
    category: {
      type: String,
      enum: ["WEDDING", "PORTRAIT", "EVENT", "GRADUATION"],
      required: true,
    },
    featured: { type: Boolean, default: false }, // Ảnh nổi bật sẽ được ưu tiên hiển thị
  },
  { timestamps: true },
);

module.exports = mongoose.model("PublicGallery", publicGallerySchema);
