const Booking = require("../models/Booking");
const User = require("../models/User");
const Service = require("../models/Service");
const Resource = require("../models/Resource");
const PublicGallery = require("../models/PublicGallery");
const Payment = require("../models/Payment");

const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getStartOfNextMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

// ==========================================
// ADMIN: Tổng quan Dashboard
// GET /api/dashboard/admin/overview
// ==========================================
exports.getAdminOverview = async (req, res) => {
  try {
    const startOfMonth = getStartOfMonth();
    const startOfNextMonth = getStartOfNextMonth();

    const [
      totalBookings,
      pendingBookings,
      depositedBookings,
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
      activeResources,
      activeRentalResources,
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

      Booking.countDocuments({ status: "PENDING" }),
      Booking.countDocuments({ status: "DEPOSITED" }),
      Booking.countDocuments({ status: "CONFIRMED" }),
      Booking.countDocuments({ status: "IN_PROGRESS" }),
      Booking.countDocuments({ status: "COMPLETED" }),
      Booking.countDocuments({ status: "CANCELED" }),
      Booking.countDocuments({ status: "EXPIRED" }),

      Booking.countDocuments({
        createdAt: {
          $gte: startOfMonth,
          $lt: startOfNextMonth,
        },
      }),

      User.countDocuments({ role: "CUSTOMER" }),
      User.countDocuments({ role: "CUSTOMER", is_active: true }),

      User.countDocuments({ role: "PHOTOGRAPHER" }),
      User.countDocuments({ role: "PHOTOGRAPHER", is_active: true }),

      Service.countDocuments({ is_active: true }),

      Resource.countDocuments({ is_active: true }),

      Resource.countDocuments({
        is_active: true,
        usage_type: { $in: ["RENTAL", "BOTH"] },
      }),

      PublicGallery.countDocuments({ is_active: true }),

      Booking.aggregate([
        {
          $match: {
            status: { $in: ["DEPOSITED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total_amount" },
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            status: "DEPOSITED",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total_amount" },
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            status: "COMPLETED",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total_amount" },
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            status: { $in: ["DEPOSITED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] },
            createdAt: {
              $gte: startOfMonth,
              $lt: startOfNextMonth,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total_amount" },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            status: "SUCCESS",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      Booking.find()
        .populate("customer_id", "full_name email phone")
        .populate("service_id", "name base_price duration_hours")
        .populate("photographer_ids", "full_name email")
        .sort({ createdAt: -1 })
        .limit(6),

      Booking.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const bookingStatus = {
      PENDING: 0,
      DEPOSITED: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELED: 0,
      EXPIRED: 0,
      PAYMENT_FAILED: 0,
    };

    bookingStatusAgg.forEach((item) => {
      bookingStatus[item._id] = item.count;
    });

    res.status(200).json({
      cards: {
        totalBookings,
        pendingBookings,
        depositedBookings,
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
        activeResources,
        activeRentalResources,
        activeGalleries,
      },

      revenue: {
        expectedRevenue: revenueAgg[0]?.total || 0,
        depositedRevenue: depositedRevenueAgg[0]?.total || 0,
        completedRevenue: completedRevenueAgg[0]?.total || 0,
        monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,

        actualPaidRevenue: paymentSuccessAgg[0]?.total || 0,
        successfulPaymentCount: paymentSuccessAgg[0]?.count || 0,
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
