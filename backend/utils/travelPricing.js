const ROUTER_BASE_URL = (process.env.OSRM_ROUTER_URL || "https://router.project-osrm.org").replace(/\/$/, "");

const STUDIO_ORIGIN = {
  lat: Number(process.env.STUDIO_ORIGIN_LAT || 10.2433),
  lon: Number(process.env.STUDIO_ORIGIN_LON || 106.3756),
  label: "Trung tâm Bến Tre",
};

const SURCHARGE_BANDS = [
  { minKm: 0, maxKm: 30, amount: 0, label: "Miễn phí" },
  { minKm: 31, maxKm: 70, amount: 300000, label: "300.000đ" },
  { minKm: 71, maxKm: 100, amount: 500000, label: "500.000đ" },
  { minKm: 101, maxKm: 150, amount: 800000, label: "800.000đ" },
  { minKm: 151, maxKm: 200, amount: 1200000, label: "1.200.000đ" },
  { minKm: 201, maxKm: 250, amount: 1500000, label: "1.500.000đ" },
  { minKm: 251, maxKm: null, amount: null, label: "Báo phí riêng", requiresQuote: true },
];

// Reference distances are studio-approved one-way estimates to each legacy city center.
const DESTINATIONS = {
  "ben-tre": { name: "Bến Tre", referenceKm: 0, lat: 10.2433, lon: 106.3756 },
  "tien-giang-my-tho": { name: "Tiền Giang (Mỹ Tho)", referenceKm: 17, lat: 10.3600, lon: 106.3600 },
  "long-an-tan-an": { name: "Long An (Tân An)", referenceKm: 43, lat: 10.5350, lon: 106.4110 },
  "tra-vinh": { name: "Trà Vinh", referenceKm: 44, lat: 9.9347, lon: 106.3453 },
  "vinh-long": { name: "Vĩnh Long", referenceKm: 76, lat: 10.2397, lon: 105.9572 },
  "ho-chi-minh": { name: "TP.HCM", referenceKm: 82, lat: 10.7769, lon: 106.7009 },
  "can-tho": { name: "Cần Thơ", referenceKm: 106, lat: 10.0452, lon: 105.7469 },
  "dong-thap-cao-lanh": { name: "Đồng Tháp (Cao Lãnh)", referenceKm: 107, lat: 10.4602, lon: 105.6365 },
  "an-giang-long-xuyen": { name: "An Giang (Long Xuyên)", referenceKm: 136, lat: 10.3864, lon: 105.4352 },
  "hau-giang-vi-thanh": { name: "Hậu Giang (Vị Thanh)", referenceKm: 147, lat: 9.7845, lon: 105.4701 },
  "tay-ninh": { name: "Tây Ninh", referenceKm: 151, lat: 11.3100, lon: 106.0983 },
  "soc-trang": { name: "Sóc Trăng", referenceKm: 161, lat: 9.6025, lon: 105.9739 },
  "ba-ria-vung-tau": { name: "Bà Rịa – Vũng Tàu (Vũng Tàu)", referenceKm: 174, lat: 10.3460, lon: 107.0843 },
  "kien-giang-rach-gia": { name: "Kiên Giang (Rạch Giá)", referenceKm: 187, lat: 10.0125, lon: 105.0809 },
  "an-giang-chau-doc": { name: "An Giang (Châu Đốc)", referenceKm: 190, lat: 10.7000, lon: 105.1167 },
  "bac-lieu": { name: "Bạc Liêu", referenceKm: 205, lat: 9.2940, lon: 105.7278 },
  "ca-mau": { name: "Cà Mau", referenceKm: 233, lat: 9.1769, lon: 105.1524 },
  "binh-thuan-phan-thiet": { name: "Bình Thuận (Phan Thiết)", referenceKm: 246, lat: 10.9289, lon: 108.1021 },
  "lam-dong-bao-loc": { name: "Lâm Đồng (Bảo Lộc)", referenceKm: null, lat: 11.5474, lon: 107.8078, requiresQuote: true },
  "lam-dong-da-lat": { name: "Lâm Đồng (Đà Lạt)", referenceKm: 375, lat: 11.9404, lon: 108.4373, requiresQuote: true },
};

const getBand = (distanceKm) => SURCHARGE_BANDS.find((band) =>
  distanceKm >= band.minKm && (band.maxKm === null || distanceKm <= band.maxKm)
);

const isValidCoordinate = (point) => {
  const lat = Number(point?.lat);
  const lon = Number(point?.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= 8 && lat <= 24 && lon >= 102 && lon <= 110;
};

const quoteRequired = (destinationId, distanceKm, source, reason = "") => ({
  destinationId,
  distanceKm,
  surchargeAmount: 0,
  surchargeText: "Studio xác nhận",
  requiresQuote: true,
  status: "QUOTE_REQUIRED",
  source,
  reason,
});

const formatEstimate = (destinationId, distanceKm, source) => {
  const band = getBand(distanceKm);
  if (!band || band.requiresQuote) {
    return quoteRequired(destinationId, distanceKm, source, "Khoảng cách trên 250 km; studio cần xác nhận chi phí thực tế và lưu trú.");
  }
  return {
    destinationId,
    distanceKm,
    surchargeAmount: band.amount,
    surchargeText: band.label,
    requiresQuote: false,
    status: "ESTIMATED",
    source,
  };
};

async function getRoadDistanceKm(destination) {
  const url = `${ROUTER_BASE_URL}/route/v1/driving/${STUDIO_ORIGIN.lon},${STUDIO_ORIGIN.lat};${destination.lon},${destination.lat}?overview=false&alternatives=false&steps=false`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Routing service returned HTTP ${response.status}`);
  const result = await response.json();
  const meters = Number(result?.routes?.[0]?.distance);
  if (result?.code !== "Ok" || !Number.isFinite(meters) || meters < 0) {
    throw new Error(result?.message || "Không tìm được tuyến đường bộ.");
  }
  return Math.ceil(meters / 1000);
}

async function calculateTravelEstimate({ destinationId, destinationCoordinates, hasCustomLocation = false } = {}) {
  const destination = DESTINATIONS[destinationId];
  if (!destination) throw new Error("Khu vực chụp không hợp lệ.");

  if (hasCustomLocation && !isValidCoordinate(destinationCoordinates)) {
    return quoteRequired(destinationId, null, "MANUAL_REVIEW", "Không xác định được tọa độ địa điểm; studio sẽ xác nhận phụ thu.");
  }

  if (isValidCoordinate(destinationCoordinates)) {
    try {
      const distanceKm = await getRoadDistanceKm({
        lat: Number(destinationCoordinates.lat),
        lon: Number(destinationCoordinates.lon),
      });
      return formatEstimate(destinationId, distanceKm, "OSRM_ROUTE");
    } catch (error) {
      console.error("Không tính được tuyến phụ thu:", error.message);
      return quoteRequired(destinationId, null, "MANUAL_REVIEW", "Chưa tính được tuyến tự động; studio sẽ xác nhận phụ thu.");
    }
  }

  if (destination.requiresQuote || !Number.isFinite(destination.referenceKm)) {
    return quoteRequired(destinationId, destination.referenceKm, "CITY_REFERENCE", "Cần xác minh tuyến và chi phí thực tế.");
  }
  return formatEstimate(destinationId, Math.ceil(destination.referenceKm), "CITY_REFERENCE");
}

module.exports = {
  DESTINATIONS,
  STUDIO_ORIGIN,
  calculateTravelEstimate,
};
