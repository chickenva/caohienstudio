require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME, ADMIN_PHONE } =
      process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_FULL_NAME) {
      console.log(
        "❌ Thiếu ADMIN_EMAIL, ADMIN_PASSWORD hoặc ADMIN_FULL_NAME trong .env",
      );
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      existingAdmin.role = "ADMIN";
      existingAdmin.full_name = existingAdmin.full_name || ADMIN_FULL_NAME;
      existingAdmin.phone = existingAdmin.phone || ADMIN_PHONE;
      existingAdmin.is_active = true;

      await existingAdmin.save();

      console.log("✅ Admin đã tồn tại, đã cập nhật role ADMIN");
      process.exit(0);
    }

    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.create({
      email: ADMIN_EMAIL,
      password_hash,
      full_name: ADMIN_FULL_NAME,
      phone: ADMIN_PHONE,
      role: "ADMIN",
      is_active: true,
    });

    console.log("✅ Tạo tài khoản admin thành công");
    console.log(`Email: ${ADMIN_EMAIL}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed admin error:", error);
    process.exit(1);
  }
};

seedAdmin();
