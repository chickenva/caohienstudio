const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Payment = require("../models/Payment");
const User = require("../models/User");
const crypto = require("crypto");
const moment = require("moment");

// ==========================================
// HÀM HELPER CHUẨN CỦA VNPAY (Bắt buộc phải có)
// ==========================================
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

const generateVnpayUrl = (req, payment) => {
  const tmnCode = process.env.VNPAY_TMN_CODE || process.env.VNP_TMNCODE;
  const secretKey = process.env.VNPAY_SECRET_KEY || process.env.VNP_HASHSECRET;
  const vnpUrl =
    process.env.VNPAY_URL ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = process.env.VNPAY_RETURN_URL || process.env.VNP_RETURNURL;
  const createDate = moment(new Date()).format("YYYYMMDDHHmmss");

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = payment._id.toString();
  vnp_Params["vnp_OrderInfo"] =
    `Thanh toan don dat lich ${payment.reference_id}`;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = payment.amount * 100; // VNPay bắt buộc nhân 100
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  vnp_Params["vnp_CreateDate"] = createDate;

  // Sắp xếp param và mã hóa chữ ký chuẩn VNPay
  vnp_Params = sortObject(vnp_Params);

  const signData = Object.keys(vnp_Params)
    .map((key) => `${key}=${vnp_Params[key]}`)
    .join("&");
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnp_Params["vnp_SecureHash"] = signed;
  const finalUrl =
    vnpUrl +
    "?" +
    Object.keys(vnp_Params)
      .map((key) => `${key}=${vnp_Params[key]}`)
      .join("&");

  return finalUrl;
};

// ==========================================
// 1. TẠO ĐƠN & TẠO LINK VNPAY
// ==========================================
// exports.createVnpayPayment = async (req, res) => {
//   try {
//     const {
//       service_id,
//       photographer_ids,
//       start_time,
//       location,
//       note,
//       deposit_percent,
//     } = req.body;

//     const service = await Service.findById(service_id);
//     if (!service)
//       return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });

//     const total_amount = service.base_price;

//     const depositPercent = Number(deposit_percent || 30);
//     if (![30, 50, 100].includes(depositPercent)) {
//       return res.status(400).json({
//         message: "Phần trăm thanh toán không hợp lệ",
//       });
//     }
//     const depositAmount = Math.round((total_amount * depositPercent) / 100);

//     const end_time = moment(start_time)
//       .add(service.duration_hours || 4, "hours")
//       .toDate();

//     // VALIDATION: Bắt buộc phải chọn thợ chụp, và phải là thợ chụp đang hoạt động
//     if (
//       !photographer_ids ||
//       !Array.isArray(photographer_ids) ||
//       photographer_ids.length === 0
//     ) {
//       return res.status(400).json({
//         message: "Vui lòng chọn ít nhất 1 thợ chụp",
//       });
//     }
//     const photographers = await User.find({
//       _id: { $in: photographer_ids },
//       role: "PHOTOGRAPHER",
//       is_active: true,
//     });

//     if (photographers.length !== photographer_ids.length) {
//       return res.status(400).json({
//         message: "Danh sách thợ chụp không hợp lệ",
//       });
//     }

//     // VALIDATION: Kiểm tra trùng lịch của thợ chụp
//     const startDate = new Date(start_time);
//     const endDate = end_time;

//     if (isNaN(startDate.getTime())) {
//       return res.status(400).json({
//         message: "Thời gian bắt đầu không hợp lệ",
//       });
//     }

//     if (startDate < new Date()) {
//       return res.status(400).json({
//         message: "Không thể đặt lịch trong quá khứ",
//       });
//     }

//     const conflictBooking = await Booking.findOne({
//       photographer_ids: { $in: photographer_ids },
//       status: { $in: ["PENDING", "DEPOSITED"] },
//       start_time: { $lt: endDate },
//       end_time: { $gt: startDate },
//     })
//       .populate("photographer_ids", "full_name email")
//       .populate("service_id", "name");

//     if (conflictBooking) {
//       return res.status(409).json({
//         message: "Thợ chụp đã có lịch trong khung giờ này",
//         conflict: {
//           booking_id: conflictBooking._id,
//           start_time: conflictBooking.start_time,
//           end_time: conflictBooking.end_time,
//           service: conflictBooking.service_id?.name,
//           photographers: conflictBooking.photographer_ids,
//         },
//       });
//     }

//     // Tạo đơn hàng với trạng thái PENDING
//     const newBooking = await Booking.create({
//       customer_id: req.user.id,
//       service_id: service._id,
//       photographer_ids,
//       start_time: startDate,
//       end_time: endDate,
//       location,
//       note,
//       total_amount,
//       status: "PENDING",
//     });

//     const newPayment = await Payment.create({
//       reference_id: newBooking._id,
//       reference_type: "BOOKING",
//       amount: depositAmount,
//       payment_method: "VNPAY",
//       payment_type: `DEPOSIT_${depositPercent}`,
//       status: "PENDING",
//     });

//     const paymentUrl = generateVnpayUrl(req, newPayment);
//     res.status(200).json({ paymentUrl });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Lỗi khởi tạo đơn hàng", error: error.message });
//   }
// };
exports.createVnpayPayment = async (req, res) => {
  try {
    const {
      service_id,
      photographer_ids,
      start_time,
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

    if (
      !photographer_ids ||
      !Array.isArray(photographer_ids) ||
      photographer_ids.length === 0
    ) {
      return res.status(400).json({
        message: "Vui lòng chọn ít nhất 1 thợ chụp",
      });
    }

    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
    }

    const photographers = await User.find({
      _id: { $in: photographer_ids },
      role: "PHOTOGRAPHER",
      is_active: true,
    });

    if (photographers.length !== photographer_ids.length) {
      return res.status(400).json({
        message: "Danh sách thợ chụp không hợp lệ",
      });
    }

    const startDate = new Date(start_time);

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        message: "Thời gian bắt đầu không hợp lệ",
      });
    }

    if (startDate < new Date()) {
      return res.status(400).json({
        message: "Không thể đặt lịch trong quá khứ",
      });
    }

    const endDate = moment(startDate)
      .add(service.duration_hours || 4, "hours")
      .toDate();

    const conflictBooking = await Booking.findOne({
      photographer_ids: { $in: photographer_ids },
      status: { $in: ["PENDING", "DEPOSITED"] },
      start_time: { $lt: endDate },
      end_time: { $gt: startDate },
    })
      .populate("photographer_ids", "full_name email")
      .populate("service_id", "name");

    if (conflictBooking) {
      return res.status(409).json({
        message: "Thợ chụp đã có lịch trong khung giờ này",
        conflict: {
          booking_id: conflictBooking._id,
          start_time: conflictBooking.start_time,
          end_time: conflictBooking.end_time,
          service: conflictBooking.service_id?.name,
          photographers: conflictBooking.photographer_ids,
        },
      });
    }

    const total_amount = service.base_price;
    const depositPercent = Number(deposit_percent || 30);

    if (![30, 50, 100].includes(depositPercent)) {
      return res.status(400).json({
        message: "Phần trăm thanh toán không hợp lệ",
      });
    }

    const depositAmount = Math.round((total_amount * depositPercent) / 100);

    const newBooking = await Booking.create({
      customer_id: req.user.id,
      service_id: service._id,
      photographer_ids,
      start_time: startDate,
      end_time: endDate,
      location,
      note,
      total_amount,
      status: "PENDING",
    });

    const newPayment = await Payment.create({
      reference_id: newBooking._id,
      reference_type: "BOOKING",
      amount: depositAmount,
      payment_method: "VNPAY",
      payment_type: `DEPOSIT_${depositPercent}`,
      status: "PENDING",
    });

    const paymentUrl = generateVnpayUrl(req, newPayment);

    res.status(200).json({
      message: "Tạo đơn đặt lịch và link thanh toán thành công",
      booking_id: newBooking._id,
      paymentUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Lỗi khởi tạo đơn hàng",
      error: error.message,
    });
  }
};

// ==========================================
// 2. LẤY DANH SÁCH ĐƠN CỦA KHÁCH HÀNG
// ==========================================
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer_id: req.user.id })
      .populate("service_id", "name thumbnail base_price duration_hours")
      .populate("photographer_ids", "full_name email phone portfolio.avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách đơn",
      error: error.message,
    });
  }
};

// ==========================================
// 3. XEM CHI TIẾT 1 ĐƠN HÀNG
// ==========================================
exports.getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      customer_id: req.user.id,
    })
      .populate("service_id", "name thumbnail base_price duration_hours")
      .populate(
        "photographer_ids",
        "full_name email phone portfolio.avatar portfolio.bio portfolio.specialties",
      );

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });
    }

    const payments = await Payment.find({ reference_id: booking._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ booking, payments });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy chi tiết đơn",
      error: error.message,
    });
  }
};

// ==========================================
// 4. KIỂM TRA TRẠNG THÁI THANH TOÁN (Cho Polling)
// ==========================================
exports.checkPaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });

    const payment = await Payment.findOne({ reference_id: req.params.id }).sort(
      { createdAt: -1 },
    );
    res.status(200).json({
      status: booking.status,
      payment_status: payment?.status || "PENDING",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy chi tiết đơn", error: error.message });
  }
};

// ==========================================
// 4. TẠO LẠI LINK THANH TOÁN
// ==========================================
exports.repayBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      customer_id: req.user.id,
    });
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    if (booking.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Đơn hàng này không ở trạng thái chờ thanh toán" });
    }

    let payment = await Payment.findOne({
      reference_id: booking._id,
      status: "PENDING",
    });
    if (!payment)
      return res
        .status(400)
        .json({ message: "Không tìm thấy giao dịch chờ thanh toán" });

    const paymentUrl = generateVnpayUrl(req, payment);
    res.status(200).json({ paymentUrl });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi tạo lại link thanh toán", error: error.message });
  }
};

// ==========================================
// 5. CẬP NHẬT TRẠNG THÁI (Dành cho Admin)
// ==========================================
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái đơn" });
  }
};

// ==========================================
// ==========================================
// 6. XỬ LÝ KẾT QUẢ VNPAY TRẢ VỀ (Hỗ trợ GET và POST)
// ==========================================
exports.vnpayReturn = async (req, res) => {
  try {
    // FIX 1: Hỗ trợ cả GET (từ VNPay redirect) và POST (từ Frontend)
    let vnp_Params = req.method === "GET" ? req.query : req.body;
    const secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // FIX 2: Sắp xếp bằng hàm chuẩn VNPay
    vnp_Params = sortObject(vnp_Params);

    const secretKey =
      process.env.VNPAY_SECRET_KEY || process.env.VNP_HASHSECRET;
    const signData = Object.keys(vnp_Params)
      .map((key) => `${key}=${vnp_Params[key]}`)
      .join("&");
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      const paymentId = vnp_Params["vnp_TxnRef"];
      const payment = await Payment.findById(paymentId);

      if (!payment)
        return res.status(404).json({ message: "Không tìm thấy giao dịch" });

      // FIX 3: Bắt buộc check mã ResponseCode == "00" (Giao dịch thành công)
      if (vnp_Params["vnp_ResponseCode"] === "00") {
        payment.status = "SUCCESS";
        payment.paid_at = new Date();
        await payment.save();

        await Booking.findByIdAndUpdate(payment.reference_id, {
          status: "DEPOSITED",
        });
        return res.status(200).json({
          message: "Giao dịch thành công, đã cập nhật DB",
          code: "00",
        });
      } else {
        // Khách hàng bấm hủy thanh toán, hoặc thẻ hết tiền
        payment.status = "FAILED";
        await payment.save();
        return res.status(400).json({
          message: "Giao dịch thất bại hoặc bị hủy",
          code: vnp_Params["vnp_ResponseCode"],
        });
      }
    } else {
      res.status(400).json({
        message: "Sai chữ ký xác thực (Invalid Signature) - Phát hiện giả mạo!",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi xử lý kết quả VNPay", error: error.message });
  }
};
