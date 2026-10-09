/**
 * Mongoose Schema: Holiday (Ngày lễ / Ngày nghỉ)
 * Cho phép Studio cấu hình:
 * 1. Ngày lễ quốc gia (2/9, 30/4, Tết...)
 * 2. Ngày nghỉ / sự kiện của studio (nghỉ định kỳ, teambuilding, kỷ niệm...)
 */
const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    // Tên ngày lễ / sự kiện
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Phân loại: NATIONAL (Lễ quốc gia) | STUDIO (Lễ/nghỉ studio) | OTHER
    type: {
      type: String,
      enum: ["NATIONAL", "STUDIO", "OTHER"],
      default: "NATIONAL",
      required: true,
    },

    // Ngày bắt đầu (định dạng chuẩn YYYY-MM-DD)
    start_date: {
      type: String,
      required: true,
      trim: true,
    },

    // Ngày kết thúc (định dạng chuẩn YYYY-MM-DD, có thể trùng start_date)
    end_date: {
      type: String,
      required: true,
      trim: true,
    },

    // Lặp lại hàng năm (dành cho các ngày lễ cố định như 02-09, 30-04, 01-01)
    is_recurring_yearly: {
      type: Boolean,
      default: false,
    },

    // Studio có tạm dừng nhận lịch (đóng cửa) vào ngày này không?
    is_closed: {
      type: Boolean,
      default: false,
    },

    // Màu sắc đại diện hiển thị trên lịch (mã HEX)
    color: {
      type: String,
      default: null,
    },

    // Ghi chú phụ thu nếu có (ví dụ: "Phụ thu 15% vào ngày lễ")
    surcharge_note: {
      type: String,
      default: "",
    },

    // Mô tả chi tiết
    description: {
      type: String,
      default: "",
    },

    // Trạng thái kích hoạt
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holiday", holidaySchema);
