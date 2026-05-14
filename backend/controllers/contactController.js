const nodemailer = require("nodemailer");
const Contact = require("../models/Contact");

exports.submitContact = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({
        message: "Vui lòng nhập họ tên, số điện thoại và lời nhắn",
      });
    }

    // 1. Lưu vào Database
    const newContact = await Contact.create({
      name,
      phone,
      email,
      message,
    });

    // 2. Cấu hình gửi mail bằng Gmail App Password
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 3. Gửi mail về studio
    await transporter.sendMail({
      from: `"Cao Hien Studio Website" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_RECEIVER_EMAIL || process.env.EMAIL_USER,
      subject: `Khách hàng mới cần tư vấn: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Khách hàng mới gửi liên hệ từ website</h2>

          <p><strong>Họ tên:</strong> ${name}</p>
          <p><strong>Số điện thoại:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email || "Không cung cấp"}</p>

          <hr />

          <p><strong>Nội dung khách gửi:</strong></p>
          <p>${message}</p>

          <hr />
          <p style="color: #777; font-size: 13px;">
            Email này được gửi tự động từ form liên hệ trên website Cao Hien Studio.
          </p>
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
