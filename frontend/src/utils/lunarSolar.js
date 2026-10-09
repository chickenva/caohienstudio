/**
 * lunarSolar.js
 * Thuật toán tính Âm lịch Việt Nam chuẩn thiên văn (Thuật toán TS. Hồ Ngọc Đức).
 * Hỗ trợ chuyển đổi ngày Dương lịch sang Âm lịch, nhận diện ngày rằm, mùng 1
 * và các ngày lễ cổ truyền Việt Nam.
 */

function jdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function getNewMoonDay(k, timeZone = 7) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr);
  C1 = C1 - 0.0004 * Math.sin(3 * dr * Mpr);
  C1 = C1 + 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin((M + Mpr) * dr);
  C1 = C1 - 0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
  C1 = C1 - 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
  C1 = C1 + 0.001 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((2 * Mpr + M) * dr);

  let deltat;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  const JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(dayNumber, timeZone = 7) {
  const T = (dayNumber - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  const L = 218.3165 + 481267.8813 * T;
  const M = 357.5291 + 35999.0503 * T - 0.0001603 * T2;
  let C = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(M * dr);
  C = C + (0.019993 - 0.000101 * T) * Math.sin(2 * M * dr) + 0.00029 * Math.sin(3 * M * dr);
  const theta = L0 + C;
  return Math.floor(((theta % 360 + 360) % 360) / 30);
}

function getLunarMonth11(yy, timeZone = 7) {
  const k = Math.floor((jdFromDate(31, 12, yy) - 2415021.0769986) / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11, timeZone = 7) {
  const k = Math.floor((a11 - 2415021.0769986) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

/**
 * Chuyển ngày Dương lịch (dd, mm, yy) sang ngày Âm lịch
 * @returns { day, month, year, leap }
 */
export function convertSolar2Lunar(dd, mm, yy, timeZone = 7) {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.0769986) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  const b11 = a11;
  let lunarYear = yy;
  if (a11 >= monthStart) {
    lunarYear = yy - 1;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    const nextA11 = getLunarMonth11(yy + 1, timeZone);
    if (nextA11 <= monthStart) {
      lunarYear = yy + 1;
      a11 = nextA11;
    }
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = 0;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = 1;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
}

/**
 * Danh sách các ngày lễ / tết Âm lịch cổ truyền
 */
const TRADITIONAL_LUNAR_HOLIDAYS = {
  "1-1": "Mùng 1 Tết Nguyên Đán",
  "2-1": "Mùng 2 Tết Nguyên Đán",
  "3-1": "Mùng 3 Tết Nguyên Đán",
  "15-1": "Rằm tháng Giêng (Tết Nguyên Tiêu)",
  "3-3": "Tết Hàn Thực",
  "10-3": "Giỗ Tổ Hùng Vương",
  "15-4": "Đại lễ Phật Đản",
  "5-5": "Tết Đoan Ngọ",
  "15-7": "Lễ Vu Lan (Rằm tháng 7)",
  "15-8": "Tết Trung Thu (Rằm tháng 8)",
  "9-9": "Tết Trùng Cửu",
  "15-10": "Tết Hạ Nguyên",
  "23-12": "Ông Công Ông Táo",
};

/**
 * Lấy thông tin Âm lịch đầy đủ từ đối tượng dayjs
 */
export function getLunarInfo(dayjsDate) {
  if (!dayjsDate || !dayjsDate.isValid()) return null;
  const dd = dayjsDate.date();
  const mm = dayjsDate.month() + 1; // 1-12
  const yy = dayjsDate.year();

  const lunar = convertSolar2Lunar(dd, mm, yy);
  const holidayKey = `${lunar.day}-${lunar.month}`;
  const holidayName = TRADITIONAL_LUNAR_HOLIDAYS[holidayKey] || null;

  // Hiển thị nhãn rút gọn: nếu là mùng 1 hoặc ngày rằm thì ghi rõ (vd: 1/8 hoặc 15/8)
  const isFirstDayOfMonth = lunar.day === 1;
  const isFullMoon = lunar.day === 15;
  const shortLabel = isFirstDayOfMonth
    ? `${lunar.day}/${lunar.month}`
    : isFullMoon
    ? `${lunar.day}/${lunar.month}`
    : `${lunar.day}`;

  return {
    ...lunar,
    shortLabel,
    holidayName,
    isFirstDayOfMonth,
    isFullMoon,
    fullLabel: `${lunar.day}/${lunar.month}${lunar.leap ? " (Nhuận)" : ""} ÂL`,
  };
}
