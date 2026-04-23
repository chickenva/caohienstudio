const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    thumbnail: { type: String, required: true }, // Ảnh đại diện gói
    description: { type: String }, // Mô tả ngắn
    details: { type: String }, // Nội dung chi tiết (dùng cho trang Detail)
    features: [{ type: String }], // Danh sách tính năng (check list)
    category: { type: String, enum: ["Wedding", "Event", "Family"] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Service", serviceSchema);
