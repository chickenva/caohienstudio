const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    message: { type: String, required: true },
    // Thông tin dịch vụ & lịch (tùy chọn, từ form liên hệ chi tiết)
    service_names: { type: String, default: "" },      // Tên các gói dịch vụ chính
    addon_names: { type: String, default: "" },         // Tên các gói đi kèm
    location_area: { type: String, default: "" },       // Khu vực chụp (tỉnh/thành)
    location_detail: { type: String, default: "" },     // Địa điểm chi tiết
    shoot_date: { type: String, default: "" },          // Ngày dự kiến (YYYY-MM-DD)
    shoot_time: { type: String, default: "" },          // Giờ dự kiến (HH:mm)
    status: {
      type: String,
      enum: ["UNREAD", "READ", "CONTACTED"],
      default: "UNREAD",
    }, // Để sau này Admin biết đã gọi lại cho khách chưa
  },
  { timestamps: true },
);

module.exports = mongoose.model("Contact", contactSchema);

