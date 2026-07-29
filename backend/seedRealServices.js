// Script seed dữ liệu dịch vụ mẫu theo nghiệp vụ studio.
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Service = require("./models/Service");

dotenv.config();

const commonThumb = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop";
const photoThumb = "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop";
const videoThumb = "https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=1200&auto=format&fit=crop";
const printThumb = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop";

const services = [
  // --- TRUYỀN THỐNG ---
  {
    name: "Chụp truyền thống 01",
    category: "TRADITIONAL",
    base_price: 3000000,
    duration_hours: 6,
    thumbnail: photoThumb,
    description: "Gói chụp truyền thống một buổi full, tập trung ảnh nghi thức, gia đình và khoảnh khắc lưu niệm.",
    features: ["1 máy chụp", "Chụp 1 buổi full", "Giao file đã chỉnh sửa", "In 100 ảnh 13x18 lụa cao cấp"],
  },
  {
    name: "Chụp truyền thống 02",
    category: "TRADITIONAL",
    base_price: 4000000,
    duration_hours: 8,
    thumbnail: photoThumb,
    description: "Gói chụp truyền thống mở rộng cho lễ công cô, tiệc nhà hàng phụ thu hoặc tiệc phát sinh.",
    features: ["1 máy chụp", "Chụp 1 buổi full + lễ công cô / tiệc nhà hàng phụ thu / tiệc phát sinh", "Giao file đã chỉnh sửa", "In 100 ảnh 13x18 lụa cao cấp"],
  },
  {
    name: "Chụp truyền thống 03",
    category: "TRADITIONAL",
    base_price: 5000000,
    duration_hours: 10,
    thumbnail: photoThumb,
    description: "Gói chụp full ngày cho tiệc kéo dài trong ngày, đã bao gồm chụp lễ công cô.",
    features: ["1 máy chụp", "Chụp full ngày, tiệc kéo dài trong ngày", "Đã bao gồm chụp lễ công cô", "Giao file đã chỉnh sửa", "In 150 ảnh 13x18 lụa cao cấp"],
  },
  {
    name: "Quay truyền thống 01",
    category: "TRADITIONAL",
    base_price: 4000000,
    duration_hours: 6,
    thumbnail: videoThumb,
    description: "Gói quay truyền thống một buổi full, phù hợp ghi hình nghi thức chính trong ngày cưới.",
    features: ["1 máy quay", "Quay 1 buổi full", "Giao file Google Drive + USB"],
  },
  {
    name: "Quay truyền thống 02",
    category: "TRADITIONAL",
    base_price: 5000000,
    duration_hours: 8,
    thumbnail: videoThumb,
    description: "Gói quay truyền thống mở rộng, có thể bao gồm lễ công cô, tiệc nhà hàng phụ thu hoặc tiệc phát sinh.",
    features: ["1 máy quay", "Quay 1 buổi full + lễ công cô / tiệc nhà hàng phụ thu / tiệc phát sinh", "Giao file Google Drive + USB"],
  },
  {
    name: "Quay lễ công cô",
    category: "TRADITIONAL",
    base_price: 1000000,
    duration_hours: 3,
    thumbnail: videoThumb,
    description: "Gói quay riêng buổi lễ xuất giá hoặc công cô tại nhà trai hoặc nhà gái.",
    features: ["1 máy quay", "Quay buổi lễ xuất giá - công cô tại nhà trai hoặc nhà gái", "Phim được gộp chung với phim chính"],
  },
  {
    name: "Gói lẻ lễ tối / xuất giá / lạy công cô",
    category: "TRADITIONAL",
    base_price: 1000000,
    duration_hours: 3,
    thumbnail: photoThumb,
    description: "Gói chụp lẻ dành cho lễ tối, xuất giá hoặc lạy công cô, không bao gồm chụp tiệc.",
    features: ["Chụp lẻ lễ tối / xuất giá / lạy công cô", "Không bao gồm chụp tiệc", "Giao file đã chỉnh sửa"],
  },
  {
    name: "Gói thêm flycam",
    category: "TRADITIONAL",
    base_price: 2000000,
    duration_hours: 4,
    thumbnail: videoThumb,
    description: "Dịch vụ bay flycam áp dụng chung cho tất cả các gói quay truyền thống.",
    features: ["Góc quay trên cao", "Chỉ áp dụng kèm các gói quay"],
  },

  // --- PHÓNG SỰ ---
  {
    name: "Chụp phóng sự - Basic",
    category: "PHOTOJOURNALISM",
    base_price: 5000000,
    duration_hours: 6,
    thumbnail: commonThumb,
    description: "Gói chụp phóng sự ghi lại khoảnh khắc tự nhiên, cảm xúc và câu chuyện ngày cưới.",
    features: ["1 máy chụp", "Chụp 1 buổi full", "Giao file đã chỉnh sửa", "Không bao gồm in ấn"],
  },
  {
    name: "Chụp phóng sự - VIP",
    category: "PHOTOJOURNALISM",
    base_price: 8000000,
    duration_hours: 6,
    thumbnail: commonThumb,
    description: "Gói chụp phóng sự cao cấp với 2 máy chụp, giúp bắt được nhiều góc và nhiều khoảnh khắc hơn.",
    features: ["2 máy chụp", "Chụp 1 buổi full", "Giao file đã chỉnh sửa", "Không bao gồm in ấn"],
  },
  {
    name: "Quay phóng sự - Basic",
    category: "PHOTOJOURNALISM",
    base_price: 6000000,
    duration_hours: 6,
    thumbnail: videoThumb,
    description: "Gói quay phóng sự cơ bản, tập trung cảm xúc tự nhiên và những khoảnh khắc chân thật.",
    features: ["1 máy quay", "Quay 1 buổi full", "Giao file phim Google Drive + USB"],
  },
  {
    name: "Quay phóng sự - VIP",
    category: "PHOTOJOURNALISM",
    base_price: 8000000,
    duration_hours: 6,
    thumbnail: videoThumb,
    description: "Gói quay phóng sự VIP với 2 máy quay, phù hợp khi cần nhiều góc máy và câu chuyện đầy đủ hơn.",
    features: ["2 máy quay", "Quay 1 buổi full", "Giao file phim Google Drive + USB"],
  },
  {
    name: "Gói thêm flycam",
    category: "PHOTOJOURNALISM",
    base_price: 2000000,
    duration_hours: 4,
    thumbnail: videoThumb,
    description: "Dịch vụ bay flycam áp dụng chung cho tất cả các gói quay phóng sự.",
    features: ["Góc quay trên cao", "Chỉ áp dụng kèm các gói quay"],
  },

  // --- KẾT HỢP ---
  {
    name: "Chụp phóng sự + truyền thống Basic",
    category: "COMBO",
    base_price: 6000000,
    duration_hours: 6,
    thumbnail: commonThumb,
    description: "Gói kết hợp giữa ảnh truyền thống và ảnh phóng sự, cân bằng giữa ảnh nghi thức và khoảnh khắc tự nhiên.",
    features: ["2 máy chụp: 1 truyền thống + 1 phóng sự", "Chụp 1 buổi full", "Giao file đã chỉnh sửa", "Không bao gồm in ấn"],
  },
  {
    name: "Chụp phóng sự + truyền thống VIP",
    category: "COMBO",
    base_price: 8000000,
    duration_hours: 6,
    thumbnail: commonThumb,
    description: "Gói kết hợp VIP với 3 máy chụp, phù hợp cho ngày cưới cần ghi lại trọn vẹn nghi thức và cảm xúc.",
    features: ["3 máy chụp: 2 truyền thống + 1 phóng sự", "Chụp 1 buổi full", "Giao file đã chỉnh sửa", "Không bao gồm in ấn"],
  },
  {
    name: "In ảnh lẻ 13x18 lụa cao cấp",
    category: "PRINT",
    base_price: 10000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "Dịch vụ in ảnh lẻ kích thước 13x18 trên chất liệu lụa cao cấp.",
    features: ["Loại in: Ảnh lẻ", "Kích thước 13x18", "Chất liệu lụa cao cấp"],
  },
  {
    name: "In ảnh lẻ 15x21 lụa cao cấp",
    category: "PRINT",
    base_price: 15000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "Dịch vụ in ảnh lẻ kích thước 15x21 trên chất liệu lụa cao cấp.",
    features: ["Loại in: Ảnh lẻ", "Kích thước 15x21", "Chất liệu lụa cao cấp"],
  },
  {
    name: "Photobook 100 ảnh 13x18",
    category: "PRINT",
    base_price: 1200000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "Photobook 100 ảnh kích thước 13x18, chất lượng siêu sắc nét.",
    features: ["Loại in: Photobook", "100 ảnh 13x18", "Chất liệu siêu sắc nét"],
  },
  {
    name: "Photobook 100 ảnh 15x21",
    category: "PRINT",
    base_price: 1500000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "Photobook 100 ảnh kích thước 15x21, chất lượng siêu sắc nét.",
    features: ["Loại in: Photobook", "100 ảnh 15x21", "Chất liệu siêu sắc nét"],
  },
  {
    name: "Photobook 30x30 - 30 trang",
    category: "PRINT",
    base_price: 2000000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "Photobook kích thước 30x30 gồm 30 trang, chất lượng siêu sắc nét.",
    features: ["Loại in: Photobook", "Kích thước 30x30", "30 trang", "Chất liệu siêu sắc nét"],
  },
  {
    name: "Photobook 25x35 - 30 trang",
    category: "PRINT",
    base_price: 2000000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "Photobook kích thước 25x35 gồm 30 trang, chất lượng siêu sắc nét.",
    features: ["Loại in: Photobook", "Kích thước 25x35", "30 trang", "Chất liệu siêu sắc nét"],
  },
  {
    name: "Photobook 35x30 - 30 trang",
    category: "PRINT",
    base_price: 3000000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "Photobook kích thước 35x30 gồm 30 trang, chất lượng siêu sắc nét.",
    features: ["Loại in: Photobook", "Kích thước 35x30", "30 trang", "Chất liệu siêu sắc nét"],
  },
  {
    name: "Hình lớn 40x60 ép gỗ",
    category: "PRINT",
    base_price: 200000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "In hình lớn kích thước 40x60, chất liệu ép gỗ.",
    features: ["Loại in: Hình lớn", "Kích thước 40x60", "Chất liệu ép gỗ"],
  },
  {
    name: "Hình lớn 40x60 mika HD",
    category: "PRINT",
    base_price: 300000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "In hình lớn kích thước 40x60, chất liệu mika HD.",
    features: ["Loại in: Hình lớn", "Kích thước 40x60", "Chất liệu mika HD"],
  },
  {
    name: "Hình lớn 60x90 ép gỗ",
    category: "PRINT",
    base_price: 500000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "In hình lớn kích thước 60x90, chất liệu ép gỗ.",
    features: ["Loại in: Hình lớn", "Kích thước 60x90", "Chất liệu ép gỗ"],
  },
  {
    name: "Hình lớn 60x90 mika HD",
    category: "PRINT",
    base_price: 800000,
    duration_hours: 1,
    thumbnail: printThumb,
    description: "In hình lớn kích thước 60x90, chất liệu mika HD.",
    features: ["Loại in: Hình lớn", "Kích thước 60x90", "Chất liệu mika HD"],
  },
];

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI/MONGODB_URI in backend/.env");
  }

  await mongoose.connect(mongoUri);
  await Service.deleteMany({});
  
  const servicesWithOrder = services.map((s, idx) => ({ ...s, order: idx + 1 }));
  await Service.insertMany(servicesWithOrder);

  const grouped = await Service.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  console.log("Seeded real service menu:", grouped);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
