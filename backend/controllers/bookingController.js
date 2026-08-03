/**
 * bookingController.js
 * Xử lý toàn bộ luồng đặt lịch chụp của studio:
 *  - Customer: tạo yêu cầu đặt lịch, xem đơn, xác nhận hợp đồng, thanh toán VNPay.
 *  - Admin: tạo đơn hộ, gửi hợp đồng PDF, cập nhật trạng thái, phân công thợ, quản lý thanh toán.
 *
 * LUỒNG TRẠNG THÁI MỚI:
 *  REQUESTED → CONTRACT_SENT → WAITING_PAYMENT → CONFIRMED → IN_PROGRESS → COMPLETED
 *  Tại mọi bước đều có thể chuyển sang CANCELED (trừ COMPLETED).
 *
 * LUỒNG LEGACY (backward-compat): PENDING → DEPOSITED → CONFIRMED → COMPLETED | CANCELED
 */
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Payment = require("../models/Payment");
const User = require("../models/User");

const crypto = require("crypto");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const mailService = require("../services/mailService");
const { generateContractPdf, generateQrDataUrl } = require("../utils/contractPdf");


// Trạng thái hợp lệ trong luồng mới
const BOOKING_STATUSES = [
  "REQUESTED",
  "CONTRACT_SENT",
  "WAITING_PAYMENT",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
  // Legacy
  "PENDING",
  "DEPOSITED",
];

// Quy tắc chuyển trạng thái hợp lệ (admin dùng updateBookingStatus)
const VALID_TRANSITIONS = {
  REQUESTED: ["CONTRACT_SENT", "CANCELED"],
  CONTRACT_SENT: ["REQUESTED", "CANCELED"], // admin có thể thu hồi về REQUESTED để chỉnh lại
  WAITING_PAYMENT: ["CANCELED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELED: [],
  // Legacy
  PENDING: ["DEPOSITED", "CONFIRMED", "CANCELED"],
  DEPOSITED: ["CONFIRMED", "CANCELED"],
};


// ==========================================
// COMMON HELPERS
// ==========================================

// Lấy id user hiện tại từ token, hỗ trợ cả id và _id.
const getCurrentUserId = (req) => req.user?._id || req.user?.id;

// Tạo email tạm cho khách chưa có email khi admin tạo đơn hộ.
const generateGuestEmailFromPhone = (phone) => {
  const cleanPhone = String(phone || "")
    .replace(/\s/g, "")
    .replace(/[^\d]/g, "");

  return `guest_${cleanPhone || Date.now()}@caohienstudio.local`;
};

// Lấy tổng giá trị đơn, ưu tiên total_amount của booking, fallback sang giá service.
const getTotalAmount = (booking) => {
  const bookingTotal = Number(booking?.total_amount || 0);
  const servicePrice = Number(booking?.service_id?.base_price || 0);

  if (bookingTotal > 0) return bookingTotal;
  if (servicePrice > 0) return servicePrice;
  return 0;
};

// Tính text trạng thái thanh toán hiển thị cho customer.
const getPaymentStatusText = ({ booking, totalAmount, paidAmount }) => {
  const total = Number(totalAmount || 0);
  const paid = Number(paidAmount || 0);

  if (booking.status === "CANCELED") return "Chưa thanh toán";
  if (booking.status === "COMPLETED") return "Đã tất toán";
  if (paid <= 0) return "Chưa thanh toán";
  if (total > 0 && paid >= total) return "Đã tất toán";

  return "Đã thanh toán";
};

// Tính tổng tiền đã thanh toán, còn lại và payment gần nhất của 1 booking.
const buildBookingPaymentSummary = async (booking) => {
  const payments = await Payment.find({
    reference_id: booking._id,
    reference_type: "BOOKING",
  }).sort({ createdAt: -1 });

  const totalAmount = getTotalAmount(booking);

  const successPaidAmount = payments
    .filter((payment) => payment.status === "SUCCESS")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  // Đơn hoàn thành được xem là đã tất toán để hiển thị rõ ràng cho customer.
  const paidAmount =
    booking.status === "COMPLETED" && totalAmount > 0
      ? Math.max(successPaidAmount, totalAmount)
      : successPaidAmount;

  const remainingAmount = Math.max(totalAmount - paidAmount, 0);
  const latestPayment = payments[0] || null;

  return {
    payments,
    latest_payment: latestPayment,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    remaining_amount: remainingAmount,
    payment_status_text: getPaymentStatusText({
      booking,
      totalAmount,
      paidAmount,
    }),
  };
};

// Chuẩn hóa booking trả về frontend, kèm thông tin thanh toán tổng hợp.
const buildBookingResponse = async (booking, options = {}) => {
  const bookingObj =
    typeof booking.toObject === "function" ? booking.toObject() : booking;

  const paymentSummary = await buildBookingPaymentSummary(booking);

  const result = {
    ...bookingObj,
    total_amount: paymentSummary.total_amount,
    paid_amount: paymentSummary.paid_amount,
    remaining_amount: paymentSummary.remaining_amount,
    payment_status_text: paymentSummary.payment_status_text,
    latest_payment: paymentSummary.latest_payment,
  };

  if (options.includePayments) {
    result.payments = paymentSummary.payments;
  }

  return result;
};

// Chuyển các đơn PENDING quá hạn sang CANCELED và payment PENDING sang EXPIRED.
// (Chỉ dùng cho luồng legacy PENDING)
const markExpiredPendingBookings = async (customerId = null) => {
  const query = {
    status: "PENDING",
    $or: [
      { expires_at: { $lte: new Date() } },
      { expires_at: null },
      { expires_at: { $exists: false } },
    ],
  };

  if (customerId) {
    query.customer_id = customerId;
  }

  const expiredBookingIds = await Booking.find(query).distinct("_id");

  if (expiredBookingIds.length === 0) return;

  await Booking.updateMany(
    { _id: { $in: expiredBookingIds } },
    { status: "CANCELED" },
  );

  await Payment.updateMany(
    {
      reference_type: "BOOKING",
      reference_id: { $in: expiredBookingIds },
      status: "PENDING",
    },
    { status: "EXPIRED" },
  );
};

// ==========================================
// SESSION-BASED SCHEDULING HELPERS
// ==========================================

const STUDIO_LOCATION = "Cao Hiển Studio";

// Map buổi chụp sang giờ bắt đầu/kết thúc (giờ địa phương VN, UTC+7)
const SESSION_TIME_MAP = {
  MORNING: { startHour: 8, startMin: 0, endHour: 12, endMin: 0 },
  AFTERNOON: { startHour: 13, startMin: 0, endHour: 17, endMin: 0 },
  FULL_DAY: { startHour: 8, startMin: 0, endHour: 17, endMin: 0 },
};

// Các buổi bị trùng nhau theo logic conflict
const SESSION_CONFLICT_MAP = {
  MORNING: ["MORNING", "FULL_DAY"],
  AFTERNOON: ["AFTERNOON", "FULL_DAY"],
  FULL_DAY: ["MORNING", "AFTERNOON", "FULL_DAY"],
};

// Tính start_time và end_time cố định từ ngày chụp + buổi chụp (UTC)
const getSessionTimes = (shootDateStr, session) => {
  const times = SESSION_TIME_MAP[session];
  if (!times) throw new Error(`Buổi chụp không hợp lệ: ${session}`);
  // shootDateStr dạng YYYY-MM-DD (local VN), convert sang UTC (trừ 7 tiếng)
  // Dùng moment để parse đúng
  const startDate = moment.utc(shootDateStr).utcOffset(7, true)
    .hour(times.startHour).minute(times.startMin).second(0).millisecond(0)
    .utc().toDate();
  const endDate = moment.utc(shootDateStr).utcOffset(7, true)
    .hour(times.endHour).minute(times.endMin).second(0).millisecond(0)
    .utc().toDate();
  return { startDate, endDate };
};

// Trạng thái booking còn hiệu lực (chiếm lịch)
const ACTIVE_STATUSES_FOR_CONFLICT = [
  "REQUESTED",
  "CONTRACT_SENT",
  "WAITING_PAYMENT",
  "CONFIRMED",
  "IN_PROGRESS",
];

// Query dùng chung: chỉ các đơn chưa hủy/chưa hoàn thành mới chiếm lịch.
const activeStatusQuery = {
  $or: ACTIVE_STATUSES_FOR_CONFLICT.map(s => ({ status: s }))
};

// Kiểm tra trùng lịch STUDIO theo buổi
// Chỉ check đơn STUDIO cùng ngày có session conflict
const findStudioSessionConflict = async ({ shootDateStr, session, excludeBookingId }) => {
  const conflictSessions = SESSION_CONFLICT_MAP[session];
  if (!conflictSessions) return null;

  const query = {
    shooting_type: "STUDIO",
    shooting_session: { $in: conflictSessions },
    ...buildDateQuery(shootDateStr),
    ...activeStatusQuery,
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  return Booking.findOne(query).populate("service_id", "name");
};

// Kiểm tra trùng lịch OUTDOOR theo buổi
// Tạm thời: chỉ 1 ekip ngoại cảnh, cùng buổi cùng ngày là trùng
const findOutdoorSessionConflict = async ({ shootDateStr, session, excludeBookingId }) => {
  const conflictSessions = SESSION_CONFLICT_MAP[session];
  if (!conflictSessions) return null;

  const query = {
    shooting_type: "OUTDOOR",
    shooting_session: { $in: conflictSessions },
    ...buildDateQuery(shootDateStr),
    ...activeStatusQuery,
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  return Booking.findOne(query).populate("service_id", "name");
};

// Helper: build query theo ngày chụp (dựa vào start_time trong UTC)
const buildDateQuery = (shootDateStr) => {
  // shootDate là YYYY-MM-DD VN time → range UTC
  const dayStart = moment.utc(shootDateStr).utcOffset(7, true).startOf("day").utc().toDate();
  const dayEnd = moment.utc(shootDateStr).utcOffset(7, true).endOf("day").utc().toDate();
  return {
    start_time: { $gte: dayStart, $lte: dayEnd },
  };
};




// Tạo payload lỗi khi có xung đột lịch.
const sendConflictResponse = (res, conflictBooking, message) => {
  return res.status(409).json({
    message,
    conflict: {
      booking_id: conflictBooking._id,
      start_time: conflictBooking.start_time,
      end_time: conflictBooking.end_time,
      shooting_type: conflictBooking.shooting_type,
      shooting_session: conflictBooking.shooting_session,
      service: conflictBooking.service_id?.name,
    },
  });
};

// ==========================================
// VNPAY HELPERS
// ==========================================

// Sắp xếp object theo key và encode đúng định dạng VNPay.
function sortObject(obj) {
  const sorted = {};
  const keys = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      keys.push(encodeURIComponent(key));
    }
  }

  keys.sort();

  for (const encodedKey of keys) {
    sorted[encodedKey] = encodeURIComponent(obj[encodedKey]).replace(
      /%20/g,
      "+",
    );
  }

  return sorted;
}

// Tạo link thanh toán VNPay từ payment PENDING.
const generateVnpayUrl = (req, payment) => {
  const tmnCode = process.env.VNPAY_TMN_CODE || process.env.VNP_TMNCODE;
  const secretKey = process.env.VNPAY_SECRET_KEY || process.env.VNP_HASHSECRET;
  const vnpUrl =
    process.env.VNPAY_URL ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = process.env.VNPAY_RETURN_URL;

  let vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: payment._id.toString(),
    vnp_OrderInfo: `Thanh toan don dat lich ${payment.reference_id}`,
    vnp_OrderType: "other",
    vnp_Amount: payment.amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr:
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1",
    vnp_CreateDate: moment(new Date()).format("YYYYMMDDHHmmss"),
  };

  if (payment.expires_at) {
    vnpParams.vnp_ExpireDate = moment(payment.expires_at).format(
      "YYYYMMDDHHmmss",
    );
  }

  vnpParams = sortObject(vnpParams);

  const signData = Object.keys(vnpParams)
    .map((key) => `${key}=${vnpParams[key]}`)
    .join("&");

  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnpParams.vnp_SecureHash = signed;

  return `${vnpUrl}?${Object.keys(vnpParams)
    .map((key) => `${key}=${vnpParams[key]}`)
    .join("&")}`;
};

// Xác thực chữ ký VNPay trả về.
const verifyVnpaySignature = (params, secureHash) => {
  const secretKey = process.env.VNPAY_SECRET_KEY || process.env.VNP_HASHSECRET;
  const sortedParams = sortObject(params);

  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join("&");

  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return {
    isValid: secureHash === signed,
    sortedParams,
  };
};

// ==========================================
// CUSTOMER FUNCTIONS — LUỒNG MỚI
// ==========================================

// Customer gửi yêu cầu đặt lịch theo buổi (MORNING/AFTERNOON/FULL_DAY).
// Booking được tạo trạng thái REQUESTED, admin sẽ xử lý sau.
exports.createBookingRequest = async (req, res) => {
  try {
    // Guard: admin không được tạo đơn qua luồng khách hàng
    if (req.user?.role === "ADMIN") {
      return res.status(403).json({
        message:
          "Tài khoản quản trị không thể đặt lịch qua luồng khách hàng. Vui lòng dùng chức năng 'Tạo đơn đặt hộ' trong trang quản lý.",
        code: "ADMIN_NOT_ALLOWED",
      });
    }

    const {
      service_id,
      original_service_ids,
      extra_service_ids,
      shoot_date,       // YYYY-MM-DD (VN time)
      shooting_type,    // "STUDIO" | "OUTDOOR"
      shooting_session, // "MORNING" | "AFTERNOON" | "FULL_DAY"
      location,
      note,
    } = req.body;

    // Validate bắt buộc
    if (!service_id) {
      return res.status(400).json({ message: "Thiếu gói dịch vụ" });
    }
    if (!shoot_date) {
      return res.status(400).json({ message: "Thiếu ngày chụp (shoot_date)" });
    }
    if (!shooting_type || !["STUDIO", "OUTDOOR"].includes(shooting_type)) {
      return res.status(400).json({ message: "Hình thức chụp không hợp lệ. Chọn STUDIO hoặc OUTDOOR." });
    }
    if (!shooting_session || !["MORNING", "AFTERNOON", "FULL_DAY"].includes(shooting_session)) {
      return res.status(400).json({ message: "Buổi chụp không hợp lệ. Chọn MORNING, AFTERNOON hoặc FULL_DAY." });
    }
    if (shooting_type === "OUTDOOR" && !location) {
      return res.status(400).json({ message: "Vui lòng nhập địa điểm chụp ngoại cảnh." });
    }

    const customerId = getCurrentUserId(req);

    // Kiểm tra đơn đang xử lý
    const activeBooking = await Booking.findOne({
      customer_id: customerId,
      status: { $in: ["REQUESTED", "CONTRACT_SENT", "WAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS", "PENDING", "DEPOSITED"] },
    });

    if (activeBooking) {
      return res.status(400).json({
        message: `Bạn đang có một đơn đặt lịch (mã: #${activeBooking._id.toString().slice(-6).toUpperCase()}) đang được xử lý. Vui lòng hoàn thành hoặc hủy đơn cũ trước khi đặt lịch mới.`,
        code: "HAS_PENDING_BOOKING",
        booking_id: activeBooking._id,
      });
    }

    const service = await Service.findById(service_id); ``
    if (!service || !service.is_active) {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ hoặc gói đã ngừng cung cấp" });
    }

    // Validate gói đi kèm
    let validatedAddonIds = [];
    let addonTotalPrice = 0;

    if (extra_service_ids && Array.isArray(extra_service_ids) && extra_service_ids.length > 0) {
      const addonServices = await Service.find({
        _id: { $in: extra_service_ids },
        is_active: true,
      });

      if (addonServices.length !== extra_service_ids.length) {
        return res.status(400).json({ message: "Một hoặc nhiều gói đi kèm không hợp lệ" });
      }

      validatedAddonIds = addonServices.map((s) => s._id);
      addonTotalPrice = addonServices.reduce((sum, s) => sum + Number(s.base_price || 0), 0);
    }

    // Tính start_time/end_time từ ngày + buổi chụp
    let startDate, endDate;
    try {
      const times = getSessionTimes(shoot_date, shooting_session);
      startDate = times.startDate;
      endDate = times.endDate;
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    // Kiểm tra ngày không trong quá khứ
    if (startDate < new Date()) {
      return res.status(400).json({ message: "Không thể đặt lịch trong quá khứ" });
    }

    // Kiểm tra trùng lịch theo type
    if (shooting_type === "STUDIO") {
      const conflict = await findStudioSessionConflict({ shootDateStr: shoot_date, session: shooting_session });
      if (conflict) {
        return sendConflictResponse(res, conflict,
          `Studio đã có lịch buổi ${shooting_session === "MORNING" ? "sáng" : shooting_session === "AFTERNOON" ? "chiều" : "cả ngày"} trong ngày này.`);
      }
    } else if (shooting_type === "OUTDOOR") {
      const conflict = await findOutdoorSessionConflict({ shootDateStr: shoot_date, session: shooting_session });
      if (conflict) {
        return sendConflictResponse(res, conflict,
          `Ekip ngoại cảnh đã có lịch buổi ${shooting_session === "MORNING" ? "sáng" : shooting_session === "AFTERNOON" ? "chiều" : "cả ngày"} trong ngày này.`);
      }
    }

    const totalAmount = Number(service.base_price || 0) + addonTotalPrice;
    const depositPercent = 30;
    const depositAmount = Math.round((totalAmount * depositPercent) / 100);
    const finalLocation = shooting_type === "STUDIO" ? STUDIO_LOCATION : location;

    const newBooking = new Booking({
      customer_id: customerId,
      service_id: service._id,
      original_service_ids: original_service_ids || [service._id],
      extra_service_ids: validatedAddonIds,
      shooting_type,
      shooting_session,
      start_time: startDate,
      end_time: endDate,
      location: finalLocation,
      note,
      total_amount: totalAmount,
      deposit_percent: depositPercent,
      deposit_amount: depositAmount,
      status: "REQUESTED",
    });

    const booking = await newBooking.save();

    return res.status(201).json({
      message: "Yêu cầu đặt lịch đã được gửi thành công. Studio sẽ kiểm tra và gửi hợp đồng xác nhận.",
      booking_id: booking._id,
      status: booking.status,
    });
  } catch (error) {
    console.error("Create booking request error:", error);
    return res.status(500).json({
      message: "Lỗi khởi tạo yêu cầu đặt lịch",
      error: error.message,
    });
  }
};

// Customer lấy toàn bộ đơn của chính mình.
exports.getMyBookings = async (req, res) => {
  try {
    const customerId = getCurrentUserId(req);

    // Vẫn xử lý PENDING cũ để backward-compatible
    await markExpiredPendingBookings(customerId);

    const bookings = await Booking.find({ customer_id: customerId })
      .populate("original_service_ids", "name base_price duration_hours").populate("service_id", "name thumbnail base_price duration_hours")
      .populate("extra_service_ids", "name base_price")
      .sort({ createdAt: -1 });

    const result = await Promise.all(
      bookings.map((booking) => buildBookingResponse(booking)),
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách đơn",
      error: error.message,
    });
  }
};

// Customer xem chi tiết một đơn của chính mình.
exports.getBookingDetail = async (req, res) => {
  try {
    const customerId = getCurrentUserId(req);

    await markExpiredPendingBookings(customerId);

    const booking = await Booking.findOne({
      _id: req.params.id,
      customer_id: customerId,
    })
      .populate("original_service_ids", "name base_price duration_hours").populate("service_id", "name thumbnail base_price duration_hours")
      .populate("extra_service_ids", "name base_price");

    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy đơn đặt lịch",
      });
    }

    const result = await buildBookingResponse(booking, {
      includePayments: true,
    });

    return res.status(200).json({
      booking: result,
      payments: result.payments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy chi tiết đơn",
      error: error.message,
    });
  }
};

// Customer kiểm tra nhanh trạng thái đơn/thanh toán.
exports.checkPaymentStatus = async (req, res) => {
  try {
    const customerId = getCurrentUserId(req);

    await markExpiredPendingBookings(customerId);

    const booking = await Booking.findOne({
      _id: req.params.id,
      customer_id: customerId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy đơn đặt lịch",
      });
    }

    const result = await buildBookingResponse(booking);

    return res.status(200).json({
      status: result.status,
      payment_status: result.latest_payment?.status || "PENDING",
      payment_status_text: result.payment_status_text,
      total_amount: result.total_amount,
      paid_amount: result.paid_amount,
      remaining_amount: result.remaining_amount,
      expires_at: result.expires_at,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy trạng thái thanh toán",
      error: error.message,
    });
  }
};

// Customer tạo lại link thanh toán nếu đơn còn PENDING và chưa quá hạn (legacy).
exports.repayBooking = async (req, res) => {
  try {
    if (req.user?.role === "ADMIN") {
      return res.status(403).json({
        message: "Tài khoản quản trị không thể sử dụng chức năng này.",
        code: "ADMIN_NOT_ALLOWED",
      });
    }

    const customerId = getCurrentUserId(req);

    await markExpiredPendingBookings(customerId);

    const booking = await Booking.findOne({
      _id: req.params.id,
      customer_id: customerId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy đơn đặt lịch",
      });
    }

    // Luong moi: WAITING_PAYMENT co the lay lai link VNPay hoac tao giao dich moi.
    if (booking.status === "WAITING_PAYMENT") {
      const activePayment = await Payment.findOne({
        reference_id: booking._id,
        reference_type: "BOOKING",
        status: "PENDING",
      }).sort({ createdAt: -1 });

      if (activePayment && (!activePayment.expires_at || activePayment.expires_at > new Date())) {
        const paymentUrl = generateVnpayUrl(req, activePayment);
        return res.status(200).json({ paymentUrl, expires_at: activePayment.expires_at });
      }

      if (activePayment) {
        activePayment.status = "EXPIRED";
        await activePayment.save();
      }

      const totalAmount = getTotalAmount(booking);
      const depositAmount = booking.deposit_amount > 0
        ? booking.deposit_amount
        : Math.round((totalAmount * (booking.deposit_percent || 30)) / 100);

      if (depositAmount <= 0) {
        return res.status(400).json({ message: "So tien coc khong hop le" });
      }

      const expiresAt = moment().add(24, "hours").toDate();
      booking.expires_at = expiresAt;
      await booking.save();

      const payment = await Payment.create({
        reference_id: booking._id,
        reference_type: "BOOKING",
        amount: depositAmount,
        payment_method: "VNPAY",
        payment_type: "DEPOSIT",
        status: "PENDING",
        expires_at: expiresAt,
      });

      const paymentUrl = generateVnpayUrl(req, payment);
      return res.status(200).json({ paymentUrl, expires_at: expiresAt });
    }

    // Legacy PENDING flow
    if (booking.status !== "PENDING") {
      return res.status(400).json({
        message: "Đơn hàng này không ở trạng thái chờ thanh toán",
      });
    }

    if (!booking.expires_at || booking.expires_at <= new Date()) {
      booking.status = "CANCELED";
      await booking.save();

      await Payment.updateMany(
        {
          reference_id: booking._id,
          reference_type: "BOOKING",
          status: "PENDING",
        },
        { status: "EXPIRED" },
      );

      return res.status(400).json({
        message: "Đơn hàng đã quá hạn thanh toán, vui lòng đặt lịch lại",
      });
    }

    const payment = await Payment.findOne({
      reference_id: booking._id,
      reference_type: "BOOKING",
      status: "PENDING",
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(400).json({
        message: "Không tìm thấy giao dịch chờ thanh toán",
      });
    }

    const paymentUrl = generateVnpayUrl(req, payment);

    return res.status(200).json({
      paymentUrl,
      expires_at: booking.expires_at,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi tạo lại link thanh toán",
      error: error.message,
    });
  }
};

// Customer hủy đơn nếu đơn còn REQUESTED hoặc CONTRACT_SENT (trước khi xác nhận hợp đồng).
exports.cancelMyBooking = async (req, res) => {
  try {
    if (req.user?.role === "ADMIN") {
      return res.status(403).json({
        message: "Tài khoản quản trị không thể hủy đơn qua luồng khách hàng.",
        code: "ADMIN_NOT_ALLOWED",
      });
    }

    const customerId = getCurrentUserId(req);

    const booking = await Booking.findOne({
      _id: req.params.id,
      customer_id: customerId,
    })
      .populate("original_service_ids", "name base_price duration_hours").populate("service_id", "name thumbnail base_price duration_hours")
      .populate("assigned_staff_ids", "full_name phone email");

    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy đơn đặt lịch",
      });
    }

    const cancelableStatuses = ["REQUESTED", "CONTRACT_SENT", "PENDING"];

    if (!cancelableStatuses.includes(booking.status)) {
      return res.status(400).json({
        message: "Chỉ có thể hủy đơn đang ở trạng thái chờ xử lý hoặc đã gửi hợp đồng",
      });
    }

    booking.status = "CANCELED";
    await booking.save();

    // Hủy payment nếu có
    await Payment.updateMany(
      {
        reference_id: booking._id,
        reference_type: "BOOKING",
        status: "PENDING",
      },
      { status: "FAILED" },
    );

    const result = await buildBookingResponse(booking, {
      includePayments: true,
    });

    return res.status(200).json({
      message: "Hủy đơn đặt lịch thành công",
      booking: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi hủy đơn đặt lịch",
      error: error.message,
    });
  }
};

// ==========================================
// HỢP ĐỒNG — CONTRACT
// ==========================================

// Admin gửi hợp đồng cho khách. Tạo contract_token, sinh PDF + QR, chuyển booking sang CONTRACT_SENT.
exports.sendContract = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price duration_hours").populate("service_id", "name base_price duration_hours")
      .populate("extra_service_ids", "name base_price")
      .populate("customer_id", "full_name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    }

    if (!["REQUESTED", "CONTRACT_SENT"].includes(booking.status)) {
      return res.status(400).json({
        message: `Không thể gửi hợp đồng cho đơn có trạng thái "${booking.status}". Chỉ có thể gửi khi đơn ở trạng thái REQUESTED hoặc CONTRACT_SENT.`,
      });
    }

    if (!booking.shooting_type || !booking.shooting_session) {
      return res.status(400).json({
        message: "Đơn chưa có hình thức chụp hoặc buổi chụp. Vui lòng cập nhật lịch theo ngày + buổi trước khi gửi hợp đồng.",
      });
    }

    const shootDateStr = moment(booking.start_time).utcOffset(7).format("YYYY-MM-DD");
    const scheduleConflict = booking.shooting_type === "STUDIO"
      ? await findStudioSessionConflict({
        shootDateStr,
        session: booking.shooting_session,
        excludeBookingId: booking._id,
      })
      : await findOutdoorSessionConflict({
        shootDateStr,
        session: booking.shooting_session,
        excludeBookingId: booking._id,
      });

    if (scheduleConflict) {
      const conflictMessage = booking.shooting_type === "STUDIO"
        ? "Studio đã có lịch trong buổi này. Vui lòng đổi ngày hoặc buổi chụp trước khi gửi hợp đồng."
        : "Ekip ngoại cảnh đã có lịch trong buổi này. Vui lòng đổi ngày hoặc buổi chụp trước khi gửi hợp đồng.";
      return sendConflictResponse(res, scheduleConflict, conflictMessage);
    }
    // Tạo token bảo mật ngẫu nhiên
    const contractToken = crypto.randomBytes(32).toString("hex");

    booking.contract_token = contractToken;
    booking.contract_sent_at = new Date();
    booking.status = "CONTRACT_SENT";
    await booking.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const contractLink = `${frontendUrl}/contract-review/${booking._id}?token=${contractToken}`;

    // Sinh QR code (data URL để embed trong response)
    const qrCodeDataUrl = await generateQrDataUrl(contractLink);

    // Sinh PDF hợp đồng
    let pdfUrl = null;
    try {
      const { fileName } = await generateContractPdf(booking, contractLink);
      pdfUrl = `${backendUrl}/public/contracts/${fileName}`;
    } catch (pdfErr) {
      // Không để lỗi PDF làm fail toàn bộ request
      console.error("[sendContract] Lỗi sinh PDF:", pdfErr.message);
    }

    await mailService.sendContractEmail(booking, booking.customer_id, {
      contractLink,
      pdfUrl,
    });

    return res.status(200).json({
      message: "Đã gửi hợp đồng thành công",
      contract_link: contractLink,
      contract_token: contractToken,
      qr_code: qrCodeDataUrl,
      pdf_url: pdfUrl,
      booking_id: booking._id,
    });
  } catch (error) {
    console.error("Send contract error:", error);
    return res.status(500).json({
      message: "Lỗi gửi hợp đồng",
      error: error.message,
    });
  }
};

// Public/Customer xem hợp đồng bằng token. Không cần đăng nhập.
exports.getContractByToken = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Thiếu token xác thực hợp đồng" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      contract_token: token,
    })
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price duration_hours").populate("service_id", "name thumbnail base_price duration_hours")
      .populate("extra_service_ids", "name base_price")
      .populate("assigned_staff_ids", "full_name phone email");

    if (!booking) {
      return res.status(404).json({ message: "Hợp đồng không tồn tại hoặc link đã hết hạn" });
    }

    if (booking.status === "CANCELED") {
      return res.status(400).json({ message: "Đơn đặt lịch này đã bị hủy" });
    }

    const bookingObj = booking.toObject();

    // Che giấu token trong response
    delete bookingObj.contract_token;

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const pdfUrl = `${backendUrl}/public/contracts/contract_${booking._id}.pdf`;

    return res.status(200).json({
      booking: bookingObj,
      pdf_url: pdfUrl,
      already_confirmed: ["WAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status),
    });
  } catch (error) {
    console.error("Get contract by token error:", error);
    return res.status(500).json({
      message: "Lỗi lấy thông tin hợp đồng",
      error: error.message,
    });
  }
};

// Khách xác nhận hợp đồng. Chuyển booking sang WAITING_PAYMENT, tạo Payment và VNPay URL.
exports.confirmContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Thiếu token xác thực hợp đồng" });
    }

    const booking = await Booking.findOne({
      _id: id,
      contract_token: token,
    })
      .populate("customer_id")
      .populate("original_service_ids", "name base_price duration_hours").populate("service_id", "name")
      .populate("extra_service_ids", "name");

    if (!booking) {
      return res.status(404).json({ message: "Hợp đồng không tồn tại hoặc token không đúng" });
    }

    if (booking.status === "CANCELED") {
      return res.status(400).json({ message: "Đơn đặt lịch này đã bị hủy" });
    }

    // Nếu đã xác nhận trước đó → trả lại paymentUrl nếu còn Payment PENDING
    // Neu da thanh toan thanh cong truoc do thi khong tao giao dich moi.
    if (booking.status === "CONFIRMED") {
      return res.status(200).json({
        message: "Hop dong da duoc xac nhan va thanh toan thanh cong truoc do",
        already_paid: true,
        booking_status: booking.status,
      });
    }

    // WAITING_PAYMENT: tra lai giao dich PENDING con han; neu khong co thi tao giao dich moi ben duoi.
    if (booking.status === "WAITING_PAYMENT") {
      const existingPayment = await Payment.findOne({
        reference_id: booking._id,
        reference_type: "BOOKING",
        status: "PENDING",
      }).sort({ createdAt: -1 });

      if (existingPayment && (!existingPayment.expires_at || existingPayment.expires_at > new Date())) {
        const paymentUrl = generateVnpayUrl(req, existingPayment);
        return res.status(200).json({
          message: "Hop dong da duoc xac nhan truoc do, day la link thanh toan",
          already_confirmed: true,
          paymentUrl,
        });
      }

      if (existingPayment) {
        existingPayment.status = "EXPIRED";
        await existingPayment.save();
      }
    }

    if (!["CONTRACT_SENT", "WAITING_PAYMENT"].includes(booking.status)) {
      return res.status(400).json({
        message: `Không thể xác nhận hợp đồng ở trạng thái hiện tại (${booking.status})`,
      });
    }

    // Lấy số tiền cọc (admin đã xác định, mặc định 30%)
    const totalAmount = getTotalAmount(booking);
    const depositAmount = booking.deposit_amount > 0
      ? booking.deposit_amount
      : Math.round((totalAmount * (booking.deposit_percent || 30)) / 100);

    if (depositAmount <= 0) {
      return res.status(400).json({ message: "Số tiền cọc không hợp lệ" });
    }

    // Hạn thanh toán: 24 giờ kể từ khi khách xác nhận
    const expiresAt = moment().add(24, "hours").toDate();

    // Chuyển booking sang WAITING_PAYMENT
    booking.status = "WAITING_PAYMENT";
    booking.contract_confirmed_at = booking.contract_confirmed_at || new Date();
    booking.deposit_amount = depositAmount;
    booking.expires_at = expiresAt;
    await booking.save();

    // Tạo Payment PENDING
    const payment = await Payment.create({
      reference_id: booking._id,
      reference_type: "BOOKING",
      amount: depositAmount,
      payment_method: "VNPAY",
      payment_type: "DEPOSIT",
      status: "PENDING",
      expires_at: expiresAt,
    });

    const paymentUrl = generateVnpayUrl(req, payment);

    return res.status(200).json({
      message: "Xác nhận hợp đồng thành công. Vui lòng thanh toán để giữ lịch.",
      paymentUrl,
      deposit_amount: depositAmount,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error("Confirm contract error:", error);
    return res.status(500).json({
      message: "Lỗi xác nhận hợp đồng",
      error: error.message,
    });
  }
};

// VNPay return: xác thực chữ ký và cập nhật payment/booking sau khi VNPay trả về.
exports.vnpayReturn = async (req, res) => {
  try {
    const rawParams = {
      ...(req.method === "GET" ? req.query : req.body),
    };

    const secureHash = rawParams.vnp_SecureHash;

    delete rawParams.vnp_SecureHash;
    delete rawParams.vnp_SecureHashType;

    const { isValid, sortedParams } = verifyVnpaySignature(
      rawParams,
      secureHash,
    );

    if (!isValid) {
      return res.status(400).json({
        message: "Sai chữ ký xác thực (Invalid Signature) - Phát hiện giả mạo!",
      });
    }

    const paymentId = sortedParams.vnp_TxnRef;
    const responseCode = sortedParams.vnp_ResponseCode;
    const transactionStatus = sortedParams.vnp_TransactionStatus;
    const transactionNo = sortedParams.vnp_TransactionNo;
    const payDateString = sortedParams.vnp_PayDate;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        message: "Không tìm thấy giao dịch",
      });
    }

    const booking = await Booking.findById(payment.reference_id)
      .populate("customer_id")
      .populate("original_service_ids", "name base_price duration_hours").populate("service_id", "name")
      .populate("extra_service_ids", "name");

    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy đơn đặt lịch",
      });
    }

    const isSuccess =
      responseCode === "00" &&
      (!transactionStatus || transactionStatus === "00");

    // Thanh toán thành công.
    if (isSuccess) {
      const paidAt = payDateString
        ? moment(payDateString, "YYYYMMDDHHmmss").toDate()
        : new Date();

      if (payment.status === "SUCCESS") {
        return res.status(200).json({
          message: "Giao dịch đã được xử lý thành công trước đó",
          code: "00",
          booking_id: booking._id,
        });
      }

      if (payment.status === "FAILED") {
        return res.status(400).json({
          message: "Giao dịch này đã bị hủy hoặc thất bại trước đó",
          code: "PAYMENT_ALREADY_FAILED",
          booking_id: booking._id,
        });
      }

      // Nếu đơn đã bị hủy thủ công trước đó thì không mở lại đơn.
      if (booking.status === "CANCELED") {
        return res.status(400).json({
          message: "Đơn đặt lịch đã bị hủy trước đó",
          code: "BOOKING_CANCELED",
          booking_id: booking._id,
        });
      }

      payment.status = "SUCCESS";
      payment.transaction_id = transactionNo;
      payment.paid_at = paidAt;
      await payment.save();

      // Luồng mới: thanh toán xong → CONFIRMED (không phải DEPOSITED)
      if (["WAITING_PAYMENT", "PENDING"].includes(booking.status)) {
        booking.status = "CONFIRMED";
        await booking.save();
      }

      // Gửi email xác nhận booking
      await mailService.sendBookingSuccessEmail(booking, booking.customer_id);
      await mailService.sendBookingSuccessToAdminEmail(booking, booking.customer_id);

      return res.status(200).json({
        message: "Giao dịch thành công, đã xác nhận đơn đặt lịch",
        code: "00",
        booking_id: booking._id,
      });
    }

    // Thanh toán thất bại hoặc khách bấm hủy trên VNPay.
    if (payment.status === "SUCCESS") {
      return res.status(200).json({
        message: "Giao dịch đã thành công trước đó, không cập nhật thất bại",
        code: "00",
        booking_id: booking._id,
      });
    }

    payment.status = "FAILED";
    payment.transaction_id = transactionNo;
    await payment.save();

    // Neu thanh toan that bai, giu WAITING_PAYMENT de khach co the tao lai link thanh toan.
    if (booking.status === "WAITING_PAYMENT") {
      booking.expires_at = null;
      await booking.save();
    } else if (booking.status === "PENDING") {
      booking.status = "CANCELED";
      await booking.save();
    }

    return res.status(400).json({
      message: "Giao dịch thất bại hoặc bị hủy",
      code: responseCode,
      booking_id: booking._id,
    });
  } catch (error) {
    console.error("VNPay return error:", error);

    return res.status(500).json({
      message: "Lỗi xử lý kết quả VNPay",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

// Admin tạo đơn đặt lịch hộ khách hàng, có thể chọn khách cũ hoặc tạo khách tạm.
exports.createBookingForAdmin = async (req, res) => {
  try {
    const {
      customer_id,
      service_id,
      original_service_ids,
      extra_service_ids,
      assigned_staff_ids,
      external_staff,
      // Session-based fields (mới)
      shoot_date,
      shooting_type,
      shooting_session,
      location,
      note,
      total_amount,
      paid_amount,
      status,
      start_time,
      end_time,
    } = req.body;

    // Phần decode customer từ body
    const {
      customer_full_name,
      customer_email,
      customer_phone,
    } = req.body;

    const effectiveShootDate = shoot_date || (start_time ? moment(start_time).utcOffset(7).format("YYYY-MM-DD") : null);
    const effectiveShootingType = shooting_type || "STUDIO";
    const effectiveShootingSession = shooting_session || (start_time && moment(start_time).utcOffset(7).hour() >= 12 ? "AFTERNOON" : "MORNING");

    if (!service_id) {
      return res.status(400).json({ message: "Vui lòng chọn gói dịch vụ" });
    }
    if (!effectiveShootDate) {
      return res.status(400).json({ message: "Vui lòng chọn ngày chụp (shoot_date)" });
    }
    if (!["STUDIO", "OUTDOOR"].includes(effectiveShootingType)) {
      return res.status(400).json({ message: "Hình thức chụp không hợp lệ" });
    }
    if (!["MORNING", "AFTERNOON", "FULL_DAY"].includes(effectiveShootingSession)) {
      return res.status(400).json({ message: "Buổi chụp không hợp lệ" });
    }
    if (effectiveShootingType === "OUTDOOR" && !location) {
      return res.status(400).json({ message: "Vui lòng nhập địa điểm chụp ngoại cảnh" });
    }

    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
    }

    // Tính start/end từ ngày + buổi
    try {
      const times = getSessionTimes(shoot_date, shooting_session);
      startDate = times.startDate;
      endDate = times.endDate;
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    await markExpiredPendingBookings();

    // Kiểm tra trùng lịch theo type
    if (shooting_type === "STUDIO") {
      const conflict = await findStudioSessionConflict({ shootDateStr: shoot_date, session: shooting_session });
      if (conflict) {
        return sendConflictResponse(res, conflict, "Studio đã có lịch buổi này.");
      }
    } else {
      const conflict = await findOutdoorSessionConflict({ shootDateStr: shoot_date, session: shooting_session });
      if (conflict) {
        return sendConflictResponse(res, conflict, "Ekip ngoại cảnh đã có lịch buổi này.");
      }
    }




    let customer = null;

    // Admin chọn customer có sẵn.
    if (customer_id) {
      customer = await User.findOne({ _id: customer_id, role: "CUSTOMER" });
      if (!customer) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản khách hàng đã chọn" });
      }
    } else {
      const normalizedEmail = customer_email?.trim()?.toLowerCase();
      const normalizedPhone = customer_phone?.trim();

      if (!customer_full_name || (!normalizedEmail && !normalizedPhone)) {
        return res.status(400).json({
          message: "Vui lòng nhập họ tên và ít nhất email hoặc số điện thoại khách hàng",
        });
      }

      const existedUser = await User.findOne({
        $or: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      });

      if (existedUser) {
        if (existedUser.role !== "CUSTOMER") {
          return res.status(400).json({
            message: "Email hoặc số điện thoại này đang thuộc tài khoản không phải khách hàng",
          });
        }
        customer = existedUser;
      } else {
        const generatedPassword = crypto.randomBytes(8).toString("hex");
        const password_hash = await bcrypt.hash(generatedPassword, 10);
        const finalEmail = normalizedEmail || generateGuestEmailFromPhone(normalizedPhone);
        customer = await User.create({
          full_name: customer_full_name,
          email: finalEmail,
          phone: normalizedPhone,
          password_hash,
          role: "CUSTOMER",
          is_active: true,
        });
      }
    }

    const activeBooking = await Booking.findOne({
      customer_id: customer._id,
      status: { $in: ["REQUESTED", "CONTRACT_SENT", "WAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS", "PENDING", "DEPOSITED"] },
    });

    if (activeBooking) {
      return res.status(400).json({
        message: `Khách hàng đang có đơn hàng (mã: #${activeBooking._id.toString().slice(-6).toUpperCase()}) chưa hoàn thành. Vui lòng xử lý đơn đó trước.`,
        code: "HAS_PENDING_BOOKING",
        booking_id: activeBooking._id,
      });
    }

    const finalTotalAmount = total_amount !== undefined && total_amount !== null
      ? Number(total_amount)
      : Number(service.base_price || 0);

    if (finalTotalAmount < 0) {
      return res.status(400).json({ message: "Tổng tiền không hợp lệ" });
    }

    const depositPercent = 30;
    const depositAmount = paid_amount !== undefined && paid_amount !== null
      ? Number(paid_amount)
      : Math.round(finalTotalAmount * depositPercent / 100);

    const finalLocation = location || (effectiveShootingType === "STUDIO" ? STUDIO_LOCATION : "");
    const targetStatus = ["REQUESTED", "CONFIRMED"].includes(status) ? status : "REQUESTED";
    const isConfirmed = targetStatus === "CONFIRMED";
    const contractToken = isConfirmed ? crypto.randomBytes(32).toString("hex") : undefined;

    const bookingPayload = {
      customer_id: customer._id,
      service_id: service._id,
      original_service_ids: original_service_ids || [service._id],
      assigned_staff_ids: assigned_staff_ids || [],
      extra_service_ids: extra_service_ids || [],
      external_staff: external_staff || [],
      shooting_type: effectiveShootingType,
      shooting_session: effectiveShootingSession,
      start_time: startDate,
      end_time: endDate,
      location: finalLocation,
      note,
      total_amount: finalTotalAmount,
      deposit_percent: depositPercent,
      deposit_amount: depositAmount,
      status: targetStatus,
      ...(isConfirmed ? {
        contract_token: contractToken,
        contract_sent_at: new Date(),
        contract_confirmed_at: new Date(),
      } : {}),
    };

    const booking = await Booking.create(bookingPayload);
    let payment = null;

    if (isConfirmed) {
      payment = await Payment.create({
        reference_id: booking._id,
        reference_type: "BOOKING",
        customer_id: customer._id,
        amount: depositAmount,
        payment_method: "MANUAL",
        status: "SUCCESS",
        paid_at: new Date(),
      });

      // Tạo PDF hợp đồng tự động cho đơn đã CONFIRMED
      try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const contractLink = `${frontendUrl}/contract-review/${booking._id}?token=${contractToken}`;
        await generateContractPdf(booking, contractLink);
      } catch (pdfErr) {
        console.error("[createBookingForAdmin] Lỗi sinh PDF:", pdfErr.message);
      }
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price").populate("service_id", "name thumbnail base_price")
      .populate("extra_service_ids", "name base_price")
      .populate("assigned_staff_ids", "full_name email phone");

    return res.status(201).json({
      message: "Admin tạo đơn đặt lịch thành công",
      booking: populatedBooking,
      payment,
      customer,
    });
  } catch (error) {
    console.error("Admin create booking error:", error);
    return res.status(500).json({
      message: "Lỗi tạo đơn đặt hộ",
      error: error.message,
    });
  }
};

// Admin cập nhật thông tin đơn đặt lịch (trước khi gửi hợp đồng).
// Cho phép sửa: dịch vụ, ngày + buổi chụp, địa điểm, tổng tiền, tiền cọc, ghi chú, nhân sự.
exports.updateBookingInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      service_ids,
      service_id, // backward compat
      extra_service_ids,
      assigned_staff_ids,
      external_staff,
      // Session-based fields (mới)
      shoot_date,
      shooting_type,
      shooting_session,
      location,
      note,
      total_amount,
      deposit_amount,
      contract_note,
    } = req.body;

    const booking = await Booking.findById(id)
      .populate("original_service_ids", "name base_price").populate("service_id", "name base_price");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    }

    // Chỉ cho chỉnh khi đơn chưa được khách xác nhận hợp đồng
    const editableStatuses = ["REQUESTED", "CONTRACT_SENT"];
    if (!editableStatuses.includes(booking.status)) {
      return res.status(400).json({
        message: `Không thể chỉnh sửa đơn ở trạng thái "${booking.status}". Chỉ có thể chỉnh đơn ở trạng thái REQUESTED hoặc CONTRACT_SENT.`,
      });
    }

    // Cập nhật dịch vụ — tính lại tổng tiền nếu không có total_amount thủ công
    let autoRecalcTotal = false;

    if (service_ids && Array.isArray(service_ids) && service_ids.length > 0) {
      booking.original_service_ids = service_ids;
      booking.service_id = service_ids[0];
      autoRecalcTotal = true;
    } else if (service_id && String(service_id) !== String(booking.service_id?._id || booking.service_id)) {
      const service = await Service.findById(service_id);
      if (!service) {
        return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
      }
      booking.service_id = service._id;
      booking.original_service_ids = [service._id];
      autoRecalcTotal = true;
    }

    if (extra_service_ids !== undefined) {
      if (Array.isArray(extra_service_ids) && extra_service_ids.length > 0) {
        const addonServices = await Service.find({ _id: { $in: extra_service_ids } });
        if (addonServices.length !== extra_service_ids.length) {
          return res.status(400).json({ message: "Một hoặc nhiều gói đi kèm không hợp lệ" });
        }
      }
      booking.extra_service_ids = extra_service_ids;
      autoRecalcTotal = true;
    }

    // Cập nhật ngày + buổi chụp (session-based)
    const newShootDate = shoot_date || null;
    const newShootingType = shooting_type || booking.shooting_type;
    const newShootingSession = shooting_session || booking.shooting_session;

    if (newShootDate && newShootingSession) {
      try {
        const times = getSessionTimes(newShootDate, newShootingSession);
        booking.start_time = times.startDate;
        booking.end_time = times.endDate;
      } catch (e) {
        return res.status(400).json({ message: e.message });
      }
      booking.shooting_session = newShootingSession;
    }

    if (shooting_type) {
      booking.shooting_type = shooting_type;
    }

    // Validate và set địa điểm
    if (location !== undefined) {
      booking.location = location;
    }
    if (booking.shooting_type === "STUDIO") {
      booking.location = STUDIO_LOCATION;
    } else if (booking.shooting_type === "OUTDOOR" && !booking.location) {
      return res.status(400).json({ message: "Vui lòng nhập địa điểm ngoại cảnh" });
    }

    if (note !== undefined) booking.note = note;
    if (contract_note !== undefined) booking.contract_note = contract_note;

    // Cập nhật nhân sự
    if (assigned_staff_ids !== undefined) booking.assigned_staff_ids = assigned_staff_ids;
    if (external_staff !== undefined) booking.external_staff = external_staff;

    // Cập nhật tài chính
    let newTotalAmount = booking.total_amount;

    if (total_amount !== undefined && total_amount !== null) {
      newTotalAmount = Number(total_amount);
      if (newTotalAmount < 0) {
        return res.status(400).json({ message: "Tổng tiền không hợp lệ" });
      }
      booking.total_amount = newTotalAmount;
      autoRecalcTotal = false;
    } else if (autoRecalcTotal) {
      const mainService = await Service.findById(booking.service_id);
      const mainPrice = Number(mainService?.base_price || 0);
      let addonPrice = 0;
      if (booking.extra_service_ids && booking.extra_service_ids.length > 0) {
        const addons = await Service.find({ _id: { $in: booking.extra_service_ids } });
        addonPrice = addons.reduce((sum, s) => sum + Number(s.base_price || 0), 0);
      }
      newTotalAmount = mainPrice + addonPrice;
      booking.total_amount = newTotalAmount;
    }

    // Cập nhật tiền cọc - cố định 30%
    booking.deposit_percent = 30;
    if (autoRecalcTotal && deposit_amount === undefined) {
      booking.deposit_amount = Math.round((newTotalAmount * 30) / 100);
    }
    if (deposit_amount !== undefined && deposit_amount !== null) {
      const amt = Number(deposit_amount);
      if (amt < 0) {
        return res.status(400).json({ message: "Tiền cọc không hợp lệ" });
      }
      booking.deposit_amount = amt;
    }

    // Kiểm tra trùng lịch lại sau khi cập nhật
    const effectiveShootDate = newShootDate || (
      booking.start_time
        ? moment(booking.start_time).utcOffset(7).format("YYYY-MM-DD")
        : null
    );
    if (effectiveShootDate && booking.shooting_type && booking.shooting_session) {
      if (booking.shooting_type === "STUDIO") {
        const conflict = await findStudioSessionConflict({
          shootDateStr: effectiveShootDate,
          session: booking.shooting_session,
          excludeBookingId: booking._id,
        });
        if (conflict) {
          return sendConflictResponse(res, conflict, "Studio đã có lịch buổi này.");
        }
      } else if (booking.shooting_type === "OUTDOOR") {
        const conflict = await findOutdoorSessionConflict({
          shootDateStr: effectiveShootDate,
          session: booking.shooting_session,
          excludeBookingId: booking._id,
        });
        if (conflict) {
          return sendConflictResponse(res, conflict, "Ekip ngoại cảnh đã có lịch buổi này.");
        }
      }
    }



    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price").populate("service_id", "name thumbnail base_price")
      .populate("extra_service_ids", "name base_price")
      .populate("assigned_staff_ids", "full_name email phone");

    return res.status(200).json({
      message: "Cập nhật thông tin đơn thành công",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Update booking info error:", error);
    return res.status(500).json({
      message: "Lỗi cập nhật thông tin đơn",
      error: error.message,
    });
  }
};

// Admin lấy danh sách toàn bộ đơn đặt lịch.
exports.getAllBookingsForAdmin = async (req, res) => {
  try {
    await markExpiredPendingBookings();

    const { status } = req.query;
    const query = {};

    if (status && status !== "ALL") {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price duration_hours").populate("service_id", "name thumbnail base_price duration_hours")
      .populate("extra_service_ids", "name base_price")
      .populate("assigned_staff_ids", "full_name email phone")
      .sort({ createdAt: -1 });

    const result = await Promise.all(
      bookings.map((booking) => buildBookingResponse(booking)),
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách đơn đặt lịch",
      error: error.message,
    });
  }
};

// Admin cập nhật trạng thái đơn đặt lịch.
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!BOOKING_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Trạng thái đơn không hợp lệ",
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price duration_hours").populate("service_id", "name thumbnail base_price duration_hours")
      .populate("extra_service_ids", "name");

    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy đơn đặt lịch",
      });
    }

    // Validate transition rules
    const allowedNextStatuses = VALID_TRANSITIONS[booking.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        message: `Không thể chuyển trạng thái từ "${booking.status}" sang "${status}". Chuyển trạng thái hợp lệ: ${allowedNextStatuses.join(", ") || "Không có"}.`,
        code: "INVALID_TRANSITION",
      });
    }

    booking.status = status;

    if (status === "CANCELED") {
      await Payment.updateMany(
        {
          reference_id: booking._id,
          reference_type: "BOOKING",
          status: "PENDING",
        },
        { status: "FAILED" },
      );
    }

    await booking.save();

    // Gửi email thông báo thay đổi trạng thái
    await mailService.sendStatusChangeEmail(booking, booking.customer_id);

    // Nếu admin chuyển hoàn thành, tạo payment phần còn lại để đơn hiển thị đã tất toán.
    if (status === "COMPLETED") {
      const summary = await buildBookingPaymentSummary(booking);

      if (summary.remaining_amount > 0) {
        await Payment.create({
          reference_id: booking._id,
          reference_type: "BOOKING",
          amount: summary.remaining_amount,
          payment_method: "MANUAL",
          payment_type: "ADMIN_COMPLETE_REMAINING",
          status: "SUCCESS",
          paid_at: new Date(),
        });
      }
    }

    const result = await buildBookingResponse(booking, {
      includePayments: true,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Update booking status error:", error);

    return res.status(500).json({
      message: "Lỗi cập nhật trạng thái đơn",
      error: error.message,
    });
  }
};



// ==========================================
// STUDIO BUSY SLOTS — cho customer booking mới
// ==========================================

// Lấy danh sách booking chiếm lịch studio theo ngày.
exports.getStudioBusySlots = async (req, res) => {
  try {
    const { date, type = "STUDIO", excludeBookingId } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Thiếu tham số date" });
    }

    const normalizedType = type === "OUTDOOR" ? "OUTDOOR" : "STUDIO";

    const baseQuery = {
      shooting_type: normalizedType,
      shooting_session: { $in: ["MORNING", "AFTERNOON", "FULL_DAY"] },
      ...buildDateQuery(date),
      ...activeStatusQuery,
    };

    // Loại trừ đơn hiện tại (dùng cho admin dời lịch — tránh đơn tự block chính nó)
    if (excludeBookingId) {
      baseQuery._id = { $ne: excludeBookingId };
    }

    const bookings = await Booking.find(baseQuery)
      .select("start_time end_time service_id shooting_type shooting_session status");

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Get busy slots error:", error);
    return res.status(500).json({
      message: "Lỗi lấy thông tin lịch bận",
      error: error.message,
    });
  }
};

// ==========================================

// Admin cập nhật ekip phụ trách cho booking.
exports.updateBookingStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_staff_ids, external_staff } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (["CANCELED"].includes(booking.status)) {
      return res.status(400).json({
        message: "Không thể phân ekip cho đơn đã hủy",
      });
    }

    if (assigned_staff_ids !== undefined) {
      if (Array.isArray(assigned_staff_ids) && assigned_staff_ids.length > 0) {
        const validStaff = await User.find({
          _id: { $in: assigned_staff_ids },
          is_active: true,
        });

        if (validStaff.length !== assigned_staff_ids.length) {
          return res.status(400).json({
            message: "Một hoặc nhiều nhân viên không hợp lệ",
          });
        }
      }

      booking.assigned_staff_ids = assigned_staff_ids;
    }

    if (external_staff !== undefined) {
      booking.external_staff = external_staff;
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("assigned_staff_ids", "full_name email phone");

    return res.status(200).json({
      message: "Cập nhật ekip phụ trách thành công",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Update booking staff error:", error);
    return res.status(500).json({
      message: "Lỗi cập nhật ekip",
      error: error.message,
    });
  }
};

// Backward-compat alias: createVnpayPayment vẫn hoạt động nhưng gọi sang createBookingRequest
// để tránh vỡ code cũ nếu có chỗ nào còn gọi thẳng tên hàm này.
exports.createVnpayPayment = exports.createBookingRequest;



// ==========================================
// ADMIN — DỜI LỊCH ĐƠN CONFIRMED
// ==========================================

/**
 * Admin dời lịch/địa điểm cho đơn đã CONFIRMED (khách đã xác nhận HĐ và thanh toán cọc).
 * Chỉ được sửa: shoot_date, shooting_session, location, note, contract_note.
 * Không sửa: service, total_amount, deposit_amount, payment, trạng thái đơn.
 * Kiểm tra conflict lịch như cũ, loại trừ chính đơn đang sửa.
 * Regenerate PDF hợp đồng với thông tin mới.
 * Trạng thái đơn vẫn giữ CONFIRMED sau khi cập nhật.
 */
exports.rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shoot_date,
      shooting_session,
      location,
      note,
      contract_note,
    } = req.body;

    const booking = await Booking.findById(id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price duration_hours")
      .populate("service_id", "name base_price duration_hours")
      .populate("extra_service_ids", "name base_price")
      .populate("assigned_staff_ids", "full_name email");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    }

    // Chỉ cho phép dời lịch đơn CONFIRMED
    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        message: `Chỉ có thể dời lịch đơn ở trạng thái CONFIRMED. Đơn hiện tại: "${booking.status}".`,
        code: "INVALID_STATUS_FOR_RESCHEDULE",
      });
    }

    // Dùng ngày/buổi mới nếu có, không thì giữ nguyên
    const effectiveShootDate = shoot_date || moment(booking.start_time).utcOffset(7).format("YYYY-MM-DD");
    const effectiveSession = shooting_session || booking.shooting_session;

    // Validate buổi chụp
    if (!["MORNING", "AFTERNOON", "FULL_DAY"].includes(effectiveSession)) {
      return res.status(400).json({ message: "Buổi chụp không hợp lệ. Chọn MORNING, AFTERNOON hoặc FULL_DAY." });
    }

    // Tính lại start_time/end_time
    let startDate, endDate;
    try {
      const times = getSessionTimes(effectiveShootDate, effectiveSession);
      startDate = times.startDate;
      endDate = times.endDate;
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    // Chặn dời lịch về ngày đã qua
    if (startDate < new Date()) {
      return res.status(400).json({
        message: "Không thể dời lịch về ngày đã qua. Vui lòng chọn ngày trong tương lai.",
        code: "PAST_DATE_NOT_ALLOWED",
      });
    }


    // Kiểm tra trùng lịch, exclude chính đơn này
    if (booking.shooting_type === "STUDIO") {
      const conflict = await findStudioSessionConflict({
        shootDateStr: effectiveShootDate,
        session: effectiveSession,
        excludeBookingId: booking._id,
      });
      if (conflict) {
        return sendConflictResponse(res, conflict,
          `Studio đã có lịch buổi ${effectiveSession === "MORNING" ? "sáng" : effectiveSession === "AFTERNOON" ? "chiều" : "cả ngày"} trong ngày này.`);
      }
    } else if (booking.shooting_type === "OUTDOOR") {
      const conflict = await findOutdoorSessionConflict({
        shootDateStr: effectiveShootDate,
        session: effectiveSession,
        excludeBookingId: booking._id,
      });
      if (conflict) {
        return sendConflictResponse(res, conflict,
          `Ekip ngoại cảnh đã có lịch buổi ${effectiveSession === "MORNING" ? "sáng" : effectiveSession === "AFTERNOON" ? "chiều" : "cả ngày"} trong ngày này.`);
      }
    }

    // Lưu thông tin lịch cũ trước khi cập nhật (dùng cho email thông báo)
    const oldStartTime = booking.start_time;
    const oldEndTime = booking.end_time;
    const oldLocation = booking.location;

    // Cập nhật lịch
    booking.start_time = startDate;
    booking.end_time = endDate;
    booking.shooting_session = effectiveSession;

    // Cập nhật địa điểm — cho phép sửa cho cả STUDIO và OUTDOOR khi dời lịch
    if (location !== undefined) {
      if (!location || !location.trim()) {
        return res.status(400).json({ message: "Vui lòng nhập địa điểm chụp" });
      }
      booking.location = location.trim();
    }

    // Cập nhật ghi chú nếu có
    if (note !== undefined) booking.note = note;
    if (contract_note !== undefined) booking.contract_note = contract_note;

    // Đảm bảo có contract_token (nếu chưa có thì tạo mới)
    if (!booking.contract_token) {
      booking.contract_token = crypto.randomBytes(32).toString("hex");
    }

    // Trạng thái VẪN GIỮ CONFIRMED — không đổi
    await booking.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const contractLink = `${frontendUrl}/contract-review/${booking._id}?token=${booking.contract_token}`;

    // Sinh lại QR code
    const qrCodeDataUrl = await generateQrDataUrl(contractLink);

    // Sinh lại PDF hợp đồng (ghi đè file cũ)
    let pdfUrl = null;
    try {
      const { fileName } = await generateContractPdf(booking, contractLink);
      pdfUrl = `${backendUrl}/public/contracts/${fileName}`;
    } catch (pdfErr) {
      console.error("[rescheduleBooking] Lỗi sinh PDF:", pdfErr.message);
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("assigned_staff_ids", "full_name email");

    // Gửi email thông báo dời lịch cho khách (fire-and-forget, không block response)
    mailService.sendRescheduleEmail(populatedBooking, populatedBooking.customer_id, {
      oldStartTime,
      oldEndTime,
      oldLocation,
      contractLink,
      pdfUrl,
    }).catch(err => console.error("[rescheduleBooking] Lỗi gửi email dời lịch:", err.message));

    return res.status(200).json({
      message: "Cập nhật lịch thành công. File hợp đồng PDF đã được tạo lại.",
      booking: populatedBooking,
      contract_link: contractLink,
      qr_code: qrCodeDataUrl,
      pdf_url: pdfUrl,
    });
  } catch (error) {
    console.error("Reschedule booking error:", error);
    return res.status(500).json({
      message: "Lỗi cập nhật lịch đơn",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN — XEM LẠI QR/LINK HĐ
// ==========================================

/**
 * Admin xem lại QR/link hợp đồng của một đơn đã có contract_token.
 * Không thay đổi gì trên DB — chỉ build lại link và generate QR mới.
 * Hoạt động với mọi trạng thái đơn có contract_token.
 */
exports.getContractInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("customer_id", "full_name email phone")
      .populate("service_id", "name");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    }

    if (!booking.contract_token) {
      return res.status(400).json({
        message: "Đơn này chưa có hợp đồng. Hãy gửi hợp đồng trước.",
        code: "NO_CONTRACT_TOKEN",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const contractLink = `${frontendUrl}/contract-review/${booking._id}?token=${booking.contract_token}`;
    const pdfUrl = `${backendUrl}/public/contracts/contract_${booking._id}.pdf`;

    const qrCodeDataUrl = await generateQrDataUrl(contractLink);

    return res.status(200).json({
      booking_id: booking._id,
      customer_name: booking.customer_id?.full_name,
      service_name: booking.service_id?.name,
      status: booking.status,
      contract_link: contractLink,
      qr_code: qrCodeDataUrl,
      pdf_url: pdfUrl,
    });
  } catch (error) {
    console.error("Get contract info error:", error);
    return res.status(500).json({
      message: "Lỗi lấy thông tin hợp đồng",
      error: error.message,
    });
  }
};
