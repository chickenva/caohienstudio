const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true }, // VD: Máy ảnh, Ống kính, Đèn, Phụ kiện
    quantity: { type: Number, required: true, default: 1 },
    status: { type: String, default: "Tốt" }, // Tốt, Đang bảo trì, Hỏng
    notes: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Resource", resourceSchema);
