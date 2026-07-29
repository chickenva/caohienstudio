const mongoose = require("mongoose");

// Schema đơn hàng legacy, giữ lại để tương thích dữ liệu/code cũ nếu còn.
const orderSchema = new mongoose.Schema(
  {
    customerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    packageID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    staffID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shootDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Deposited", "Completed", "Cancelled"],
      default: "Pending",
    },
    // Lưu các resource dưới dạng mảng (thay cho bảng trung gian n-n trong SQL)
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
    // Lưu thông tin thanh toán nhúng trực tiếp (One-to-Many)
    payments: [
      {
        amount: Number,
        paymentMethod: String,
        transactionID: String,
        status: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
