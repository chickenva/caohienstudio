/**
 * Legacy province/city destinations and travel surcharge policy for Cao Hien Studio.
 * Reference distances follow the studio-approved one-way road-distance table.
 */
export const TRAVEL_SURCHARGE_BANDS = [
  { tier: 1, minKm: 0, maxKm: 30, tierName: "0–30 km", surchargeAmount: 0, surchargeText: "Miễn phí" },
  { tier: 2, minKm: 31, maxKm: 70, tierName: "31–70 km", surchargeAmount: 300000, surchargeText: "300.000đ" },
  { tier: 3, minKm: 71, maxKm: 100, tierName: "71–100 km", surchargeAmount: 500000, surchargeText: "500.000đ" },
  { tier: 4, minKm: 101, maxKm: 150, tierName: "101–150 km", surchargeAmount: 800000, surchargeText: "800.000đ" },
  { tier: 5, minKm: 151, maxKm: 200, tierName: "151–200 km", surchargeAmount: 1200000, surchargeText: "1.200.000đ" },
  { tier: 6, minKm: 201, maxKm: 250, tierName: "201–250 km", surchargeAmount: 1500000, surchargeText: "1.500.000đ" },
  { tier: 7, minKm: 251, maxKm: null, tierName: "Trên 250 km", surchargeAmount: null, surchargeText: "Báo phí riêng", requiresQuote: true },
];

// Điểm đại diện và khoảng cách một chiều đã được studio chốt để tính giá mặc định.
// Tọa độ thành phố dùng cho dự báo thời tiết và tính tuyến khi khách chọn địa chỉ cụ thể.
const DESTINATIONS = [
  { id: "ben-tre", name: "Bến Tre", regionName: "Bến Tre", referenceName: "Trung tâm Bến Tre", referenceKm: 0, lat: 10.2433, lon: 106.3756 },
  { id: "tien-giang-my-tho", name: "Tiền Giang (Mỹ Tho)", regionName: "Tiền Giang", weatherName: "Mỹ Tho", referenceName: "Mỹ Tho", referenceKm: 17, lat: 10.3600, lon: 106.3600 },
  { id: "long-an-tan-an", name: "Long An (Tân An)", regionName: "Long An", weatherName: "Tân An", referenceName: "Tân An", referenceKm: 43, lat: 10.5350, lon: 106.4110 },
  { id: "tra-vinh", name: "Trà Vinh", regionName: "Trà Vinh", referenceName: "Trung tâm Trà Vinh", referenceKm: 44, lat: 9.9347, lon: 106.3453 },
  { id: "vinh-long", name: "Vĩnh Long", regionName: "Vĩnh Long", referenceName: "Trung tâm Vĩnh Long", referenceKm: 76, lat: 10.2397, lon: 105.9572 },
  { id: "ho-chi-minh", name: "TP.HCM", regionName: "TP.HCM", weatherName: "Thành phố Hồ Chí Minh", referenceName: "Trung tâm TP.HCM", referenceKm: 82, lat: 10.7769, lon: 106.7009 },
  { id: "can-tho", name: "Cần Thơ", regionName: "Cần Thơ", referenceName: "Trung tâm Cần Thơ", referenceKm: 106, lat: 10.0452, lon: 105.7469 },
  { id: "dong-thap-cao-lanh", name: "Đồng Tháp (Cao Lãnh)", regionName: "Đồng Tháp", weatherName: "Cao Lãnh", referenceName: "Cao Lãnh", referenceKm: 107, lat: 10.4602, lon: 105.6365 },
  { id: "an-giang-long-xuyen", name: "An Giang (Long Xuyên)", regionName: "An Giang", weatherName: "Long Xuyên", referenceName: "Long Xuyên", referenceKm: 136, lat: 10.3864, lon: 105.4352 },
  { id: "hau-giang-vi-thanh", name: "Hậu Giang (Vị Thanh)", regionName: "Hậu Giang", weatherName: "Vị Thanh", referenceName: "Vị Thanh", referenceKm: 147, lat: 9.7845, lon: 105.4701 },
  { id: "tay-ninh", name: "Tây Ninh", regionName: "Tây Ninh", referenceName: "Trung tâm Tây Ninh", referenceKm: 151, lat: 11.3100, lon: 106.0983 },
  { id: "soc-trang", name: "Sóc Trăng", regionName: "Sóc Trăng", referenceName: "Trung tâm Sóc Trăng", referenceKm: 161, lat: 9.6025, lon: 105.9739 },
  { id: "ba-ria-vung-tau", name: "Bà Rịa – Vũng Tàu (Vũng Tàu)", regionName: "Bà Rịa – Vũng Tàu", weatherName: "Vũng Tàu", referenceName: "Vũng Tàu", referenceKm: 174, lat: 10.3460, lon: 107.0843 },
  { id: "kien-giang-rach-gia", name: "Kiên Giang (Rạch Giá)", regionName: "Kiên Giang", weatherName: "Rạch Giá", referenceName: "Rạch Giá", referenceKm: 187, lat: 10.0125, lon: 105.0809 },
  { id: "an-giang-chau-doc", name: "An Giang (Châu Đốc)", regionName: "An Giang", weatherName: "Châu Đốc", referenceName: "Châu Đốc", referenceKm: 190, lat: 10.7000, lon: 105.1167 },
  { id: "bac-lieu", name: "Bạc Liêu", regionName: "Bạc Liêu", referenceName: "Trung tâm Bạc Liêu", referenceKm: 205, lat: 9.2940, lon: 105.7278 },
  { id: "ca-mau", name: "Cà Mau", regionName: "Cà Mau", referenceName: "Trung tâm Cà Mau", referenceKm: 233, lat: 9.1769, lon: 105.1524 },
  { id: "binh-thuan-phan-thiet", name: "Bình Thuận (Phan Thiết)", regionName: "Bình Thuận", weatherName: "Phan Thiết", referenceName: "Phan Thiết", referenceKm: 246, lat: 10.9289, lon: 108.1021 },
  { id: "lam-dong-bao-loc", name: "Lâm Đồng (Bảo Lộc)", regionName: "Lâm Đồng", weatherName: "Bảo Lộc", referenceName: "Bảo Lộc", referenceKm: null, lat: 11.5474, lon: 107.8078, requiresQuote: true },
  { id: "lam-dong-da-lat", name: "Lâm Đồng (Đà Lạt)", regionName: "Lâm Đồng", weatherName: "Đà Lạt", referenceName: "Đà Lạt", referenceKm: 375, lat: 11.9404, lon: 108.4373, requiresQuote: true },
];

const getBandForDistance = (distanceKm) => {
  if (!Number.isFinite(Number(distanceKm))) return null;
  const roundedKm = Math.ceil(Number(distanceKm));
  return TRAVEL_SURCHARGE_BANDS.find((band) =>
    roundedKm >= band.minKm && (band.maxKm === null || roundedKm <= band.maxKm)
  ) || null;
};

export const SHOOTING_LOCATION_TIERS = TRAVEL_SURCHARGE_BANDS.map((band) => {
  const locations = DESTINATIONS
    .filter((destination) => {
      if (destination.requiresQuote) return band.requiresQuote;
      const distanceBand = getBandForDistance(destination.referenceKm);
      return distanceBand?.tier === band.tier;
    })
    .map((destination) => ({ ...destination }));

  return {
    ...band,
    distance: band.maxKm === null ? "Trên 250 km" : `${band.minKm}–${band.maxKm} km`,
    surchargeMin: band.surchargeAmount ?? 0,
    surchargeMax: band.surchargeAmount ?? 0,
    note: band.requiresQuote ? "Studio xác nhận chi phí thực tế, thời gian di chuyển và lưu trú trước khi chốt." : "Phụ thu áp dụng một lần cho một booking.",
    locations,
  };
}).filter((band) => band.locations.length > 0);

export const FORECAST_LOCATIONS = SHOOTING_LOCATION_TIERS.flatMap((tierGroup) =>
  tierGroup.locations.map((destination) => {
    const band = destination.requiresQuote ? TRAVEL_SURCHARGE_BANDS[6] : getBandForDistance(destination.referenceKm);
    return {
      ...destination,
      tier: band.tier,
      tierName: band.tierName,
      surchargeText: band.surchargeText,
      surchargeAmount: band.surchargeAmount,
      distance: destination.referenceKm === null ? "Cần xác minh tuyến" : `${destination.referenceKm} km (một chiều, tham khảo)`,
      tierNote: band.requiresQuote ? "Studio xác nhận chi phí thực tế và lưu trú nếu cần." : "Mức tham khảo theo trung tâm điểm đến.",
    };
  })
);

// Bảng giá đã được chốt lấy trung tâm Bến Tre làm điểm xuất phát.
export const DEFAULT_STUDIO_LOCATION = FORECAST_LOCATIONS.find((destination) => destination.id === "ben-tre") || FORECAST_LOCATIONS[0];

export const getLocationTierInfo = (cityName) => {
  if (!cityName) return null;
  const normalized = String(cityName).toLocaleLowerCase("vi");
  return FORECAST_LOCATIONS.find((destination) =>
    destination.name.toLocaleLowerCase("vi") === normalized ||
    destination.regionName.toLocaleLowerCase("vi") === normalized ||
    normalized.includes(destination.regionName.toLocaleLowerCase("vi"))
  ) || null;
};

export const getReferenceTravelEstimate = (destination) => {
  if (!destination || destination.requiresQuote || destination.referenceKm === null) {
    return {
      destinationId: destination?.id || null,
      distanceKm: null,
      surchargeAmount: 0,
      surchargeText: "Báo phí riêng",
      requiresQuote: true,
      source: "MANUAL_REVIEW",
    };
  }

  const band = getBandForDistance(destination.referenceKm);
  return {
    destinationId: destination.id,
    distanceKm: destination.referenceKm,
    surchargeAmount: band?.surchargeAmount ?? 0,
    surchargeText: band?.surchargeText || "Báo phí riêng",
    requiresQuote: Boolean(band?.requiresQuote),
    source: "CITY_REFERENCE",
  };
};
