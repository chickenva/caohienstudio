/**
 * cameraRentalController.js
 * Quản lý CRUD thiết bị cho thuê (máy ảnh, ống kính, phụ kiện).
 * Chỉ hiển thị thông tin, khách liên hệ trực tiếp để thuê.
 */
const CameraRental = require("../models/CameraRental");

// ==========================================
// PUBLIC
// ==========================================

/**
 * [GET] /api/camera-rentals?category=BODY
 * Lấy danh sách thiết bị cho thuê đang active.
 */
exports.getActiveCameras = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { is_active: true };

    if (category && category !== "ALL") {
      query.category = category;
    }

    const cameras = await CameraRental.find(query).sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ success: true, cameras });
  } catch (error) {
    console.error("Error in getActiveCameras:", error);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách thiết bị cho thuê",
      error: error.message,
    });
  }
};

/**
 * [GET] /api/camera-rentals/:id
 * Lấy chi tiết 1 thiết bị cho thuê.
 */
exports.getCameraById = async (req, res) => {
  try {
    const camera = await CameraRental.findOne({
      _id: req.params.id,
      is_active: true,
    });

    if (!camera) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    return res.status(200).json({ success: true, camera });
  } catch (error) {
    console.error("Error in getCameraById:", error);
    return res.status(500).json({
      message: "Lỗi khi lấy chi tiết thiết bị",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN
// ==========================================

/**
 * [GET] /api/camera-rentals/admin/all
 * Admin lấy tất cả thiết bị (kể cả inactive).
 */
exports.getAllCamerasAdmin = async (req, res) => {
  try {
    const cameras = await CameraRental.find().sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ success: true, cameras });
  } catch (error) {
    console.error("Error in getAllCamerasAdmin:", error);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách thiết bị",
      error: error.message,
    });
  }
};

/**
 * [POST] /api/camera-rentals/admin
 * Admin thêm thiết bị cho thuê.
 */
exports.createCamera = async (req, res) => {
  try {
    const {
      name, brand, category, description, specifications,
      rental_price_per_day, deposit_amount, images, thumbnail,
      condition, is_available, is_active, order,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Vui lòng nhập tên thiết bị" });
    }
    if (rental_price_per_day === undefined || rental_price_per_day === null) {
      return res.status(400).json({ message: "Vui lòng nhập giá thuê/ngày" });
    }

    const camera = await CameraRental.create({
      name,
      brand: brand || "",
      category: category || "BODY",
      description: description || "",
      specifications: Array.isArray(specifications) ? specifications : [],
      rental_price_per_day: Number(rental_price_per_day),
      deposit_amount: Number(deposit_amount || 0),
      images: Array.isArray(images) ? images : [],
      thumbnail: thumbnail || "",
      condition: condition || "LIKE_NEW",
      is_available: is_available !== undefined ? is_available : true,
      is_active: is_active !== undefined ? is_active : true,
      order: order || 0,
    });

    return res.status(201).json({
      message: "Thêm thiết bị cho thuê thành công",
      camera,
    });
  } catch (error) {
    console.error("Error in createCamera:", error);
    return res.status(500).json({
      message: "Lỗi khi thêm thiết bị",
      error: error.message,
    });
  }
};

/**
 * [PUT] /api/camera-rentals/admin/:id
 * Admin cập nhật thông tin thiết bị.
 */
exports.updateCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, brand, category, description, specifications,
      rental_price_per_day, deposit_amount, images, thumbnail,
      condition, is_available, is_active, order,
    } = req.body;

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (brand !== undefined) updatePayload.brand = brand;
    if (category !== undefined) updatePayload.category = category;
    if (description !== undefined) updatePayload.description = description;
    if (specifications !== undefined) updatePayload.specifications = specifications;
    if (rental_price_per_day !== undefined) updatePayload.rental_price_per_day = Number(rental_price_per_day);
    if (deposit_amount !== undefined) updatePayload.deposit_amount = Number(deposit_amount);
    if (images !== undefined) updatePayload.images = images;
    if (thumbnail !== undefined) updatePayload.thumbnail = thumbnail;
    if (condition !== undefined) updatePayload.condition = condition;
    if (is_available !== undefined) updatePayload.is_available = is_available;
    if (is_active !== undefined) updatePayload.is_active = is_active;
    if (order !== undefined) updatePayload.order = order;

    const camera = await CameraRental.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!camera) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    return res.status(200).json({
      message: "Cập nhật thiết bị thành công",
      camera,
    });
  } catch (error) {
    console.error("Error in updateCamera:", error);
    return res.status(500).json({
      message: "Lỗi khi cập nhật thiết bị",
      error: error.message,
    });
  }
};

/**
 * [PATCH] /api/camera-rentals/admin/:id/toggle
 * Admin bật/tắt hiển thị thiết bị.
 */
exports.toggleCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const camera = await CameraRental.findById(id);

    if (!camera) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    camera.is_active = !camera.is_active;
    await camera.save();

    return res.status(200).json({
      message: `Đã ${camera.is_active ? "bật" : "tắt"} hiển thị thiết bị`,
      camera,
    });
  } catch (error) {
    console.error("Error in toggleCamera:", error);
    return res.status(500).json({
      message: "Lỗi khi thay đổi trạng thái thiết bị",
      error: error.message,
    });
  }
};

/**
 * [DELETE] /api/camera-rentals/admin/:id
 * Admin xóa thiết bị.
 */
exports.deleteCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const camera = await CameraRental.findByIdAndDelete(id);

    if (!camera) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị để xóa" });
    }

    return res.status(200).json({ message: "Xóa thiết bị thành công" });
  } catch (error) {
    console.error("Error in deleteCamera:", error);
    return res.status(500).json({
      message: "Lỗi khi xóa thiết bị",
      error: error.message,
    });
  }
};
