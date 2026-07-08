require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

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
const setupCronJobs = require("./jobs/cronJobs");

const app = express();
app.use(express.json());
app.use(cors());

// Connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error", err));

// Routes
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

const PORT = process.env.PORT || 5000;

// Khởi chạy các cron jobs tự động hóa (gửi mail, cập nhật trạng thái đơn)
setupCronJobs();

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
