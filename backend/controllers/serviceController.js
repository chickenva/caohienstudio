const Service = require("../models/Service");


// Chuẩn hóa danh sách đặc điểm dịch vụ từ textarea hoặc mảng.
const normalizeFeatures = (features) => {
  if (Array.isArray(features)) {
    return features.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof features === "string") {
    return features
      .split(new RegExp("\\r?\\n"))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

// Gom dữ liệu body thành payload chung cho thao tác tạo/cập nhật dịch vụ.
const buildServicePayload = (body) => {
  const {
    name,
    description,
    category,
    base_price,
    duration_hours,
    thumbnail,
    features,
    is_active,
    booking_mode,
    allow_addon,
  } = body;

  return {
    name,
    description,
    category: category || "OTHER",
    base_price,
    duration_hours,
    thumbnail,
    features,
    is_active,
    booking_mode,
    allow_addon,
  };
};

// ==========================================
// PUBLIC: Lấy dịch vụ đang hoạt động
// GET /api/services?category=TRADITIONAL
// ==========================================
exports.getAllServices = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { is_active: true };

    if (category && category !== "ALL") {
      query.category = category;
    }

    const services = await Service.find(query).sort({
      order: 1,
      createdAt: -1,
    });

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({
      message: "Loi lay danh sach dich vu",
      error: error.message,
    });
  }
};

// ==========================================
// PUBLIC: Lấy chi tiết dịch vụ đang hoạt động
// GET /api/services/:id
// ==========================================
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      is_active: true,
    });

    if (!service) {
      return res.status(404).json({
        message: "Khong tim thay goi dich vu nay",
      });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({
      message: "Loi server",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Lấy tất cả dịch vụ, kể cả dịch vụ đã ẩn
// GET /api/services/admin/all
// ==========================================
exports.getAllServicesForAdmin = async (req, res) => {
  try {
    const services = await Service.find().sort({ order: 1, createdAt: -1 });

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({
      message: "Loi lay danh sach dich vu",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Lấy chi tiết dịch vụ cho admin
// GET /api/services/admin/:id
// ==========================================
exports.getServiceByIdForAdmin = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Khong tim thay goi dich vu nay",
      });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({
      message: "Loi lay chi tiet dich vu",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Tạo dịch vụ mới
// POST /api/services/admin
// ==========================================
exports.createService = async (req, res) => {
  try {
    const payload = buildServicePayload(req.body);

    if (!payload.name || payload.base_price === undefined || payload.duration_hours === undefined) {
      return res.status(400).json({
        message: "Vui long nhap ten dich vu, gia va thoi luong chup/quay",
      });
    }


    if (Number(payload.base_price) < 0 || Number(payload.duration_hours) <= 0) {
      return res.status(400).json({
        message: "Gia dich vu hoac thoi luong khong hop le",
      });
    }

    const newService = await Service.create({
      name: payload.name,
      description: payload.description,
      category: payload.category,
      base_price: Number(payload.base_price),
      duration_hours: Number(payload.duration_hours),
      thumbnail: payload.thumbnail,
      features: normalizeFeatures(payload.features),
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      booking_mode: payload.booking_mode || "SINGLE_DAY",
      allow_addon: payload.allow_addon !== undefined ? payload.allow_addon : false,
      order: req.body.order || 0,
    });

    res.status(201).json({
      message: "Tao goi dich vu thanh cong",
      service: newService,
    });
  } catch (error) {
    res.status(500).json({
      message: "Loi tao dich vu",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Cập nhật dịch vụ
// PUT /api/services/admin/:id
// ==========================================
exports.updateService = async (req, res) => {
  try {
    const payload = buildServicePayload(req.body);
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Khong tim thay dich vu de cap nhat",
      });
    }

    if (payload.name !== undefined) service.name = payload.name;
    if (payload.description !== undefined) service.description = payload.description;
    if (payload.thumbnail !== undefined) service.thumbnail = payload.thumbnail;
    if (payload.is_active !== undefined) service.is_active = payload.is_active;

    if (payload.category !== undefined) {
      service.category = payload.category;
    }

    if (payload.features !== undefined) {
      service.features = normalizeFeatures(payload.features);
    }

    if (payload.base_price !== undefined) {
      if (Number(payload.base_price) < 0) {
        return res.status(400).json({ message: "Gia dich vu khong hop le" });
      }

      service.base_price = Number(payload.base_price);
    }

    if (payload.duration_hours !== undefined) {
      if (Number(payload.duration_hours) <= 0) {
        return res.status(400).json({ message: "Thoi luong chup/quay khong hop le" });
      }

      service.duration_hours = Number(payload.duration_hours);
    }

    if (payload.booking_mode !== undefined) {
      service.booking_mode = payload.booking_mode;
    }

    if (payload.allow_addon !== undefined) {
      service.allow_addon = payload.allow_addon;
    }

    if (req.body.order !== undefined) {
      service.order = Number(req.body.order);
    }

    await service.save();

    res.status(200).json({
      message: "Cap nhat dich vu thanh cong",
      service,
    });
  } catch (error) {
    res.status(500).json({
      message: "Loi cap nhat dich vu",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Ẩn / hiện dịch vụ
// PATCH /api/services/admin/:id/toggle-active
// ==========================================
exports.toggleServiceActive = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Khong tim thay dich vu" });
    }

    service.is_active = !service.is_active;
    await service.save();

    res.status(200).json({
      message: service.is_active ? "Da hien thi dich vu" : "Da an dich vu",
      service,
    });
  } catch (error) {
    res.status(500).json({
      message: "Loi cap nhat trang thai dich vu",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Xóa mềm dịch vụ
// DELETE /api/services/admin/:id
// ==========================================
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true },
    );

    if (!service) {
      return res.status(404).json({ message: "Khong tim thay dich vu" });
    }

    res.status(200).json({
      message: "Da tam ngung cung cap goi dich vu nay",
      service,
    });
  } catch (error) {
    res.status(500).json({
      message: "Loi xoa dich vu",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Cập nhật thứ tự hàng loạt
// PUT /api/services/admin/reorder
// ==========================================
exports.reorderServices = async (req, res) => {
  try {
    const { items } = req.body; // array of { _id, order }
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Du lieu khong hop le" });
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { order: item.order },
      },
    }));

    if (bulkOps.length > 0) {
      await Service.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: "Cap nhat thu tu thanh cong" });
  } catch (error) {
    res.status(500).json({
      message: "Loi cap nhat thu tu",
      error: error.message,
    });
  }
};
