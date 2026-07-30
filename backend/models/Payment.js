/**
 * Mongoose Schema: Payment (Giao dịch thanh toán)
 * Lưu mỗi giao dịch thanh toán cho một Booking qua VNPay hoặc thủ công.
 * Phân loại theo payment_type: DEPOSIT (cọc) hoặc FULL (tất toán).
 */
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // ID Booking liên kết
    reference_id: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Booking",
      required: true,
    },
    reference_type: { type: String, default: "BOOKING" },

    // Số tiền giao dịch (đơn vị VND)
    amount: { type: Number, required: true },

    // Phương thức: VNPAY | CASH | TRANSFER
    payment_method: { type: String, default: "VNPAY" },

    // Phân loại: DEPOSIT (tiền cọc) | FULL (tất toán)
    payment_type: { type: String },

    // Mã giao dịch trả về từ VNPay
    transaction_id: { type: String },

    status: {
      type:    String,
      enum:    ["PENDING", "SUCCESS", "FAILED", "EXPIRED"],
      default: "PENDING",
    },

    // Thời điểm thanh toán thành công
    paid_at: { type: Date },

    // Thời điểm link thanh toán hết hạn
    // Nên đồng bộ với Booking.expires_at và vnp_ExpireDate gửi sang VNPay
    expires_at: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
