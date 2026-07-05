const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Payment = require("../models/Payment");
const User = require("../models/User");

const crypto = require("crypto");
const moment = require("moment");
const bcrypt = require("bcryptjs");

const BOOKING_HOLD_MINUTES = 15;
const BOOKING_STATUSES = ["PENDING", "DEPOSITED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED"];

// Quy tắc chuyển trạng thái hợp lệ
const VALID_TRANSITIONS = {
  PENDING: ["DEPOSITED", "CANCELED"],
  DEPOSITED: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELED: [],
};
const DEPOSIT_PERCENTS = [30, 50, 100];

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

// Tìm đơn PENDING còn hạn của customer để chống spam tạo nhiều đơn chờ thanh toán.
const findActivePendingBooking = async (customerId) => {
  return Booking.findOne({
    customer_id: customerId,
    status: "PENDING",
    expires_at: { $gt: new Date() },
  })
    .populate("service_id", "name thumbnail base_price duration_hours")
    .sort({ createdAt: -1 });
};

// Kiểm tra thợ chụp có bị trùng lịch với đơn hợp lệ khác không (giữ cho admin).
const findPhotographerConflict = async ({
  photographerIds,
  startDate,
  endDate,
}) => {
  if (!photographerIds || photographerIds.length === 0) return null;
  return Booking.findOne({
    photographer_ids: { $in: photographerIds },
    start_time: { $lt: endDate },
    end_time: { $gt: startDate },
    $or: [
      { status: "DEPOSITED" },
      { status: "CONFIRMED" },
      { status: "IN_PROGRESS" },
      { status: "COMPLETED" },
      {
        status: "PENDING",
        expires_at: { $gt: new Date() },
      },
    ],
  })
    .populate("photographer_ids", "full_name email")
    .populate("service_id", "name");
};

// Kiểm tra studio có booking trùng thời gian không (dùng cho customer booking).
const findStudioConflict = async ({ startDate, endDate, excludeBookingId }) => {
  const query = {
    start_time: { $lt: endDate },
    end_time: { $gt: startDate },
    $or: [
      { status: "DEPOSITED" },
      { status: "CONFIRMED" },
      { status: "IN_PROGRESS" },
      { status: "COMPLETED" },
      {
        status: "PENDING",
        expires_at: { $gt: new Date() },
      },
    ],
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  return Booking.findOne(query).populate("service_id", "name");
};

// Tạo payload lỗi khi thợ chụp bị trùng lịch.
const sendConflictResponse = (res, conflictBooking, message) => {
  return res.status(409).json({
    message,
    conflict: {
      booking_id: conflictBooking._id,
      start_time: conflictBooking.start_time,
      end_time: conflictBooking.end_time,
      service: conflictBooking.service_id?.name,
      photographers: conflictBooking.photographer_ids,
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
  const returnUrl = process.env.VNPAY_RETURN_URL || process.env.VNP_RETURNURL;

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
// CUSTOMER FUNCTIONS
// ==========================================

// Customer tạo đơn đặt lịch và nhận link thanh toán VNPay.
exports.createVnpayPayment = async (req, res) => {
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
      extra_service_ids,
      start_time,
      end_time,
      location,
      note,
      deposit_percent,
    } = req.body;

    if (!service_id) {
      return res.status(400).json({ message: "Thiếu gói dịch vụ" });
    }

    if (!start_time) {
      return res.status(400).json({ message: "Thiếu thời gian bắt đầu" });
    }

    if (!location) {
      return res.status(400).json({ message: "Thiếu địa điểm chụp" });
    }

    const customerId = getCurrentUserId(req);

    await markExpiredPendingBookings(customerId);

    const activePendingBooking = await findActivePendingBooking(customerId);

    if (activePendingBooking) {
      return res.status(409).json({
        message:
          "Bạn đang có một đơn chờ thanh toán. Vui lòng thanh toán hoặc hủy đơn đó trước khi tạo đơn mới.",
        code: "HAS_PENDING_BOOKING",
        booking_id: activePendingBooking._id,
        booking: {
          _id: activePendingBooking._id,
          service_name: activePendingBooking.service_id?.name,
          start_time: activePendingBooking.start_time,
          end_time: activePendingBooking.end_time,
          status: activePendingBooking.status,
          total_amount: getTotalAmount(activePendingBooking),
          expires_at: activePendingBooking.expires_at,
        },
      });
    }

    const service = await Service.findById(service_id);

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
        return res.status(400).json({
          message: "Một hoặc nhiều gói đi kèm không hợp lệ hoặc không được phép chọn làm addon",
        });
      }

      // Không cho chọn trùng gói chính
      if (extra_service_ids.includes(service_id)) {
        return res.status(400).json({
          message: "Gói đi kèm không được trùng với gói chính",
        });
      }

      validatedAddonIds = addonServices.map((s) => s._id);
      addonTotalPrice = addonServices.reduce((sum, s) => sum + Number(s.base_price || 0), 0);
    }

    const startDate = new Date(start_time);

    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        message: "Thời gian bắt đầu không hợp lệ",
      });
    }

    if (startDate < new Date()) {
      return res.status(400).json({
        message: "Không thể đặt lịch trong quá khứ",
      });
    }

    const endDate = end_time
      ? new Date(end_time)
      : moment(startDate)
        .add(service.duration_hours || 4, "hours")
        .toDate();

    // Check lịch studio thay vì thợ chụp
    const conflictBooking = await findStudioConflict({
      startDate,
      endDate,
    });

    if (conflictBooking) {
      return sendConflictResponse(
        res,
        conflictBooking,
        "Studio đã có lịch trong khung giờ này. Vui lòng chọn khung giờ khác.",
      );
    }

    const totalAmount = Number(service.base_price || 0) + addonTotalPrice;
    const depositPercent = Number(deposit_percent || 30);

    if (totalAmount <= 0) {
      return res.status(400).json({
        message: "Giá dịch vụ không hợp lệ",
      });
    }

    if (!DEPOSIT_PERCENTS.includes(depositPercent)) {
      return res.status(400).json({
        message: "Phần trăm thanh toán không hợp lệ",
      });
    }

    const depositAmount = Math.round((totalAmount * depositPercent) / 100);
    const expiresAt = moment().add(BOOKING_HOLD_MINUTES, "minutes").toDate();

    const booking = await Booking.create({
      customer_id: customerId,
      service_id: service._id,
      extra_service_ids: validatedAddonIds,
      start_time: startDate,
      end_time: endDate,
      location,
      note,
      total_amount: totalAmount,
      status: "PENDING",
      expires_at: expiresAt,
    });

    const payment = await Payment.create({
      reference_id: booking._id,
      reference_type: "BOOKING",
      amount: depositAmount,
      payment_method: "VNPAY",
      payment_type:
        depositPercent === 100 ? "FULL_100" : `DEPOSIT_${depositPercent}`,
      status: "PENDING",
      expires_at: expiresAt,
    });

    const paymentUrl = generateVnpayUrl(req, payment);

    return res.status(200).json({
      message: "Tạo đơn đặt lịch và link thanh toán thành công",
      booking_id: booking._id,
      expires_at: booking.expires_at,
      paymentUrl,
    });
  } catch (error) {
    console.error("Create VNPay booking error:", error);

    return res.status(500).json({
      message: "Lỗi khởi tạo đơn hàng",
      error: error.message,
    });
  }
};

// Customer lấy toàn bộ đơn của chính mình.
exports.getMyBookings = async (req, res) => {
  try {
    const customerId = getCurrentUserId(req);

    await markExpiredPendingBookings(customerId);

    const bookings = await Booking.find({ customer_id: customerId })
      .populate("service_id", "name thumbnail base_price duration_hours")
      .populate("extra_service_ids", "name base_price")
      .populate("photographer_ids", "full_name email phone portfolio.avatar")
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
      .populate("service_id", "name thumbnail base_price duration_hours")
      .populate("extra_service_ids", "name base_price")
      .populate(
        "photographer_ids",
        "full_name email phone portfolio.avatar portfolio.bio",
      );

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

// Customer kiểm tra nhanh trạng thái đơn/thanh toán khi frontend polling hoặc countdown hết.
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

// Customer tạo lại link thanh toán nếu đơn còn PENDING và chưa quá hạn.
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

// Customer hủy đơn nếu đơn còn đang chờ thanh toán.
exports.cancelMyBooking = async (req, res) => {
  try {
    if (req.user?.role === "ADMIN") {
      return res.status(403).json({
        message: "Tài khoản quản trị không thể hủy đơn qua luồng khách hàng. Dùng chức năng Hủy đơn trong trang quản lý.",
        code: "ADMIN_NOT_ALLOWED",
      });
    }

    const customerId = getCurrentUserId(req);

    const booking = await Booking.findOne({
      _id: req.params.id,
      customer_id: customerId,
    })
      .populate("service_id", "name thumbnail base_price duration_hours")
      .populate("photographer_ids", "full_name email phone portfolio.avatar");

    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy đơn đặt lịch",
      });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({
        message: "Chỉ có thể hủy đơn đang chờ thanh toán",
      });
    }

    booking.status = "CANCELED";
    await booking.save();

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

    const booking = await Booking.findById(payment.reference_id);

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

      if (booking.expires_at && paidAt > booking.expires_at) {
        booking.status = "CANCELED";
        await booking.save();

        payment.status = "EXPIRED";
        payment.transaction_id = transactionNo;
        await payment.save();

        return res.status(400).json({
          message: "Đơn đặt lịch đã quá hạn thanh toán",
          code: "EXPIRED",
          booking_id: booking._id,
        });
      }

      // Nếu đơn đã bị hủy thủ công trước đó thì không mở lại đơn.
      if (booking.status === "CANCELED" && payment.status !== "EXPIRED") {
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

      booking.status = "DEPOSITED";
      await booking.save();

      return res.status(200).json({
        message: "Giao dịch thành công, đã cập nhật DB",
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

    if (booking.status === "PENDING") {
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
      customer_full_name,
      customer_email,
      customer_phone,
      service_id,
      extra_service_ids,
      photographer_ids,
      assigned_staff_ids,
      external_staff,
      start_time,
      end_time,
      location,
      note,
      total_amount,
      status,
      paid_amount,
      payment_method,
    } = req.body;

    if (!service_id) {
      return res.status(400).json({ message: "Vui lòng chọn gói dịch vụ" });
    }

    if (!start_time) {
      return res.status(400).json({
        message: "Vui lòng chọn thời gian bắt đầu",
      });
    }

    if (!location) {
      return res.status(400).json({
        message: "Vui lòng nhập địa điểm chụp",
      });
    }

    const bookingStatus = status || "DEPOSITED";
    const allowedAdminStatuses = ["PENDING", "DEPOSITED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

    if (!allowedAdminStatuses.includes(bookingStatus)) {
      return res.status(400).json({
        message: "Trạng thái đơn không hợp lệ",
      });
    }

    const service = await Service.findById(service_id);

    if (!service) {
      return res.status(404).json({
        message: "Không tìm thấy gói dịch vụ",
      });
    }

    const photographers = (photographer_ids && Array.isArray(photographer_ids) && photographer_ids.length > 0)
      ? await User.find({
        _id: { $in: photographer_ids },
        role: "PHOTOGRAPHER",
        is_active: true,
      })
      : [];

    if (photographer_ids && photographer_ids.length > 0 && photographers.length !== photographer_ids.length) {
      return res.status(400).json({
        message: "Danh sách nhiếp ảnh gia không hợp lệ",
      });
    }

    const startDate = new Date(start_time);

    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        message: "Thời gian bắt đầu không hợp lệ",
      });
    }

    const endDate = end_time
      ? new Date(end_time)
      : moment(startDate)
        .add(service.duration_hours || 4, "hours")
        .toDate();

    if (Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return res.status(400).json({
        message: "Thời gian kết thúc không hợp lệ",
      });
    }

    await markExpiredPendingBookings();

    const conflictBooking = await findPhotographerConflict({
      photographerIds: photographer_ids,
      startDate,
      endDate,
    });

    if (conflictBooking) {
      return sendConflictResponse(
        res,
        conflictBooking,
        "Nhiếp ảnh gia đã có lịch trong khung giờ này",
      );
    }

    let customer = null;

    // Admin chọn customer có sẵn.
    if (customer_id) {
      customer = await User.findOne({
        _id: customer_id,
        role: "CUSTOMER",
      });

      if (!customer) {
        return res.status(404).json({
          message: "Không tìm thấy tài khoản khách hàng đã chọn",
        });
      }
    } else {
      // Admin nhập thông tin khách mới hoặc khách chưa có tài khoản.
      const normalizedEmail = customer_email?.trim()?.toLowerCase();
      const normalizedPhone = customer_phone?.trim();

      if (!customer_full_name || (!normalizedEmail && !normalizedPhone)) {
        return res.status(400).json({
          message:
            "Vui lòng nhập họ tên và ít nhất email hoặc số điện thoại khách hàng",
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
            message:
              "Email hoặc số điện thoại này đang thuộc tài khoản không phải khách hàng",
          });
        }

        customer = existedUser;
      } else {
        const generatedPassword = crypto.randomBytes(8).toString("hex");
        const password_hash = await bcrypt.hash(generatedPassword, 10);
        const finalEmail =
          normalizedEmail || generateGuestEmailFromPhone(normalizedPhone);

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

    if (bookingStatus === "PENDING") {
      await markExpiredPendingBookings(customer._id);

      const activePendingBooking = await findActivePendingBooking(customer._id);

      if (activePendingBooking) {
        return res.status(409).json({
          message:
            "Khách hàng này đang có một đơn chờ thanh toán. Vui lòng xử lý đơn đó trước khi tạo đơn mới.",
          code: "HAS_PENDING_BOOKING",
          booking_id: activePendingBooking._id,
        });
      }
    }

    const finalTotalAmount =
      total_amount !== undefined && total_amount !== null
        ? Number(total_amount)
        : Number(service.base_price || 0);

    if (finalTotalAmount < 0) {
      return res.status(400).json({
        message: "Tổng tiền không hợp lệ",
      });
    }

    const bookingPayload = {
      customer_id: customer._id,
      service_id: service._id,
      photographer_ids: photographer_ids || [],
      extra_service_ids: extra_service_ids || [],
      assigned_staff_ids: assigned_staff_ids || [],
      external_staff: external_staff || [],
      start_time: startDate,
      end_time: endDate,
      location,
      note,
      total_amount: finalTotalAmount,
      status: bookingStatus,
    };

    if (bookingStatus === "PENDING") {
      bookingPayload.expires_at = moment()
        .add(BOOKING_HOLD_MINUTES, "minutes")
        .toDate();
    }

    const booking = await Booking.create(bookingPayload);
    let payment = null;

    if (["DEPOSITED", "COMPLETED"].includes(bookingStatus)) {
      const defaultPaidAmount =
        bookingStatus === "COMPLETED"
          ? finalTotalAmount
          : Math.round(finalTotalAmount * 0.3);

      const manualPaidAmount =
        paid_amount !== undefined && paid_amount !== null
          ? Number(paid_amount)
          : defaultPaidAmount;

      if (manualPaidAmount > 0) {
        payment = await Payment.create({
          reference_id: booking._id,
          reference_type: "BOOKING",
          amount: manualPaidAmount,
          payment_method: payment_method || "MANUAL",
          payment_type: "ADMIN_CREATED",
          status: "SUCCESS",
          paid_at: new Date(),
        });
      }
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer_id", "full_name email phone")
      .populate("service_id", "name thumbnail base_price duration_hours")
      .populate("extra_service_ids", "name base_price")
      .populate("photographer_ids", "full_name email phone portfolio.avatar")
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
      .populate("service_id", "name thumbnail base_price duration_hours")
      .populate("extra_service_ids", "name base_price")
      .populate("photographer_ids", "full_name email phone portfolio.avatar")
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
      .populate("service_id", "name thumbnail base_price duration_hours")
      .populate("photographer_ids", "full_name email phone portfolio.avatar");

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

    if (status === "PENDING" && !booking.expires_at) {
      booking.expires_at = moment()
        .add(BOOKING_HOLD_MINUTES, "minutes")
        .toDate();
    }

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

// API Lấy danh sách khung giờ bận của thợ chụp
exports.getPhotographerBusySlots = async (req, res) => {
  try {
    const { photographer_id, date, start_date, end_date } = req.query;
    if (!photographer_id) {
      return res.status(400).json({ message: "Thiếu id thợ chụp" });
    }

    let queryStart, queryEnd;
    if (start_date && end_date) {
      queryStart = moment(start_date).startOf("day").toDate();
      queryEnd = moment(end_date).endOf("day").toDate();
    } else if (date) {
      queryStart = moment(date).startOf("day").toDate();
      queryEnd = moment(date).endOf("day").toDate();
    } else {
      return res.status(400).json({ message: "Thiếu ngày cần kiểm tra" });
    }

    const bookings = await Booking.find({
      photographer_ids: photographer_id,
      start_time: { $gte: queryStart, $lte: queryEnd },
      $or: [
        { status: "DEPOSITED" },
        { status: "CONFIRMED" },
        { status: "IN_PROGRESS" },
        { status: "COMPLETED" },
        {
          status: "PENDING",
          expires_at: { $gt: new Date() },
        },
      ],
    }).select("start_time end_time");

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Get photographer busy slots error:", error);
    return res.status(500).json({
      message: "Lỗi lấy thông tin lịch bận của thợ chụp",
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
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Thiếu tham số date" });
    }

    const queryStart = moment(date).startOf("day").toDate();
    const queryEnd = moment(date).endOf("day").toDate();

    const bookings = await Booking.find({
      start_time: { $lte: queryEnd },
      end_time: { $gte: queryStart },
      $or: [
        { status: "DEPOSITED" },
        { status: "CONFIRMED" },
        { status: "IN_PROGRESS" },
        { status: "COMPLETED" },
        {
          status: "PENDING",
          expires_at: { $gt: new Date() },
        },
      ],
    }).select("start_time end_time service_id");

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Get studio busy slots error:", error);
    return res.status(500).json({
      message: "Lỗi lấy thông tin lịch bận của studio",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN — PHÂN EKIP
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

    if (["CANCELED", "EXPIRED", "PAYMENT_FAILED"].includes(booking.status)) {
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
      .populate("customer_id", "full_name email phone")
      .populate("service_id", "name base_price")
      .populate("extra_service_ids", "name base_price")
      .populate("assigned_staff_ids", "full_name email phone")
      .populate("photographer_ids", "full_name email phone");

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