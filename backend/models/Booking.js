/**
 * Mongoose Schema: Booking (Đơn đặt lịch)
 * Lưu toàn bộ thông tin lịch chụp: dịch vụ, thợ chụp, buổi chụp,
 * trạng thái, hợp đồng và tiền cọc.
 */
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Khách hàng đặt lịch
    customer_id: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    // Gói dịch vụ chính (sau khi admin chỉnh lại hoặc gộp)
    service_id: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Service",
      required: true,
    },

    // Danh sách gói gốc khách chọn khi đặt (trước khi admin chỉnh)
    original_service_ids: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    ],

    // Thợ chụp được phân công cho buổi chụp này
    photographer_ids: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],

    // Gói dịch vụ đi kèm (addon)
    extra_service_ids: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    ],

    // Nhân sự hỗ trợ nội bộ (ekip studio)
    assigned_staff_ids: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],

    // Nhân sự ngoài (freelancer, không có tài khoản hệ thống)
    external_staff: [
      {
        full_name: { type: String },
        email:     { type: String },
        phone:     { type: String },
        role_note: { type: String },
      },
    ],

    // Tài nguyên thiết bị sử dụng (chưa triển khai đầy đủ)
    resource_ids: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
    ],

    // ==========================================
    // LỊCH CHỤP THEO BUỔI
    // ==========================================

    // Hình thức chụp: tại studio hoặc ngoại cảnh
    shooting_type: {
      type:    String,
      enum:    ["STUDIO", "OUTDOOR"],
      default: null,
    },

    // Buổi chụp: sáng (08–12h), chiều (13–17h), hoặc cả ngày (08–17h)
    shooting_session: {
      type:    String,
      enum:    ["MORNING", "AFTERNOON", "FULL_DAY"],
      default: null,
    },

    // ==========================================
    // THỜI GIAN
    // ==========================================

    start_time: { type: Date, required: true },
    end_time:   { type: Date, required: true },

    location: {
      type:     String,
      required: true,
      trim:     true,
    },

    // Tổng giá trị đơn
    total_amount: {
      type:     Number,
      required: true,
      default:  0,
      min:      0,
    },

    // Tỉ lệ cọc (%) — mặc định 30%, admin có thể điều chỉnh
    deposit_percent: {
      type:    Number,
      default: 30,
      min:     0,
      max:     100,
    },

    // Số tiền cọc tuyệt đối (= total_amount * deposit_percent / 100)
    deposit_amount: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // Trạng thái đơn — luồng chính:
    //   REQUESTED       → Khách gửi yêu cầu đặt lịch
    //   CONTRACT_SENT   → Admin gửi hợp đồng cho khách
    //   WAITING_PAYMENT → Khách xác nhận hợp đồng, chờ thanh toán VNPay
    //   CONFIRMED       → Thanh toán cọc thành công, lịch được giữ chính thức
    //   IN_PROGRESS     → Admin bấm khi buổi chụp bắt đầu
    //   COMPLETED       → Hoàn thành toàn bộ
    //   CANCELED        → Đã hủy
    //   PENDING/DEPOSITED → Legacy, giữ lại để tương thích dữ liệu cũ
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
        "PENDING",   // legacy
        "DEPOSITED", // legacy
      ],
      default: "REQUESTED",
    },

    // Thời điểm hết hạn đơn (dùng cho legacy PENDING và WAITING_PAYMENT)
    expires_at: { type: Date, default: null },

    // Ghi chú từ khách hàng khi đặt lịch
    note: { type: String, default: "" },

    // ==========================================
    // HỢP ĐỒNG
    // ==========================================

    // Token bảo mật để khách truy cập trang xem hợp đồng mà không cần login
    contract_token: { type: String, default: null },

    // Thời điểm admin gửi hợp đồng
    contract_sent_at: { type: Date, default: null },

    // Thời điểm khách xác nhận hợp đồng
    contract_confirmed_at: { type: Date, default: null },

    // Điều khoản / ghi chú hợp đồng do admin soạn (thêm vào PDF)
    contract_note: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);