/**
 * userController.js
 * Quản lý người dùng: khách hàng và tài khoản admin.
 * Admin có thể xem, ẩn/hiện tài khoản customer và tạo tài khoản ADMIN mới.
 */
const bcrypt = require("bcryptjs");
const User   = require("../models/User");

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
// ADMIN: QUẢN LÝ TÀI KHOẢN (ADMIN)
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
