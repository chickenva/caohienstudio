/**
 * bookingController.js
 * Xử lý toàn bộ luồng đặt lịch chụp của studio:
 *  - Customer: tạo yêu cầu đặt lịch, xem đơn và hợp đồng.
 *  - Admin: tạo đơn hộ, gửi hợp đồng PDF, xác nhận đã nhận cọc (tiền mặt/CK), cập nhật trạng thái, phân công thợ.
 *
 * LUỒNG TRẠNG THÁI:
 *  REQUESTED → WAITING_PAYMENT → CONFIRMED → IN_PROGRESS → COMPLETED
 *  CONTRACT_SENT is a legacy alias for WAITING_PAYMENT and remains readable.
 *  Tại mọi bước đều có thể chuyển sang CANCELED (trừ COMPLETED).
 *
 * Thanh toán: Thủ công (tiền mặt hoặc chuyển khoản). Không dùng cổng thanh toán.
 * Admin xác nhận đã nhận cọc qua API /confirm-deposit → booking chuyển CONFIRMED.
 *
 * LUỒNG LEGACY (backward-compat): PENDING → DEPOSITED → CONFIRMED → COMPLETED | CANCELED
 */
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Payment = require("../models/Payment");
const User = require("../models/User");
const OTP = require("../models/OTP");
const WebsiteImage = require("../models/WebsiteImage");
const Holiday = require("../models/Holiday");

const crypto = require("crypto");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const mailService = require("../services/mailService");
const { generateQrDataUrl } = require("../utils/qrCode");
const {
  generateBookingContractPdf,
  uploadBookingContractPdf,
  resolveContractTemplateSelection,
} = require("../services/contractTemplateService");
const { calculateTravelEstimate, STUDIO_ORIGIN } = require("../utils/travelPricing");

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
  REQUESTED: ["WAITING_PAYMENT", "CANCELED"],
  CONTRACT_SENT: ["REQUESTED", "WAITING_PAYMENT", "CANCELED"], // legacy; admin có thể chuẩn hóa đơn cũ
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

// Chuẩn hóa thông tin khách cho cả tài khoản đã liên kết và khách đặt không cần tài khoản.
const getBookingCustomer = (booking) => {
  const account = booking?.customer_id;
  return {
    full_name: booking?.customer_full_name || account?.full_name || "Khách hàng",
    email: booking?.customer_email || account?.email || "",
    phone: booking?.customer_phone || account?.phone || "",
  };
};

// Tạo URL API truy cập/tải PDF hợp đồng qua backend (tránh lỗi 401 ACL khi truy cập trực tiếp raw URL trên Cloudinary).
const buildContractPdfApiUrl = (req, booking, { download = false } = {}) => {
  if (!booking?._id || !booking?.contract_token) return null;
  const configuredBackendUrl = process.env.BACKEND_URL
    || (req ? `${req.protocol}://${req.get("host")}` : "http://localhost:5000");
  const baseUrl = String(configuredBackendUrl).replace(/\/+$/, "");
  const apiPrefix = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
  const versionTag = booking.updatedAt ? new Date(booking.updatedAt).getTime() : Date.now();
  return `${apiPrefix}/bookings/contract/${booking._id}/pdf?token=${encodeURIComponent(booking.contract_token)}&v=${versionTag}${download ? "&download=1" : ""}`;
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
// SESSION-BASED & TIMETABLE SCHEDULING HELPERS
// ==========================================

const STUDIO_LOCATION = "Cao Hiển Studio";

const VALID_SHOOTING_SESSIONS = ["MORNING", "AFTERNOON", "EVENING", "FULL_DAY", "CUSTOM"];

// Map buổi chụp sang giờ bắt đầu/kết thúc mặc định (giờ địa phương VN, UTC+7)
const SESSION_TIME_MAP = {
  MORNING: { startHour: 8, startMin: 0, endHour: 12, endMin: 0 },
  AFTERNOON: { startHour: 13, startMin: 0, endHour: 17, endMin: 0 },
  EVENING: { startHour: 17, startMin: 30, endHour: 21, endMin: 30 },
  FULL_DAY: { startHour: 8, startMin: 0, endHour: 17, endMin: 0 },
  CUSTOM: { startHour: 8, startMin: 0, endHour: 12, endMin: 0 },
};

// Các buổi bị trùng nhau theo logic conflict truyền thống
const SESSION_CONFLICT_MAP = {
  MORNING: ["MORNING", "FULL_DAY"],
  AFTERNOON: ["AFTERNOON", "FULL_DAY"],
  EVENING: ["EVENING"],
  FULL_DAY: ["MORNING", "AFTERNOON", "FULL_DAY"],
  CUSTOM: [],
};

// Parse chuỗi giờ "HH:mm" thành { hour, minute }
const parseTimeHHmm = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

// Tính start_time và end_time từ ngày chụp + buổi chụp + giờ tùy chỉnh (nếu có)
const getSessionTimes = (shootDateStr, session, customStartStr = null, customEndStr = null) => {
  const effectiveSession = session || "MORNING";
  const times = SESSION_TIME_MAP[effectiveSession];
  if (!times) throw new Error(`Buổi chụp không hợp lệ: ${session}`);

  const parsedStart = parseTimeHHmm(customStartStr);
  const parsedEnd = parseTimeHHmm(customEndStr);

  const startHour = parsedStart ? parsedStart.hour : times.startHour;
  const startMin = parsedStart ? parsedStart.minute : times.startMin;
  const endHour = parsedEnd ? parsedEnd.hour : times.endHour;
  const endMin = parsedEnd ? parsedEnd.minute : times.endMin;

  const startDate = moment.utc(shootDateStr).utcOffset(7, true)
    .hour(startHour).minute(startMin).second(0).millisecond(0)
    .utc().toDate();
  let endDate = moment.utc(shootDateStr).utcOffset(7, true)
    .hour(endHour).minute(endMin).second(0).millisecond(0)
    .utc().toDate();

  if (endDate <= startDate) {
    throw new Error("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
  }

  const isCustom =
    effectiveSession === "CUSTOM" ||
    startHour !== times.startHour ||
    startMin !== times.startMin ||
    endHour !== times.endHour ||
    endMin !== times.endMin;

  return { startDate, endDate, isCustom };
};

// Gợi ý thời gian cộng thêm (phút) cho việc di chuyển của đơn ngoại cảnh dựa trên cự ly OSRM
const getSuggestedTravelBufferMinutes = (distanceKm, shootingType) => {
  if (shootingType !== "OUTDOOR") return 0;
  const km = Number(distanceKm || 0);
  if (!Number.isFinite(km) || km <= 15) return 0;
  if (km <= 40) return 60;   // +1h
  if (km <= 80) return 120;  // +2h
  if (km <= 130) return 180; // +3h (VD: TP.HCM, Cần Thơ...)
  if (km <= 200) return 240; // +4h
  return 300;                // +5h
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

// Kiểm tra xung đột khung giờ thực tế [startDate, endDate] trong cùng ngày
const findTimeOverlapConflicts = async ({ shootDateStr, startDate, endDate, shootingType, excludeBookingId }) => {
  const query = {
    ...buildDateQuery(shootDateStr),
    ...activeStatusQuery,
    start_time: { $lt: endDate },
    end_time: { $gt: startDate },
  };
  if (shootingType) query.shooting_type = shootingType;
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  return Booking.find(query)
    .populate("service_id", "name")
    .populate("customer_id", "full_name phone")
    .sort({ start_time: 1 });
};

// Kiểm tra trùng lịch STUDIO theo buổi
// Chỉ check đơn STUDIO cùng ngày có session conflict
const findStudioSessionConflict = async ({ shootDateStr, session, excludeBookingId }) => {
  const conflictSessions = SESSION_CONFLICT_MAP[session];
  if (!conflictSessions || conflictSessions.length === 0) return null;

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
const findOutdoorSessionConflict = async ({ shootDateStr, session, excludeBookingId }) => {
  const conflictSessions = SESSION_CONFLICT_MAP[session];
  if (!conflictSessions || conflictSessions.length === 0) return null;

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
      shooting_session, // Tùy chọn; studio sẽ chốt sau khi liên hệ khách.
      location,
      destination_id,
      destination_coordinates,
      travel_estimate,
      note,
      customer_name,
      customer_phone,
      customer_email,
      guest_otp,
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
    if (shooting_session && !VALID_SHOOTING_SESSIONS.includes(shooting_session)) {
      return res.status(400).json({ message: "Buổi chụp không hợp lệ." });
    }
    const customerId = getCurrentUserId(req);

    let accountCustomer = null;
    let guestCustomer = null;
    if (customerId) {
      accountCustomer = await User.findById(customerId).select("full_name email phone role is_active");
      if (!accountCustomer || accountCustomer.role !== "CUSTOMER" || !accountCustomer.is_active) {
        return res.status(401).json({ message: "Tài khoản không hợp lệ hoặc đã bị khóa." });
      }
    } else {
      const normalizedEmail = String(customer_email || "").trim().toLowerCase();
      const normalizedName = String(customer_name || "").trim();
      const normalizedPhone = String(customer_phone || "").trim();
      if (!normalizedName || !normalizedPhone || !normalizedEmail || !guest_otp) {
        return res.status(400).json({ message: "Vui lòng nhập họ tên, số điện thoại, email và xác minh email bằng OTP." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: "Email không hợp lệ." });
      }
      if (!/^0[0-9]{9,10}$/.test(normalizedPhone)) {
        return res.status(400).json({ message: "Số điện thoại cần bắt đầu bằng 0 và có 10–11 chữ số." });
      }
      const otpRecord = await OTP.findOne({
        email: normalizedEmail,
        otp: String(guest_otp).trim(),
        createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) },
      });
      if (!otpRecord) {
        return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn. Vui lòng xác minh lại email." });
      }
      guestCustomer = {
        full_name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
      };
    }

    // Kiểm tra đơn đang xử lý
    const customerBookingFilter = customerId
      ? { $or: [{ customer_id: customerId }, { customer_email: accountCustomer.email.toLowerCase() }] }
      : { customer_email: guestCustomer.email };
    const activeBooking = await Booking.findOne({
      ...customerBookingFilter,
      status: { $in: ["REQUESTED", "CONTRACT_SENT", "WAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS", "PENDING", "DEPOSITED"] },
    });

    if (activeBooking) {
      return res.status(400).json({
        message: `Bạn đang có một đơn đặt lịch (mã: #${activeBooking._id.toString().slice(-6).toUpperCase()}) đang được xử lý. Vui lòng hoàn thành hoặc hủy đơn cũ trước khi đặt lịch mới.`,
        code: "HAS_PENDING_BOOKING",
        booking_id: activeBooking._id,
      });
    }

    // original_service_ids contains every selected main package; service_id is the primary one.
    // Keep the primary first and normalize duplicates before validating/pricing.
    const requestedMainIds = Array.isArray(original_service_ids) && original_service_ids.length > 0
      ? original_service_ids
      : [service_id];
    const mainServiceIds = [...new Set([service_id, ...requestedMainIds].map((id) => String(id || "")).filter(Boolean))];
    const foundMainServices = await Service.find({
      _id: { $in: mainServiceIds },
      is_active: true,
    });
    if (foundMainServices.length !== mainServiceIds.length) {
      return res.status(404).json({ message: "Một hoặc nhiều gói dịch vụ chính không hợp lệ hoặc đã ngừng cung cấp" });
    }
    const mainServiceById = new Map(foundMainServices.map((item) => [String(item._id), item]));
    const mainServices = mainServiceIds.map((id) => mainServiceById.get(id));
    const service = mainServices[0];

    // Validate gói đi kèm
    let validatedAddonIds = [];
    let addonTotalPrice = 0;

    // Older clients also placed secondary main packages in extra_service_ids.
    // Ignore those duplicates so the field and stored data contain add-ons only.
    const mainServiceIdSet = new Set(mainServiceIds);
    const requestedAddonIds = Array.isArray(extra_service_ids)
      ? [...new Set(extra_service_ids.map((id) => String(id || "")).filter((id) => id && !mainServiceIdSet.has(id)))]
      : [];
    if (requestedAddonIds.length > 0) {
      const addonServices = await Service.find({
        _id: { $in: requestedAddonIds },
        is_active: true,
      });

      if (addonServices.length !== requestedAddonIds.length) {
        return res.status(400).json({ message: "Một hoặc nhiều gói đi kèm không hợp lệ" });
      }

      const addonServiceById = new Map(addonServices.map((item) => [String(item._id), item]));
      validatedAddonIds = requestedAddonIds.map((id) => addonServiceById.get(id)._id);
      addonTotalPrice = addonServices.reduce((sum, s) => sum + Number(s.base_price || 0), 0);
    }

    // Nếu khách chưa chốt buổi, lưu ngày đề xuất theo trọn ngày; ngày/giờ cụ thể
    // sẽ được studio cập nhật sau khi trao đổi với khách.
    let startDate, endDate;
    try {
      const parsedShootDate = moment.utc(shoot_date, "YYYY-MM-DD", true);
      if (!parsedShootDate.isValid()) {
        return res.status(400).json({ message: "Ngày chụp không hợp lệ." });
      }
      const requestedDay = moment.utc(shoot_date, "YYYY-MM-DD").utcOffset(7, true);
      if (requestedDay.isBefore(moment().utcOffset(7).startOf("day"))) {
        return res.status(400).json({ message: "Không thể đặt lịch trong quá khứ" });
      }
      if (shooting_session) {
        const times = getSessionTimes(shoot_date, shooting_session);
        startDate = times.startDate;
        endDate = times.endDate;
      } else {
        // Mặc định xếp tạm vào khung giờ sáng 08:00 - 12:00 trên Thời khóa biểu để Admin nhìn thấy ngay và gọi tư vấn chốt giờ
        startDate = requestedDay.clone().hour(8).minute(0).second(0).millisecond(0).utc().toDate();
        endDate = requestedDay.clone().hour(12).minute(0).second(0).millisecond(0).utc().toDate();
      }
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    // Kiểm tra ngày không trong quá khứ
    if (shooting_session && startDate < new Date()) {
      return res.status(400).json({ message: "Không thể đặt lịch trong quá khứ" });
    }

    // Chỉ giữ kiểm tra xung đột cho các request legacy có buổi chụp.
    if (shooting_session && shooting_type === "STUDIO") {
      const conflict = await findStudioSessionConflict({ shootDateStr: shoot_date, session: shooting_session });
      if (conflict) {
        return sendConflictResponse(res, conflict,
          `Studio đã có lịch buổi ${shooting_session === "MORNING" ? "sáng" : shooting_session === "AFTERNOON" ? "chiều" : "cả ngày"} trong ngày này.`);
      }
    } else if (shooting_session && shooting_type === "OUTDOOR") {
      const conflict = await findOutdoorSessionConflict({ shootDateStr: shoot_date, session: shooting_session });
      if (conflict) {
        return sendConflictResponse(res, conflict,
          `Ekip ngoại cảnh đã có lịch buổi ${shooting_session === "MORNING" ? "sáng" : shooting_session === "AFTERNOON" ? "chiều" : "cả ngày"} trong ngày này.`);
      }
    }

    let travelEstimate = {
      destinationId: "",
      distanceKm: null,
      surchargeAmount: 0,
      surchargeText: "Không áp dụng",
      requiresQuote: false,
      status: "NOT_APPLICABLE",
      source: "",
    };
    if (shooting_type === "OUTDOOR") {
      try {
        travelEstimate = await calculateTravelEstimate({
          destinationId: destination_id || "ben-tre",
          destinationCoordinates: destination_coordinates,
          hasCustomLocation: Boolean(String(location || "").trim()),
        });
      } catch (estimateError) {
        return res.status(400).json({ message: estimateError.message || "Khu vực chụp không hợp lệ." });
      }

      if (travel_estimate) {
        const quoteStateChanged = Boolean(travel_estimate.requiresQuote) !== Boolean(travelEstimate.requiresQuote);
        const surchargeChanged = !travelEstimate.requiresQuote &&
          Number(travel_estimate.surchargeAmount || 0) !== Number(travelEstimate.surchargeAmount || 0);
        const distanceChanged = travel_estimate.distanceKm != null && travelEstimate.distanceKm != null &&
          Number(travel_estimate.distanceKm) !== Number(travelEstimate.distanceKm);
        if (quoteStateChanged || surchargeChanged || distanceChanged) {
          return res.status(409).json({
            code: "TRAVEL_ESTIMATE_CHANGED",
            message: "Tuyến đường hoặc phụ thu vừa thay đổi. Vui lòng kiểm tra lại mức mới trước khi gửi yêu cầu.",
            travel_estimate: travelEstimate,
          });
        }
      }
    }

    const travelSurchargeAmount = travelEstimate.requiresQuote ? 0 : Number(travelEstimate.surchargeAmount || 0);
    const mainServiceTotal = mainServices.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
    const totalAmount = mainServiceTotal + addonTotalPrice + travelSurchargeAmount;
    const depositPercent = 30;
    const depositAmount = Math.round((totalAmount * depositPercent) / 100);
    const finalLocation = shooting_type === "STUDIO" ? STUDIO_LOCATION : (location || "");

    const newBooking = new Booking({
      customer_id: customerId || null,
      customer_full_name: accountCustomer?.full_name || guestCustomer?.full_name,
      customer_email: accountCustomer?.email || guestCustomer?.email,
      customer_phone: accountCustomer?.phone || guestCustomer?.phone,
      service_id: service._id,
      original_service_ids: mainServices.map((item) => item._id),
      extra_service_ids: validatedAddonIds,
      shooting_type,
      shooting_session,
      start_time: startDate,
      end_time: endDate,
      location: finalLocation,
      travel_destination_id: shooting_type === "OUTDOOR" ? (destination_id || "ben-tre") : "",
      travel_distance_km: travelEstimate.distanceKm,
      travel_surcharge_amount: travelSurchargeAmount,
      travel_surcharge_status: shooting_type === "OUTDOOR"
        ? (travelEstimate.requiresQuote ? "QUOTE_REQUIRED" : "ESTIMATED")
        : "NOT_APPLICABLE",
      travel_pricing_source: travelEstimate.source || "",
      travel_origin_label: shooting_type === "OUTDOOR" ? STUDIO_ORIGIN.label : "",
      travel_origin_coordinates: shooting_type === "OUTDOOR"
        ? { lat: STUDIO_ORIGIN.lat, lon: STUDIO_ORIGIN.lon }
        : { lat: null, lon: null },
      travel_destination_coordinates: destination_coordinates || { lat: null, lon: null },
      note,
      total_amount: totalAmount,
      deposit_percent: depositPercent,
      deposit_amount: depositAmount,
      status: "REQUESTED",
    });

    const booking = await newBooking.save();
    if (guestCustomer?.email) {
      await OTP.deleteMany({ email: guestCustomer.email });
    }

    // 1. Khi khách gửi yêu cầu -> Gửi mail thông báo về cho admin
    try {
      const populatedBooking = await Booking.findById(booking._id)
        .populate("customer_id", "full_name email phone")
        .populate("service_id", "name base_price")
        .populate("extra_service_ids", "name base_price");
      if (populatedBooking) {
        mailService.sendBookingSuccessToAdminEmail(populatedBooking, getBookingCustomer(populatedBooking))
          .catch(err => console.error("Lỗi gửi mail thông báo cho admin khi khách gửi yêu cầu:", err));
      }
    } catch (mailErr) {
      console.error("Lỗi chuẩn bị email báo admin:", mailErr.message);
    }

    return res.status(201).json({
      message: "Yêu cầu đặt lịch đã được gửi thành công. Studio sẽ liên hệ để tư vấn và chốt buổi, giờ chụp.",
      booking_id: booking._id,
      status: booking.status,
      travel_estimate: travelEstimate,
    });
  } catch (error) {
    console.error("Create booking request error:", error);
    return res.status(500).json({
      message: "Lỗi khởi tạo yêu cầu đặt lịch",
      error: error.message,
    });
  }
};

// Báo giá phụ thu để khách xem ngay trong trang đặt lịch.
exports.getTravelEstimate = async (req, res) => {
  try {
    const { destination_id, destination_coordinates, has_custom_location } = req.body || {};
    const estimate = await calculateTravelEstimate({
      destinationId: destination_id,
      destinationCoordinates: destination_coordinates,
      hasCustomLocation: Boolean(has_custom_location),
    });
    return res.json(estimate);
  } catch (error) {
    return res.status(400).json({ message: error.message || "Không thể tính phụ thu di chuyển." });
  }
};

// Customer lấy toàn bộ đơn của chính mình.
exports.getMyBookings = async (req, res) => {
  try {
    const customerId = getCurrentUserId(req);

    // Vẫn xử lý PENDING cũ để backward-compatible
    await markExpiredPendingBookings(customerId);

    const bookings = await Booking.find({ customer_id: customerId })
      .populate("original_service_ids", "name base_price").populate("service_id", "name thumbnail base_price")
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
      .populate("original_service_ids", "name base_price").populate("service_id", "name thumbnail base_price")
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

// Customer hủy đơn khi còn REQUESTED hoặc đang chờ cọc (bao gồm trạng thái legacy).
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
      .populate("original_service_ids", "name base_price").populate("service_id", "name thumbnail base_price")
      .populate("assigned_staff_ids", "full_name phone email");

    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy đơn đặt lịch",
      });
    }

    const cancelableStatuses = ["REQUESTED", "WAITING_PAYMENT", "CONTRACT_SENT", "PENDING"];

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
      .populate("original_service_ids", "name base_price").populate("service_id", "name thumbnail base_price")
      .populate("extra_service_ids", "name base_price")
      .populate("assigned_staff_ids", "full_name phone email");

    if (!booking) {
      return res.status(404).json({ message: "Hợp đồng không tồn tại hoặc link đã hết hạn" });
    }

    if (booking.status === "CANCELED") {
      return res.status(400).json({ message: "Đơn đặt lịch này đã bị hủy" });
    }

    const bookingObj = booking.toObject();
    bookingObj.customer_id = getBookingCustomer(booking);
    delete bookingObj.contract_token;

    // Lấy QR thanh toán mặc định của Studio từ DB (do Admin upload trong Cài đặt)
    const qrImage = await WebsiteImage.findOne({ page: "SETTINGS", key: "payment_qr" });
    const paymentQrUrl = qrImage?.imageUrl || process.env.PAYMENT_QR_URL || "";

    // PDF hợp đồng phân phối qua endpoint backend
    const pdfUrl = buildContractPdfApiUrl(req, booking);

    return res.status(200).json({
      booking: bookingObj,
      pdf_url: pdfUrl,
      payment_qr_url: paymentQrUrl,
      already_confirmed: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status),
    });
  } catch (error) {
    console.error("Get contract by token error:", error);
    return res.status(500).json({
      message: "Lỗi lấy thông tin hợp đồng",
      error: error.message,
    });
  }
};

// Public PDF delivery through the API ensures browsers receive an inline application/pdf response.
exports.getContractPdfByToken = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { token, download } = req.query;
    if (!token) return res.status(400).json({ message: "Thiếu token xác thực hợp đồng." });

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Mã đơn hàng không hợp lệ." });
    }

    const booking = await Booking.findOne({ _id: bookingId, contract_token: token })
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price")
      .populate("service_id", "name base_price")
      .populate("extra_service_ids", "name base_price");
    if (!booking) return res.status(404).json({ message: "Hợp đồng không tồn tại hoặc link đã hết hạn." });
    if (booking.status === "CANCELED") return res.status(400).json({ message: "Đơn đặt lịch này đã bị hủy." });

    let pdfBuffer = null;

    if (booking.contract_file_url && String(booking.contract_file_url).startsWith("http")) {
      try {
        const fileUrl = new URL(booking.contract_file_url);
        if (fileUrl.hostname === "res.cloudinary.com" && !fileUrl.pathname.toLowerCase().endsWith(".pdf")) {
          const fileResponse = await fetch(fileUrl, { signal: AbortSignal.timeout(30000) });
          if (fileResponse.ok) {
            const candidate = Buffer.from(await fileResponse.arrayBuffer());
            if (candidate.length > 4 && candidate.subarray(0, 5).toString("ascii") === "%PDF-") {
              pdfBuffer = candidate;
            }
          }
        }
      } catch (fetchErr) {
        console.warn("[getContractPdfByToken] Không tải được từ Cloudinary, chuyển sang sinh trực tiếp từ template:", fetchErr.message);
      }
    }

    if (!pdfBuffer) {
      const generated = await generateBookingContractPdf(booking);
      pdfBuffer = generated.buffer;
      const bookingCode = String(booking._id).slice(-8).toUpperCase();
      const generatedFileName = booking.contract_original_name || `Hop-dong-${bookingCode}.pdf`;
      uploadBookingContractPdf(pdfBuffer, bookingCode)
        .then(async (uploaded) => {
          if (uploaded?.secure_url) {
            await Booking.updateOne(
              { _id: booking._id },
              {
                $set: {
                  contract_file_url: uploaded.secure_url,
                  contract_original_name: generatedFileName,
                },
              },
            );
          }
        })
        .catch((err) => console.error("[getContractPdfByToken] Lỗi cập nhật lại file hợp đồng lên Cloudinary:", err.message));
    }

    const fileName = String(booking.contract_original_name || `Hop-dong-${String(booking._id).slice(-8).toUpperCase()}.pdf`)
      .replace(/[\r\n"]+/g, "_");
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `${download === "1" ? "attachment" : "inline"}; filename="${fileName}"`);
    res.set("Cache-Control", "private, no-store");
    res.set("X-Content-Type-Options", "nosniff");
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Get contract PDF by token error:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Không thể tải file PDF hợp đồng." });
  }
};

// Khách xác nhận hợp đồng. Chuyển booking sang WAITING_PAYMENT.
// Không tạo link thanh toán — khách thanh toán thủ công (tiền mặt/chuyển khoản).
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
      .populate("original_service_ids", "name base_price").populate("service_id", "name")
      .populate("extra_service_ids", "name");

    if (!booking) {
      return res.status(404).json({ message: "Hợp đồng không tồn tại hoặc token không đúng" });
    }

    if (booking.status === "CANCELED") {
      return res.status(400).json({ message: "Đơn đặt lịch này đã bị hủy" });
    }

    // Đã thanh toán và xác nhận trước đó
    if (booking.status === "CONFIRMED") {
      return res.status(200).json({
        message: "Hợp đồng đã được xác nhận và studio đã ghi nhận thanh toán cọc trước đó",
        already_paid: true,
        booking_status: booking.status,
      });
    }

    // Đã xác nhận hợp đồng trước đó, đang chờ admin xác nhận cọc
    if (booking.status === "WAITING_PAYMENT") {
      const totalAmount = getTotalAmount(booking);
      const depositAmount = booking.deposit_amount > 0
        ? booking.deposit_amount
        : Math.round((totalAmount * (booking.deposit_percent || 30)) / 100);

      // Tạo nội dung chuyển khoản gợi ý
      const bookingCode = booking._id.toString().slice(-6).toUpperCase();
      const customerPhone = booking.customer_id?.phone || "";
      const transferContent = `CHS ${bookingCode} ${customerPhone}`.trim();

      return res.status(200).json({
        message: "Bạn đã xác nhận hợp đồng trước đó. Vui lòng thanh toán tiền cọc để giữ lịch chính thức.",
        already_confirmed: true,
        deposit_amount: depositAmount,
        transfer_content: transferContent,
      });
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

    // Hạn giữ tạm 24h kể từ khi khách xác nhận hợp đồng
    const holdExpiresAt = moment().add(24, "hours").toDate();

    // Chuẩn hóa cả đơn legacy khi khách mở và xác nhận hợp đồng.
    booking.status = "WAITING_PAYMENT";
    booking.contract_confirmed_at = booking.contract_confirmed_at || new Date();
    booking.deposit_amount = depositAmount;
    booking.hold_expires_at = holdExpiresAt;
    await booking.save();

    // Tạo nội dung chuyển khoản gợi ý cho khách
    const bookingCode = booking._id.toString().slice(-6).toUpperCase();
    const customerPhone = booking.customer_id?.phone || "";
    const transferContent = `CHS ${bookingCode} ${customerPhone}`.trim();

    return res.status(200).json({
      message: "Xác nhận hợp đồng thành công. Vui lòng thanh toán tiền cọc để giữ lịch.",
      deposit_amount: depositAmount,
      transfer_content: transferContent,
      hold_expires_at: holdExpiresAt,
    });
  } catch (error) {
    console.error("Confirm contract error:", error);
    return res.status(500).json({
      message: "Lỗi xác nhận hợp đồng",
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
      // Session-based & Timetable fields
      shoot_date,
      shooting_type,
      shooting_session,
      custom_start_time,
      custom_end_time,
      schedule_note,
      use_custom_time_on_contract,
      location,
      note,
      total_amount,
      paid_amount,
      status,
      contract_type,
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
    if (!VALID_SHOOTING_SESSIONS.includes(effectiveShootingSession)) {
      return res.status(400).json({ message: "Buổi chụp không hợp lệ" });
    }
    if (effectiveShootingType === "OUTDOOR" && !location) {
      return res.status(400).json({ message: "Vui lòng nhập địa điểm chụp ngoại cảnh" });
    }

    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
    }

    // Tính start/end từ ngày + buổi + giờ tùy chỉnh (nếu có)
    let startDate, endDate, isCustomScheduleTime = false;
    try {
      const times = getSessionTimes(
        effectiveShootDate,
        effectiveShootingSession,
        custom_start_time,
        custom_end_time,
      );
      startDate = times.startDate;
      endDate = times.endDate;
      isCustomScheduleTime = Boolean(times.isCustom);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    await markExpiredPendingBookings();




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

    const adminMainIds = [...new Set([
      service_id,
      ...(Array.isArray(original_service_ids) ? original_service_ids : []),
    ].map((id) => String(id || "")).filter(Boolean))];
    const adminMainIdSet = new Set(adminMainIds);
    const adminAddonIds = Array.isArray(extra_service_ids)
      ? [...new Set(extra_service_ids.map((id) => String(id || "")).filter((id) => id && !adminMainIdSet.has(id)))]
      : [];
    const adminMainServices = await Service.find({ _id: { $in: adminMainIds } });
    if (adminMainServices.length !== adminMainIds.length) {
      return res.status(404).json({ message: "Một hoặc nhiều gói dịch vụ chính không tồn tại" });
    }
    const adminAddonServices = adminAddonIds.length > 0
      ? await Service.find({ _id: { $in: adminAddonIds } })
      : [];
    if (adminAddonServices.length !== adminAddonIds.length) {
      return res.status(400).json({ message: "Một hoặc nhiều gói đi kèm không tồn tại" });
    }
    const calculatedTotalAmount = adminMainServices.reduce((sum, item) => sum + Number(item.base_price || 0), 0) +
      adminAddonServices.reduce((sum, item) => sum + Number(item.base_price || 0), 0);

    const finalTotalAmount = total_amount !== undefined && total_amount !== null
      ? Number(total_amount)
      : calculatedTotalAmount;

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
    const contractTemplateSelection = await resolveContractTemplateSelection(contract_type);

    const bookingPayload = {
      customer_id: customer._id,
      customer_full_name: String(customer_full_name || customer.full_name || "").trim(),
      customer_email: String(customer_email || customer.email || "").trim().toLowerCase(),
      customer_phone: String(customer_phone || customer.phone || "").trim(),
      service_id: service._id,
      original_service_ids: adminMainIds,
      assigned_staff_ids: assigned_staff_ids || [],
      extra_service_ids: adminAddonIds,
      external_staff: external_staff || [],
      shooting_type: effectiveShootingType,
      shooting_session: effectiveShootingSession,
      start_time: startDate,
      end_time: endDate,
      is_custom_schedule_time: isCustomScheduleTime,
      schedule_note: String(schedule_note || "").trim(),
      use_custom_time_on_contract: Boolean(use_custom_time_on_contract || effectiveShootingSession === "CUSTOM"),
      location: finalLocation,
      note,
      total_amount: finalTotalAmount,
      deposit_percent: depositPercent,
      deposit_amount: depositAmount,
      status: targetStatus,
      ...contractTemplateSelection,
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

      // Tạo PDF theo template đang hoạt động cho đơn đã CONFIRMED.
      try {
        const contractBooking = await Booking.findById(booking._id)
          .populate("customer_id", "full_name email phone")
          .populate("original_service_ids", "name base_price")
          .populate("service_id", "name base_price")
          .populate("extra_service_ids", "name base_price");
        const generated = await generateBookingContractPdf(contractBooking);
        const uploaded = await uploadBookingContractPdf(generated.buffer, String(booking._id).slice(-8).toUpperCase());
        booking.contract_file_url = uploaded.secure_url;
        booking.contract_original_name = `Hop-dong-${String(booking._id).slice(-8).toUpperCase()}.pdf`;
        await booking.save();
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
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Lỗi tạo đơn đặt hộ",
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
      // Session-based & Timetable fields
      shoot_date,
      shooting_type,
      shooting_session,
      custom_start_time,
      custom_end_time,
      schedule_note,
      use_custom_time_on_contract,
      location,
      note,
      total_amount,
      deposit_amount,
      travel_distance_km,
      travel_surcharge_amount,
      travel_surcharge_status,
      travel_pricing_source,
      travel_destination_id,
      travel_destination_coordinates,
      contract_note,
      contract_type,
      // Thông tin khách hàng
      customer_full_name,
      customer_phone,
      customer_email,
    } = req.body;

    const booking = await Booking.findById(id)
      .populate("original_service_ids", "name base_price").populate("service_id", "name base_price");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    }

    // Cho phép chỉnh sửa ở các trạng thái chưa hoàn thành / hủy
    const editableStatuses = ["REQUESTED", "CONTRACT_SENT", "WAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS"];
    if (!editableStatuses.includes(booking.status)) {
      return res.status(400).json({
        message: `Không thể chỉnh sửa đơn ở trạng thái "${booking.status}".`,
      });
    }

    if (contract_type !== undefined) {
      const requestedType = String(contract_type || "").trim().toLowerCase();
      if (requestedType !== booking.contract_type || !booking.contract_template_id) {
        const selection = await resolveContractTemplateSelection(requestedType);
        booking.contract_type = selection.contract_type;
        booking.contract_template_id = selection.contract_template_id;
      }
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
      const currentMainIds = new Set((booking.original_service_ids?.length
        ? booking.original_service_ids
        : [booking.service_id]).map((item) => String(item?._id || item || "")));
      const actualAddonIds = Array.isArray(extra_service_ids)
        ? [...new Set(extra_service_ids.map((item) => String(item?._id || item || ""))
          .filter((id) => id && !currentMainIds.has(id)))]
        : [];
      if (actualAddonIds.length > 0) {
        const addonServices = await Service.find({ _id: { $in: actualAddonIds } });
        if (addonServices.length !== actualAddonIds.length) {
          return res.status(400).json({ message: "Một hoặc nhiều gói đi kèm không hợp lệ" });
        }
      }
      booking.extra_service_ids = actualAddonIds;
      autoRecalcTotal = true;
    }

    // Cập nhật ngày + buổi chụp + giờ tùy chỉnh trên Thời khóa biểu
    const oldShootDateStr = booking.start_time
      ? moment(booking.start_time).utcOffset(7).format("YYYY-MM-DD")
      : null;
    const newShootDate = shoot_date || oldShootDateStr;
    const newShootingSession = shooting_session || booking.shooting_session;
    const sessionChanged = Boolean(shooting_session && shooting_session !== booking.shooting_session);
    const hasExplicitCustomTimes = Boolean(custom_start_time && custom_end_time);

    if (newShootDate && newShootingSession) {
      if (!VALID_SHOOTING_SESSIONS.includes(newShootingSession)) {
        return res.status(400).json({ message: "Buổi chụp không hợp lệ." });
      }
      try {
        if (hasExplicitCustomTimes) {
          const times = getSessionTimes(newShootDate, newShootingSession, custom_start_time, custom_end_time);
          booking.start_time = times.startDate;
          booking.end_time = times.endDate;
          booking.is_custom_schedule_time = Boolean(times.isCustom);
        } else if (booking.is_custom_schedule_time && !sessionChanged && booking.start_time && booking.end_time) {
          // Giữ nguyên khung giờ tùy chỉnh trên Thời khóa biểu (VD: đơn ngoại cảnh TPHCM đã cộng giờ đi lại)
          const prevStartStr = moment(booking.start_time).utcOffset(7).format("HH:mm");
          const prevEndStr = moment(booking.end_time).utcOffset(7).format("HH:mm");
          const times = getSessionTimes(newShootDate, newShootingSession, prevStartStr, prevEndStr);
          booking.start_time = times.startDate;
          booking.end_time = times.endDate;
        } else {
          const times = getSessionTimes(newShootDate, newShootingSession);
          booking.start_time = times.startDate;
          booking.end_time = times.endDate;
          booking.is_custom_schedule_time = false;
        }
      } catch (e) {
        return res.status(400).json({ message: e.message });
      }
      booking.shooting_session = newShootingSession;
    }

    if (schedule_note !== undefined) {
      booking.schedule_note = String(schedule_note || "").trim();
    }
    if (use_custom_time_on_contract !== undefined) {
      booking.use_custom_time_on_contract = Boolean(use_custom_time_on_contract);
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
      booking.travel_distance_km = 0;
      booking.travel_surcharge_amount = 0;
      booking.travel_surcharge_status = "NOT_APPLICABLE";
      booking.travel_pricing_source = "NOT_APPLICABLE";
    } else if (booking.shooting_type === "OUTDOOR" && !booking.location) {
      return res.status(400).json({ message: "Vui lòng nhập địa điểm ngoại cảnh" });
    }

    if (note !== undefined) booking.note = note;
    if (contract_note !== undefined) booking.contract_note = contract_note;

    // Cập nhật thông tin khách hàng
    if (customer_full_name !== undefined) {
      booking.customer_full_name = String(customer_full_name || "").trim();
    }
    if (customer_phone !== undefined) {
      booking.customer_phone = String(customer_phone || "").trim();
    }
    if (customer_email !== undefined) {
      booking.customer_email = String(customer_email || "").trim().toLowerCase();
    }

    // Cập nhật nhân sự
    if (assigned_staff_ids !== undefined) booking.assigned_staff_ids = assigned_staff_ids;
    if (external_staff !== undefined) booking.external_staff = external_staff;

    if (travel_distance_km !== undefined) {
      booking.travel_distance_km = travel_distance_km === null ? null : Number(travel_distance_km);
    }
    if (travel_pricing_source !== undefined) {
      booking.travel_pricing_source = travel_pricing_source;
    }
    if (travel_destination_id !== undefined) {
      booking.travel_destination_id = travel_destination_id;
    }
    if (travel_destination_coordinates !== undefined) {
      booking.travel_destination_coordinates = travel_destination_coordinates;
    }

    if (travel_surcharge_amount !== undefined && travel_surcharge_amount !== null) {
      const amount = Number(travel_surcharge_amount);
      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({ message: "Phụ thu di chuyển không hợp lệ." });
      }
      booking.travel_surcharge_amount = amount;
      if (travel_surcharge_status === undefined) {
        booking.travel_surcharge_status = (booking.shooting_type === "STUDIO" || amount === 0)
          ? "NOT_APPLICABLE"
          : "ESTIMATED";
      }
    }
    if (travel_surcharge_status !== undefined) {
      if (!["NOT_APPLICABLE", "ESTIMATED", "QUOTE_REQUIRED"].includes(travel_surcharge_status)) {
        return res.status(400).json({ message: "Trạng thái phụ thu di chuyển không hợp lệ." });
      }
      booking.travel_surcharge_status = travel_surcharge_status;
      if (travel_surcharge_status === "QUOTE_REQUIRED" || travel_surcharge_status === "NOT_APPLICABLE") {
        booking.travel_surcharge_amount = 0;
      }
    } else if (Number(booking.travel_surcharge_amount || 0) > 0 && booking.travel_surcharge_status === "QUOTE_REQUIRED") {
      booking.travel_surcharge_status = "ESTIMATED";
    }

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
      const mainIds = [...new Set([
        ...(booking.original_service_ids || []),
        booking.service_id,
      ].map((item) => String(item?._id || item || "")).filter(Boolean))];
      const mainServices = await Service.find({ _id: { $in: mainIds } });
      const mainPrice = mainServices.reduce((sum, item) => sum + Number(item.base_price || 0), 0);
      let addonPrice = 0;
      if (booking.extra_service_ids && booking.extra_service_ids.length > 0) {
        const addons = await Service.find({ _id: { $in: booking.extra_service_ids } });
        addonPrice = addons.reduce((sum, s) => sum + Number(s.base_price || 0), 0);
      }
      newTotalAmount = mainPrice + addonPrice + Number(booking.travel_surcharge_amount || 0);
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

    // Chỉ chặn cứng nếu client truyền cờ strict_conflict_check, còn mặc định cho phép Admin lưu và quản lý trên Thời khóa biểu
    const effectiveShootDate = newShootDate || (
      booking.start_time
        ? moment(booking.start_time).utcOffset(7).format("YYYY-MM-DD")
        : null
    );
    if (req.body?.strict_conflict_check && effectiveShootDate && booking.shooting_type && booking.shooting_session) {
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

    let populatedBooking = await Booking.findById(booking._id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price").populate("service_id", "name thumbnail base_price")
      .populate("extra_service_ids", "name base_price")
      .populate("assigned_staff_ids", "full_name email phone");

    if (
      !req.body?.skip_contract_sync &&
      (booking.contract_token || booking.contract_file_url || ["WAITING_PAYMENT", "CONTRACT_SENT", "CONFIRMED"].includes(booking.status))
    ) {
      try {
        const generated = await generateBookingContractPdf(populatedBooking);
        const bookingCode = String(booking._id).slice(-8).toUpperCase();
        const uploaded = await uploadBookingContractPdf(generated.buffer, bookingCode);
        const fileName = `Hop-dong-${bookingCode}.pdf`;
        booking.contract_file_url = uploaded.secure_url;
        booking.contract_original_name = fileName;
        await booking.save();
        populatedBooking = await Booking.findById(booking._id)
          .populate("customer_id", "full_name email phone")
          .populate("original_service_ids", "name base_price").populate("service_id", "name thumbnail base_price")
          .populate("extra_service_ids", "name base_price")
          .populate("assigned_staff_ids", "full_name email phone");
      } catch (syncErr) {
        console.warn("[updateBookingInfo] Không thể tự động đồng bộ lại PDF hợp đồng:", syncErr.message);
      }
    }

    return res.status(200).json({
      message: "Cập nhật thông tin đơn thành công",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Update booking info error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Lỗi cập nhật thông tin đơn",
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
      query.status = status === "WAITING_PAYMENT"
        ? { $in: ["WAITING_PAYMENT", "CONTRACT_SENT"] }
        : status;
    }

    const bookings = await Booking.find(query)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price").populate("service_id", "name thumbnail base_price")
      .populate("extra_service_ids", "name base_price category allow_addon")
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
      .populate("original_service_ids", "name base_price").populate("service_id", "name thumbnail base_price")
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

    // Chỉ gửi email cho khách khi đơn đã được xác nhận cọc (CONFIRMED), hoàn thành (COMPLETED) hoặc bị hủy (CANCELED)
    if (["CONFIRMED", "COMPLETED", "CANCELED"].includes(status)) {
      if (status === "CONFIRMED") {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const contractLink = booking.contract_token
          ? `${frontendUrl}/contract-review/${booking._id}?token=${booking.contract_token}`
          : null;
        const pdfUrl = buildContractPdfApiUrl(req, booking, { download: true });
        await mailService.sendDepositConfirmedEmail(booking, getBookingCustomer(booking), {
          contractLink,
          pdfUrl,
          payment_method: "MANUAL",
          confirmedAmount: booking.deposit_amount || 0,
        });
      } else {
        await mailService.sendStatusChangeEmail(booking, getBookingCustomer(booking));
      }
    }

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

    const normalizedType = type === "OUTDOOR" ? "OUTDOOR" : type === "ALL" ? null : "STUDIO";

    const baseQuery = {
      ...(normalizedType ? { shooting_type: normalizedType } : {}),
      ...buildDateQuery(date),
      ...activeStatusQuery,
    };

    // Loại trừ đơn hiện tại (dùng cho admin dời lịch — tránh đơn tự block chính nó)
    if (excludeBookingId) {
      baseQuery._id = { $ne: excludeBookingId };
    }

    const bookings = await Booking.find(baseQuery)
      .populate("service_id", "name")
      .select("start_time end_time service_id shooting_type shooting_session status is_custom_schedule_time schedule_note customer_full_name");

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

// ==========================================
// ADMIN — XÁC NHẬN ĐÃ NHẬN CỌC (CASH/TRANSFER)
// ==========================================

/**
 * Admin xác nhận đã nhận tiền cọc từ khách (tiền mặt hoặc chuyển khoản).
 * Quy trình:
 *  1. Kiểm tra đơn hợp lệ (đang WAITING_PAYMENT).
 *  2. Tạo Payment SUCCESS với phương thức CASH hoặc TRANSFER.
 *  3. Chuyển booking sang CONFIRMED.
 *  4. Gửi email xác nhận đơn chính thức cho khách.
 */
exports.adminConfirmDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      payment_method, // "CASH" hoặc "TRANSFER"
      amount,         // Số tiền đã nhận (mặc định = deposit_amount)
      payment_note,   // Ghi chú đối soát (vd: "Khách gửi bill qua Zalo")
      transaction_id, // Mã giao dịch ngân hàng (nếu có - legacy)
      bill_image_url, // URL ảnh bill thanh toán (nếu có)
    } = req.body;

    // Chỉ chấp nhận phương thức thủ công
    if (!payment_method || !["CASH", "TRANSFER"].includes(payment_method)) {
      return res.status(400).json({
        message: "Phương thức thanh toán không hợp lệ. Chọn CASH hoặc TRANSFER.",
      });
    }

    const booking = await Booking.findById(id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price")
      .populate("service_id", "name base_price")
      .populate("extra_service_ids", "name");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    }

    // Cho phép xác nhận cọc cho các đơn ở trạng thái CONTRACT_SENT, WAITING_PAYMENT hoặc REQUESTED
    if (!["CONTRACT_SENT", "WAITING_PAYMENT", "REQUESTED"].includes(booking.status)) {
      return res.status(400).json({
        message: `Không thể xác nhận cọc cho đơn ở trạng thái "${booking.status}".`,
        code: "INVALID_STATUS",
      });
    }

    const totalAmount = getTotalAmount(booking);
    const depositAmount = booking.deposit_amount > 0
      ? booking.deposit_amount
      : Math.round((totalAmount * (booking.deposit_percent || 30)) / 100);

    // Số tiền admin xác nhận — mặc định bằng deposit_amount
    const confirmedAmount = (amount !== undefined && amount !== null)
      ? Number(amount)
      : depositAmount;

    if (isNaN(confirmedAmount) || confirmedAmount <= 0) {
      return res.status(400).json({ message: "Số tiền xác nhận không hợp lệ" });
    }

    const now = new Date();

    // Tạo Payment SUCCESS — admin ghi nhận đã nhận tiền
    const payment = await Payment.create({
      reference_id: booking._id,
      reference_type: "BOOKING",
      amount: confirmedAmount,
      payment_method,        // CASH hoặc TRANSFER
      payment_type: "DEPOSIT",
      status: "SUCCESS",
      paid_at: now,
      payment_note: payment_note || "",
      transaction_id: transaction_id || "",
      bill_image_url: bill_image_url || "",
    });

    // Chuyển booking sang CONFIRMED — lịch được giữ chính thức
    booking.status = "CONFIRMED";
    booking.hold_expires_at = null; // Không còn hết hạn khi đã CONFIRMED
    if (bill_image_url) {
      booking.deposit_bill_url = bill_image_url;
    }
    await booking.save();

    // Gửi email xác nhận đặt lịch chính thức cho khách
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const contractLink = booking.contract_token
      ? `${frontendUrl}/contract-review/${booking._id}?token=${booking.contract_token}`
      : null;
    const pdfUrl = buildContractPdfApiUrl(req, booking, { download: true });

    await mailService.sendDepositConfirmedEmail(booking, getBookingCustomer(booking), {
      contractLink,
      pdfUrl,
      payment_method,
      confirmedAmount,
    });

    return res.status(200).json({
      message: "Xác nhận nhận cọc thành công. Đơn đặt lịch đã chuyển sang CONFIRMED.",
      booking_id: booking._id,
      payment_id: payment._id,
      payment_method,
      confirmed_amount: confirmedAmount,
    });
  } catch (error) {
    console.error("Admin confirm deposit error:", error);
    return res.status(500).json({
      message: "Lỗi xác nhận nhận cọc",
      error: error.message,
    });
  }
};

// Alias không còn dùng — giữ để tránh vỡ import cũ nếu có
// exports.createVnpayPayment đã được xóa, đổi sang createBookingRequest

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
      .populate("original_service_ids", "name base_price")
      .populate("service_id", "name base_price")
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
    const { custom_start_time, custom_end_time, schedule_note, use_custom_time_on_contract } = req.body;

    // Validate buổi chụp
    if (!VALID_SHOOTING_SESSIONS.includes(effectiveSession)) {
      return res.status(400).json({ message: "Buổi chụp không hợp lệ." });
    }

    // Tính lại start_time/end_time
    let startDate, endDate, isCustomScheduleTime = false;
    try {
      const times = getSessionTimes(effectiveShootDate, effectiveSession, custom_start_time, custom_end_time);
      startDate = times.startDate;
      endDate = times.endDate;
      isCustomScheduleTime = Boolean(times.isCustom);
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

    // Lưu thông tin lịch cũ trước khi cập nhật (dùng cho email thông báo)
    const oldStartTime = booking.start_time;
    const oldEndTime = booking.end_time;
    const oldLocation = booking.location;

    // Cập nhật lịch
    booking.start_time = startDate;
    booking.end_time = endDate;
    booking.shooting_session = effectiveSession;
    booking.is_custom_schedule_time = isCustomScheduleTime;
    if (schedule_note !== undefined) booking.schedule_note = String(schedule_note || "").trim();
    if (use_custom_time_on_contract !== undefined) booking.use_custom_time_on_contract = Boolean(use_custom_time_on_contract);

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
    const contractLink = `${frontendUrl}/contract-review/${booking._id}?token=${booking.contract_token}`;

    // Sinh lại QR code
    const qrCodeDataUrl = await generateQrDataUrl(contractLink);

    // Sinh lại PDF từ template hiện hành để đồng nhất nội dung hợp đồng.
    try {
      const contractBooking = await Booking.findById(booking._id)
        .populate("customer_id", "full_name email phone")
        .populate("original_service_ids", "name base_price")
        .populate("service_id", "name base_price")
        .populate("extra_service_ids", "name base_price");
      const generated = await generateBookingContractPdf(contractBooking);
      const uploaded = await uploadBookingContractPdf(generated.buffer, String(booking._id).slice(-8).toUpperCase());
      booking.contract_file_url = uploaded.secure_url;
      booking.contract_original_name = `Hop-dong-${String(booking._id).slice(-8).toUpperCase()}.pdf`;
      await booking.save();
    } catch (pdfErr) {
      console.error("[rescheduleBooking] Lỗi sinh PDF:", pdfErr.message);
    }

    const pdfUrl = buildContractPdfApiUrl(req, booking);
    const pdfDownloadUrl = buildContractPdfApiUrl(req, booking, { download: true });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("assigned_staff_ids", "full_name email");

    // Gửi email thông báo dời lịch cho khách (fire-and-forget, không block response)
    mailService.sendRescheduleEmail(populatedBooking, getBookingCustomer(populatedBooking), {
      oldStartTime,
      oldEndTime,
      oldLocation,
      contractLink,
      pdfUrl: pdfDownloadUrl,
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
// ADMIN — XUẤT VÀ GỬI HỢP ĐỒNG TỪ TEMPLATE
// ==========================================

/**
 * Admin tạo PDF từ template DOCX/XLSX đã điền bằng thông tin của booking.
 * Chỉ lưu file vào booking; chưa đổi trạng thái đơn sang WAITING_PAYMENT.
 */
exports.generateContractPdfFromTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price")
      .populate("service_id", "name base_price")
      .populate("extra_service_ids", "name base_price");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    }
    if (!["REQUESTED", "CONTRACT_SENT", "WAITING_PAYMENT", "CONFIRMED"].includes(booking.status)) {
      return res.status(400).json({
        message: `Chỉ có thể tạo hợp đồng cho đơn ở trạng thái REQUESTED, WAITING_PAYMENT hoặc CONFIRMED. Đơn hiện tại: "${booking.status}".`,
      });
    }

    const generated = await generateBookingContractPdf(booking, req.body || {});
    const bookingCode = String(booking._id).slice(-8).toUpperCase();
    const uploaded = await uploadBookingContractPdf(generated.buffer, bookingCode);
    const fileName = `Hop-dong-${bookingCode}.pdf`;
    booking.contract_file_url = uploaded.secure_url;
    booking.contract_original_name = fileName;
    await booking.save();

    return res.status(200).json({
      message: "Đã tạo PDF hợp đồng từ dữ liệu đơn đặt lịch.",
      pdf_url: booking.contract_token ? buildContractPdfApiUrl(req, booking) : uploaded.secure_url,
      contract_file_url: uploaded.secure_url,
      contract_original_name: fileName,
      booking_id: booking._id,
    });
  } catch (error) {
    console.error("Generate contract PDF from template error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Không thể tạo PDF hợp đồng",
    });
  }
};

exports.previewContractPdfFromTemplate = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price")
      .populate("service_id", "name base_price")
      .populate("extra_service_ids", "name base_price");
    if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    if (!["REQUESTED", "CONTRACT_SENT", "WAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS"].includes(booking.status)) {
      return res.status(400).json({ message: "Đơn không ở trạng thái có thể xem trước hợp đồng." });
    }
    const generated = await generateBookingContractPdf(booking, req.body || {});

    // Đồng bộ ngầm file PDF hợp đồng nếu đơn đã có hợp đồng hoặc đã gửi hợp đồng
    if (booking.contract_token || booking.contract_file_url || ["WAITING_PAYMENT", "CONTRACT_SENT", "CONFIRMED"].includes(booking.status)) {
      const bookingCode = String(booking._id).slice(-8).toUpperCase();
      const fileName = booking.contract_original_name || `Hop-dong-${bookingCode}.pdf`;
      uploadBookingContractPdf(generated.buffer, bookingCode)
        .then(async (uploaded) => {
          if (uploaded?.secure_url) {
            await Booking.updateOne(
              { _id: booking._id },
              {
                $set: {
                  contract_file_url: uploaded.secure_url,
                  contract_original_name: fileName,
                },
              },
            );
          }
        })
        .catch((err) => console.warn("[previewContractPdfFromTemplate] Lỗi đồng bộ file hợp đồng lên Cloudinary:", err.message));
    }

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", "inline; filename=contract-preview.pdf");
    return res.send(generated.buffer);
  } catch (error) {
    console.error("Preview contract PDF error:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Không thể xem trước hợp đồng" });
  }
};

exports.getBookingForContractEditor = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price")
      .populate("service_id", "name base_price")
      .populate("extra_service_ids", "name base_price");
    if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    if (!["REQUESTED", "WAITING_PAYMENT", "CONTRACT_SENT", "CONFIRMED"].includes(booking.status)) {
      return res.status(400).json({ message: "Đơn không ở trạng thái có thể chỉnh sửa hợp đồng." });
    }
    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ message: "Không thể tải dữ liệu hợp đồng", error: error.message });
  }
};

/**
 * Admin tạo đơn / gửi hợp đồng cho khách (REQUESTED / WAITING_PAYMENT -> WAITING_PAYMENT).
 * Nhận PDF vừa sinh từ template, sau đó tạo token và link/QR.
 * KHÔNG GỬI MAIL ở bước này! (Chỉ tạo token & link/QR hợp đồng trả về cho Admin).
 */
exports.sendContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { contract_file_url, contract_original_name } = req.body || {};

    const booking = await Booking.findById(id).populate("customer_id");
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    }

    if (!contract_file_url && !booking.contract_file_url) {
      return res.status(400).json({ message: "Hãy tạo PDF từ template hợp đồng trước khi tạo link/QR." });
    }

    if (!booking.shooting_type || !booking.shooting_session) {
      return res.status(400).json({
        message: "Vui lòng cập nhật hình thức, buổi và giờ chụp sau khi tư vấn với khách trước khi tạo hợp đồng.",
      });
    }

    if (!["REQUESTED", "WAITING_PAYMENT", "CONTRACT_SENT", "CONFIRMED"].includes(booking.status)) {
      return res.status(400).json({
        message: `Chỉ có thể tạo hợp đồng cho đơn ở trạng thái REQUESTED, WAITING_PAYMENT hoặc CONFIRMED. Đơn hiện tại: "${booking.status}".`
      });
    }

    if (contract_file_url) {
      booking.contract_file_url = contract_file_url;
    }
    if (contract_original_name) {
      booking.contract_original_name = contract_original_name;
    }

    if (!booking.contract_token) {
      booking.contract_token = crypto.randomBytes(24).toString("hex");
    }

    if (booking.status !== "CONFIRMED") {
      booking.status = "WAITING_PAYMENT";
      booking.hold_expires_at = moment().add(24, "hours").toDate();
    }
    booking.contract_sent_at = booking.contract_sent_at || new Date();
    await booking.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const contractLink = `${frontendUrl}/contract-review/${booking._id}?token=${booking.contract_token}`;
    const qrCodeDataUrl = await generateQrDataUrl(contractLink);
    const pdfUrl = buildContractPdfApiUrl(req, booking);

    return res.status(200).json({
      message: "Tạo hợp đồng thành công!",
      contract_link: contractLink,
      qr_code: qrCodeDataUrl,
      pdf_url: pdfUrl,
      booking,
    });
  } catch (error) {
    console.error("Send contract error:", error);
    return res.status(500).json({
      message: "Lỗi tạo hợp đồng",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN — XEM LẠI QR/LINK HĐ
// ==========================================

/**
 * Admin xem lại QR/link hợp đồng của một đơn đã có contract_token.
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
        message: "Đơn này chưa có hợp đồng. Hãy bấm tạo hợp đồng trước.",
        code: "NO_CONTRACT_TOKEN",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const contractLink = `${frontendUrl}/contract-review/${booking._id}?token=${booking.contract_token}`;
    const pdfUrl = buildContractPdfApiUrl(req, booking);

    const qrCodeDataUrl = await generateQrDataUrl(contractLink);

    return res.status(200).json({
      booking_id: booking._id,
      customer_name: booking.customer_id?.full_name || booking.customer_full_name,
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

// ==========================================
// THỜI KHÓA BIỂU ADMIN & ĐỒNG BỘ LỊCH KHÁCH HÀNG
// ==========================================

/**
 * GET /api/bookings/admin/timetable?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&shooting_type=ALL
 * Trả về danh sách các đơn đặt lịch trong tuần/tháng kèm gợi ý thời gian di chuyển,
 * phát hiện xung đột khung giờ và danh sách ngày nghỉ/lễ của Studio.
 */
exports.getAdminTimetable = async (req, res) => {
  try {
    await markExpiredPendingBookings();

    const { startDate, endDate, shooting_type = "ALL", include_canceled = "false" } = req.query;

    const startMoment = startDate
      ? moment.utc(startDate, "YYYY-MM-DD").utcOffset(7, true).startOf("day")
      : moment().utcOffset(7).startOf("isoWeek");
    const endMoment = endDate
      ? moment.utc(endDate, "YYYY-MM-DD").utcOffset(7, true).endOf("day")
      : startMoment.clone().add(6, "days").endOf("day");

    if (!startMoment.isValid() || !endMoment.isValid()) {
      return res.status(400).json({ message: "Khoảng thời gian truy vấn không hợp lệ." });
    }

    const query = {
      start_time: {
        $gte: startMoment.clone().utc().toDate(),
        $lte: endMoment.clone().utc().toDate(),
      },
    };

    if (include_canceled !== "true") {
      query.status = { $ne: "CANCELED" };
    }
    if (shooting_type && ["STUDIO", "OUTDOOR"].includes(shooting_type)) {
      query.shooting_type = shooting_type;
    }

    const [bookings, holidays] = await Promise.all([
      Booking.find(query)
        .populate("customer_id", "full_name email phone")
        .populate("original_service_ids", "name base_price")
        .populate("service_id", "name thumbnail base_price")
        .populate("extra_service_ids", "name base_price category allow_addon")
        .populate("assigned_staff_ids", "full_name email phone")
        .sort({ start_time: 1 }),
      Holiday.find({ is_active: true }).lean(),
    ]);

    const enrichedBookings = bookings.map((b) => {
      const obj = typeof b.toObject === "function" ? b.toObject() : b;
      const startLocal = moment(obj.start_time).utcOffset(7);
      const endLocalRaw = moment(obj.end_time).utcOffset(7);
      // Nếu đơn cũ có end_time <= start_time (do chưa chọn buổi), hiển thị tạm 4 giờ để dễ quản lý trên thời khóa biểu
      const endLocal = endLocalRaw.valueOf() > startLocal.valueOf()
        ? endLocalRaw
        : startLocal.clone().add(4, "hours");

      const dateStr = startLocal.format("YYYY-MM-DD");
      const startTimeStr = startLocal.format("HH:mm");
      const endTimeStr = endLocal.format("HH:mm");
      const durationMinutes = Math.max(30, Math.round((endLocal.valueOf() - startLocal.valueOf()) / 60000));

      const suggestedTravelBufferMinutes = getSuggestedTravelBufferMinutes(obj.travel_distance_km, obj.shooting_type);
      const baseSessionEndHour = SESSION_TIME_MAP[obj.shooting_session || "MORNING"]?.endHour || 12;
      const baseSessionEndMin = SESSION_TIME_MAP[obj.shooting_session || "MORNING"]?.endMin || 0;
      const suggestedEndMoment = startLocal.clone()
        .hour(baseSessionEndHour)
        .minute(baseSessionEndMin)
        .add(suggestedTravelBufferMinutes, "minutes");

      // Kiểm tra xem giờ kết thúc có lấn sang ca sau không (VD: đơn buổi sáng nhưng kết thúc sau 13:00)
      const spansIntoAfternoon =
        obj.shooting_session === "MORNING" &&
        (endLocal.hour() > 13 || (endLocal.hour() === 13 && endLocal.minute() > 0));
      const spansIntoEvening =
        (obj.shooting_session === "MORNING" || obj.shooting_session === "AFTERNOON") &&
        (endLocal.hour() > 17 || (endLocal.hour() === 17 && endLocal.minute() > 30));

      return {
        ...obj,
        shoot_date_str: dateStr,
        start_time_str: startTimeStr,
        end_time_str: endTimeStr,
        duration_minutes: durationMinutes,
        suggested_travel_buffer_minutes: suggestedTravelBufferMinutes,
        suggested_end_time_str: suggestedTravelBufferMinutes > 0 ? suggestedEndMoment.format("HH:mm") : null,
        spans_into_afternoon: spansIntoAfternoon,
        spans_into_evening: spansIntoEvening,
        _start_ms: startLocal.valueOf(),
        _end_ms: endLocal.valueOf(),
      };
    });

    // Phát hiện xung đột khung giờ giữa các đơn chưa hủy trong cùng một ngày
    for (let i = 0; i < enrichedBookings.length; i++) {
      const a = enrichedBookings[i];
      a.overlapping_bookings = [];
      if (a.status === "CANCELED") continue;
      for (let j = 0; j < enrichedBookings.length; j++) {
        if (i === j) continue;
        const b = enrichedBookings[j];
        if (b.status === "CANCELED" || a.shoot_date_str !== b.shoot_date_str) continue;
        if (a._start_ms < b._end_ms && a._end_ms > b._start_ms) {
          a.overlapping_bookings.push({
            _id: b._id,
            booking_code: String(b._id).slice(-6).toUpperCase(),
            customer_name: b.customer_full_name || b.customer_id?.full_name || "Khách hàng",
            shooting_type: b.shooting_type,
            start_time_str: b.start_time_str,
            end_time_str: b.end_time_str,
            same_shooting_type: a.shooting_type === b.shooting_type,
          });
        }
      }
    }

    return res.status(200).json({
      startDate: startMoment.format("YYYY-MM-DD"),
      endDate: endMoment.format("YYYY-MM-DD"),
      bookings: enrichedBookings,
      holidays,
    });
  } catch (error) {
    console.error("Get admin timetable error:", error);
    return res.status(500).json({
      message: "Không thể tải dữ liệu thời khóa biểu",
      error: error.message,
    });
  }
};

/**
 * PUT /api/bookings/:id/schedule
 * Admin tùy chỉnh nhanh ngày chụp, buổi chụp, giờ bắt đầu và giờ kết thúc dự kiến
 * của đơn hàng ngay trên Thời khóa biểu (VD: cộng thêm thời gian đi lại ngoại cảnh TP.HCM).
 */
exports.updateBookingSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shoot_date,
      shooting_session,
      custom_start_time,
      custom_end_time,
      schedule_note,
      use_custom_time_on_contract,
      shooting_type,
      location,
    } = req.body || {};

    const booking = await Booking.findById(id)
      .populate("customer_id", "full_name email phone")
      .populate("original_service_ids", "name base_price")
      .populate("service_id", "name thumbnail base_price")
      .populate("extra_service_ids", "name base_price")
      .populate("assigned_staff_ids", "full_name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch." });
    }
    if (booking.status === "CANCELED") {
      return res.status(400).json({ message: "Không thể chỉnh lịch cho đơn đã hủy." });
    }

    const effectiveShootDate = shoot_date || moment(booking.start_time).utcOffset(7).format("YYYY-MM-DD");
    const effectiveSession = shooting_session || booking.shooting_session || "MORNING";

    if (!VALID_SHOOTING_SESSIONS.includes(effectiveSession)) {
      return res.status(400).json({ message: "Buổi chụp không hợp lệ." });
    }

    let times;
    try {
      times = getSessionTimes(effectiveShootDate, effectiveSession, custom_start_time, custom_end_time);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    const oldDateStr = moment(booking.start_time).utcOffset(7).format("YYYY-MM-DD");
    const oldSession = booking.shooting_session;
    const oldUseCustomContract = Boolean(booking.use_custom_time_on_contract);

    booking.start_time = times.startDate;
    booking.end_time = times.endDate;
    booking.shooting_session = effectiveSession;
    booking.is_custom_schedule_time = Boolean(times.isCustom);

    if (schedule_note !== undefined) {
      booking.schedule_note = String(schedule_note || "").trim();
    }
    if (use_custom_time_on_contract !== undefined) {
      booking.use_custom_time_on_contract = Boolean(use_custom_time_on_contract);
    }
    if (shooting_type && ["STUDIO", "OUTDOOR"].includes(shooting_type)) {
      booking.shooting_type = shooting_type;
      if (shooting_type === "STUDIO") {
        booking.location = STUDIO_LOCATION;
      }
    }
    if (location !== undefined && booking.shooting_type === "OUTDOOR") {
      booking.location = String(location || "").trim();
    }

    await booking.save();

    // Nếu thay đổi có ảnh hưởng tới nội dung Hợp đồng (ngày chụp, buổi chụp, hoặc bật/tắt hiển thị giờ cụ thể trên HĐ)
    // và đơn đã phát hành hợp đồng thì tự động đồng bộ lại file PDF hợp đồng
    const contractAffected =
      oldDateStr !== effectiveShootDate ||
      oldSession !== effectiveSession ||
      oldUseCustomContract !== Boolean(booking.use_custom_time_on_contract) ||
      Boolean(booking.use_custom_time_on_contract);

    if (
      contractAffected &&
      (booking.contract_token || booking.contract_file_url || ["WAITING_PAYMENT", "CONTRACT_SENT", "CONFIRMED"].includes(booking.status))
    ) {
      try {
        const generated = await generateBookingContractPdf(booking);
        const bookingCode = String(booking._id).slice(-8).toUpperCase();
        const uploaded = await uploadBookingContractPdf(generated.buffer, bookingCode);
        booking.contract_file_url = uploaded.secure_url;
        booking.contract_original_name = `Hop-dong-${bookingCode}.pdf`;
        await booking.save();
      } catch (syncErr) {
        console.warn("[updateBookingSchedule] Không thể đồng bộ PDF hợp đồng:", syncErr.message);
      }
    }

    const overlaps = await findTimeOverlapConflicts({
      shootDateStr: effectiveShootDate,
      startDate: booking.start_time,
      endDate: booking.end_time,
      excludeBookingId: booking._id,
    });

    return res.status(200).json({
      message: "Đã cập nhật thời gian trên Thời khóa biểu thành công.",
      booking,
      overlaps: overlaps.map((item) => ({
        _id: item._id,
        booking_code: String(item._id).slice(-6).toUpperCase(),
        customer_name: item.customer_full_name || item.customer_id?.full_name || "Khách hàng",
        shooting_type: item.shooting_type,
        start_time_str: moment(item.start_time).utcOffset(7).format("HH:mm"),
        end_time_str: moment(item.end_time).utcOffset(7).format("HH:mm"),
      })),
    });
  } catch (error) {
    console.error("Update booking schedule error:", error);
    return res.status(500).json({
      message: "Lỗi cập nhật thời khóa biểu",
      error: error.message,
    });
  }
};

/**
 * GET /api/bookings/public-schedule?month=YYYY-MM
 * API Public an toàn cho trang Đặt lịch khách hàng:
 * Trả về các khung giờ đã có lịch theo từng ngày trong tháng (đã đồng bộ với giờ kết thúc dự kiến trên Thời khóa biểu Admin),
 * không lộ thông tin cá nhân của khách hàng.
 */
exports.getPublicSchedule = async (req, res) => {
  try {
    const { month, startDate, endDate } = req.query;

    let startMoment, endMoment;
    if (month && /^\d{4}-\d{2}$/.test(String(month).trim())) {
      startMoment = moment.utc(`${month}-01`, "YYYY-MM-DD").utcOffset(7, true).startOf("month").subtract(7, "days");
      endMoment = moment.utc(`${month}-01`, "YYYY-MM-DD").utcOffset(7, true).endOf("month").add(7, "days");
    } else if (startDate && endDate) {
      startMoment = moment.utc(startDate, "YYYY-MM-DD").utcOffset(7, true).startOf("day");
      endMoment = moment.utc(endDate, "YYYY-MM-DD").utcOffset(7, true).endOf("day");
    } else {
      startMoment = moment().utcOffset(7).startOf("month").subtract(7, "days");
      endMoment = moment().utcOffset(7).endOf("month").add(7, "days");
    }

    const bookings = await Booking.find({
      start_time: {
        $gte: startMoment.clone().utc().toDate(),
        $lte: endMoment.clone().utc().toDate(),
      },
      ...activeStatusQuery,
    })
      .select("start_time end_time shooting_type shooting_session status is_custom_schedule_time")
      .sort({ start_time: 1 })
      .lean();

    const days = {};
    bookings.forEach((b) => {
      const startLocal = moment(b.start_time).utcOffset(7);
      const endLocalRaw = moment(b.end_time).utcOffset(7);
      const endLocal = endLocalRaw.valueOf() > startLocal.valueOf()
        ? endLocalRaw
        : startLocal.clone().add(4, "hours");

      const dateKey = startLocal.format("YYYY-MM-DD");
      if (!days[dateKey]) {
        days[dateKey] = {
          date: dateKey,
          totalSlots: 0,
          studioSlots: 0,
          outdoorSlots: 0,
          slots: [],
        };
      }

      days[dateKey].totalSlots += 1;
      if (b.shooting_type === "STUDIO") days[dateKey].studioSlots += 1;
      if (b.shooting_type === "OUTDOOR") days[dateKey].outdoorSlots += 1;

      days[dateKey].slots.push({
        start_time_label: startLocal.format("HH:mm"),
        end_time_label: endLocal.format("HH:mm"),
        shooting_type: b.shooting_type || "STUDIO",
        shooting_session: b.shooting_session || "MORNING",
        status: b.status,
        is_confirmed: ["CONFIRMED", "IN_PROGRESS"].includes(b.status),
        is_extended: Boolean(b.is_custom_schedule_time),
      });
    });

    return res.status(200).json({ days });
  } catch (error) {
    console.error("Get public schedule error:", error);
    return res.status(500).json({
      message: "Không thể tải thông tin lịch chụp",
      error: error.message,
    });
  }
};



