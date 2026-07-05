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
    category: {
      type: String,
      enum: ["TRADITIONAL", "PHOTOJOURNALISM", "COMBO", "PRINT", "OTHER"],
      default: "OTHER",
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
    features: [{ type: String }],
    is_active: {
      type: Boolean,
      default: true,
    },
    booking_mode: {
      type: String,
      enum: ["SINGLE_DAY", "MULTI_DAY"],
      default: "SINGLE_DAY",
    },
    allow_addon: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Service", serviceSchema);
