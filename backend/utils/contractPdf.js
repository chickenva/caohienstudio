/**
 * contractPdf.js
 * Sinh file PDF hợp đồng dịch vụ nhiếp ảnh Cao Hiển Studio.
 * Sử dụng pdfkit (không cần Chrome/Puppeteer).
 */

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const moment = require("moment");

// Đường dẫn thư mục lưu file PDF
const CONTRACT_DIR = path.join(__dirname, "..", "public", "contracts");

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(CONTRACT_DIR)) {
  fs.mkdirSync(CONTRACT_DIR, { recursive: true });
}

// Đường dẫn font tiếng Việt
const FONT_REGULAR_PATH = path.join(__dirname, "..", "public", "fonts", "Roboto-Regular.ttf");
const FONT_BOLD_PATH = path.join(__dirname, "..", "public", "fonts", "Roboto-Bold.ttf");

// Tên font được register vào PDFKit
const FONT_REGULAR = "Roboto-Regular";
const FONT_BOLD = "Roboto-Bold";

const GOLD = "#BFA16A";
const DARK = "#1A1A1A";
const GRAY = "#555555";
const LIGHT_GRAY = "#888888";
const LINE_COLOR = "#E8DCC8";

/**
 * Định dạng số tiền Việt Nam.
 * @param {number} amount
 * @returns {string}
 */
const formatVND = (amount) =>
  `${Number(amount || 0).toLocaleString("vi-VN")} VND`;

/**
 * Vẽ đường kẻ ngang.
 */
const drawLine = (doc, y, color = LINE_COLOR) => {
  doc
    .moveTo(50, y)
    .lineTo(doc.page.width - 50, y)
    .strokeColor(color)
    .lineWidth(0.5)
    .stroke();
};

/**
 * In label + value trên cùng dòng.
 */
const labelValue = (doc, label, value, x, y, labelWidth = 140) => {
  doc
    .font(FONT_BOLD)
    .fontSize(9)
    .fillColor(GRAY)
    .text(label, x, y, { width: labelWidth, continued: false });

  doc
    .font(FONT_REGULAR)
    .fontSize(9)
    .fillColor(DARK)
    .text(value || "—", x + labelWidth, y, {
      width: doc.page.width - x - labelWidth - 50,
    });
};

/**
 * Tạo QR code dưới dạng Buffer PNG.
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
const generateQrBuffer = async (url) => {
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: "M",
    type: "png",
    margin: 1,
    width: 200,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });
};

/**
 * Sinh file PDF hợp đồng và lưu vào thư mục public/contracts.
 *
 * @param {object} booking   - Booking đã populate
 * @param {string} contractLink - URL trang hợp đồng
 * @returns {Promise<{filePath: string, fileName: string}>}
 */
const generateContractPdf = async (booking, contractLink) => {
  const fileName = `contract_${booking._id}.pdf`;
  const filePath = path.join(CONTRACT_DIR, fileName);

  // Sinh QR code trước
  const qrBuffer = await generateQrBuffer(contractLink);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Hop Dong Dich Vu - Cao Hien Studio`,
        Author: "Cao Hien Studio",
        Subject: "Contract",
      },
    });

    if (fs.existsSync(FONT_REGULAR_PATH)) {
      doc.registerFont(FONT_REGULAR, FONT_REGULAR_PATH);
    }
    if (fs.existsSync(FONT_BOLD_PATH)) {
      doc.registerFont(FONT_BOLD, FONT_BOLD_PATH);
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageW = doc.page.width;
    const contentW = pageW - 100; // trừ margin 2 bên

    // ==========================================
    // HEADER
    // ==========================================
    doc
      .rect(0, 0, pageW, 80)
      .fill(DARK);

    // Tên studio
    doc
      .font(FONT_BOLD)
      .fontSize(20)
      .fillColor(GOLD)
      .text("CAO HIEN STUDIO", 50, 22, { align: "center" });

    doc
      .font(FONT_REGULAR)
      .fontSize(9)
      .fillColor("white")
      .text("Studio nhiếp ảnh chuyên nghiệp – Hợp đồng dịch vụ", 50, 48, {
        align: "center",
      });

    // ==========================================
    // TIÊU ĐỀ HỢP ĐỒNG
    // ==========================================
    let y = 100;

    doc
      .font(FONT_BOLD)
      .fontSize(14)
      .fillColor(DARK)
      .text("HỢP ĐỒNG DỊCH VỤ CHỤP ẢNH", 50, y, {
        align: "center",
        width: contentW,
      });

    y += 18;

    const bookingCode = `#${String(booking._id).slice(-8).toUpperCase()}`;
    const sentDate = moment(booking.contract_sent_at || new Date()).format(
      "DD/MM/YYYY"
    );

    doc
      .font(FONT_REGULAR)
      .fontSize(9)
      .fillColor(LIGHT_GRAY)
      .text(`Mã đơn: ${bookingCode}   |   Ngày lập: ${sentDate}`, 50, y, {
        align: "center",
        width: contentW,
      });

    y += 8;
    drawLine(doc, y + 6, GOLD);
    y += 20;

    // ==========================================
    // BÊN A (STUDIO)
    // ==========================================
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(GOLD)
      .text("BÊN A – STUDIO (BÊN CUNG CẤP DỊCH VỤ)", 50, y);
    y += 14;

    const studioLines = [
      ["Tên đơn vị:", "Cao Hiển Studio"],
      ["Địa chỉ:", "Cao Hiển Studio, Việt Nam"],
      ["Email liên hệ:", process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "caohienstudio@gmail.com"],
    ];

    for (const [lbl, val] of studioLines) {
      labelValue(doc, lbl, val, 50, y);
      y += 14;
    }

    y += 4;
    drawLine(doc, y);
    y += 12;

    // ==========================================
    // BÊN B (KHÁCH HÀNG)
    // ==========================================
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(GOLD)
      .text("BÊN B – KHÁCH HÀNG (BÊN SỬ DỤNG DỊCH VỤ)", 50, y);
    y += 14;

    const customer = booking.customer_id || {};
    const customerLines = [
      ["Họ và tên:", customer.full_name || "—"],
      ["Số điện thoại:", customer.phone || "—"],
      ["Email:", customer.email || "—"],
    ];

    for (const [lbl, val] of customerLines) {
      labelValue(doc, lbl, val, 50, y);
      y += 14;
    }

    y += 4;
    drawLine(doc, y);
    y += 12;

    // ==========================================
    // THÔNG TIN BUỔI CHỤP
    // ==========================================
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(GOLD)
      .text("THÔNG TIN BUỔI CHỤP", 50, y);
    y += 14;

    const SESSION_LABEL = {
      MORNING: "Buổi sáng (08:00 – 12:00)",
      AFTERNOON: "Buổi chiều (13:00 – 17:00)",
      FULL_DAY: "Cả ngày (08:00 – 17:00)",
    };
    const TYPE_LABEL = {
      STUDIO: "Chụp tại Studio",
      OUTDOOR: "Chụp ngoại cảnh",
    };

    const shootLines = [];

    if (booking.shooting_type) {
      shootLines.push(["Hình thức chụp:", TYPE_LABEL[booking.shooting_type] || booking.shooting_type]);
    }
    if (booking.shooting_session) {
      shootLines.push(["Buổi chụp:", SESSION_LABEL[booking.shooting_session] || booking.shooting_session]);
    }
    shootLines.push(["Ngày chụp:", moment(booking.start_time).utcOffset(7).format("DD/MM/YYYY")]);
    shootLines.push(["Giờ bắt đầu:", moment(booking.start_time).utcOffset(7).format("HH:mm")]);
    shootLines.push(["Giờ kết thúc:", moment(booking.end_time).utcOffset(7).format("HH:mm")]);
    shootLines.push(["Địa điểm:", booking.location || "—"]);

    for (const [lbl, val] of shootLines) {
      labelValue(doc, lbl, val, 50, y);
      y += 14;
    }

    if (booking.note) {
      labelValue(doc, "Ghi chú:", booking.note, 50, y);
      y += 14;
    }

    y += 4;
    drawLine(doc, y);
    y += 12;

    // ==========================================
    // BẢNG DỊCH VỤ
    // ==========================================
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(GOLD)
      .text("DỊCH VỤ VÀ GIÁ", 50, y);
    y += 14;

    // Tiêu đề bảng
    doc.rect(50, y, contentW, 18).fill("#F5EFE6");
    doc
      .font(FONT_BOLD)
      .fontSize(8.5)
      .fillColor(DARK)
      .text("Dịch vụ", 55, y + 5, { width: contentW * 0.6 })
      .text("Đơn giá", 55 + contentW * 0.6, y + 5, {
        width: contentW * 0.4,
        align: "right",
      });
    y += 20;

    // Gói chính
    const mainServices = booking.original_service_ids?.length > 0 
      ? booking.original_service_ids 
      : (booking.service_id ? [booking.service_id] : []);

    for (const mainService of mainServices) {
      doc
        .font(FONT_BOLD)
        .fontSize(9)
        .fillColor(DARK)
        .text(`[Gói chính] ${mainService.name || "Dịch vụ chính"}`, 55, y, {
          width: contentW * 0.6,
        });
      doc
        .font(FONT_REGULAR)
        .fontSize(9)
        .fillColor(DARK)
        .text(formatVND(mainService.base_price), 55 + contentW * 0.6, y, {
          width: contentW * 0.4 - 5,
          align: "right",
        });
      y += 15;
    }

    // Gói đi kèm
    const extras = booking.extra_service_ids || [];
    for (const extra of extras) {
      doc
        .font(FONT_REGULAR)
        .fontSize(9)
        .fillColor(GRAY)
        .text(`+ ${extra.name || "Gói kèm"}`, 55, y, {
          width: contentW * 0.6,
        });
      doc
        .font(FONT_REGULAR)
        .fontSize(9)
        .fillColor(GRAY)
        .text(formatVND(extra.base_price), 55 + contentW * 0.6, y, {
          width: contentW * 0.4 - 5,
          align: "right",
        });
      y += 15;
    }

    // Tổng tiền + cọc
    y += 4;
    drawLine(doc, y);
    y += 8;

    // Tổng hợp đồng
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(DARK)
      .text("Tổng giá trị hợp đồng:", 55, y, { width: contentW * 0.7 })
      .text(formatVND(booking.total_amount), 55 + contentW * 0.6, y, {
        width: contentW * 0.4 - 5,
        align: "right",
      });
    y += 16;

    // Tiền cọc — khung vàng
    doc.rect(50, y, contentW, 24).fill("#FFF8EC");
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(GOLD)
      .text(
        `Tiền cọc cần thanh toán (${booking.deposit_percent || 30}%):`,
        55,
        y + 7,
        { width: contentW * 0.65 }
      )
      .text(formatVND(booking.deposit_amount), 55 + contentW * 0.55, y + 7, {
        width: contentW * 0.45 - 5,
        align: "right",
      });
    y += 30;

    drawLine(doc, y);
    y += 12;

    // ==========================================
    // ĐIỀU KHOẢN HỢP ĐỒNG
    // ==========================================
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(GOLD)
      .text("ĐIỀU KHOẢN HỢP ĐỒNG", 50, y);
    y += 14;

    // Điều khoản riêng (nếu admin có nhập)
    if (booking.contract_note) {
      doc
        .font(FONT_REGULAR)
        .fontSize(8.5)
        .fillColor(DARK)
        .text(booking.contract_note, 50, y, {
          width: contentW,
          align: "justify",
        });
      y = doc.y + 10;
    }

    // Điều khoản mặc định (Theo website)
    const defaultTerms = [
      "1. THÔNG TIN CÁC BÊN: Ghi nhận chi tiết thông tin của Studio (Bên A) và Khách hàng (Bên B).",
      "2. NỘI DUNG DỊCH VỤ: Bên A đồng ý cung cấp và Bên B đồng ý sử dụng dịch vụ chụp ảnh với các tùy chọn đã xác nhận.",
      "3. GIÁ TRỊ VÀ THANH TOÁN: Cọc 30% để giữ lịch. Phần còn lại thanh toán sau 3-4 ngày kể từ khi chụp (khi nhận ảnh gốc).",
      "4. CHÍNH SÁCH HỦY & BẢO LƯU: Hủy đơn từ Bên B không hoàn cọc. Bảo lưu tối đa 6 tháng nếu báo trước 24h (chụp 1 ngày) hoặc 3 ngày (nhiều ngày).",
      "5. QUYỀN VÀ NGHĨA VỤ BÊN A: Đảm bảo dịch vụ, giao ảnh đúng hạn, được dùng ảnh để quảng bá (trừ khi khách yêu cầu bảo mật).",
      "6. QUYỀN VÀ NGHĨA VỤ BÊN B: Có mặt đúng giờ, thanh toán đúng hạn, tự bảo quản tài sản.",
      "7. ĐIỀU KHOẢN CHUNG: Cam kết thực hiện đúng hợp đồng, ưu tiên giải quyết tranh chấp bằng thương lượng hòa giải."
    ];

    for (const term of defaultTerms) {
      // Kiểm tra còn đủ chỗ không
      if (y > doc.page.height - 160) {
        doc.addPage();
        y = 50;
      }
      doc
        .font(FONT_REGULAR)
        .fontSize(8.5)
        .fillColor(GRAY)
        .text(term, 50, y, { width: contentW });
      y = doc.y + 4;
    }

    y += 8;

    // ==========================================
    // KÝ KẾT (nếu có chỗ) hoặc trang mới
    // ==========================================
    if (y > doc.page.height - 140) {
      doc.addPage();
      y = 50;
    }

    drawLine(doc, y, GOLD);
    y += 16;

    const halfW = contentW / 2 - 10;

    doc
      .font(FONT_BOLD)
      .fontSize(9)
      .fillColor(DARK)
      .text("BÊN A – STUDIO", 50, y, { width: halfW, align: "center" })
      .text("BÊN B – KHÁCH HÀNG", 50 + halfW + 20, y, {
        width: halfW,
        align: "center",
      });
    y += 12;

    doc
      .font(FONT_REGULAR)
      .fontSize(8)
      .fillColor(LIGHT_GRAY)
      .text("(Ký và ghi rõ họ tên)", 50, y, { width: halfW, align: "center" })
      .text("(Ký và ghi rõ họ tên)", 50 + halfW + 20, y, {
        width: halfW,
        align: "center",
      });
    y += 50;

    // Đường ký tên
    doc
      .moveTo(60, y)
      .lineTo(60 + halfW - 20, y)
      .strokeColor("#CCCCCC")
      .lineWidth(0.5)
      .stroke();

    doc
      .moveTo(50 + halfW + 30, y)
      .lineTo(50 + contentW - 10, y)
      .strokeColor("#CCCCCC")
      .lineWidth(0.5)
      .stroke();

    y += 20;

    // ==========================================
    // QR CODE + FOOTER
    // ==========================================
    // Kiểm tra đủ chỗ cho QR không
    const qrY = Math.max(y + 10, doc.page.height - 180);

    if (qrY + 150 > doc.page.height - 20) {
      doc.addPage();
    }

    const finalY = qrY > doc.page.height - 180 ? 50 : qrY;

    // QR code ở giữa
    doc.image(qrBuffer, pageW / 2 - 55, finalY, {
      width: 110,
      height: 110,
    });

    doc
      .font(FONT_REGULAR)
      .fontSize(8)
      .fillColor(LIGHT_GRAY)
      .text("Quét QR để xem và xác nhận hợp đồng trực tuyến", 50, finalY + 115, {
        width: contentW,
        align: "center",
      });

    doc
      .font(FONT_REGULAR)
      .fontSize(7.5)
      .fillColor(LIGHT_GRAY)
      .text(contractLink, 50, finalY + 128, {
        width: contentW,
        align: "center",
      });

    // Footer line
    doc
      .rect(0, doc.page.height - 30, pageW, 30)
      .fill(DARK);

    doc
      .font(FONT_REGULAR)
      .fontSize(7.5)
      .fillColor("#888888")
      .text(
        `Cao Hiển Studio – Hợp đồng tự động. Mã đơn: ${bookingCode}`,
        50,
        doc.page.height - 20,
        { width: contentW, align: "center" }
      );

    doc.end();

    stream.on("finish", () => resolve({ filePath, fileName }));
    stream.on("error", reject);
  });
};

/**
 * Sinh QR code dưới dạng Data URL (base64 PNG) để embed vào response JSON.
 * @param {string} url
 * @returns {Promise<string>} data URL
 */
const generateQrDataUrl = async (url) => {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    type: "image/png",
    margin: 1,
    width: 256,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });
};

module.exports = { generateContractPdf, generateQrDataUrl };
