// Script tạo tài khoản admin
// Sử dụng: node seeds/createAdmin.js

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Kiểm tra admin đã tồn tại hay chưa
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("⚠️  Admin account already exists!");
      process.exit(0);
    }

    // Hash password
    const password = "Admin@123"; // Mật khẩu mặc định
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo admin user
    const admin = new User({
      fullName: "Admin",
      phone: "0123456789",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("✅ Admin account created successfully!");
    console.log("\n📋 Admin Account Details:");
    console.log("   Email: admin@gmail.com");
    console.log("   Password: Admin@123");
    console.log("\n⚠️  IMPORTANT: Change this password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
