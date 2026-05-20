const Resource = require("../models/Resource");

// ==========================================
// PUBLIC: Lấy danh sách đồ cho thuê
// GET /api/resources/rentals?type=ALL
// ==========================================
exports.getRentals = async (req, res) => {
  try {
    const { type } = req.query;

    const query = {
      usage_type: { $in: ["RENTAL", "BOTH"] },
      is_active: true,
    };

    if (type && type !== "ALL") {
      query.type = type;
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });

    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách thiết bị",
      error: error.message,
    });
  }
};

// ==========================================
// PUBLIC: Lấy chi tiết 1 thiết bị cho thuê
// GET /api/resources/rentals/:id
// ==========================================
exports.getRentalDetail = async (req, res) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      usage_type: { $in: ["RENTAL", "BOTH"] },
      is_active: true,
    });

    if (!resource) {
      return res.status(404).json({
        message: "Không tìm thấy thiết bị cho thuê",
      });
    }

    res.status(200).json(resource);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy chi tiết thiết bị",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Lấy tất cả tài nguyên, kể cả đã ẩn
// GET /api/resources/admin/all
// ==========================================
exports.getAllResourcesForAdmin = async (req, res) => {
  try {
    const { type, status, usage_type } = req.query;

    const query = {};

    if (type && type !== "ALL") {
      query.type = type;
    }

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (usage_type && usage_type !== "ALL") {
      query.usage_type = usage_type;
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });

    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách tài nguyên",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Lấy chi tiết tài nguyên
// GET /api/resources/admin/:id
// ==========================================
exports.getResourceByIdForAdmin = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        message: "Không tìm thấy tài nguyên",
      });
    }

    res.status(200).json(resource);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy chi tiết tài nguyên",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Tạo tài nguyên
// POST /api/resources/admin
// ==========================================
exports.createResource = async (req, res) => {
  try {
    const {
      name,
      type,
      usage_type,
      rental_price_per_day,
      required_deposit_amount,
      thumbnail,
      features,
      status,
      is_active,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        message: "Vui lòng nhập tên thiết bị và loại thiết bị",
      });
    }

    const validTypes = ["CAMERA", "LENS", "LIGHT", "STUDIO", "ACCESSORY"];
    const validUsageTypes = ["INTERNAL", "RENTAL", "BOTH"];
    const validStatuses = ["AVAILABLE", "IN_USE", "MAINTENANCE"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: "Loại thiết bị không hợp lệ",
      });
    }

    if (usage_type && !validUsageTypes.includes(usage_type)) {
      return res.status(400).json({
        message: "Mục đích sử dụng không hợp lệ",
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Trạng thái thiết bị không hợp lệ",
      });
    }

    const resource = await Resource.create({
      name,
      type,
      usage_type: usage_type || "RENTAL",
      rental_price_per_day: Number(rental_price_per_day || 0),
      required_deposit_amount: Number(required_deposit_amount || 0),
      thumbnail,
      features: Array.isArray(features) ? features : [],
      status: status || "AVAILABLE",
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json({
      message: "Tạo tài nguyên thành công",
      resource,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi tạo tài nguyên",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Cập nhật tài nguyên
// PUT /api/resources/admin/:id
// ==========================================
exports.updateResource = async (req, res) => {
  try {
    const {
      name,
      type,
      usage_type,
      rental_price_per_day,
      required_deposit_amount,
      thumbnail,
      features,
      status,
      is_active,
    } = req.body;

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        message: "Không tìm thấy tài nguyên",
      });
    }

    const validTypes = ["CAMERA", "LENS", "LIGHT", "STUDIO", "ACCESSORY"];
    const validUsageTypes = ["INTERNAL", "RENTAL", "BOTH"];
    const validStatuses = ["AVAILABLE", "IN_USE", "MAINTENANCE"];

    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        message: "Loại thiết bị không hợp lệ",
      });
    }

    if (usage_type && !validUsageTypes.includes(usage_type)) {
      return res.status(400).json({
        message: "Mục đích sử dụng không hợp lệ",
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Trạng thái thiết bị không hợp lệ",
      });
    }

    if (name !== undefined) resource.name = name;
    if (type !== undefined) resource.type = type;
    if (usage_type !== undefined) resource.usage_type = usage_type;
    if (thumbnail !== undefined) resource.thumbnail = thumbnail;
    if (status !== undefined) resource.status = status;
    if (is_active !== undefined) resource.is_active = is_active;

    if (rental_price_per_day !== undefined) {
      resource.rental_price_per_day = Number(rental_price_per_day || 0);
    }

    if (required_deposit_amount !== undefined) {
      resource.required_deposit_amount = Number(required_deposit_amount || 0);
    }

    if (features !== undefined) {
      resource.features = Array.isArray(features) ? features : [];
    }

    await resource.save();

    res.status(200).json({
      message: "Cập nhật tài nguyên thành công",
      resource,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật tài nguyên",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Ẩn / hiện tài nguyên
// PATCH /api/resources/admin/:id/toggle-active
// ==========================================
exports.toggleResourceActive = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        message: "Không tìm thấy tài nguyên",
      });
    }

    resource.is_active = !resource.is_active;
    await resource.save();

    res.status(200).json({
      message: resource.is_active
        ? "Đã hiển thị tài nguyên"
        : "Đã ẩn tài nguyên",
      resource,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật trạng thái tài nguyên",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN: Xóa mềm tài nguyên
// DELETE /api/resources/admin/:id
// ==========================================
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true },
    );

    if (!resource) {
      return res.status(404).json({
        message: "Không tìm thấy tài nguyên",
      });
    }

    res.status(200).json({
      message: "Đã tạm ẩn tài nguyên",
      resource,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi xóa tài nguyên",
      error: error.message,
    });
  }
};
