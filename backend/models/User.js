/**
 * Mongoose Schema: User (Người dùng)
 * Chức năng: Quản lý thông tin tài khoản, mật khẩu (đã mã hóa) và phân quyền (ADMIN/CUSTOMER).
 */
const mongoose = require("mongoose");

// Schema người dùng cho CUSTOMER, ADMIN và PHOTOGRAPHER.
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    phone: { type: String },

    role: {
      type: String,
      enum: ["ADMIN", "PHOTOGRAPHER", "CUSTOMER"],
      default: "CUSTOMER",
    },

    // Dành cho user có role PHOTOGRAPHER
    portfolio: {
      avatar: String,
      bio: String,
      specialties: [{ type: String }],
      years_of_experience: Number,
      featured_images: [{ type: String }],

      // Sau này dùng cho Google Drive
      google_drive_folder_id: String,
      google_drive_folder_url: String,
    },

    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
