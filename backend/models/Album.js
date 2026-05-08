const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    description: { type: String },
    coverImage: { type: String, required: true },
    images: [{ type: String }], // Mảng chứa các URL ảnh
  },
  { timestamps: true },
);

module.exports = mongoose.model("Album", albumSchema);
