const Booking = require("../models/Booking");
const Service = require("../models/Service");
const crypto = require("crypto");
const moment = require("moment");

const generateVnpayUrl = (req, booking, depositAmount) => {
  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = process.env.VNP_HASHSECRET;
  const vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURNURL;
  const createDate = moment(new Date()).format("YYYYMMDDHHmmss");

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = booking._id.toString();
  vnp_Params["vnp_OrderInfo"] = "ThanhToanTienCocLichChup";
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = depositAmount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = "127.0.0.1";
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

// API: Tạo đơn mới (Giữ nguyên logic tính cọc của bạn)
exports.createVnpayPayment = async (req, res) => {
  try {
    const { serviceId, appointmentDate, location, note } = req.body;
    const service = await Service.findById(serviceId);

    // Tính cọc theo logic Tiered (30-50-100)
    const diffDays = moment(appointmentDate).diff(
      moment().startOf("day"),
      "days",
    );
    let ratio = diffDays < 3 ? 1 : diffDays <= 6 ? 0.5 : 0.3;
    const depositAmount = Math.round(service.price * ratio);

    const newBooking = new Booking({
      userId: req.user.id,
      serviceName: service.name,
      price: service.price,
      depositAmount,
      appointmentDate,
      location,
      note,
      status: "Pending",
    });
    const savedBooking = await newBooking.save();

    const paymentUrl = generateVnpayUrl(req, savedBooking, depositAmount);
    res.status(200).json({ paymentUrl });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo đơn" });
  }
};

// API MỚI: Lấy lại link thanh toán cho đơn đang Pending
exports.repayBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn" });

    // Kiểm tra xem đơn còn cho phép thanh toán không (chưa bị hủy)
    if (booking.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Đơn hàng này không ở trạng thái chờ thanh toán" });
    }

    const paymentUrl = generateVnpayUrl(req, booking, booking.depositAmount);
    res.status(200).json({ paymentUrl });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo lại link thanh toán" });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let updateData = { status };

    // Nếu thanh toán thành công, ghi nhận thời điểm để tính 12h ân hạn
    if (status === "Confirmed") {
      updateData.paidAt = new Date();
    }

    const updated = await Booking.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Lỗi cập nhật trạng thái đơn" });
  }
};
exports.getMyBookings = async (req, res) => {
  const b = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(b);
};
exports.getBookingDetail = async (req, res) => {
  const b = await Booking.findById(req.params.id);
  res.json(b);
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn" });

    const now = moment();
    const paidAt = moment(booking.paidAt);
    const appointDate = moment(booking.appointmentDate);

    const hoursSincePayment = now.diff(paidAt, "hours");
    const daysToAppointment = appointDate.diff(now, "days");

    let refundAmount = 0;
    let refundPolicy = "Không hoàn cọc theo quy định";

    // 1. Kiểm tra chính sách Ân hạn (Cooling-off) - 12 giờ
    // Chỉ áp dụng cho Đặt sớm và Đặt cận ngày (>= 3 ngày)
    if (booking.bookingType !== "Urgent" && hoursSincePayment <= 12) {
      refundAmount = booking.depositAmount;
      refundPolicy = "Hoàn trả 100% trong thời gian ân hạn 12h";
    }
    // 2. Quy định hủy tiêu chuẩn (Nếu đã quá 12h ân hạn)
    else {
      if (daysToAppointment > 7) {
        refundAmount = booking.depositAmount; // Hủy trước 7 ngày: Hoàn 100%
        refundPolicy = "Hoàn trả 100% do hủy trước 7 ngày";
      } else {
        refundAmount = 0; // Hủy trong vòng 7 ngày: Không hoàn
        refundPolicy = "Không hoàn cọc do hủy trong vòng 7 ngày";
      }
    }

    // Nếu là đơn Đặt gấp (< 3 ngày): Luôn rơi vào refundAmount = 0
    // vì logic trên đã loại trừ bookingType !== 'Urgent'

    booking.status = "Cancelled";
    booking.refundAmount = refundAmount;
    await booking.save();

    res.status(200).json({
      message: "Hủy đơn thành công",
      refundAmount,
      policy: refundPolicy,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xử lý hủy đơn" });
  }
};
