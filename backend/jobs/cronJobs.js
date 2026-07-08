const cron = require("node-cron");
const moment = require("moment");
const Booking = require("../models/Booking");
const mailService = require("../services/mailService");

const setupCronJobs = () => {
  // 1. Chạy vào 7:00 Sáng mỗi ngày: Gửi email nhắc nhở
  cron.schedule("0 7 * * *", async () => {
    console.log("[CRON] Bắt đầu chạy job gửi email nhắc nhở vào lúc 7:00 Sáng...");
    try {
      const todayStart = moment().startOf("day").toDate();
      const todayEnd = moment().endOf("day").toDate();
      const tomorrowStart = moment().add(1, "days").startOf("day").toDate();
      const tomorrowEnd = moment().add(1, "days").endOf("day").toDate();

      // a. Nhắc khách hàng (ngày chụp là ngày mai)
      const tomorrowBookings = await Booking.find({
        status: "CONFIRMED",
        start_time: { $gte: tomorrowStart, $lte: tomorrowEnd },
      }).populate("customer_id");

      for (const booking of tomorrowBookings) {
        await mailService.sendReminderToCustomerEmail(booking, booking.customer_id);
      }
      console.log(`[CRON] Đã gửi nhắc nhở cho ${tomorrowBookings.length} khách hàng có lịch chụp ngày mai.`);

      // b. Nhắc Admin (ngày chụp là hôm nay)
      const todayBookings = await Booking.find({
        status: "CONFIRMED",
        start_time: { $gte: todayStart, $lte: todayEnd },
      });

      for (const booking of todayBookings) {
        // Gửi email cho Admin (có thể lấy từ process.env.ADMIN_EMAIL hoặc cấu hình tùy chỉnh)
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        await mailService.sendReminderToAdminEmail(booking, adminEmail);
      }
      console.log(`[CRON] Đã gửi nhắc nhở cho Admin về ${todayBookings.length} lịch chụp hôm nay.`);

    } catch (error) {
      console.error("[CRON] Lỗi khi gửi email nhắc nhở:", error);
    }
  });

  // 2. Chạy vào 23:55 mỗi ngày: Tự động chuyển trạng thái đơn "CONFIRMED" thành "IN_PROGRESS"
  cron.schedule("55 23 * * *", async () => {
    console.log("[CRON] Bắt đầu chạy job cập nhật trạng thái IN_PROGRESS lúc 23:55...");
    try {
      const todayStart = moment().startOf("day").toDate();
      const todayEnd = moment().endOf("day").toDate();

      const todayBookings = await Booking.find({
        status: "CONFIRMED",
        start_time: { $gte: todayStart, $lte: todayEnd },
      });

      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

      for (const booking of todayBookings) {
        booking.status = "IN_PROGRESS";
        await booking.save();
        await mailService.sendAutoInProgressToAdminEmail(booking, adminEmail);
      }

      if (todayBookings.length > 0) {
        console.log(`[CRON] Đã tự động cập nhật ${todayBookings.length} đơn hàng sang IN_PROGRESS.`);
      } else {
        console.log("[CRON] Không có đơn hàng nào cần tự động cập nhật trạng thái hôm nay.");
      }
    } catch (error) {
      console.error("[CRON] Lỗi khi tự động cập nhật trạng thái:", error);
    }
  });

  console.log("[CRON] Đã thiết lập xong các job tự động hóa.");
};

module.exports = setupCronJobs;
