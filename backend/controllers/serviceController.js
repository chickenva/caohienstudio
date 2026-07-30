/**
 * serviceController.js
 * Quản lý gói dịch vụ chụp/quay/in ấn của studio.
 * Hỗ trợ CRUD, ẩn/hiện (soft delete), và sắp xếp thứ tự hàng loạt.
 */
const Service = require("../models/Service");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Chuẩn hóa danh sách tính năng (features) từ textarea hoặc mảng.
 * Hỗ trợ 2 input: string phân cách bằng newline hoặc mảng chuỗi.
 * @param {string|Array} features
 * @returns {string[]}
 */
const normalizeFeatures = (features) => {
  if (Array.isArray(features)) {
    return features.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof features === "string") {
    return features
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

/**
 * Gom các trường body thành payload chung cho tạo/cập nhật dịch vụ.
 * @param {Object} body - req.body
 * @returns {Object}
 */
const buildServicePayload = (body) => {
  const {
    name, description, category,
    base_price, duration_hours,
    thumbnail, features,
    is_active, booking_mode, allow_addon,
  } = body;

  return {
    name, description,
    category:     category || "OTHER",
    base_price, duration_hours,
    thumbnail, features,
    is_active, booking_mode, allow_addon,
  };
};

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

/**
 * [GET] /api/services?category=...
 * Lấy danh sách dịch vụ đang hoạt động, có thể lọc theo danh mục.
 */
exports.getAllServices = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { is_active: true };

    if (category && category !== "ALL") {
      query.category = category;
    }

    const services = await Service.find(query).sort({ order: 1, createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách dịch vụ", error: error.message });
  }
};

/**
 * [GET] /api/services/:id
 * Lấy chi tiết dịch vụ đang hoạt động theo ID.
 */
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, is_active: true });

    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ này" });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

/**
 * [GET] /api/services/admin/all
 * Admin lấy tất cả dịch vụ, kể cả dịch vụ đã ẩn.
 */
exports.getAllServicesForAdmin = async (req, res) => {
  try {
    const services = await Service.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách dịch vụ", error: error.message });
  }
};

/**
 * [GET] /api/services/admin/:id
 * Admin lấy chi tiết dịch vụ theo ID (kể cả đã ẩn).
 */
exports.getServiceByIdForAdmin = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy gói dịch vụ này" });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết dịch vụ", error: error.message });
  }
};

/**
 * [POST] /api/services/admin
 * Admin tạo gói dịch vụ mới. Validate tên, giá và thời lượng.
 */
exports.createService = async (req, res) => {
  try {
    const payload = buildServicePayload(req.body);

    if (!payload.name || payload.base_price === undefined || payload.duration_hours === undefined) {
      return res.status(400).json({
        message: "Vui lòng nhập tên dịch vụ, giá và thời lượng chụp/quay",
      });
    }

    if (Number(payload.base_price) < 0 || Number(payload.duration_hours) <= 0) {
      return res.status(400).json({
        message: "Giá dịch vụ hoặc thời lượng không hợp lệ",
      });
    }

    const newService = await Service.create({
      name:         payload.name,
      description:  payload.description,
      category:     payload.category,
      base_price:   Number(payload.base_price),
      duration_hours: Number(payload.duration_hours),
      thumbnail:    payload.thumbnail,
      features:     normalizeFeatures(payload.features),
      is_active:    payload.is_active !== undefined ? payload.is_active : true,
      booking_mode: payload.booking_mode || "SINGLE_DAY",
      allow_addon:  payload.allow_addon  !== undefined ? payload.allow_addon : false,
      order:        req.body.order || 0,
    });

    res.status(201).json({ message: "Tạo gói dịch vụ thành công", service: newService });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo dịch vụ", error: error.message });
  }
};

/**
 * [PUT] /api/services/admin/:id
 * Admin cập nhật gói dịch vụ. Chỉ cập nhật các trường được gửi lên.
 */
exports.updateService = async (req, res) => {
  try {
    const payload = buildServicePayload(req.body);
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ để cập nhật" });
    }

    if (payload.name        !== undefined) service.name        = payload.name;
    if (payload.description !== undefined) service.description = payload.description;
    if (payload.thumbnail   !== undefined) service.thumbnail   = payload.thumbnail;
    if (payload.is_active   !== undefined) service.is_active   = payload.is_active;
    if (payload.category    !== undefined) service.category    = payload.category;

    if (payload.features !== undefined) {
      service.features = normalizeFeatures(payload.features);
    }

    if (payload.base_price !== undefined) {
      if (Number(payload.base_price) < 0) {
        return res.status(400).json({ message: "Giá dịch vụ không hợp lệ" });
      }
      service.base_price = Number(payload.base_price);
    }

    if (payload.duration_hours !== undefined) {
      if (Number(payload.duration_hours) <= 0) {
        return res.status(400).json({ message: "Thời lượng chụp/quay không hợp lệ" });
      }
      service.duration_hours = Number(payload.duration_hours);
    }

    if (payload.booking_mode !== undefined) service.booking_mode = payload.booking_mode;
    if (payload.allow_addon  !== undefined) service.allow_addon  = payload.allow_addon;
    if (req.body.order       !== undefined) service.order        = Number(req.body.order);

    await service.save();

    res.status(200).json({ message: "Cập nhật dịch vụ thành công", service });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật dịch vụ", error: error.message });
  }
};

/**
 * [PATCH] /api/services/admin/:id/toggle-active
 * Admin ẩn hoặc hiện gói dịch vụ trên website.
 */
exports.toggleServiceActive = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    service.is_active = !service.is_active;
    await service.save();

    res.status(200).json({
      message: service.is_active ? "Đã hiển thị dịch vụ" : "Đã ẩn dịch vụ",
      service,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái dịch vụ", error: error.message });
  }
};

/**
 * [DELETE] /api/services/admin/:id
 * Soft delete: đặt is_active = false thay vì xóa hoàn toàn.
 */
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true },
    );

    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    res.status(200).json({ message: "Đã tạm ngừng cung cấp gói dịch vụ này", service });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa dịch vụ", error: error.message });
  }
};

/**
 * [PUT] /api/services/admin/reorder
 * Admin cập nhật thứ tự hiển thị hàng loạt bằng bulkWrite.
 * @param {Array} items - Mảng { _id, order }
 */
exports.reorderServices = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
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

    res.status(200).json({ message: "Cập nhật thứ tự thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật thứ tự", error: error.message });
  }
};
