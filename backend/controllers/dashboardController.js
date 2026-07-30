/**
 * dashboardController.js
 * Cung cấp dữ liệu thống kê tổng quan cho Admin Dashboard.
 * Tổng hợp số liệu đơn đặt lịch, doanh thu, khách hàng, dịch vụ và album.
 */
const Booking      = require("../models/Booking");
const User         = require("../models/User");
const Service      = require("../models/Service");
const PublicGallery = require("../models/PublicGallery");
const Payment      = require("../models/Payment");

// Lấy mốc đầu tháng hiện tại (để lọc dữ liệu trong tháng)
const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

// Lấy mốc đầu tháng sau (tạo khoảng [đầu tháng, đầu tháng sau))
const getStartOfNextMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

/**
 * [GET] /api/dashboard/admin/overview
 * Thống kê tổng quan Dashboard Admin: số lượng đơn theo trạng thái,
 * doanh thu (kỳ vọng/thực nhận), khách hàng, thợ chụp, dịch vụ, album và đơn mới nhất.
 */
exports.getAdminOverview = async (req, res) => {
  try {
    const startOfMonth     = getStartOfMonth();
    const startOfNextMonth = getStartOfNextMonth();

    // Chạy tất cả query song song để tối ưu thời gian phản hồi
    const [
      totalBookings,
      requestedBookings,
      contractSentBookings,
      waitingPaymentBookings,
      legacyPendingBookings,
      legacyDepositedBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      canceledBookings,
      expiredBookings,

      monthlyBookings,
      totalCustomers,
      activeCustomers,
      totalPhotographers,
      activePhotographers,
      activeServices,
      activeGalleries,

      revenueAgg,
      depositedRevenueAgg,
      completedRevenueAgg,
      monthlyRevenueAgg,
      paymentSuccessAgg,

      recentBookings,
      bookingStatusAgg,
    ] = await Promise.all([
      Booking.countDocuments(),

      Booking.countDocuments({ status: "REQUESTED" }),
      Booking.countDocuments({ status: "CONTRACT_SENT" }),
      Booking.countDocuments({ status: "WAITING_PAYMENT" }),
      Booking.countDocuments({ status: "PENDING" }),
      Booking.countDocuments({ status: "DEPOSITED" }),
      Booking.countDocuments({ status: "CONFIRMED" }),
      Booking.countDocuments({ status: "IN_PROGRESS" }),
      Booking.countDocuments({ status: "COMPLETED" }),
      Booking.countDocuments({ status: "CANCELED" }),
      Booking.countDocuments({ status: "EXPIRED" }),

      // Số đơn tạo trong tháng hiện tại
      Booking.countDocuments({
        createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
      }),

      User.countDocuments({ role: "CUSTOMER" }),
      User.countDocuments({ role: "CUSTOMER", is_active: true }),

      User.countDocuments({ role: "PHOTOGRAPHER" }),
      User.countDocuments({ role: "PHOTOGRAPHER", is_active: true }),

      Service.countDocuments({ is_active: true }),
      PublicGallery.countDocuments({ is_active: true }),

      // Doanh thu kỳ vọng: tổng giá trị đơn CONFIRMED/IN_PROGRESS/COMPLETED/DEPOSITED
      Booking.aggregate([
        { $match: { status: { $in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "DEPOSITED"] } } },
        { $group: { _id: null, total: { $sum: "$total_amount" } } },
      ]),

      // Doanh thu từ đơn đang chờ xác nhận (WAITING_PAYMENT, DEPOSITED legacy)
      Booking.aggregate([
        { $match: { status: { $in: ["WAITING_PAYMENT", "DEPOSITED"] } } },
        { $group: { _id: null, total: { $sum: "$total_amount" } } },
      ]),

      // Doanh thu đã hoàn thành
      Booking.aggregate([
        { $match: { status: "COMPLETED" } },
        { $group: { _id: null, total: { $sum: "$total_amount" } } },
      ]),

      // Doanh thu kỳ vọng trong tháng hiện tại
      Booking.aggregate([
        {
          $match: {
            status: { $in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "DEPOSITED"] },
            createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$total_amount" } } },
      ]),

      // Doanh thu thực nhận: tổng các giao dịch SUCCESS từ bảng Payment
      Payment.aggregate([
        { $match: { status: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),

      // 6 đơn mới nhất (có populate đầy đủ)
      Booking.find()
        .populate("customer_id",    "full_name email phone")
        .populate("service_id",     "name base_price duration_hours")
        .populate("photographer_ids", "full_name email")
        .sort({ createdAt: -1 })
        .limit(6),

      // Phân bố đơn theo trạng thái
      Booking.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    // Map kết quả aggregate trạng thái vào object dễ dùng hơn
    const bookingStatus = {
      REQUESTED:      0,
      CONTRACT_SENT:  0,
      WAITING_PAYMENT: 0,
      PENDING:        0,
      DEPOSITED:      0,
      CONFIRMED:      0,
      IN_PROGRESS:    0,
      COMPLETED:      0,
      CANCELED:       0,
      EXPIRED:        0,
      PAYMENT_FAILED: 0,
    };

    bookingStatusAgg.forEach((item) => {
      bookingStatus[item._id] = item.count;
    });

    res.status(200).json({
      cards: {
        totalBookings,
        requestedBookings,
        contractSentBookings,
        waitingPaymentBookings,
        pendingBookings:   waitingPaymentBookings + legacyPendingBookings,
        depositedBookings: legacyDepositedBookings,
        confirmedBookings,
        inProgressBookings,
        completedBookings,
        canceledBookings,
        expiredBookings,
        monthlyBookings,

        totalCustomers,
        activeCustomers,

        totalPhotographers,
        activePhotographers,

        activeServices,
        activeGalleries,
      },

      revenue: {
        expectedRevenue:         revenueAgg[0]?.total          || 0,
        depositedRevenue:        depositedRevenueAgg[0]?.total || 0,
        completedRevenue:        completedRevenueAgg[0]?.total || 0,
        monthlyRevenue:          monthlyRevenueAgg[0]?.total   || 0,
        actualPaidRevenue:       paymentSuccessAgg[0]?.total   || 0,
        successfulPaymentCount:  paymentSuccessAgg[0]?.count   || 0,
      },

      bookingStatus,
      recentBookings,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    res.status(500).json({
      message: "Lỗi lấy dữ liệu dashboard",
      error: error.message,
    });
  }
};
