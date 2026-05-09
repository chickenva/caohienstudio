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
      fullName,
      phone,
      email,
      password: hashedPassword,
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

    const isMatch = await bcrypt.compare(password, user.password);
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
        name: user.fullName,
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

    await User.findOneAndUpdate({ email }, { password: hashedPassword });
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
      subject: "Mã xác thực Đăng ký tài khoản",
      html: `<p>Mã OTP đăng ký của bạn là: <b>${otpCode}</b>. Mã có hiệu lực trong 5 phút.</p>`,
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
      subject: "Mã xác thực Khôi phục mật khẩu",
      html: `<p>Mã OTP khôi phục mật khẩu của bạn là: <b>${otpCode}</b>. Mã có hiệu lực trong 5 phút.</p>`,
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
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    await OTP.deleteMany({ email: user.email });
    await new OTP({ email: user.email, otp: otpCode }).save();

    await transporter.sendMail({
      from: '"Cao Hien Studio" <no-reply@caohien.com>',
      to: user.email,
      subject: "Mã OTP xác nhận thay đổi thông tin bảo mật",
      html: `<p>Bạn đang thực hiện thay đổi Email hoặc Mật khẩu. Mã OTP của bạn là: <b>${otpCode}</b> (Hiệu lực 5 phút).</p>`,
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
    const { fullName, phone, email } = req.body;

    // Check trùng email nếu user muốn đổi sang email khác
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user.id },
      });
      if (existingUser)
        return res
          .status(400)
          .json({ message: "Email này đã được người khác sử dụng!" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone, email },
      { new: true },
    ).select("-password");

    res
      .status(200)
      .json({ message: "Cập nhật thành công!", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};
