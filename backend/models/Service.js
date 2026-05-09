const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    base_price: {
      type: Number,
      required: true,
    },
    duration_hours: {
      type: Number,
      required: true, // Tính theo giờ (VD: 4 giờ, 8 giờ, 12 giờ)
    },
    thumbnail: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Service", serviceSchema);
