/**
 * contactController.js
 * Xử lý yêu cầu liên hệ/tư vấn từ khách hàng qua form website.
 * Luồng: Gửi OTP → Xác thực OTP → Submit form (lưu DB + gửi mail về studio).
 */
const nodemailer = require("nodemailer");
const Contact   = require("../models/Contact");
const OTP       = require("../models/OTP");

// Khởi tạo transporter Gmail dùng chung cho toàn bộ controller (Tối ưu cho Cloud/Render)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

const buildEmailError = (message, statusCode = 503, publicMessage = message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  return error;
};

// Render Free blocks outbound SMTP, so deployed Render services use an HTTPS mail API.
const sendOtpEmail = async ({ to, subject, html }) => {
  const provider = String(
    process.env.EMAIL_PROVIDER || (process.env.RENDER === "true" ? "resend" : "smtp"),
  ).trim().toLowerCase();

  if (provider === "resend") {
    const apiKey = String(process.env.RESEND_API_KEY || "").trim();
    const from = String(process.env.EMAIL_FROM || "").trim();
    if (!apiKey || !from) {
      throw buildEmailError(
        "Resend requires RESEND_API_KEY and EMAIL_FROM.",
        503,
        "Email OTP chưa được cấu hình trên môi trường deploy. Cần khai báo RESEND_API_KEY và EMAIL_FROM đã xác minh.",
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Resend từ chối gửi OTP:", response.status, result.message || result.name || "Không có chi tiết");
      throw buildEmailError(
        `Resend API returned ${response.status}.`,
        502,
        "Nhà cung cấp email từ chối gửi OTP. Kiểm tra API key và địa chỉ EMAIL_FROM đã xác minh.",
      );
    }
    return result;
  }

  if (provider !== "smtp") {
    throw buildEmailError(`EMAIL_PROVIDER không hợp lệ: ${provider}`, 503, "Cấu hình dịch vụ gửi email không hợp lệ.");
  }

  const senderEmail = String(process.env.EMAIL_USER || "").trim();
  const senderPassword = String(process.env.EMAIL_PASS || "").trim();
  if (!senderEmail || !senderPassword) {
    throw buildEmailError(
      "SMTP requires EMAIL_USER and EMAIL_PASS.",
      503,
      "Dịch vụ gửi email local chưa được cấu hình EMAIL_USER và EMAIL_PASS.",
    );
  }

  return transporter.sendMail({
    from: `"Cao Hien Studio" <${senderEmail}>`,
    to,
    subject,
    html,
  });
};

/**
 * [POST] /api/contacts/send-otp
 * Gửi OTP xác thực email cho khách chưa đăng nhập trước khi gửi form liên hệ.
 */
exports.sendContactOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Vui lòng nhập email!" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Email không hợp lệ." });
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const otpRecord = await new OTP({ email: normalizedEmail, otp: otpCode }).save();

    try {
      await sendOtpEmail({
        to: normalizedEmail,
        subject: "Mã xác thực email - Cao Hiển Studio",
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; color: #000; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Cao Hiển Studio</h2>
          <p style="font-size: 16px; margin-bottom: 12px; color: #333;">Xin chào,</p>
          <p style="font-size: 16px; margin-bottom: 30px; color: #333;">Sử dụng mã xác thực dưới đây để xác minh email và hoàn tất yêu cầu của bạn.</p>
          <div style="background-color: #f4f4f4; border-radius: 12px; padding: 24px; margin: 0 auto 30px auto; max-width: 300px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #000;">${otpCode}</span>
          </div>
          <p style="font-size: 15px; color: #555; margin-bottom: 40px;">Mã này sẽ hết hạn trong 5 phút.</p>
          <p style="font-size: 13px; color: #999;">© ${new Date().getFullYear()} Cao Hiển Studio. All rights reserved.</p>
        </div>
      `,
      });
    } catch (mailError) {
      // Keep any previously issued code usable if the replacement email fails.
      try {
        await OTP.deleteOne({ _id: otpRecord._id });
      } catch (cleanupError) {
        console.error("Không thể xóa OTP chưa gửi được:", cleanupError.message);
      }
      throw mailError;
    }

    try {
      await OTP.deleteMany({ email: normalizedEmail, _id: { $ne: otpRecord._id } });
    } catch (cleanupError) {
      console.error("Không thể dọn OTP cũ:", cleanupError.message);
    }

    res.status(200).json({ message: "Mã OTP đã được gửi đến email của bạn!" });
  } catch (error) {
    console.error("Lỗi gửi OTP liên hệ:", error);
    const response = {
      message: error.publicMessage || "Không thể gửi mã OTP. Vui lòng thử lại sau.",
    };
    if (process.env.NODE_ENV !== "production") response.error = error.message;
    res.status(error.statusCode || 502).json(response);
  }
};

/**
 * [POST] /api/contacts/verify-otp
 * Xác thực mã OTP liên hệ — kiểm tra khớp email + otp trong DB.
 */
exports.verifyContactOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const record = await OTP.findOne({
      email: normalizedEmail,
      otp: String(otp || "").trim(),
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) },
    });
    if (!record) {
      return res.status(400).json({
        message: "Mã OTP không chính xác hoặc đã hết hạn!",
      });
    }
    res.status(200).json({ message: "Mã OTP hợp lệ!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Chuyển chuỗi danh sách dịch vụ (phân cách bằng ", ") thành từng dòng HTML
const formatList = (str) =>
  str ? str.split(", ").map((item) => `- ${item}`).join("<br/>") : "";

/**
 * [POST] /api/contacts/
 * Gửi liên hệ: lưu vào DB, xóa OTP và gửi email thông báo về studio.
 * Kèm thông tin dịch vụ, lịch, địa điểm nếu khách điền đầy đủ form.
 */
exports.submitContact = async (req, res) => {
  try {
    const {
      name, phone, email, message,
      service_names, addon_names,
      location_area, location_detail,
      shoot_date, shoot_time,
    } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({
        message: "Vui lòng nhập họ tên, số điện thoại và lời nhắn",
      });
    }

    // Lưu liên hệ vào Database
    const newContact = await Contact.create({
      name, phone, email, message,
      service_names:   service_names   || "",
      addon_names:     addon_names     || "",
      location_area:   location_area   || "",
      location_detail: location_detail || "",
      shoot_date:      shoot_date      || "",
      shoot_time:      shoot_time      || "",
    });

    // Xóa OTP sau khi submit thành công
    if (email) {
      await OTP.deleteMany({ email });
    }

    // Tạo các dòng thông tin dịch vụ/lịch cho email HTML
    const extraInfoRows = [
      service_names   ? `<tr><td style="padding: 8px 0; color: #666; width: 140px; vertical-align: top;">Gói dịch vụ chính:</td><td style="padding: 8px 0; font-weight: 500; color: #222;">${formatList(service_names)}</td></tr>` : "",
      addon_names     ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Gói đi kèm:</td><td style="padding: 8px 0; font-weight: 500; color: #222;">${formatList(addon_names)}</td></tr>` : "",
      location_area   ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Khu vực chụp:</td><td style="padding: 8px 0; font-weight: 500; color: #222;">${location_area}</td></tr>` : "",
      location_detail ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Địa điểm chi tiết:</td><td style="padding: 8px 0; font-weight: 500; color: #222;">${location_detail}</td></tr>` : "",
      shoot_date      ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Ngày dự kiến:</td><td style="padding: 8px 0; font-weight: 500; color: #222;">${shoot_date}${shoot_time ? ` lúc ${shoot_time}` : ""}</td></tr>` : "",
    ].filter(Boolean).join("");

    const extraInfoSection = extraInfoRows
      ? `
        <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 10px;">Dịch Vụ Quan Tâm</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          ${extraInfoRows}
        </table>
      `
      : "";

    // Gửi email thông báo về hòm thư studio
    await transporter.sendMail({
      from:    `"Cao Hien Studio Website" <${process.env.EMAIL_USER}>`,
      to:      process.env.CONTACT_RECEIVER_EMAIL || process.env.EMAIL_USER,
      subject: `Khách hàng mới cần tư vấn: ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 30px 15px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background-color: #BFA16A; color: #ffffff; padding: 25px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Khách Hàng Mới Liên Hệ</h2>
            </div>

            <!-- Body -->
            <div style="padding: 30px;">
              <p style="font-size: 15px; color: #555; margin-top: 0; margin-bottom: 25px;">Hệ thống vừa nhận được một yêu cầu tư vấn mới từ khách hàng trên website. Dưới đây là thông tin chi tiết:</p>

              <!-- Thông tin khách hàng -->
              <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 0; margin-bottom: 10px;">Thông Tin Khách Hàng</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 140px; vertical-align: top;">Họ và tên:</td>
                  <td style="padding: 8px 0; font-weight: 500; color: #222;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; vertical-align: top;">Số điện thoại:</td>
                  <td style="padding: 8px 0; font-weight: 500; color: #222;">
                    <a href="tel:${phone}" style="color: #222; text-decoration: none;">${phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; vertical-align: top;">Email:</td>
                  <td style="padding: 8px 0; font-weight: 500; color: #222;">
                    ${email ? `<a href="mailto:${email}" style="color: #BFA16A;">${email}</a>` : "Không cung cấp"}
                  </td>
                </tr>
              </table>

              ${extraInfoSection}

              <!-- Lời nhắn -->
              <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 15px;">Nội Dung Lời Nhắn</h3>
              <div style="background-color: #f7f7f7; padding: 15px; border-radius: 6px; color: #444; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message || "<i>Không có lời nhắn</i>"}</div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f1f1; padding: 20px; text-align: center; color: #888; font-size: 13px;">
              Email này được gửi tự động từ hệ thống website <br /> <strong>Cao Hiển Studio</strong>
            </div>
          </div>
        </div>
      `,
    });

    return res.status(201).json({
      message: "Đã gửi lời nhắn thành công. Chúng tôi sẽ liên hệ lại sớm nhất!",
      contact: newContact,
    });
  } catch (error) {
    console.error("Lỗi gửi lời nhắn:", error);
    return res.status(500).json({
      message: "Lỗi gửi lời nhắn",
      error: error.message,
    });
  }
};
