/**
 * Mongoose Schema: Payment (Giao dịch thanh toán)
 * Lưu mỗi giao dịch thanh toán cho một Booking qua hình thức thủ công.
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

    // Phương thức thanh toán: CASH (tiền mặt) | TRANSFER (chuyển khoản) | MANUAL (legacy/admin tạo thủ công)
    payment_method: { type: String, default: "MANUAL" },

    // Phân loại: DEPOSIT (tiền cọc) | FULL (tất toán) | ADMIN_COMPLETE_REMAINING (admin hoàn thành phần còn lại)
    payment_type: { type: String },

    // Mã giao dịch ngân hàng hoặc ghi chú đối soát thủ công
    transaction_id: { type: String },

    // Ghi chú đối soát của admin (vd: "Khách gửi bill qua Zalo")
    payment_note: { type: String, default: "" },

    // URL hình ảnh bill thanh toán (ảnh chụp màn hình chuyển khoản / hóa đơn)
    bill_image_url: { type: String, default: "" },

    status: {
      type:    String,
      enum:    ["PENDING", "SUCCESS", "FAILED", "EXPIRED"],
      default: "PENDING",
    },

    // Thời điểm thanh toán được ghi nhận
    paid_at: { type: Date },

    // Thời điểm hết hạn giữ tạm (dùng cho trạng thái WAITING_PAYMENT)
    expires_at: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
