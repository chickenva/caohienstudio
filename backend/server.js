/**
 * server.js
 * Entry point của backend Cao Hiển Studio.
 * Khởi động Express, kết nối MongoDB, đăng ký routes và cron jobs.
 */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const dns = require("node:dns");

// Routes
const authRoutes = require("./routes/authRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const contactRoutes = require("./routes/contactRoutes");
const userRoutes = require("./routes/userRoutes");
const driveRoutes = require("./routes/driveRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiChatRoutes = require("./routes/aiChatRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const websiteRoutes = require("./routes/websiteRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const cameraRentalRoutes = require("./routes/cameraRentalRoutes");
const holidayRoutes = require("./routes/holidayRoutes");

// Cron jobs
const setupCronJobs = require("./jobs/cronJobs");

const app = express();

app.use(express.json());
app.use(cors());

// Phục vụ file tĩnh: PDF hợp đồng, font chữ, v.v.
app.use("/public", express.static(path.join(__dirname, "public")));

// Kết nối MongoDB; retry SRV lookup qua DNS dự phòng nếu resolver mặc định lỗi.
const isSrvDnsError = (error) => {
  const messages = [];
  const pending = [error];
  const visited = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    messages.push(current.syscall, current.code, current.message);
    pending.push(current.cause, current.reason);
  }
  return /query(?:srv|txt)/i.test(messages.filter(Boolean).join(" "));
};

const connectMongo = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ DB Error: MONGO_URI chưa được cấu hình.");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    if (!mongoUri.startsWith("mongodb+srv://") || !isSrvDnsError(error)) {
      console.error("❌ DB Error", error);
      return;
    }

    const dnsServers = (process.env.MONGODB_DNS_SERVERS || "1.1.1.1,8.8.8.8")
      .split(",")
      .map((server) => server.trim())
      .filter(Boolean);

    try {
      dns.setServers(dnsServers);
      console.warn(`⚠️ MongoDB SRV lookup lỗi; thử lại qua DNS dự phòng: ${dnsServers.join(", ")}`);
      await mongoose.connect(mongoUri);
      console.log("✅ MongoDB Connected (DNS fallback)");
    } catch (fallbackError) {
      console.error("❌ DB Error sau khi thử DNS dự phòng", fallbackError);
    }
  }
};

connectMongo();

app.get("/health", (req, res) => {
  res.send("Cao Hiển Studio API is running...");
});

// Đăng ký API routes
app.use("/api/auth", authRoutes);
app.use("/api/galleries", galleryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/users", userRoutes);
app.use("/api/drive", driveRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/website", websiteRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/camera-rentals", cameraRentalRoutes);
app.use("/api/holidays", holidayRoutes);

const PORT = process.env.PORT || 5000;

// Khởi chạy cron jobs (gửi mail nhắc lịch, v.v.)
setupCronJobs();

app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
