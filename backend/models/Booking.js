const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceName: { type: String, required: true },
    price: { type: Number, required: true },
    appointmentDate: { type: Date, required: true },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
      default: "Pending",
    },
    note: { type: String },
    depositAmount: { type: Number }, // Lưu số tiền cọc thực tế đã trả
    paidAt: { type: Date }, // Thời điểm thanh toán thành công
    bookingType: { type: String }, // 'Early', 'Late', 'Urgent'
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
