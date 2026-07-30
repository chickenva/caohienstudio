/**
 * Mongoose Schema: User (Người dùng)
 * Lưu thông tin tài khoản, mật khẩu (đã mã hóa) và phân quyền.
 * Role: ADMIN | PHOTOGRAPHER | CUSTOMER
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
      enum:    ["ADMIN", "PHOTOGRAPHER", "CUSTOMER"],
      default: "CUSTOMER",
    },

    // Thông tin portfolio (chỉ dùng cho PHOTOGRAPHER)
    portfolio: {
      avatar:               String,
      bio:                  String,
      specialties:          [{ type: String }],
      years_of_experience:  Number,
      featured_images:      [{ type: String }],

      // Liên kết folder Google Drive của thợ chụp
      google_drive_folder_id:  String,
      google_drive_folder_url: String,
    },

    // Trạng thái tài khoản — false khi admin khóa tài khoản
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
