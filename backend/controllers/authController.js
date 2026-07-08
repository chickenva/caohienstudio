const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body; // Lấy fullName

    // 1. Kiểm tra định dạng dữ liệu (Validation Backend)
    const phoneRegex = /^0[0-9]{9,10}$/; // Bắt đầu bằng 0, tổng 10-11 số
    const nameRegex =
      /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()>\.]).{8,16}$/;

    if (!nameRegex.test(fullName)) {
      return res.status(400).json({
        message: "Họ và tên không hợp lệ (không chứa số hoặc ký tự đặc biệt)!",
      });
    }
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại phải bắt đầu bằng số 0 và có 10-11 chữ số!",
      });
    }
    if (!passwordRegex.test(password)) {
      return res
        .status(400)
        .json({ message: "Mật khẩu không đạt yêu cầu bảo mật!" });
    }

    // 2. Kiểm tra email tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email đã tồn tại!" });

    // 3. Mã hóa và lưu Database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      full_name: fullName,
      phone: phone,
      email: email,
      password_hash: hashedPassword,
    });
    await newUser.save();

    await OTP.deleteMany({ email }); // Xóa OTP sau khi đăng ký xong

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng!" });

    if (!user.is_active) {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị khóa đăng nhập. Vui lòng liên hệ quản trị viên.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng!" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // 1. Kiểm tra định dạng mật khẩu mới
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()>\.]).{8,16}$/;
    if (!passwordRegex.test(newPassword)) {
      return res
        .status(400)
        .json({ message: "Mật khẩu không đạt yêu cầu bảo mật!" });
    }

    // 2. Mã hóa và cập nhật Database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate({ email }, { password_hash: hashedPassword });
    await OTP.deleteMany({ email }); // Xóa OTP sau khi dùng xong

    res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Gửi OTP Đăng ký (Check email chưa tồn tại)
exports.sendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email đã được sử dụng!" });

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    await OTP.deleteMany({ email });
    await new OTP({ email, otp: otpCode }).save();

    await transporter.sendMail({
      from: '"Cao Hien Studio" <no-reply@caohien.com>',
      to: email,
      subject: "Mã xác thực Đăng ký tài khoản - Cao Hiển Studio",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; color: #000; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Cao Hiển Studio</h2>
          
          <p style="font-size: 16px; margin-bottom: 12px; color: #333;">Xin chào,</p>
          <p style="font-size: 16px; margin-bottom: 30px; color: #333;">Sử dụng mã xác thực dưới đây để hoàn tất việc đăng ký tài khoản.</p>
          
          <div style="background-color: #f4f4f4; border-radius: 12px; padding: 24px; margin: 0 auto 30px auto; max-width: 300px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #000;">${otpCode}</span>
          </div>
          
          <p style="font-size: 15px; color: #555; margin-bottom: 40px;">Mã này sẽ hết hạn trong 5 phút.</p>
          
          <p style="font-size: 13px; color: #999;">© ${new Date().getFullYear()} Cao Hiển Studio. All rights reserved.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Mã OTP đã được gửi!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Gửi OTP Quên mật khẩu (Check email phải tồn tại)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản với email này!" });

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    await OTP.deleteMany({ email });
    await new OTP({ email, otp: otpCode }).save();

    await transporter.sendMail({
      from: '"Cao Hien Studio" <no-reply@caohien.com>',
      to: email,
      subject: "Mã xác thực Khôi phục mật khẩu - Cao Hiển Studio",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; color: #000; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Cao Hiển Studio</h2>
          
          <p style="font-size: 16px; margin-bottom: 12px; color: #333;">Xin chào,</p>
          <p style="font-size: 16px; margin-bottom: 30px; color: #333;">Sử dụng mã xác thực dưới đây để khôi phục mật khẩu của bạn.</p>
          
          <div style="background-color: #f4f4f4; border-radius: 12px; padding: 24px; margin: 0 auto 30px auto; max-width: 300px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #000;">${otpCode}</span>
          </div>
          
          <p style="font-size: 15px; color: #555; margin-bottom: 40px;">Mã này sẽ hết hạn trong 5 phút.</p>
          
          <p style="font-size: 13px; color: #999;">© ${new Date().getFullYear()} Cao Hiển Studio. All rights reserved.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Mã OTP đã được gửi!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Xác thực OTP chung
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OTP.findOne({ email, otp });

    if (!record)
      return res
        .status(400)
        .json({ message: "Mã OTP không chính xác hoặc đã hết hạn!" });
    res.status(200).json({ message: "Mã OTP hợp lệ!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Gửi OTP để đổi Email hoặc Mật khẩu
exports.sendUpdateOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { email } = req.body;
    // Nếu có email mới, gửi OTP đến email mới; nếu không, gửi đến email hiện tại
    const targetEmail = email || user.email;
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    await OTP.deleteMany({ email: targetEmail });
    await new OTP({ email: targetEmail, otp: otpCode }).save();

    await transporter.sendMail({
      from: '"Cao Hien Studio" <no-reply@caohien.com>',
      to: targetEmail,
      subject: "Mã xác nhận thay đổi thông tin bảo mật - Cao Hiển Studio",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; color: #000; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Cao Hiển Studio</h2>
          
          <p style="font-size: 16px; margin-bottom: 12px; color: #333;">Xin chào,</p>
          <p style="font-size: 16px; margin-bottom: 30px; color: #333;">Sử dụng mã xác thực dưới đây để xác nhận thay đổi thông tin bảo mật.</p>
          
          <div style="background-color: #f4f4f4; border-radius: 12px; padding: 24px; margin: 0 auto 30px auto; max-width: 300px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #000;">${otpCode}</span>
          </div>
          
          <p style="font-size: 15px; color: #555; margin-bottom: 40px;">Mã này sẽ hết hạn trong 5 phút.</p>
          
          <p style="font-size: 13px; color: #999;">© ${new Date().getFullYear()} Cao Hiển Studio. All rights reserved.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Mã OTP đã được gửi đến Email của bạn!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gửi mail" });
  }
};

// Lấy thông tin cá nhân (Dùng Middleware verifyToken để lấy req.user.id)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật Profile (Họ tên, SĐT, Email)
exports.updateProfile = async (req, res) => {
  try {
    // Nhận dữ liệu từ Frontend (bao gồm cả OTP nếu có)
    const { full_name, phone, email, otp } = req.body;

    const currentUser = await User.findById(req.user.id);
    if (!currentUser)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const updateData = {};

    // ==========================================
    // 1. CẬP NHẬT TỪNG PHẦN (HỌ TÊN, SĐT)
    // Logic: Khách gửi trường nào lên, và trường đó khác rỗng -> Mới lưu.
    // Giúp tránh lỗi "để trống bị bắt nhập".
    // ==========================================
    if (full_name !== undefined && full_name.trim() !== "") {
      updateData.full_name = full_name.trim();
    }
    if (phone !== undefined && phone.trim() !== "") {
      updateData.phone = phone.trim();
    }

    // ==========================================
    // 2. LOGIC ĐỔI EMAIL (BẮT BUỘC CÓ OTP)
    // ==========================================
    const isEmailChanged =
      email && email.trim() !== "" && email !== currentUser.email;

    if (isEmailChanged) {
      // a. Check trùng Email với người khác
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email này đã được người khác sử dụng!" });
      }

      // b. Bắt buộc phải có mã OTP đi kèm
      if (!otp) {
        return res
          .status(400)
          .json({ message: "Hệ thống cần mã OTP để xác nhận đổi Email!" });
      }

      // c. Kiểm tra OTP trong Database xem có khớp và còn hạn không
      const otpRecord = await OTP.findOne({ email, otp });
      if (!otpRecord) {
        return res
          .status(400)
          .json({ message: "Mã OTP không chính xác hoặc đã hết hạn!" });
      }

      // d. Đạt chuẩn -> Cho phép cập nhật Email & Xóa OTP
      updateData.email = email;
      await OTP.deleteMany({ email });
    }

    // ==========================================
    // 3. LƯU VÀO DATABASE
    // ==========================================
    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        message: "Không có thông tin nào được thay đổi",
        user: currentUser,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select("-password_hash"); // Giấu mật khẩu đi cho an toàn

    res
      .status(200)
      .json({ message: "Cập nhật thành công!", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
