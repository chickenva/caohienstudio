/**
 * cronJobs.js
 * Thiết lập các tác vụ tự động chạy theo lịch (cron) của hệ thống.
 * Hiện tại chỉ có 1 job: gửi email nhắc nhở lịch chụp hàng ngày lúc 7:00 sáng.
 */
const cron        = require("node-cron");
const moment      = require("moment");
const Booking     = require("../models/Booking");
const mailService = require("../services/mailService");

/**
 * Đăng ký và khởi động toàn bộ cron jobs của hệ thống.
 * Gọi hàm này một lần duy nhất khi server khởi động.
 */
const setupCronJobs = () => {
  // Job 1: 7:00 sáng mỗi ngày — gửi email nhắc nhở lịch chụp
  cron.schedule("0 7 * * *", async () => {
    console.log("[CRON] Bắt đầu chạy job gửi email nhắc nhở vào lúc 7:00 sáng...");
    try {
      const todayStart    = moment().startOf("day").toDate();
      const todayEnd      = moment().endOf("day").toDate();
      const tomorrowStart = moment().add(1, "days").startOf("day").toDate();
      const tomorrowEnd   = moment().add(1, "days").endOf("day").toDate();

      // a. Nhắc khách hàng: lịch chụp là ngày mai
      const tomorrowBookings = await Booking.find({
        status:     "CONFIRMED",
        start_time: { $gte: tomorrowStart, $lte: tomorrowEnd },
      }).populate("customer_id");

      for (const booking of tomorrowBookings) {
        await mailService.sendReminderToCustomerEmail(booking, booking.customer_id);
      }
      console.log(`[CRON] Đã gửi nhắc nhở cho ${tomorrowBookings.length} khách hàng có lịch chụp ngày mai.`);

      // b. Nhắc Admin: lịch chụp là hôm nay
      const todayBookings = await Booking.find({
        status:     "CONFIRMED",
        start_time: { $gte: todayStart, $lte: todayEnd },
      });

      for (const booking of todayBookings) {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        await mailService.sendReminderToAdminEmail(booking, adminEmail);
      }
      console.log(`[CRON] Đã gửi nhắc nhở cho Admin về ${todayBookings.length} lịch chụp hôm nay.`);

    } catch (error) {
      console.error("[CRON] Lỗi khi gửi email nhắc nhở:", error);
    }
  });

  // NOTE: Đã bỏ cron tự động chuyển CONFIRMED → IN_PROGRESS.
  // Trạng thái IN_PROGRESS phải do admin bấm thủ công khi buổi chụp thật sự bắt đầu.
  // Lý do: Studio cần kiểm soát chính xác thời điểm bắt đầu buổi chụp.

  console.log("[CRON] Đã thiết lập xong các job tự động hóa.");
};

module.exports = setupCronJobs;
