const mongoose = require("mongoose");

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

    // Nơi chứa thông tin show ra trang giới thiệu thợ chụp
    portfolio: {
      avatar: String,
      bio: String,
      specialties: [{ type: String }],
      years_of_experience: Number,
      featured_images: [{ type: String }],
    },

    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
