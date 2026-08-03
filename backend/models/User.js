/**
 * Mongoose Schema: User (Người dùng)
 * Lưu thông tin tài khoản, mật khẩu (đã mã hóa) và phân quyền.
 * Role: ADMIN | CUSTOMER
 */
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email:         { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    full_name:     { type: String, required: true },
    phone:         { type: String },

    role: {
      type:    String,
      enum:    ["ADMIN", "CUSTOMER"],
      default: "CUSTOMER",
    },

    // Trạng thái tài khoản — false khi admin khóa tài khoản
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
