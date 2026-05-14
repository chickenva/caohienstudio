const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    // photographer_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    photographer_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    resource_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }], // Thiết bị sẽ được Admin gán sau

    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true }, // Tự động tính dựa vào duration_hours của Service
    location: { type: String, required: true },

    total_amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "DEPOSITED", "COMPLETED", "CANCELED"],
      default: "PENDING",
    },
    note: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
