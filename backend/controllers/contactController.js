const nodemailer = require("nodemailer");
const Contact = require("../models/Contact");
const OTP = require("../models/OTP");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Gửi OTP xác thực email cho khách chưa đăng nhập
exports.sendContactOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email!" });
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    await OTP.deleteMany({ email });
    await new OTP({ email, otp: otpCode }).save();

    await transporter.sendMail({
      from: `"Cao Hien Studio" <no-reply@caohien.com>`,
      to: email,
      subject: "Mã xác thực gửi liên hệ - Cao Hiển Studio",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; color: #000; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Cao Hiển Studio</h2>
          
          <p style="font-size: 16px; margin-bottom: 12px; color: #333;">Xin chào,</p>
          <p style="font-size: 16px; margin-bottom: 30px; color: #333;">Sử dụng mã xác thực dưới đây để hoàn tất yêu cầu liên hệ của bạn.</p>
          
          <div style="background-color: #f4f4f4; border-radius: 12px; padding: 24px; margin: 0 auto 30px auto; max-width: 300px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #000;">${otpCode}</span>
          </div>
          
          <p style="font-size: 15px; color: #555; margin-bottom: 40px;">Mã này sẽ hết hạn trong 5 phút.</p>
          
          <p style="font-size: 13px; color: #999;">© ${new Date().getFullYear()} Cao Hiển Studio. All rights reserved.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Mã OTP đã được gửi đến email của bạn!" });
  } catch (error) {
    console.error("Lỗi gửi OTP liên hệ:", error);
    res.status(500).json({ message: "Lỗi gửi OTP", error: error.message });
  }
};

// Xác thực OTP liên hệ
exports.verifyContactOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OTP.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn!" });
    }
    res.status(200).json({ message: "Mã OTP hợp lệ!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Gửi liên hệ (có thể kèm thông tin dịch vụ, lịch)
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

    // 1. Lưu vào Database
    const newContact = await Contact.create({
      name, phone, email, message,
      service_names: service_names || "",
      addon_names: addon_names || "",
      location_area: location_area || "",
      location_detail: location_detail || "",
      shoot_date: shoot_date || "",
      shoot_time: shoot_time || "",
    });

    // Xóa OTP sau khi submit thành công (nếu có)
    if (email) {
      await OTP.deleteMany({ email });
    }

    // Tạo nội dung phần dịch vụ/lịch cho email dạng table row
    const formatList = (str) => str ? str.split(", ").map(item => `- ${item}`).join("<br/>") : "";

    const extraInfoRows = [
      service_names ? `<tr><td style="padding: 8px 0; color: #666; width: 140px; vertical-align: top;">Gói dịch vụ chính:</td><td style="padding: 8px 0; font-weight: 500; color: #222;">${formatList(service_names)}</td></tr>` : "",
      addon_names ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Gói đi kèm:</td><td style="padding: 8px 0; font-weight: 500; color: #222;">${formatList(addon_names)}</td></tr>` : "",
      location_area ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Khu vực chụp:</td><td style="padding: 8px 0; font-weight: 500; color: #222;">${location_area}</td></tr>` : "",
      location_detail ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Địa điểm chi tiết:</td><td style="padding: 8px 0; font-weight: 500; color: #222;">${location_detail}</td></tr>` : "",
      shoot_date ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Ngày dự kiến:</td><td style="padding: 8px 0; font-weight: 500; color: #222;">${shoot_date}${shoot_time ? ` lúc ${shoot_time}` : ""}</td></tr>` : "",
    ].filter(Boolean).join("");

    const extraInfoSection = extraInfoRows 
      ? `
        <h3 style="font-size: 16px; color: #BFA16A; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 10px;">Dịch Vụ Quan Tâm</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          ${extraInfoRows}
        </table>
      ` 
      : "";

    // 2. Gửi mail về studio
    await transporter.sendMail({
      from: `"Cao Hien Studio Website" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_RECEIVER_EMAIL || process.env.EMAIL_USER,
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

              <!-- Customer Info -->
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

              <!-- Message -->
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

