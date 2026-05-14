const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    reference_type: { type: String, default: "BOOKING" },

    amount: { type: Number, required: true },
    payment_method: { type: String, default: "VNPAY" },
    payment_type: { type: String }, // Phân loại: DEPOSIT_30, DEPOSIT_50, FULL_100

    transaction_id: { type: String }, // Mã giao dịch trả về từ VNPay

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "EXPIRED"],
      default: "PENDING",
    },

    paid_at: { type: Date },

    // Thời điểm link thanh toán hết hạn.
    // Nên trùng với Booking.expires_at và vnp_ExpireDate gửi sang VNPay.
    expires_at: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
