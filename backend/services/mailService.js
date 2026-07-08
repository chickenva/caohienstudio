const nodemailer = require("nodemailer");
const moment = require("moment");

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
};

const getStatusText = (status) => {
  const statusMap = {
    PENDING: "Chờ thanh toán",
    DEPOSITED: "Đã đặt cọc",
    CONFIRMED: "Đã xác nhận",
    IN_PROGRESS: "Đang thực hiện (Đang chụp)",
    COMPLETED: "Đã hoàn thành",
    CANCELED: "Đã hủy",
  };
  return statusMap[status] || status;
};

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

// 2. Gửi mail khi thay đổi trạng thái
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
        <p style="margin: 0; font-size: 13px; color: #cf1322;">(Nếu đến cuối ngày không được chuyển, hệ thống sẽ tự động chuyển đơn sang IN_PROGRESS).</p>
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

// 5. Gửi mail thông báo Admin khi đơn hàng tự động chuyển sang IN_PROGRESS
exports.sendAutoInProgressToAdminEmail = async (booking, adminEmail) => {
  try {
    if (!adminEmail) return;

    const content = `
      <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">Hệ thống vừa tự động cập nhật trạng thái đơn hàng sau sang <strong>Đang thực hiện (IN_PROGRESS)</strong>.</p>
      
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
      subject: `[Cao Hien Studio - Admin] Hệ thống tự động cập nhật trạng thái đơn hàng (Mã đơn: #${booking._id.toString().slice(-8).toUpperCase()})`,
      html: baseTemplate("Cập Nhật Tự Động", content),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi email báo tự động cập nhật trạng thái:", error);
  }
};
