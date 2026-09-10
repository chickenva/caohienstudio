/**
 * Mongoose Schema: CameraRental (Thiết bị cho thuê)
 * Lưu thông tin máy ảnh, ống kính, phụ kiện cho thuê.
 * Chỉ hiển thị thông tin trên website, khách liên hệ trực tiếp để thuê.
 */
const mongoose = require("mongoose");

const cameraRentalSchema = new mongoose.Schema(
  {
    // Tên thiết bị
    name: { type: String, required: true, trim: true },

    // Hãng sản xuất
    brand: { type: String, default: "", trim: true },

    // Phân loại thiết bị
    category: {
      type: String,
      enum: ["BODY", "LENS", "ACCESSORY", "KIT"],
      default: "BODY",
    },

    // Mô tả chi tiết
    description: { type: String, default: "" },

    // Thông số kỹ thuật
    specifications: [{ type: String }],

    // Giá thuê / ngày (VND)
    rental_price_per_day: { type: Number, required: true, min: 0 },

    // Tiền cọc yêu cầu (VND)
    deposit_amount: { type: Number, default: 0, min: 0 },

    // Danh sách ảnh sản phẩm
    images: [{ type: String }],

    // Ảnh thumbnail
    thumbnail: { type: String, default: "" },

    // Tình trạng thiết bị
    condition: {
      type: String,
      enum: ["NEW", "LIKE_NEW", "GOOD"],
      default: "LIKE_NEW",
    },

    // Có sẵn để cho thuê không
    is_available: { type: Boolean, default: true },

    // Admin bật/tắt hiển thị
    is_active: { type: Boolean, default: true },

    // Thứ tự hiển thị
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CameraRental", cameraRentalSchema);
