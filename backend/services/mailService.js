/**
 * mailService.js
 * Tập hợp tất cả email transactional của hệ thống Cao Hiển Studio:
 *  - Xác nhận đặt lịch, nhắc lịch chụp, gửi hợp đồng PDF, xác nhận nhận cọc.
 * Sử dụng Nodemailer + Gmail transport, template HTML đồng nhất với thương hiệu.
 */
const nodemailer = require("nodemailer");
const moment     = require("moment");

// Cấu hình transporter (Tối ưu cho Cloud/Render)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Định dạng tiền VND trong nội dung email.
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
};

// Chuyển mã trạng thái booking sang tiếng Việt dễ hiểu cho khách/admin.
const getStatusText = (status) => {
  const statusMap = {
    REQUESTED: "Đã gửi yêu cầu",
    CONTRACT_SENT: "Đã gửi hợp đồng",
    WAITING_PAYMENT: "Chờ đặt cọc",
    PENDING: "Chờ thanh toán",
    DEPOSITED: "Đã đặt cọc",
    CONFIRMED: "Đã xác nhận",
    IN_PROGRESS: "Đang thực hiện (Đang chụp)",
    COMPLETED: "Đã hoàn thành",
    CANCELED: "Đã hủy",
  };
  return statusMap[status] || status;
};

// Khung HTML chung để các email cùng nhận diện thương hiệu Cao Hiển Studio.
const baseTemplate = (title, content) => `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 30px 15px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <div style="background-color: #BFA16A; color: #ffffff; padding: 25px; text-align: center;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${title}</h2>
    </div>
    <div style="padding: 30px;">
      ${content}
    </div>
    <div style="background-color: #f1f1f1; padding: 20px; text-align: center; color: #888; font-size: 13px;">
      Email này được gửi tự động từ hệ thống website <br /> <strong>Cao Hiển Studio</strong>
    </div>
  </div>
</div>
`;

// Render bảng label/value dùng lại trong nhiều email.
const renderTable = (rows) => `
<table style="width: 100%; border-collapse: collapse; font-size: 15px;">
  ${rows.map(row => `
    <tr>
      <td style="padding: 8px 0; color: #666; width: 140px; vertical-align: top;">${row.label}:</td>
      <td style="padding: 8px 0; font-weight: 500; color: #222;">${row.value}</td>
    </tr>
  `).join("")}
</table>
`;

// 1. Gửi mail khi đặt lịch thành công
/**
 * Hàm gửi email thông báo đặt lịch thành công cho khách hàng.
 * Xử lý: Gửi thông tin lịch chụp (ngày, giờ, dịch vụ) đến email khách.
 * @param {Object} booking - Thông tin đơn đặt lịch
 * @param {Object} customer - Thông tin khách hàng
 */
exports.sendBookingSuccessEmail = async (booking, customer) => {
  try {
    if (!customer?.email) return;

    const formatList = (strList) => strList.map(item => `- ${item}`).join("<br/>");
    const mainServiceName = booking.service_id?.name ? `- ${booking.service_id.name}` : "- Gói dịch vụ";
    const addonNames = booking.extra_service_ids && booking.extra_service_ids.length > 0
      ? formatList(booking.extra_service_ids.map(s => s.name))
      : "Không có";

    const content = `
      <p style="font-size: 16px; margin-bottom: 20px; color: #333;">Xin chào <strong>${customer.full_name}</strong>,</p>
      <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">Cảm ơn bạn đã tin tưởng và đặt lịch chụp ảnh tại Cao Hiển Studio. Đơn đặt lịch của bạn đã được hệ thống ghi nhận thành công.</p>

      <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 0; margin-bottom: 10px;">Chi Tiết Đơn Đặt Lịch</h3>
      ${renderTable([
        { label: "Mã đơn", value: `#${booking._id.toString().slice(-8).toUpperCase()}` },
        { label: "Gói dịch vụ chính", value: mainServiceName },
        { label: "Gói đi kèm", value: addonNames },
        { label: "Ngày chụp", value: moment(booking.start_time).format("DD/MM/YYYY") },
        { label: "Thời gian chụp", value: `${moment(booking.start_time).format("HH:mm")} - ${moment(booking.end_time).format("HH:mm")}` },
        { label: "Địa điểm", value: booking.location },
        { label: "Tổng tiền", value: formatCurrency(booking.total_amount) },
        { label: "Trạng thái", value: `<span style="color: #BFA16A; font-weight: bold;">${getStatusText(booking.status)}</span>` }
      ])}

      <div style="background-color: #fcf9f2; border-left: 4px solid #BFA16A; padding: 15px; margin-top: 25px; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">Nhân viên của chúng tôi sẽ sớm liên hệ với bạn để xác nhận thông tin đơn hàng.</p>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">Vui lòng theo dõi email để nhận các cập nhật tiếp theo.</p>
        <p style="margin: 0; font-size: 14px; color: #555;">Nếu cần hỗ trợ, vui lòng liên hệ với chúng tôi qua Fanpage hoặc số điện thoại hotline.</p>
      </div>
    `;

    const mailOptions = {
      from: `"Cao Hien Studio" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `[Cao Hien Studio] Xác nhận đặt lịch chụp ảnh thành công (Mã đơn: #${booking._id.toString().slice(-8).toUpperCase()})`,
      html: baseTemplate("Xác Nhận Đặt Lịch Thành Công", content),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi email xác nhận đặt lịch:", error);
  }
};

// Gửi email báo admin khi hệ thống ghi nhận đơn đặt lịch mới.
/**
 * Hàm gửi email thông báo có đơn mới cho Admin.
 * Xử lý: Gửi thông tin đơn mới để Admin vào xác nhận và lên hợp đồng.
 * @param {Object} booking - Thông tin đơn đặt lịch
 * @param {Object} customer - Thông tin khách hàng
 */
exports.sendBookingSuccessToAdminEmail = async (booking, customer) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) return;

    const formatList = (strList) => strList.map(item => `- ${item}`).join("<br/>");
    const mainServiceName = booking.service_id?.name ? `- ${booking.service_id.name}` : "- Gói dịch vụ";
    const addonNames = booking.extra_service_ids && booking.extra_service_ids.length > 0
      ? formatList(booking.extra_service_ids.map(s => s.name))
      : "Không có";

    const content = `
      <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">Hệ thống vừa ghi nhận một đơn đặt lịch chụp ảnh mới từ khách hàng <strong>${customer.full_name}</strong>.</p>

      <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 0; margin-bottom: 10px;">Thông Tin Đơn Đặt Lịch</h3>
      ${renderTable([
        { label: "Mã đơn", value: `#${booking._id.toString().slice(-8).toUpperCase()}` },
        { label: "Khách hàng", value: `${customer.full_name} <br/> <a href="tel:${customer.phone}" style="color: #222; text-decoration: none;">${customer.phone || ""}</a> | <a href="mailto:${customer.email}" style="color: #BFA16A; text-decoration: none;">${customer.email || ""}</a>` },
        { label: "Gói dịch vụ chính", value: mainServiceName },
        { label: "Gói đi kèm", value: addonNames },
        { label: "Ngày chụp", value: moment(booking.start_time).format("DD/MM/YYYY") },
        { label: "Thời gian chụp", value: `${moment(booking.start_time).format("HH:mm")} - ${moment(booking.end_time).format("HH:mm")}` },
        { label: "Địa điểm", value: booking.location },
        { label: "Tổng tiền", value: formatCurrency(booking.total_amount) },
        { label: "Trạng thái", value: `<span style="color: #BFA16A; font-weight: bold;">${getStatusText(booking.status)}</span>` }
      ])}
    `;

    const mailOptions = {
      from: `"Hệ thống Cao Hien Studio" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `[Cao Hien Studio - Admin] Đơn đặt lịch chụp ảnh mới (Mã đơn: #${booking._id.toString().slice(-8).toUpperCase()})`,
      html: baseTemplate("Có Đơn Đặt Lịch Mới", content),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi email báo đơn mới cho admin:", error);
  }
};

// 2. Gửi mail hợp đồng
// Gửi email hợp đồng, link xác nhận và hướng dẫn thanh toán cho khách hàng.
/**
 * Hàm gửi email chứa hợp đồng và hướng dẫn thanh toán cho khách hàng.
 * Xử lý: Đính kèm URL hợp đồng, file PDF và hướng dẫn thanh toán tiền cọc.
 * @param {Object} booking - Thông tin đơn đặt lịch
 * @param {Object} customer - Thông tin khách hàng
 * @param {Object} data - Dữ liệu kèm theo (contractLink, pdfUrl)
 */
exports.sendContractEmail = async (booking, customer, data) => {
  try {
    if (!customer?.email) return;

    const { contractLink, pdfUrl } = data;

    // Nội dung chuyển khoản gợi ý
    const bookingCode = booking._id.toString().slice(-8).toUpperCase();
    const customerPhone = customer.phone || "";
    const transferContent = `CHS ${bookingCode} ${customerPhone}`.trim();
    const depositAmount = booking.deposit_amount || 0;

    const content = `
      <p style="font-size: 16px; margin-bottom: 20px; color: #333;">Xin chào <strong>${customer.full_name}</strong>,</p>
      <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">Cao Hiển Studio đã chuẩn bị xong hợp đồng cho lịch chụp của bạn. Vui lòng kiểm tra và xác nhận hợp đồng để giữ lịch.</p>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #eee;">
        <h3 style="color: #BFA16A; margin: 0 0 15px 0; font-size: 18px;">Xác nhận hợp đồng trực tuyến</h3>
        <a href="${contractLink}" style="display: inline-block; padding: 12px 24px; background-color: #BFA16A; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px;">Xem và Xác Nhận Hợp Đồng</a>

        ${pdfUrl ? `<p style="margin-top: 15px; font-size: 14px;"><a href="${pdfUrl}" style="color: #555; text-decoration: underline;">Tải xuống file PDF hợp đồng</a></p>` : ''}
      </div>

      <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 10px;">Chi Tiết Đơn Đặt Lịch</h3>
      ${renderTable([
        { label: "Mã đơn", value: `#${bookingCode}` },
        { label: "Ngày chụp", value: moment(booking.start_time).format("DD/MM/YYYY") },
        { label: "Thời gian", value: `${moment(booking.start_time).format("HH:mm")} - ${moment(booking.end_time).format("HH:mm")}` },
        { label: "'Địa điểm", value: booking.location },
        { label: "Tổng tiền", value: formatCurrency(booking.total_amount) },
        { label: "Tiền cọc cần TT", value: formatCurrency(booking.deposit_amount) },
      ])}

      <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 10px;">Hướng Dẫn Thanh Toán Tiền Cọc</h3>
      <div style="background-color: #fffbe6; border-left: 4px solid #faad14; padding: 15px; margin-top: 10px; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;">✅ <strong>Thanh toán tiền mặt:</strong> Tại địa chỉ Cao Hiển Studio.</p>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;">✅ <strong>Chuyển khoản:</strong> Theo QR code hoặc thông tin tài khoản được cung cấp trên trang hợp đồng.</p>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #333;"><strong>Nội dung CK gợi ý:</strong> <code style="background:#f5f5f5;padding:2px 8px;border-radius:4px;font-size:13px;">${transferContent}</code></p>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;">Số tiền cọc: <strong style="color: #BFA16A; font-size: 16px;">${formatCurrency(depositAmount)}</strong></p>
        <p style="margin: 0; font-size: 13px; color: #888;">Sau khi chuyển khoản, vui lòng gửi bill qua Zalo để studio đối soát và xác nhận.</p>
      </div>

      <div style="background-color: #fffbe6; border-left: 4px solid #faad14; padding: 15px; margin-top: 20px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #d48806;">Lưu ý: Hợp đồng chỉ có hiệu lực và lịch chụp chỉ được giữ chính thức sau khi bạn xác nhận <strong>và</strong> Cao Hiển Studio ghi nhận đã nhận tiền cọc.</p>
      </div>
    `;

    const mailOptions = {
      from: `"Cao Hien Studio" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `[Cao Hien Studio] Hợp đồng dịch vụ nhiếp ảnh (Mã đơn: #${bookingCode})`,
      html: baseTemplate("Hợp Đồng Dịch Vụ Nhiếp Ảnh", content),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi email hợp đồng:", error);
  }
};

// 2b. Gửi mail xác nhận đã nhận tiền cọc (admin xác nhận thủ công).
/**
 * Hàm gửi email thông báo đã xác nhận đặt lịch chính thức cho khách hàng.
 * GỬi khi admin ghi nhận đã nhận tiền cọc (CASH hoặc TRANSFER).
 * @param {Object} booking - Thông tin đơn đặt lịch (status = CONFIRMED)
 * @param {Object} customer - Thông tin khách hàng
 * @param {Object} data - { contractLink, pdfUrl, payment_method, confirmedAmount }
 */
exports.sendDepositConfirmedEmail = async (booking, customer, data) => {
  try {
    if (!customer?.email) return;

    const { contractLink, pdfUrl, payment_method, confirmedAmount } = data;
    const bookingCode = booking._id.toString().slice(-8).toUpperCase();
    const methodLabel = payment_method === "CASH" ? "Tiền mặt" : "Chuyển khoản";

    const content = `
      <p style="font-size: 16px; margin-bottom: 20px; color: #333;">Xin chào <strong>${customer.full_name}</strong>,</p>
      <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">
        Cao Hiển Studio xác nhận đã nhận <strong>tiền cọc</strong> cho lịch chụp của bạn. Lịch chụp đã được <strong>giữ chính thức</strong>!
      </p>

      <div style="background-color: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <span style="font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Trạng thái đơn</span>
        <h3 style="color: #52c41a; margin: 10px 0 0 0; font-size: 22px;">CỖNG ĐẶT LỊCH - ĐÃ XÁC NHẬN</h3>
      </div>

      <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 10px;">Thông Tin Thanh Toán</h3>
      ${renderTable([
        { label: "Phương thức", value: methodLabel },
        { label: "Số tiền cọc", value: `<strong style="color:#BFA16A;font-size:16px;">${formatCurrency(confirmedAmount)}</strong>` },
        { label: "Ngày ghi nhận", value: moment().format("DD/MM/YYYY HH:mm") },
      ])}

      <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 10px;">Chi Tiết Lịch Chụp</h3>
      ${renderTable([
        { label: "Mã đơn", value: `#${bookingCode}` },
        { label: "Ngày chụp", value: moment(booking.start_time).format("DD/MM/YYYY") },
        { label: "Thời gian", value: `${moment(booking.start_time).format("HH:mm")} - ${moment(booking.end_time).format("HH:mm")}` },
        { label: "Địa điểm", value: booking.location },
        { label: "Tổng hợp đồng", value: formatCurrency(booking.total_amount) },
      ])}

      ${contractLink ? `
      <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #eee;">
        <a href="${contractLink}" style="display: inline-block; padding: 10px 20px; background-color: #BFA16A; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Xem hợp đồng</a>
        ${pdfUrl ? `<p style="margin-top: 12px; font-size: 14px;"><a href="${pdfUrl}" style="color: #555; text-decoration: underline;">Tải xuống PDF hợp đồng</a></p>` : ''}
      </div>
      ` : ''}

      <div style="background-color: #e6f7ff; border-left: 4px solid #1890ff; padding: 15px; margin-top: 20px; border-radius: 4px;">
        <p style="margin: 0 0 6px 0; font-size: 14px; color: #0050b3;">Phần tiền còn lại (${formatCurrency(booking.total_amount - confirmedAmount)}) sẽ được thanh toán sau 3–4 ngày kể từ ngày chụp (khi nhận ảnh gốc).</p>
        <p style="margin: 0; font-size: 14px; color: #0050b3;">Hẹn gặp bạn vào ngày chụp! Đừng quên có mặt đúng giờ nhé.</p>
      </div>
    `;

    const mailOptions = {
      from: `"Cao Hien Studio" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `[Cao Hien Studio] Xác nhận đặt lịch chính thức (Mã đơn: #${bookingCode})`,
      html: baseTemplate("Xác Nhận Đặt Lịch Chính Thức", content),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi email xác nhận nhận cọc:", error);
  }
};

// 3. Gửi mail khi thay đổi trạng thái
// Gửi email khi trạng thái quan trọng của đơn thay đổi.
/**
 * Hàm gửi email khi trạng thái đơn hàng thay đổi.
 * Xử lý: Gửi thông báo khi đơn được xác nhận, hoàn thành hoặc bị hủy.
 * @param {Object} booking - Thông tin đơn đặt lịch
 * @param {Object} customer - Thông tin khách hàng
 */
exports.sendStatusChangeEmail = async (booking, customer) => {
  try {
    if (!customer?.email) return;

    if (!["CONFIRMED", "CANCELED"].includes(booking.status)) {
      return;
    }

    let statusMessage = "Đơn đặt lịch chụp ảnh của bạn vừa được cập nhật trạng thái mới.";
    let statusColor = "#1890ff"; // blue
    let extraNote = "";

    if (booking.status === "CONFIRMED") {
      statusMessage = "Đơn đặt lịch của bạn đã được Studio xác nhận! Vui lòng chuẩn bị cho buổi chụp sắp tới.";
      statusColor = "#52c41a"; // green
    } else if (booking.status === "CANCELED") {
      statusMessage = "Rất tiếc, đơn đặt lịch của bạn đã bị hủy.";
      statusColor = "#ff4d4f"; // red
      extraNote = `
        <div style="background-color: #fff1f0; border-left: 4px solid #ff4d4f; padding: 15px; margin-top: 25px; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #cf1322;">Nếu bạn không phải là người yêu cầu hủy đơn hoặc cần biết thêm nguyên nhân chi tiết, vui lòng liên hệ trực tiếp với nhân viên của chúng tôi qua Fanpage hoặc Hotline để được hỗ trợ kịp thời.</p>
        </div>
      `;
    }

    const content = `
      <p style="font-size: 16px; margin-bottom: 20px; color: #333;">Xin chào <strong>${customer.full_name}</strong>,</p>
      <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">${statusMessage}</p>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #eee;">
        <span style="font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Trạng thái hiện tại</span>
        <h3 style="color: ${statusColor}; margin: 10px 0 0 0; font-size: 22px;">${getStatusText(booking.status)}</h3>
      </div>

      <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 10px;">Chi Tiết Lịch Chụp</h3>
      ${renderTable([
        { label: "Mã đơn", value: `#${booking._id.toString().slice(-8).toUpperCase()}` },
        { label: "Ngày giờ chụp", value: moment(booking.start_time).format("DD/MM/YYYY HH:mm") },
        { label: "Địa điểm", value: booking.location }
      ])}

      ${extraNote}
    `;

    const mailOptions = {
      from: `"Cao Hien Studio" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `[Cao Hien Studio] Thông báo cập nhật trạng thái đơn hàng (Mã đơn: #${booking._id.toString().slice(-8).toUpperCase()})`,
      html: baseTemplate("Cập Nhật Trạng Thái", content),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi email cập nhật trạng thái:", error);
  }
};

// 3. Gửi mail nhắc nhở khách hàng (1 ngày trước ngày chụp)
// Nhắc khách trước ngày chụp để họ chuẩn bị và đến đúng giờ.
/**
 * Hàm gửi email nhắc nhở khách hàng trước ngày chụp (Cronjob).
 * Xử lý: Gửi nhắc lịch vào lúc 19:00 ngày hôm trước ngày chụp.
 * @param {Object} booking - Thông tin đơn đặt lịch
 * @param {Object} customer - Thông tin khách hàng
 */
exports.sendReminderToCustomerEmail = async (booking, customer) => {
  try {
    if (!customer?.email) return;

    const content = `
      <p style="font-size: 16px; margin-bottom: 20px; color: #333;">Xin chào <strong>${customer.full_name}</strong>,</p>
      <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">Cao Hiển Studio xin gửi lời nhắc về lịch chụp ảnh của bạn vào ngày mai.</p>

      <div style="background-color: #fffbe6; border-left: 4px solid #faad14; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #d48806; font-weight: bold;">Lịch chụp của bạn đang đến gần!</p>
        <p style="margin: 0; font-size: 14px; color: #876800;">Vui lòng đến đúng giờ để buổi chụp diễn ra thuận lợi nhất nhé.</p>
      </div>

      <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 10px;">Chi Tiết Lịch Chụp</h3>
      ${renderTable([
        { label: "Mã đơn", value: `#${booking._id.toString().slice(-8).toUpperCase()}` },
        { label: "Thời gian", value: moment(booking.start_time).format("HH:mm DD/MM/YYYY") },
        { label: "Địa điểm", value: booking.location }
      ])}

      <p style="font-size: 15px; color: #555; margin-top: 25px;">Hẹn gặp lại bạn vào ngày mai!</p>
    `;

    const mailOptions = {
      from: `"Cao Hien Studio" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `[Cao Hien Studio] Lịch chụp ảnh của bạn vào ngày mai (Mã đơn: #${booking._id.toString().slice(-8).toUpperCase()})`,
      html: baseTemplate("Nhắc Nhở Lịch Chụp", content),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi email nhắc nhở khách hàng:", error);
  }
};

// 4. Gửi mail nhắc nhở Admin (Đầu ngày chụp)
// Nhắc admin vào đầu ngày có lịch chụp cần thực hiện.
/**
 * Hàm gửi email nhắc nhở cho Admin/Thợ chụp (Cronjob).
 * Xử lý: Gửi thông báo các lịch chụp ngày mai để chuẩn bị máy móc, thiết bị.
 * @param {Object} booking - Thông tin đơn đặt lịch
 * @param {String} adminEmail - Email của Admin
 */
exports.sendReminderToAdminEmail = async (booking, adminEmail) => {
  try {
    if (!adminEmail) return;

    const content = `
      <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">Hệ thống thông báo có lịch chụp cần thực hiện trong ngày hôm nay.</p>

      <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 0; margin-bottom: 10px;">Chi Tiết Lịch Chụp</h3>
      ${renderTable([
        { label: "Mã đơn", value: `#${booking._id.toString().slice(-8).toUpperCase()}` },
        { label: "Thời gian", value: moment(booking.start_time).format("HH:mm DD/MM/YYYY") },
        { label: "Địa điểm", value: booking.location }
      ])}

      <div style="background-color: #fff1f0; border-left: 4px solid #f5222d; padding: 15px; margin-top: 25px; border-radius: 4px;">
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #a8071a; font-weight: bold;">Lưu ý quan trọng:</p>
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #a8071a;">Vui lòng đăng nhập hệ thống và chuyển trạng thái đơn hàng sang "Đang thực hiện" (IN_PROGRESS) khi bắt đầu làm việc.</p>
        <p style="margin: 0; font-size: 13px; color: #cf1322;">(Trạng thái IN_PROGRESS cần được admin cập nhật thủ công khi buổi chụp bắt đầu).</p>
      </div>
    `;

    const mailOptions = {
      from: `"Hệ thống Cao Hien Studio" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `[Cao Hien Studio - Admin] Danh sách lịch chụp cần thực hiện hôm nay (Mã đơn: #${booking._id.toString().slice(-8).toUpperCase()})`,
      html: baseTemplate("Lịch Chụp Hôm Nay", content),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi email nhắc nhở Admin:", error);
  }
};

// 5. Legacy: gui mail thong bao Admin khi don hang duoc chuyen sang IN_PROGRESS
// Email legacy khi đơn được chuyển sang IN_PROGRESS.
/**
 * Hàm gửi email thông báo hệ thống tự động chuyển trạng thái đơn (Cronjob).
 * Xử lý: Báo cho Admin biết đơn hàng đã được hệ thống tự động đánh dấu IN_PROGRESS.
 * @param {Object} booking - Thông tin đơn đặt lịch
 * @param {String} adminEmail - Email của Admin
 */
exports.sendAutoInProgressToAdminEmail = async (booking, adminEmail) => {
  try {
    if (!adminEmail) return;

    const content = `
      <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">Đơn hàng sau vừa được cập nhật trạng thái sang <strong>Đang thực hiện (IN_PROGRESS)</strong>.</p>

      <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 0; margin-bottom: 10px;">Chi Tiết Đơn Hàng</h3>
      ${renderTable([
        { label: "Mã đơn", value: `#${booking._id.toString().slice(-8).toUpperCase()}` },
        { label: "Ngày giờ chụp", value: moment(booking.start_time).format("DD/MM/YYYY HH:mm") },
        { label: "Địa điểm", value: booking.location }
      ])}

      <div style="background-color: #e6f7ff; border-left: 4px solid #1890ff; padding: 15px; margin-top: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #0050b3;">Vui lòng kiểm tra lại đơn hàng trên hệ thống để cập nhật thêm thông tin hoặc chuyển sang trạng thái Hoàn thành nếu đã giao file và thu đủ tiền.</p>
      </div>
    `;

    const mailOptions = {
      from: `"Hệ thống Cao Hien Studio" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `[Cao Hien Studio - Admin] Cap nhat trang thai don hang (Ma don: #${booking._id.toString().slice(-8).toUpperCase()})`,
      html: baseTemplate("Cap Nhat Trang Thai", content),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Loi gui email bao cap nhat trang thai:", error);
  }
};

// 6. Gửi mail thông báo admin đã dời lịch chụp cho khách hàng.
/**
 * Hàm gửi email thông báo dời lịch cho khách hàng.
 * Xử lý: So sánh lịch cũ và lịch mới, đính kèm link PDF hợp đồng đã cập nhật.
 * @param {Object} booking - Thông tin đơn sau khi dời lịch (đã save)
 * @param {Object} customer - Thông tin khách hàng
 * @param {Object} data - { oldStartTime, oldEndTime, oldLocation, contractLink, pdfUrl }
 */
exports.sendRescheduleEmail = async (booking, customer, data) => {
  try {
    if (!customer?.email) return;

    const { oldStartTime, oldEndTime, oldLocation, contractLink, pdfUrl } = data;

    const sessionLabel = (session) => {
      if (session === "MORNING") return "Buổi sáng (08:00 – 12:00)";
      if (session === "AFTERNOON") return "Buổi chiều (13:00 – 17:00)";
      if (session === "FULL_DAY") return "Cả ngày (08:00 – 17:00)";
      return session || "";
    };

    const content = `
      <p style="font-size: 16px; margin-bottom: 20px; color: #333;">Xin chào <strong>${customer.full_name}</strong>,</p>
      <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">
        Cao Hiển Studio xin thông báo lịch chụp ảnh của bạn đã được <strong>cập nhật mới</strong>.
        Hợp đồng PDF cũng đã được tạo lại theo thông tin mới nhất.
      </p>

      <h3 style="font-size: 16px; color: #cf1322; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 0; margin-bottom: 10px;">Lịch cũ (đã thay đổi)</h3>
      ${renderTable([
        { label: "Ngày chụp", value: moment(oldStartTime).utcOffset(7).format("DD/MM/YYYY") },
        { label: "Thời gian", value: `${moment(oldStartTime).utcOffset(7).format("HH:mm")} – ${moment(oldEndTime).utcOffset(7).format("HH:mm")}` },
        { label: "Địa điểm", value: oldLocation || "—" },
      ])}

      <h3 style="font-size: 16px; color: #52c41a; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 10px;">Lịch mới (đã xác nhận)</h3>
      ${renderTable([
        { label: "Mã đơn", value: `#${booking._id.toString().slice(-8).toUpperCase()}` },
        { label: "Ngày chụp", value: moment(booking.start_time).utcOffset(7).format("DD/MM/YYYY") },
        { label: "Buổi chụp", value: sessionLabel(booking.shooting_session) },
        { label: "Thời gian", value: `${moment(booking.start_time).utcOffset(7).format("HH:mm")} – ${moment(booking.end_time).utcOffset(7).format("HH:mm")}` },
        { label: "Địa điểm", value: booking.location },
      ])}

      ${contractLink ? `
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; border: 1px solid #eee;">
        <h3 style="color: #BFA16A; margin: 0 0 15px 0; font-size: 17px;">Hợp đồng đã được cập nhật</h3>
        <a href="${contractLink}" style="display: inline-block; padding: 12px 24px; background-color: #BFA16A; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px;">Xem hợp đồng mới</a>
        ${pdfUrl ? `<p style="margin-top: 15px; font-size: 14px;"><a href="${pdfUrl}" style="color: #555; text-decoration: underline;">Tải xuống file PDF hợp đồng</a></p>` : ""}
      </div>
      ` : ""}

      <div style="background-color: #fffbe6; border-left: 4px solid #faad14; padding: 15px; margin-top: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #d48806;">
          Nếu bạn có thắc mắc về việc thay đổi lịch, vui lòng liên hệ Studio qua Fanpage hoặc Hotline để được giải đáp.
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"Cao Hien Studio" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `[Cao Hien Studio] Thông báo cập nhật lịch chụp (Mã đơn: #${booking._id.toString().slice(-8).toUpperCase()})`,
      html: baseTemplate("Thông Báo Dời Lịch Chụp", content),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi email thông báo dời lịch:", error);
  }
};
