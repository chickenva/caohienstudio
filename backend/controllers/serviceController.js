const Service = require("../models/Service");

// ==========================================
// PUBLIC: Lấy dịch vụ đang hoạt động
// GET /api/services
// ==========================================
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ is_active: true }).sort({
      createdAt: -1,
    });

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách dịch vụ",
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
        message: "Không tìm thấy gói dịch vụ này",
      });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Lấy tất cả dịch vụ, kể cả đã ẩn
// GET /api/services/admin/all
// ==========================================
exports.getAllServicesForAdmin = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách dịch vụ",
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
        message: "Không tìm thấy gói dịch vụ này",
      });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy chi tiết dịch vụ",
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
    const {
      name,
      description,
      base_price,
      duration_hours,
      thumbnail,
      is_active,
    } = req.body;

    if (!name || base_price === undefined || duration_hours === undefined) {
      return res.status(400).json({
        message: "Vui lòng nhập tên dịch vụ, giá và thời lượng chụp",
      });
    }

    if (Number(base_price) < 0 || Number(duration_hours) <= 0) {
      return res.status(400).json({
        message: "Giá dịch vụ hoặc thời lượng không hợp lệ",
      });
    }

    const newService = await Service.create({
      name,
      description,
      base_price: Number(base_price),
      duration_hours: Number(duration_hours),
      thumbnail,
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json({
      message: "Tạo gói dịch vụ thành công",
      service: newService,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi tạo dịch vụ",
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
    const {
      name,
      description,
      base_price,
      duration_hours,
      thumbnail,
      is_active,
    } = req.body;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Không tìm thấy dịch vụ để cập nhật",
      });
    }

    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (thumbnail !== undefined) service.thumbnail = thumbnail;
    if (is_active !== undefined) service.is_active = is_active;

    if (base_price !== undefined) {
      if (Number(base_price) < 0) {
        return res.status(400).json({
          message: "Giá dịch vụ không hợp lệ",
        });
      }

      service.base_price = Number(base_price);
    }

    if (duration_hours !== undefined) {
      if (Number(duration_hours) <= 0) {
        return res.status(400).json({
          message: "Thời lượng chụp không hợp lệ",
        });
      }

      service.duration_hours = Number(duration_hours);
    }

    await service.save();

    res.status(200).json({
      message: "Cập nhật dịch vụ thành công",
      service,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật dịch vụ",
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
      return res.status(404).json({
        message: "Không tìm thấy dịch vụ",
      });
    }

    service.is_active = !service.is_active;
    await service.save();

    res.status(200).json({
      message: service.is_active ? "Đã hiển thị dịch vụ" : "Đã ẩn dịch vụ",
      service,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật trạng thái dịch vụ",
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
      return res.status(404).json({
        message: "Không tìm thấy dịch vụ",
      });
    }

    res.status(200).json({
      message: "Đã tạm ngưng cung cấp gói dịch vụ này",
      service,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi xóa dịch vụ",
      error: error.message,
    });
  }
};
