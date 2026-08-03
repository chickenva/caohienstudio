/**
 * userController.js
 * Quản lý người dùng: nhiếp ảnh gia (public + admin), khách hàng và tài khoản admin.
 * Admin có toàn quyền CRUD photographer, xem và ẩn/hiện tài khoản customer.
 * Admin có thể tạo tài khoản ADMIN/PHOTOGRAPHER mới qua trang Quản lý tài khoản.
 */
const bcrypt = require("bcryptjs");
const User   = require("../models/User");

// ==========================================
// PUBLIC: NHIẾP ẢNH GIA
// ==========================================

/**
 * [GET] /api/users/photographers
 * Lấy danh sách nhiếp ảnh gia đang hoạt động (is_active = true).
 */
exports.getPhotographers = async (req, res) => {
  try {
    const photographers = await User.find({ role: "PHOTOGRAPHER", is_active: true })
      .select("full_name email phone portfolio is_active createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Lấy danh sách nhiếp ảnh gia thành công",
      photographers,
    });
  } catch (error) {
    console.error("Get photographers error:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách nhiếp ảnh gia",
      error: error.message,
    });
  }
};

/**
 * [GET] /api/users/photographers/:id
 * Lấy chi tiết nhiếp ảnh gia đang hoạt động (public).
 */
exports.getPhotographerDetail = async (req, res) => {
  try {
    const photographer = await User.findOne({
      _id:       req.params.id,
      role:      "PHOTOGRAPHER",
      is_active: true,
    }).select("full_name email phone portfolio is_active createdAt");

    if (!photographer) {
      return res.status(404).json({ message: "Không tìm thấy nhiếp ảnh gia" });
    }

    res.status(200).json({
      message: "Lấy chi tiết nhiếp ảnh gia thành công",
      photographer,
    });
  } catch (error) {
    console.error("Get photographer detail error:", error);
    res.status(500).json({
      message: "Lỗi lấy chi tiết nhiếp ảnh gia",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: NHIẾP ẢNH GIA
// ==========================================

/**
 * [GET] /api/users/admin/photographers
 * Admin lấy tất cả nhiếp ảnh gia, kể cả inactive.
 */
exports.getAllPhotographersForAdmin = async (req, res) => {
  try {
    const photographers = await User.find({ role: "PHOTOGRAPHER" })
      .select("full_name email phone portfolio is_active createdAt updatedAt")
      .sort({ createdAt: -1 });

    res.status(200).json(photographers);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách nhiếp ảnh gia",
      error: error.message,
    });
  }
};

/**
 * [GET] /api/users/admin/photographers/:id
 * Admin lấy chi tiết nhiếp ảnh gia theo ID (kể cả inactive).
 */
exports.getPhotographerDetailForAdmin = async (req, res) => {
  try {
    const photographer = await User.findOne({ _id: req.params.id, role: "PHOTOGRAPHER" })
      .select("full_name email phone portfolio is_active createdAt updatedAt");

    if (!photographer) {
      return res.status(404).json({ message: "Không tìm thấy nhiếp ảnh gia" });
    }

    res.status(200).json({
      message: "Lấy chi tiết nhiếp ảnh gia thành công",
      photographer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy chi tiết nhiếp ảnh gia",
      error: error.message,
    });
  }
};

/**
 * [POST] /api/users/admin/photographers
 * Admin tạo tài khoản nhiếp ảnh gia mới.
 * Mật khẩu được mã hóa bằng bcrypt trước khi lưu.
 */
exports.createPhotographer = async (req, res) => {
  try {
    const { email, password, full_name, phone, portfolio, is_active = true } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: "Vui lòng nhập email, mật khẩu và họ tên" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã tồn tại" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const photographer = await User.create({
      email,
      password_hash,
      full_name,
      phone,
      role:      "PHOTOGRAPHER",
      portfolio: portfolio || {},
      is_active,
    });

    res.status(201).json({ message: "Tạo nhiếp ảnh gia thành công", photographer });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo nhiếp ảnh gia", error: error.message });
  }
};

/**
 * [PUT] /api/users/admin/photographers/:id
 * Admin cập nhật thông tin nhiếp ảnh gia. Kiểm tra trùng email nếu có thay đổi.
 */
exports.updatePhotographer = async (req, res) => {
  try {
    const { email, full_name, phone, portfolio, is_active } = req.body;

    const photographer = await User.findOne({ _id: req.params.id, role: "PHOTOGRAPHER" });
    if (!photographer) {
      return res.status(404).json({ message: "Không tìm thấy nhiếp ảnh gia" });
    }

    // Nếu đổi email, kiểm tra email mới chưa được dùng bởi tài khoản khác
    if (email && email !== photographer.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email này đã được sử dụng" });
      }
      photographer.email = email;
    }

    if (full_name  !== undefined) photographer.full_name  = full_name;
    if (phone      !== undefined) photographer.phone      = phone;
    if (portfolio  !== undefined) photographer.portfolio  = portfolio;
    if (is_active  !== undefined) photographer.is_active  = is_active;

    await photographer.save();

    res.status(200).json({ message: "Cập nhật nhiếp ảnh gia thành công", photographer });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật nhiếp ảnh gia", error: error.message });
  }
};

/**
 * [PATCH] /api/users/admin/photographers/:id/toggle-active
 * Admin kích hoạt hoặc ẩn tài khoản nhiếp ảnh gia.
 */
exports.togglePhotographerActive = async (req, res) => {
  try {
    const photographer = await User.findOne({ _id: req.params.id, role: "PHOTOGRAPHER" });
    if (!photographer) {
      return res.status(404).json({ message: "Không tìm thấy nhiếp ảnh gia" });
    }

    photographer.is_active = !photographer.is_active;
    await photographer.save();

    res.status(200).json({
      message: photographer.is_active ? "Đã kích hoạt nhiếp ảnh gia" : "Đã ẩn nhiếp ảnh gia",
      photographer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật trạng thái nhiếp ảnh gia",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: KHÁCH HÀNG
// ==========================================

/**
 * [GET] /api/users/admin/customers
 * Admin lấy toàn bộ danh sách khách hàng.
 */
exports.getAllCustomersForAdmin = async (req, res) => {
  try {
    const customers = await User.find({ role: "CUSTOMER" })
      .select("full_name email phone role is_active createdAt updatedAt")
      .sort({ createdAt: -1 });

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách khách hàng", error: error.message });
  }
};

/**
 * [GET] /api/users/admin/customers/:id
 * Admin lấy chi tiết thông tin một khách hàng.
 */
exports.getCustomerDetailForAdmin = async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: "CUSTOMER" })
      .select("full_name email phone role is_active createdAt updatedAt");

    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }

    res.status(200).json({ message: "Lấy chi tiết khách hàng thành công", customer });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết khách hàng", error: error.message });
  }
};

/**
 * [PATCH] /api/users/admin/customers/:id/toggle-active
 * Admin khóa hoặc mở khóa tài khoản khách hàng.
 */
exports.toggleCustomerActive = async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: "CUSTOMER" });
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }

    customer.is_active = !customer.is_active;
    await customer.save();

    res.status(200).json({
      message: customer.is_active ? "Đã kích hoạt tài khoản khách hàng" : "Đã ẩn tài khoản khách hàng",
      customer,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái khách hàng", error: error.message });
  }
};

/**
 * [GET] /api/users/admin/customers/search?keyword=...
 * Admin tìm kiếm khách hàng theo email, số điện thoại hoặc họ tên (tối thiểu 2 ký tự).
 */
exports.searchCustomersForAdmin = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        message: "Vui lòng nhập ít nhất 2 ký tự để tìm khách hàng",
      });
    }

    const searchText = keyword.trim();

    const customers = await User.find({
      role: "CUSTOMER",
      $or: [
        { email:     { $regex: searchText, $options: "i" } },
        { phone:     { $regex: searchText, $options: "i" } },
        { full_name: { $regex: searchText, $options: "i" } },
      ],
    })
      .select("full_name email phone is_active createdAt")
      .limit(10)
      .sort({ createdAt: -1 });

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tìm khách hàng", error: error.message });
  }
};

// ==========================================
// ADMIN: QUẢN LÝ TÀI KHOẢN (ADMIN + PHOTOGRAPHER)
// ==========================================

/**
 * [GET] /api/users/admin/accounts
 * Admin lấy toàn bộ danh sách tài khoản ADMIN.
 */
exports.getAllAccountsForAdmin = async (req, res) => {
  try {
    const accounts = await User.find({ role: "ADMIN" })
      .select("full_name email phone role is_active createdAt updatedAt")
      .sort({ createdAt: -1 });

    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách tài khoản", error: error.message });
  }
};

/**
 * [POST] /api/users/admin/accounts
 * Admin tạo tài khoản ADMIN mới.
 * Mật khẩu được mã hóa bằng bcrypt trước khi lưu.
 */
exports.createAccount = async (req, res) => {
  try {
    const { email, password, full_name, phone, is_active = true } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: "Vui lòng nhập email, mật khẩu và họ tên" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã tồn tại" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const account = await User.create({
      email,
      password_hash,
      full_name,
      phone,
      role: "ADMIN",
      is_active,
    });

    res.status(201).json({
      message: "Tạo tài khoản thành công",
      account: {
        _id: account._id,
        email: account.email,
        full_name: account.full_name,
        phone: account.phone,
        role: account.role,
        is_active: account.is_active,
        createdAt: account.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo tài khoản", error: error.message });
  }
};

/**
 * [PATCH] /api/users/admin/accounts/:id/toggle-active
 * Admin kích hoạt hoặc khóa tài khoản ADMIN.
 */
exports.toggleAccountActive = async (req, res) => {
  try {
    const account = await User.findOne({
      _id: req.params.id,
      role: "ADMIN",
    });

    if (!account) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    account.is_active = !account.is_active;
    await account.save();

    res.status(200).json({
      message: account.is_active ? "Đã kích hoạt tài khoản" : "Đã khóa tài khoản",
      account,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái tài khoản", error: error.message });
  }
};
