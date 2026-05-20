const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ==========================================
// PUBLIC: Lấy danh sách nhiếp ảnh gia
// GET /api/users/photographers
// ==========================================
exports.getPhotographers = async (req, res) => {
  try {
    const photographers = await User.find({
      role: "PHOTOGRAPHER",
      is_active: true,
    })
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

// ==========================================
// PUBLIC: Lấy chi tiết nhiếp ảnh gia
// GET /api/users/photographers/:id
// ==========================================
exports.getPhotographerDetail = async (req, res) => {
  try {
    const photographer = await User.findOne({
      _id: req.params.id,
      role: "PHOTOGRAPHER",
      is_active: true,
    }).select("full_name email phone portfolio is_active createdAt");

    if (!photographer) {
      return res.status(404).json({
        message: "Không tìm thấy nhiếp ảnh gia",
      });
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
// ADMIN: Lấy tất cả photographer, kể cả inactive
// GET /api/users/admin/photographers
// ==========================================
exports.getAllPhotographersForAdmin = async (req, res) => {
  try {
    const photographers = await User.find({
      role: "PHOTOGRAPHER",
    })
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

// ==========================================
// ADMIN: Tạo photographer
// POST /api/users/admin/photographers
// ==========================================
exports.createPhotographer = async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      portfolio,
      is_active = true,
    } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        message: "Vui lòng nhập email, mật khẩu và họ tên",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email này đã tồn tại",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const photographer = await User.create({
      email,
      password_hash,
      full_name,
      phone,
      role: "PHOTOGRAPHER",
      portfolio: portfolio || {},
      is_active,
    });

    res.status(201).json({
      message: "Tạo nhiếp ảnh gia thành công",
      photographer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi tạo nhiếp ảnh gia",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Cập nhật photographer
// PUT /api/users/admin/photographers/:id
// ==========================================
exports.updatePhotographer = async (req, res) => {
  try {
    const { email, full_name, phone, portfolio, is_active } = req.body;

    const photographer = await User.findOne({
      _id: req.params.id,
      role: "PHOTOGRAPHER",
    });

    if (!photographer) {
      return res.status(404).json({
        message: "Không tìm thấy nhiếp ảnh gia",
      });
    }

    if (email && email !== photographer.email) {
      const existingEmail = await User.findOne({ email });

      if (existingEmail) {
        return res.status(400).json({
          message: "Email này đã được sử dụng",
        });
      }

      photographer.email = email;
    }

    if (full_name !== undefined) photographer.full_name = full_name;
    if (phone !== undefined) photographer.phone = phone;
    if (portfolio !== undefined) photographer.portfolio = portfolio;
    if (is_active !== undefined) photographer.is_active = is_active;

    await photographer.save();

    res.status(200).json({
      message: "Cập nhật nhiếp ảnh gia thành công",
      photographer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật nhiếp ảnh gia",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Ẩn/hiện photographer
// PATCH /api/users/admin/photographers/:id/toggle-active
// ==========================================
exports.togglePhotographerActive = async (req, res) => {
  try {
    const photographer = await User.findOne({
      _id: req.params.id,
      role: "PHOTOGRAPHER",
    });

    if (!photographer) {
      return res.status(404).json({
        message: "Không tìm thấy nhiếp ảnh gia",
      });
    }

    photographer.is_active = !photographer.is_active;
    await photographer.save();

    res.status(200).json({
      message: photographer.is_active
        ? "Đã kích hoạt nhiếp ảnh gia"
        : "Đã ẩn nhiếp ảnh gia",
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
// ADMIN: Lấy chi tiết photographer, kể cả inactive
// GET /api/users/admin/photographers/:id
// ==========================================
exports.getPhotographerDetailForAdmin = async (req, res) => {
  try {
    const photographer = await User.findOne({
      _id: req.params.id,
      role: "PHOTOGRAPHER",
    }).select("full_name email phone portfolio is_active createdAt updatedAt");

    if (!photographer) {
      return res.status(404).json({
        message: "Không tìm thấy nhiếp ảnh gia",
      });
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

// ==========================================
// ADMIN: Lấy danh sách khách hàng
// GET /api/users/admin/customers
// ==========================================
exports.getAllCustomersForAdmin = async (req, res) => {
  try {
    const customers = await User.find({
      role: "CUSTOMER",
    })
      .select("full_name email phone role is_active createdAt updatedAt")
      .sort({ createdAt: -1 });

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách khách hàng",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Lấy chi tiết khách hàng
// GET /api/users/admin/customers/:id
// ==========================================
exports.getCustomerDetailForAdmin = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: "CUSTOMER",
    }).select("full_name email phone role is_active createdAt updatedAt");

    if (!customer) {
      return res.status(404).json({
        message: "Không tìm thấy khách hàng",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết khách hàng thành công",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy chi tiết khách hàng",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Ẩn / hiện tài khoản khách hàng
// PATCH /api/users/admin/customers/:id/toggle-active
// ==========================================
exports.toggleCustomerActive = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: "CUSTOMER",
    });

    if (!customer) {
      return res.status(404).json({
        message: "Không tìm thấy khách hàng",
      });
    }

    customer.is_active = !customer.is_active;
    await customer.save();

    res.status(200).json({
      message: customer.is_active
        ? "Đã kích hoạt tài khoản khách hàng"
        : "Đã ẩn tài khoản khách hàng",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật trạng thái khách hàng",
      error: error.message,
    });
  }
};
