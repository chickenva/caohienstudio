const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SiteLock = require("../models/SiteLock");

// Tách JWT token ra khỏi header Authorization dạng "Bearer <token>".
const getTokenFromHeader = (req) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) return null;

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

/**
 * Middleware xác thực JWT — kiểm tra người dùng đã đăng nhập chưa.
 * Nếu token hợp lệ, gắn thông tin user vào req.user và gọi next().
 */
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

/**
 * Middleware xác thực quyền ADMIN.
 * Lấy user thực từ DB (thay vì chỉ dùng payload token) để đảm bảo
 * role luôn được kiểm tra theo dữ liệu hiện tại, tránh dùng token cũ.
 * Super Admin (isSuperAdmin: true) bypass hoàn toàn việc tra DB.
 */
exports.verifyAdmin = async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({
      message: "Vui lòng đăng nhập để tiếp tục",
    });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // --- Super Admin bypass: không cần tra DB ---
    if (verified.isSuperAdmin === true) {
      req.user = {
        id: "super-admin",
        email: verified.email,
        full_name: verified.full_name,
        role: "ADMIN",
        isSuperAdmin: true,
      };
      return next();
    }
    // --------------------------------------------

    // --- Nếu website bị khóa, ngắt quyền truy cập của Admin thường ---
    const siteLock = await SiteLock.findOne();
    if (siteLock && siteLock.isLocked) {
      return res.status(403).json({
        message: "Website hiện đang trong trạng thái tạm khóa. Chỉ Super Admin mới có quyền truy cập.",
      });
    }
    // ------------------------------------------------------------------

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
