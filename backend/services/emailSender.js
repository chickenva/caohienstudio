/**
 * emailSender.js
 * Quản lý gửi email toàn hệ thống Cao Hiển Studio bằng Resend REST API (HTTPS port 443).
 * Áp dụng thống nhất 100% cho cả Local Development và Render Production.
 */

const buildEmailError = (message, statusCode = 503) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
};

/**
 * Gửi email qua Resend REST API
 * @param {Object} options - { from, to, subject, html }
 */
const sendMail = async ({ to, subject, html }) => {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const sender = String(process.env.EMAIL_FROM || "").trim();

  if (!apiKey) {
    throw buildEmailError(
      "Hệ thống chưa được cấu hình RESEND_API_KEY. Vui lòng kiểm tra file .env hoặc biến môi trường trên Render.",
      503
    );
  }
  if (!sender) {
    throw buildEmailError(
      "Hệ thống chưa được cấu hình EMAIL_FROM. Hãy dùng địa chỉ gửi thuộc domain đã xác minh trên Resend.",
      503
    );
  }

  const recipientList = (Array.isArray(to) ? to : [to])
    .map((recipient) => String(recipient || "").trim())
    .filter(Boolean);
  if (recipientList.length === 0 || !subject || !html) {
    throw buildEmailError("Email cần có người nhận, tiêu đề và nội dung.", 500);
  }

  let response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: recipientList,
        subject,
        html,
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("Không thể kết nối Resend:", error.message);
    throw buildEmailError(
      "Không thể kết nối dịch vụ Resend. Vui lòng thử lại sau.",
      502
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const providerDetail = result.message || result.name || "Không có chi tiết";
    console.error("Resend API từ chối gửi email:", response.status, providerDetail);
    const detail =
      result.message ||
      (result.name ? `${result.name}: ${result.message}` : `Mã lỗi ${response.status}`);
    throw buildEmailError(
      `Resend không chấp nhận yêu cầu gửi email (${response.status}). ${detail}`,
      502
    );
  }

  return result;
};

/**
 * Gửi email mã OTP chuẩn nhận diện thương hiệu Cao Hiển Studio
 * Hỗ trợ 2 kiểu gọi:
 *  - sendOtpEmail(toEmail, subject, description, otpCode)
 *  - sendOtpEmail({ to, subject, description, otpCode, html })
 */
const sendOtpEmail = async (optionsOrTo, subject, description, otpCode) => {
  let to, finalSubject, desc, code, customHtml;

  if (typeof optionsOrTo === "object" && optionsOrTo !== null) {
    to = optionsOrTo.to;
    finalSubject = optionsOrTo.subject || "Mã xác thực email - Cao Hiển Studio";
    desc = optionsOrTo.description || "Sử dụng mã xác thực dưới đây để tiếp tục.";
    code = optionsOrTo.otpCode || optionsOrTo.otp;
    customHtml = optionsOrTo.html;
  } else {
    to = optionsOrTo;
    finalSubject = subject || "Mã xác thực - Cao Hiển Studio";
    desc = description || "Sử dụng mã xác thực dưới đây để tiếp tục.";
    code = otpCode;
  }

  const html =
    customHtml ||
    `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; color: #000; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #BFA16A;">Cao Hiển Studio</h2>
      <p style="font-size: 16px; margin-bottom: 12px; color: #333;">Xin chào,</p>
      <p style="font-size: 16px; margin-bottom: 30px; color: #333;">${desc}</p>
      <div style="background-color: #f4f4f4; border-radius: 12px; padding: 24px; margin: 0 auto 30px auto; max-width: 300px;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #000;">${code}</span>
      </div>
      <p style="font-size: 15px; color: #555; margin-bottom: 40px;">Mã này sẽ hết hạn trong 5 phút.</p>
      <p style="font-size: 13px; color: #999;">© ${new Date().getFullYear()} Cao Hiển Studio. All rights reserved.</p>
    </div>
  `;

  return sendMail({
    to,
    subject: finalSubject,
    html,
  });
};

module.exports = {
  sendMail,
  sendOtpEmail,
  buildEmailError,
};
