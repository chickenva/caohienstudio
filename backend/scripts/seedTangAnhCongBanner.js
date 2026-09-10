/**
 * seedTangAnhCongBanner.js
 * Seed banner "TẶNG ẢNH CỔNG TRỌN GÓI BẤT KÌ"
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Banner = require("../models/Banner");

const seedBanner = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ Thiếu biến môi trường MONGO_URI");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Đã kết nối MongoDB");

    // Xóa banner cũ nếu có
    await Banner.deleteMany({
      title: { $regex: /tặng ảnh cổng/i },
    });

    const bannerData = {
      title: "TẶNG ẢNH CỔNG TRỌN GÓI BẤT KÌ",
      description: "Chương trình khuyến mãi đặc quyền mùa cưới: Tặng ngay ảnh cổng sang trọng khi đăng ký gói chụp ảnh bất kì tại Cao Hiển Studio. Hotline / Zalo: 0979 7676 02 • Đ/c: 3B4 Phú Nhuận, P. An Hội, Vĩnh Long.",
      imageUrl: "http://localhost:5000/public/uploads/wedding_promo_tang_anh_cong.png",
      linkUrl: "/booking",
      discount_percent: 0,
      start_date: new Date("2025-01-01"),
      end_date: new Date("2030-12-31"),
      is_active: true,
      position: "HOME_TOP",
      order: 2,
    };

    const newBanner = await Banner.create(bannerData);
    console.log("🎉 Đã seed banner thành công:", newBanner.title);

    await mongoose.disconnect();
    console.log("✅ Đã ngắt kết nối MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi seed banner:", error);
    process.exit(1);
  }
};

seedBanner();
