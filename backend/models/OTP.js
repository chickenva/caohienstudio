/**
 * Mongoose Schema: OTP (Mã xác thực một lần)
 * Lưu mã OTP tạm thời cho đăng ký tài khoản, quên mật khẩu và đổi email.
 * Document tự hủy sau 5 phút nhờ TTL index của MongoDB.
 */
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp:   { type: String, required: true },

  // TTL index — MongoDB tự xóa document sau 300 giây (5 phút)
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

module.exports = mongoose.model("OTP", otpSchema);
