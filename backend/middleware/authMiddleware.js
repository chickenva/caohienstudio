const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getTokenFromHeader = (req) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) return null;

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

// ==========================================
// Kiểm tra user đã đăng nhập chưa
// ==========================================
exports.verifyToken = (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({
      message: "Vui lòng đăng nhập để tiếp tục",
    });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

// ==========================================
// Kiểm tra quyền ADMIN
// Lấy user thật từ DB để tránh lỗi token thiếu role
// ==========================================
exports.verifyAdmin = async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({
      message: "Vui lòng đăng nhập để tiếp tục",
    });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    const userId = verified.id || verified._id;

    if (!userId) {
      return res.status(401).json({
        message: "Token không hợp lệ: thiếu thông tin người dùng",
      });
    }

    const user = await User.findById(userId).select(
      "_id email full_name role is_active",
    );

    if (!user) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa hoặc ngừng hoạt động",
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập chức năng quản trị",
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

// ==========================================
// Dự phòng sau này nếu có dashboard photographer
// ==========================================
exports.verifyAdminOrPhotographer = async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({
      message: "Vui lòng đăng nhập để tiếp tục",
    });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    const userId = verified.id || verified._id;

    if (!userId) {
      return res.status(401).json({
        message: "Token không hợp lệ: thiếu thông tin người dùng",
      });
    }

    const user = await User.findById(userId).select(
      "_id email full_name role is_active",
    );

    if (!user) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa hoặc ngừng hoạt động",
      });
    }

    if (!["ADMIN", "PHOTOGRAPHER"].includes(user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập chức năng này",
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};
