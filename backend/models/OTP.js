const mongoose = require("mongoose");

// Schema OTP tạm thời cho đăng ký, quên mật khẩu và xác thực email.
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // Tự hủy sau 5 phút (300s)
});

module.exports = mongoose.model("OTP", otpSchema);
