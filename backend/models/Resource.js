const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["CAMERA", "LENS", "LIGHT", "STUDIO", "ACCESSORY"],
      required: true,
    },
    usage_type: {
      type: String,
      enum: ["INTERNAL", "RENTAL", "BOTH"],
      default: "RENTAL",
    },
    rental_price_per_day: { type: Number, default: 0 },
    required_deposit_amount: { type: Number, default: 0 }, // Tiền cọc thiết bị

    thumbnail: { type: String }, // Ảnh thiết bị
    features: [{ type: String }], // Cấu hình nổi bật (VD: "Cảm biến Full-frame", "Quay 8K")

    status: {
      type: String,
      enum: ["AVAILABLE", "IN_USE", "MAINTENANCE"],
      default: "AVAILABLE",
    },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Resource", resourceSchema);
