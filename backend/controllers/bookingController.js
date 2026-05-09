const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Payment = require("../models/Payment");
const crypto = require("crypto");
const moment = require("moment");

// Hàm Helper tạo URL VNPay (Dùng Payment._id làm mã giao dịch để dễ đối soát)
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
  vnp_Params["vnp_TxnRef"] = payment._id.toString(); // Dùng Payment ID thay vì Booking ID
  vnp_Params["vnp_OrderInfo"] =
    `Thanh toan don dat lich ${payment.reference_id}`;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = payment.amount * 100; // VNPay nhân 100
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  vnp_Params["vnp_CreateDate"] = createDate;

  const sortedParams = {};
  const keys = Object.keys(vnp_Params).sort();
  keys.forEach((key) => {
    sortedParams[key] = vnp_Params[key];
  });

  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
};

// ==========================================
// 1. TẠO ĐƠN & TẠO LINK VNPAY
// ==========================================
exports.createVnpayPayment = async (req, res) => {
  try {
    // Nhận data chuẩn từ Frontend mới
    const { service_id, start_time, location, note, deposit_percent } =
      req.body;

    // 1. Lấy thông tin gói dịch vụ
    const service = await Service.findById(service_id);
    if (!service)
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });

    // 2. Tính toán tiền bạc và thời gian
    const total_amount = service.base_price;
    const depositAmount = Math.round((total_amount * deposit_percent) / 100);
    const end_time = moment(start_time)
      .add(service.duration_hours || 4, "hours")
      .toDate();

    // 3. Tạo Đơn đặt lịch (Booking)
    const newBooking = await Booking.create({
      customer_id: req.user.id, // Lấy từ token Auth Middleware
      service_id: service._id,
      start_time: new Date(start_time),
      end_time: end_time,
      location,
      note,
      total_amount,
      status: "PENDING",
    });

    // 4. Tạo Lịch sử thanh toán (Payment)
    const newPayment = await Payment.create({
      reference_id: newBooking._id,
      reference_type: "BOOKING",
      amount: depositAmount,
      payment_method: "VNPAY",
      payment_type: `DEPOSIT_${deposit_percent}`, // DEPOSIT_30, DEPOSIT_50, DEPOSIT_100
      status: "PENDING",
    });

    // 5. Sinh Link VNPay
    const paymentUrl = generateVnpayUrl(req, newPayment);
    res.status(200).json({ paymentUrl });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Lỗi khởi tạo đơn hàng", error: error.message });
  }
};

// ==========================================
// 2. LẤY DANH SÁCH ĐƠN CỦA KHÁCH HÀNG (Dùng cho MyBookings.jsx)
// ==========================================
exports.getMyBookings = async (req, res) => {
  try {
    // Lấy booking và join (populate) với bảng Service để lấy tên và ảnh gói chụp
    const bookings = await Booking.find({ customer_id: req.user.id })
      .populate("service_id", "name thumbnail base_price")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách đơn", error: error.message });
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
    }).populate("service_id", "name thumbnail base_price duration_hours");

    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt lịch" });

    // Lấy thêm lịch sử thanh toán của đơn này
    const payments = await Payment.find({ reference_id: booking._id });

    res.status(200).json({ booking, payments });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy chi tiết đơn", error: error.message });
  }
};

// ==========================================
// 4. TẠO LẠI LINK THANH TOÁN (Nếu khách thoát ra chưa thanh toán kịp)
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

    // Tìm record Payment đang Pending của Booking này
    let payment = await Payment.findOne({
      reference_id: booking._id,
      status: "PENDING",
    });

    if (!payment) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy giao dịch chờ thanh toán" });
    }

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
// 6. XỬ LÝ KẾT QUẢ VNPAY TRẢ VỀ (CALLBACK BẢO MẬT)
// ==========================================
exports.vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.body;
    const secureHash = vnp_Params["vnp_SecureHash"];

    // Bỏ 2 trường Hash ra để tạo lại chữ ký
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // Sắp xếp lại params theo chuẩn cấu trúc của VNPay
    vnp_Params = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    const secretKey =
      process.env.VNPAY_SECRET_KEY || process.env.VNP_HASHSECRET;
    const signData = new URLSearchParams(vnp_Params).toString();
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // KIỂM TRA CHỮ KÝ
    if (secureHash === signed) {
      const paymentId = vnp_Params["vnp_TxnRef"]; // Lấy ID của Payment

      // 1. Tìm giao dịch Payment
      const payment = await Payment.findById(paymentId);
      if (!payment)
        return res.status(404).json({ message: "Không tìm thấy giao dịch" });

      // 2. Cập nhật trạng thái Payment -> SUCCESS
      payment.status = "SUCCESS";
      payment.paid_at = new Date();
      await payment.save();

      // 3. Cập nhật trạng thái Booking -> DEPOSITED (Đã đặt cọc)
      await Booking.findByIdAndUpdate(payment.reference_id, {
        status: "DEPOSITED",
      });

      res.status(200).json({ message: "Giao dịch thành công, đã cập nhật DB" });
    } else {
      res
        .status(400)
        .json({
          message:
            "Sai chữ ký xác thực (Invalid Signature) - Phát hiện giả mạo!",
        });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi xử lý kết quả VNPay", error: error.message });
  }
};
