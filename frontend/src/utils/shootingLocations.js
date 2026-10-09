/**
 * shootingLocations.js
 * Danh mục khu vực chụp và quy chuẩn tính phụ thu cự ly di chuyển cho Cao Hiển Studio.
 * Phân cấp theo 5 bậc cự ly (Căn cứ tài liệu Báo cáo tiến độ phân tích yêu cầu).
 */

export const SHOOTING_LOCATION_TIERS = [
  {
    tier: 1,
    tierName: "Bậc 1 - Vùng lõi",
    distance: "Đến 30 km hoặc trong khu vực",
    surchargeText: "0 đồng (Miễn phí)",
    surchargeMin: 0,
    surchargeMax: 0,
    note: "Tự động áp dụng khi chọn một trong ba tỉnh; không phát sinh phụ thu.",
    locations: [
      { name: "Vĩnh Long", lat: 10.2500, lon: 105.9667, tag: "Trụ sở Studio" },
      { name: "Bến Tre", lat: 10.1094, lon: 106.5526 },
      { name: "Cần Thơ", lat: 10.1547, lon: 105.5005 },
    ],
  },
  {
    tier: 2,
    tierName: "Bậc 2 - Vùng liền kề",
    distance: "31 - 70 km",
    surchargeText: "300.000 - 500.000 đồng",
    surchargeMin: 300000,
    surchargeMax: 500000,
    note: "Di chuyển bằng xe máy hoặc ô tô; thời gian dự kiến 1 - 1,5 giờ.",
    locations: [
      { name: "Trà Vinh", lat: 9.6667, lon: 106.3333 },
      { name: "Tiền Giang", lat: 10.3500, lon: 106.3500 },
      { name: "Đồng Tháp", lat: 10.6667, lon: 105.6667 },
      { name: "Hậu Giang", lat: 9.7833, lon: 105.4667 },
    ],
  },
  {
    tier: 3,
    tierName: "Bậc 3 - Vùng tầm trung",
    distance: "71 - 150 km",
    surchargeText: "800.000 - 1.200.000 đồng",
    surchargeMin: 800000,
    surchargeMax: 1200000,
    note: "Di chuyển bằng ô tô; thời gian dự kiến 2 - 3 giờ. Hỗ trợ xăng xe và vé cao tốc.",
    locations: [
      { name: "TP. Hồ Chí Minh", lat: 10.7626, lon: 106.6602 },
      { name: "Long An", lat: 10.9050, lon: 106.6994 },
      { name: "Sóc Trăng", lat: 9.6000, lon: 105.9667 },
      { name: "An Giang", lat: 10.5149, lon: 105.1132 },
      { name: "Bạc Liêu", lat: 9.3477, lon: 105.5097 },
    ],
  },
  {
    tier: 4,
    tierName: "Bậc 4 - Vùng xa",
    distance: "151 - 250 km",
    surchargeText: "1.500.000 - 2.200.000 đồng",
    surchargeMin: 1500000,
    surchargeMax: 2200000,
    note: "Thời gian di chuyển dự kiến 4 - 5 giờ; ekip có thể khởi hành sớm hoặc lưu trú.",
    locations: [
      { name: "Cà Mau", lat: 9.0833, lon: 105.0833 },
      { name: "Kiên Giang", lat: 10.0125, lon: 105.0809, note: "Rạch Giá" },
      { name: "Bà Rịa - Vũng Tàu", lat: 10.3460, lon: 107.0843 },
      { name: "Tây Ninh", lat: 11.3333, lon: 106.1667 },
    ],
  },
  {
    tier: 5,
    tierName: "Bậc 5 - Ngoại cảnh đặc thù",
    distance: "Trên 250 km hoặc địa hình đèo",
    surchargeText: "2.500.000 - 4.000.000 đồng (hoặc combo 2N1Đ)",
    surchargeMin: 2500000,
    surchargeMax: 4000000,
    note: "Chụp đồi thông, săn mây. Chi phí gồm xe ô tô riêng, công tác phí và lưu trú cho ekip.",
    locations: [
      { name: "Lâm Đồng", lat: 11.9404, lon: 108.4373, note: "Đà Lạt, Bảo Lộc" },
      { name: "Bình Thuận", lat: 10.9333, lon: 108.1000, note: "Phan Thiết" },
    ],
  },
];

// Danh sách phẳng tất cả địa điểm được phục vụ
export const FORECAST_LOCATIONS = SHOOTING_LOCATION_TIERS.flatMap((tierGroup) =>
  tierGroup.locations.map((loc) => ({
    ...loc,
    tier: tierGroup.tier,
    tierName: tierGroup.tierName,
    surchargeText: tierGroup.surchargeText,
    distance: tierGroup.distance,
    tierNote: tierGroup.note,
  }))
);

// Mặc định địa điểm trụ sở studio
export const DEFAULT_STUDIO_LOCATION =
  FORECAST_LOCATIONS.find((c) => c.name === "Vĩnh Long") || FORECAST_LOCATIONS[0];

// Lấy thông tin bậc cự ly theo tên tỉnh thành
export const getLocationTierInfo = (cityName) => {
  if (!cityName) return null;
  return FORECAST_LOCATIONS.find((c) => c.name === cityName || cityName.includes(c.name)) || null;
};
