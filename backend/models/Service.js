/**
 * Mongoose Schema: Service (Gói dịch vụ)
 * Lưu thông tin các gói chụp/quay/in ấn hiển thị trên website.
 * is_active = false khi admin ẩn hoặc xóa mềm gói dịch vụ.
 */
const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    description: { type: String },

    // Danh mục (slug từ bảng Category, ví dụ: "cuoi", "gia-dinh")
    category: { type: String, default: "OTHER" },

    // Giá gốc (đơn vị VND)
    base_price: { type: Number, required: true },

    // Thời lượng buổi chụp (giờ, ví dụ: 4, 8, 12)
    duration_hours: { type: Number, required: true },

    // Ảnh thumbnail hiển thị trên trang danh sách/trang chủ
    thumbnail: { type: String },

    // Danh sách tính năng/quyền lợi của gói
    features: [{ type: String }],

    is_active: { type: Boolean, default: true },

    // Chế độ đặt lịch: SINGLE_DAY (1 buổi) hoặc MULTI_DAY (nhiều ngày)
    booking_mode: {
      type:    String,
      enum:    ["SINGLE_DAY", "MULTI_DAY"],
      default: "SINGLE_DAY",
    },

    // Có cho phép khách thêm gói đi kèm (addon) khi đặt không
    allow_addon: { type: Boolean, default: false },

    // Thứ tự hiển thị — số nhỏ hơn ưu tiên trước
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Service", serviceSchema);
