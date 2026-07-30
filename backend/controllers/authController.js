/**
 * authController.js
 * Xử lý xác thực người dùng: đăng ký, đăng nhập, OTP, quên/đổi mật khẩu, cập nhật profile.
 * JWT có hiệu lực 1 ngày. OTP hết hạn sau 5 phút (TTL index MongoDB).
 */
const User       = require("../models/User");
const OTP        = require("../models/OTP");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Transporter Gmail dùng chung cho toàn bộ controller
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ==========================================
// REGEX VALIDATION
// ==========================================

// Số điện thoại Việt Nam: bắt đầu bằng 0, tổng 10-11 chữ số
const PHONE_REGEX = /^0[0-9]{9,10}$/;

// Họ tên: chỉ cho phép chữ cái và khoảng trắng (hỗ trợ tiếng Việt)
const NAME_REGEX = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;

// Mật khẩu: 8-16 ký tự, phải có chữ thường, chữ hoa, số và ký tự đặc biệt
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()>\.]).{8,16}$/;

// ==========================================
// HELPER: GỬI EMAIL OTP
// ==========================================

/**
 * Gửi email chứa mã OTP đến địa chỉ email chỉ định.
 * Template HTML đồng bộ với thiết kế mail của studio.
 * @param {string} toEmail     - Địa chỉ email nhận
 * @param {string} subject     - Tiêu đề email
 * @param {string} description - Mô tả mục đích OTP trong thân email
 * @param {string} otpCode     - Mã OTP 4 chữ số
 */
const sendOtpEmail = async (toEmail, subject, description, otpCode) => {
  await transporter.sendMail({
    from:    `"Cao Hien Studio" <no-reply@caohien.com>`,
    to:      toEmail,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; color: #000; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Cao Hiển Studio</h2>
        <p style="font-size: 16px; margin-bottom: 12px; color: #333;">Xin chào,</p>
        <p style="font-size: 16px; margin-bottom: 30px; color: #333;">${description}</p>
        <div style="background-color: #f4f4f4; border-radius: 12px; padding: 24px; margin: 0 auto 30px auto; max-width: 300px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #000;">${otpCode}</span>
        </div>
        <p style="font-size: 15px; color: #555; margin-bottom: 40px;">Mã này sẽ hết hạn trong 5 phút.</p>
        <p style="font-size: 13px; color: #999;">© ${new Date().getFullYear()} Cao Hiển Studio. All rights reserved.</p>
      </div>
    `,
  });
};

/**
 * Tạo OTP 4 chữ số, xóa OTP cũ cùng email và lưu OTP mới vào DB.
 * @param {string} email
 * @returns {string} mã OTP mới
 */
const createAndSaveOtp = async (email) => {
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  await OTP.deleteMany({ email });
  await new OTP({ email, otp: otpCode }).save();
  return otpCode;
};

// ==========================================
// AUTH ENDPOINTS
// ==========================================

/**
 * [POST] /api/auth/register
 * Đăng ký tài khoản mới.
 * Validate họ tên, SĐT và mật khẩu; kiểm tra email trùng; mã hóa mật khẩu bcrypt.
 */
exports.register = async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body;

    // Validate dữ liệu đầu vào
    if (!NAME_REGEX.test(fullName)) {
      return res.status(400).json({
        message: "Họ và tên không hợp lệ (không chứa số hoặc ký tự đặc biệt)!",
      });
    }
    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại phải bắt đầu bằng số 0 và có 10-11 chữ số!",
      });
    }
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ message: "Mật khẩu không đạt yêu cầu bảo mật!" });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại!" });
    }

    // Mã hóa mật khẩu và tạo tài khoản
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      full_name:     fullName,
      phone,
      email,
      password_hash: hashedPassword,
    });

    // Xóa OTP đã dùng để xác thực email đăng ký
    await OTP.deleteMany({ email });

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * [POST] /api/auth/login
 * Đăng nhập. Kiểm tra email, trạng thái tài khoản và mật khẩu.
 * Trả về JWT token (1 ngày) nếu thành công.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng!" });
    }

    if (!user.is_active) {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị khóa đăng nhập. Vui lòng liên hệ quản trị viên.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id:        user._id,
        email:     user.email,
        full_name: user.full_name,
        phone:     user.phone,
        role:      user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * [POST] /api/auth/reset-password
 * Đặt lại mật khẩu sau khi xác thực OTP thành công.
 * Validate độ mạnh mật khẩu, mã hóa bcrypt và xóa OTP.
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu không đạt yêu cầu bảo mật!" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password_hash: hashedPassword });
    await OTP.deleteMany({ email });

    res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// ==========================================
// OTP ENDPOINTS
// ==========================================

/**
 * [POST] /api/auth/send-register-otp
 * Gửi OTP xác thực email để đăng ký tài khoản mới.
 * Yêu cầu email chưa được đăng ký.
 */
exports.sendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng!" });
    }

    const otpCode = await createAndSaveOtp(email);
    await sendOtpEmail(
      email,
      "Mã xác thực Đăng ký tài khoản - Cao Hiển Studio",
      "Sử dụng mã xác thực dưới đây để hoàn tất việc đăng ký tài khoản.",
      otpCode,
    );

    res.status(200).json({ message: "Mã OTP đã được gửi!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * [POST] /api/auth/forgot-password
 * Gửi OTP khôi phục mật khẩu về email.
 * Yêu cầu email đã tồn tại trong hệ thống.
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản với email này!" });
    }

    const otpCode = await createAndSaveOtp(email);
    await sendOtpEmail(
      email,
      "Mã xác thực Khôi phục mật khẩu - Cao Hiển Studio",
      "Sử dụng mã xác thực dưới đây để khôi phục mật khẩu của bạn.",
      otpCode,
    );

    res.status(200).json({ message: "Mã OTP đã được gửi!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * [POST] /api/auth/verify-otp
 * Xác thực mã OTP — kiểm tra khớp email + otp trong DB.
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OTP.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn!" });
    }

    res.status(200).json({ message: "Mã OTP hợp lệ!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * [POST] /api/auth/send-update-otp
 * Gửi OTP xác nhận thay đổi email hoặc thông tin bảo mật.
 * Nếu đổi email → gửi đến email mới; nếu không → gửi đến email hiện tại.
 * Yêu cầu đăng nhập (verifyToken middleware).
 */
exports.sendUpdateOtp = async (req, res) => {
  try {
    const user        = await User.findById(req.user.id);
    const { email }   = req.body;
    const targetEmail = email || user.email;

    const otpCode = await createAndSaveOtp(targetEmail);
    await sendOtpEmail(
      targetEmail,
      "Mã xác nhận thay đổi thông tin bảo mật - Cao Hiển Studio",
      "Sử dụng mã xác thực dưới đây để xác nhận thay đổi thông tin bảo mật.",
      otpCode,
    );

    res.status(200).json({ message: "Mã OTP đã được gửi đến Email của bạn!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gửi mail" });
  }
};

// ==========================================
// PROFILE ENDPOINTS
// ==========================================

/**
 * [GET] /api/auth/me
 * Lấy thông tin profile của người dùng đang đăng nhập.
 * Trường password_hash không được trả về.
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password_hash");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [PUT] /api/auth/profile
 * Cập nhật profile người dùng (họ tên, SĐT, email).
 * Đổi email bắt buộc phải có OTP hợp lệ gửi đến email mới.
 */
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, email, otp } = req.body;

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const updateData = {};

    // Cập nhật họ tên và SĐT nếu được gửi lên và không rỗng
    if (full_name !== undefined && full_name.trim() !== "") {
      updateData.full_name = full_name.trim();
    }
    if (phone !== undefined && phone.trim() !== "") {
      updateData.phone = phone.trim();
    }

    // Đổi email: yêu cầu OTP hợp lệ
    const isEmailChanged = email && email.trim() !== "" && email !== currentUser.email;

    if (isEmailChanged) {
      // Kiểm tra email mới chưa được dùng bởi tài khoản khác
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email này đã được người khác sử dụng!" });
      }

      // Bắt buộc có OTP
      if (!otp) {
        return res.status(400).json({ message: "Hệ thống cần mã OTP để xác nhận đổi Email!" });
      }

      // Xác thực OTP
      const otpRecord = await OTP.findOne({ email, otp });
      if (!otpRecord) {
        return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn!" });
      }

      updateData.email = email;
      await OTP.deleteMany({ email });
    }

    // Không có gì thay đổi
    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        message: "Không có thông tin nào được thay đổi",
        user: currentUser,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true })
      .select("-password_hash");

    res.status(200).json({ message: "Cập nhật thành công!", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
