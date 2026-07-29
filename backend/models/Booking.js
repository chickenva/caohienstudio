/**
 * Mongoose Schema: Booking (Đơn đặt lịch)
 * Chức năng: Lưu trữ toàn bộ thông tin về lịch chụp, dịch vụ, thợ chụp, trạng thái thanh toán và hợp đồng.
 */
const mongoose = require("mongoose");

// Schema lưu đơn đặt lịch, lịch chụp, trạng thái hợp đồng và tiền cọc.
const bookingSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    original_service_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],

    photographer_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    extra_service_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],

    assigned_staff_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    external_staff: [
      {
        full_name: { type: String },
        email: { type: String },
        phone: { type: String },
        role_note: { type: String },
      },
    ],

    resource_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
      },
    ],

    // ==========================================
    // LỊCH CHỤP THEO BUỔI
    // ==========================================

    // Hình thức chụp: tại studio hoặc ngoại cảnh
    shooting_type: {
      type: String,
      enum: ["STUDIO", "OUTDOOR"],
      default: null,
    },

    // Buổi chụp: sáng (08-12), chiều (13-17), cả ngày (08-17)
    shooting_session: {
      type: String,
      enum: ["MORNING", "AFTERNOON", "FULL_DAY"],
      default: null,
    },

    // ==========================================
    // THỜI GIAN
    // ==========================================

    start_time: {
      type: Date,
      required: true,
    },

    end_time: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    total_amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Tiền cọc: admin xác định khi chỉnh đơn. Mặc định 30% tổng tiền.
    deposit_percent: {
      type: Number,
      default: 30,
      min: 0,
      max: 100,
    },

    deposit_amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Trạng thái:
    // REQUESTED       — Khách gửi yêu cầu đặt lịch
    // CONTRACT_SENT   — Admin đã gửi hợp đồng cho khách
    // WAITING_PAYMENT — Khách xác nhận hợp đồng, chờ thanh toán VNPay
    // CONFIRMED       — Thanh toán VNPay thành công, lịch được giữ chính thức
    // IN_PROGRESS     — Admin bấm khi buổi chụp bắt đầu
    // COMPLETED       — Hoàn thành
    // CANCELED        — Đã hủy
    // PENDING / DEPOSITED — Giữ lại để tương thích dữ liệu cũ
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "CONTRACT_SENT",
        "WAITING_PAYMENT",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELED",
        // Legacy statuses (backward compatibility)
        "PENDING",
        "DEPOSITED",
      ],
      default: "REQUESTED",
    },

    expires_at: {
      type: Date,
      default: null,
    },

    note: {
      type: String,
      default: "",
    },

    // ==========================================
    // HỢP ĐỒNG
    // ==========================================

    // Token bảo mật để khách truy cập trang xem hợp đồng
    contract_token: {
      type: String,
      default: null,
    },

    // Thời điểm admin gửi hợp đồng
    contract_sent_at: {
      type: Date,
      default: null,
    },

    // Thời điểm khách xác nhận hợp đồng
    contract_confirmed_at: {
      type: Date,
      default: null,
    },

    // Ghi chú / điều khoản hợp đồng do admin soạn
    contract_note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);