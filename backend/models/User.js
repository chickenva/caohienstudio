const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["ADMIN", "PHOTOGRAPHER"],
      default: "CUSTOMER",
    },

    // Nơi chứa thông tin show ra trang giới thiệu thợ chụp
    portfolio: {
      avatar: String, // Ảnh chân dung thợ chụp
      bio: String, // Vài dòng tự giới thiệu nghệ, chảnh chảnh xíu
      specialties: [{ type: String }], // Thể loại mạnh nhất (Ví dụ: "Phóng sự cưới", "Chân dung")
      years_of_experience: Number,
      featured_images: [{ type: String }], // <--- ĐÂY LÀ CHÌA KHÓA: Mảng chứa 3-4 ảnh đỉnh nhất của thợ này
    },

    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
