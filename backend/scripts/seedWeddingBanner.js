/**
 * seedWeddingBanner.js
 * Script seed banner quảng cáo đám cưới theo yêu cầu của người dùng.
 * Sử dụng hình ảnh và nội dung từ poster ảnh cưới:
 * - Tiêu đề: "Chụp ảnh CỔNG GIÁ KHÓ TIN — CHỈ VỚI 999k"
 * - Trọn gói ngày cưới: "4 TRIỆU 900K"
 * - Các ưu điểm: Hình ảnh sắc nét, Chụp nhanh - gọn - đẹp, Ảnh chỉnh sửa chuyên nghiệp, Giao ảnh nhanh chóng
 * - Hotline: 0979 767 602 | Địa chỉ: Bến Tre - Vĩnh Long - TP. HCM
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Banner = require("../models/Banner");

const seedBanner = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ Thiếu biến môi trường MONGO_URI trong .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Đã kết nối MongoDB");

    // Xóa banner cũ cùng tiêu đề nếu đã tồn tại để tránh trùng lặp
    await Banner.deleteMany({
      title: { $regex: /chụp ảnh cổng/i }
    });

    const bannerData = {
      title: "Chụp ảnh CỔNG GIÁ KHÓ TIN chỉ với 999k — Trọn gói ngày cưới chỉ 4.900.000đ",
      description: "Lưu giữ khoảnh khắc, trọn vẹn cảm xúc! Hình ảnh sắc nét • Chụp nhanh gọn đẹp • Chỉnh sửa chuyên nghiệp • Giao ảnh nhanh chóng. Hotline: 0979 767 602 (Bến Tre - Vĩnh Long - TP. HCM)",
      imageUrl: "http://localhost:5000/public/uploads/wedding_promo_999k.jpg",
      linkUrl: "/booking",
      discount_percent: 50,
      start_date: new Date("2025-01-01"),
      end_date: new Date("2030-12-31"),
      is_active: true,
      position: "HOME_TOP",
      order: 1,
    };

    const newBanner = await Banner.create(bannerData);
    console.log("🎉 Đã seed banner thành công:", newBanner);

    await mongoose.disconnect();
    console.log("✅ Đã ngắt kết nối MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi seed banner:", error);
    process.exit(1);
  }
};

seedBanner();
