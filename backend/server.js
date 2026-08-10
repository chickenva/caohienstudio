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

// Cron jobs
const setupCronJobs = require("./jobs/cronJobs");

const app = express();

app.use(express.json());
app.use(cors());

// Phục vụ file tĩnh: PDF hợp đồng, font chữ, v.v.
app.use("/public", express.static(path.join(__dirname, "public")));

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error", err));

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

const PORT = process.env.PORT || 5000;

// Khởi chạy cron jobs (gửi mail nhắc lịch, v.v.)
setupCronJobs();

app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
