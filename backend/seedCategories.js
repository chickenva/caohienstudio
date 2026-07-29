require("dotenv").config();
// Script seed danh mục dịch vụ/album ban đầu.
const mongoose = require("mongoose");
const Category = require("./models/Category");

const serviceCategories = [
  { name: "Chụp / Quay truyền thống", slug: "TRADITIONAL", type: "SERVICE", description: "Các gói quay và chụp truyền thống cho lễ cưới, lễ công cô, tiệc nhà hàng và những khoảnh khắc quan trọng trong ngày cưới." },
  { name: "Chụp / Quay phóng sự", slug: "PHOTOJOURNALISM", type: "SERVICE", description: "Các gói phóng sự ghi lại câu chuyện ngày cưới tự nhiên, cảm xúc và giàu tính tư liệu." },
  { name: "Chụp kết hợp", slug: "COMBO", type: "SERVICE", description: "Gói kết hợp giữa phong cách truyền thống và phóng sự, phù hợp khi bạn muốn vừa đủ nghi thức vừa có câu chuyện trọn vẹn." },
  { name: "In ảnh / Photobook", slug: "PRINT", type: "SERVICE", description: "Dịch vụ in ảnh, hình lớn, photobook và album lưu giữ kỷ niệm sau buổi chụp." },
  { name: "Khác", slug: "OTHER", type: "SERVICE", description: "Các dịch vụ đi kèm hoặc khác." },
];

const galleryCategories = [
  { name: "Ảnh cưới", slug: "WEDDING", type: "GALLERY", description: "Những bộ ảnh cưới lãng mạn, ghi lại trọn vẹn khoảnh khắc hạnh phúc nhất." },
  { name: "Chân dung", slug: "PORTRAIT", type: "GALLERY", description: "Các bộ ảnh chân dung nghệ thuật, profile doanh nhân hoặc nàng thơ." },
  { name: "Sự kiện", slug: "EVENT", type: "GALLERY", description: "Ảnh phóng sự sự kiện, hội nghị, khai trương, sinh nhật." },
  { name: "Kỷ yếu", slug: "GRADUATION", type: "GALLERY", description: "Album kỷ yếu thanh xuân lưu giữ những kỷ niệm tuổi học trò." },
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const allCategories = [...serviceCategories, ...galleryCategories];
    let addedCount = 0;

    for (const cat of allCategories) {
      const exists = await Category.findOne({ slug: cat.slug, type: cat.type });
      if (!exists) {
        await Category.create(cat);
        console.log(`Added category: ${cat.name} (${cat.slug})`);
        addedCount++;
      } else {
        console.log(`Category already exists: ${cat.name} (${cat.slug})`);
      }
    }

    console.log(`\n🎉 Seeding complete. Added ${addedCount} new categories.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error", error);
    process.exit(1);
  }
};

seedCategories();
