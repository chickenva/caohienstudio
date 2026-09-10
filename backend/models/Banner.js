/**
 * Mongoose Schema: Banner (Banner quảng cáo)
 * Lưu thông tin banner/poster quảng cáo hiển thị trên website.
 * Banner chỉ hiển thị khi is_active = true VÀ ngày hiện tại nằm trong [start_date, end_date].
 * Mỗi banner là 1 poster duy nhất (1 tấm hình).
 */
const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    // URL ảnh poster (Google Drive hoặc upload)
    imageUrl: { type: String, default: "" },

    // Thời gian bắt đầu hiển thị
    start_date: { type: Date, required: true },

    // Thời gian kết thúc hiển thị — quá hạn sẽ tự ẩn
    end_date: { type: Date, required: true },

    // Bật/tắt hiển thị
    is_active: { type: Boolean, default: true },

    // Thứ tự hiển thị — số nhỏ ưu tiên trước
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
