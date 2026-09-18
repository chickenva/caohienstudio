/**
 * bannerController.js
 * Xử lý CRUD banner quảng cáo / poster.
 * Banner chỉ hiển thị trên customer khi is_active = true VÀ trong khoảng start_date – end_date.
 * Mỗi banner là 1 tấm poster duy nhất.
 */
const Banner = require("../models/Banner");

// ==========================================
// PUBLIC
// ==========================================

/**
 * [GET] /api/banners
 * Lấy danh sách banner đang active và nằm trong khoảng thời gian hiển thị.
 */
exports.getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now },
    }).sort({ order: 1, createdAt: -1 });

    return res.status(200).json({ success: true, banners });
  } catch (error) {
    console.error("Error in getActiveBanners:", error);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách banner",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN
// ==========================================

/**
 * [GET] /api/banners/admin/all
 * Admin lấy tất cả banners (bao gồm hết hạn, inactive).
 */
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ success: true, banners });
  } catch (error) {
    console.error("Error in getAllBanners:", error);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách banner",
      error: error.message,
    });
  }
};

/**
 * [POST] /api/banners/admin
 * Admin tạo banner mới (chỉ cần tiêu đề, ảnh poster, thời hạn).
 */
exports.createBanner = async (req, res) => {
  try {
    const { imageUrl, linkUrl, start_date, end_date, is_active, order } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        message: "Vui lòng chọn ngày bắt đầu và ngày kết thúc",
      });
    }

    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    const banner = await Banner.create({
      imageUrl: imageUrl || "",
      linkUrl: linkUrl ? linkUrl.trim() : "",
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      is_active: is_active !== undefined ? is_active : true,
      order: order || 0,
    });

    return res.status(201).json({
      message: "Tạo banner thành công",
      banner,
    });
  } catch (error) {
    console.error("Error in createBanner:", error);
    return res.status(500).json({
      message: "Lỗi khi tạo banner",
      error: error.message,
    });
  }
};

/**
 * [PUT] /api/banners/admin/:id
 * Admin cập nhật banner.
 */
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl, linkUrl, start_date, end_date, is_active, order } = req.body;

    if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    const updatePayload = {};
    if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl;
    if (linkUrl !== undefined) updatePayload.linkUrl = linkUrl ? linkUrl.trim() : "";
    if (start_date !== undefined) updatePayload.start_date = new Date(start_date);
    if (end_date !== undefined) updatePayload.end_date = new Date(end_date);
    if (is_active !== undefined) updatePayload.is_active = is_active;
    if (order !== undefined) updatePayload.order = order;

    const banner = await Banner.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }

    return res.status(200).json({
      message: "Cập nhật banner thành công",
      banner,
    });
  } catch (error) {
    console.error("Error in updateBanner:", error);
    return res.status(500).json({
      message: "Lỗi khi cập nhật banner",
      error: error.message,
    });
  }
};

/**
 * [PATCH] /api/banners/admin/:id/toggle
 * Admin bật/tắt banner.
 */
exports.toggleBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ message: "Không tìm thấy banner" });
    }

    banner.is_active = !banner.is_active;
    await banner.save();

    return res.status(200).json({
      message: `Đã ${banner.is_active ? "bật" : "tắt"} banner`,
      banner,
    });
  } catch (error) {
    console.error("Error in toggleBanner:", error);
    return res.status(500).json({
      message: "Lỗi khi thay đổi trạng thái banner",
      error: error.message,
    });
  }
};

/**
 * [DELETE] /api/banners/admin/:id
 * Admin xóa banner.
 */
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ message: "Không tìm thấy banner để xóa" });
    }

    return res.status(200).json({ message: "Xóa banner thành công" });
  } catch (error) {
    console.error("Error in deleteBanner:", error);
    return res.status(500).json({
      message: "Lỗi khi xóa banner",
      error: error.message,
    });
  }
};

/**
 * [PUT] /api/banners/admin/reorder
 * Admin cập nhật thứ tự hiển thị hàng loạt bằng bulkWrite.
 * @param {Array} items - Mảng { _id, order }
 */
exports.reorderBanners = async (req, res) => {
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
      await Banner.bulkWrite(bulkOps);
    }

    return res.status(200).json({ message: "Cập nhật thứ tự thành công" });
  } catch (error) {
    console.error("Error in reorderBanners:", error);
    return res.status(500).json({
      message: "Lỗi khi cập nhật thứ tự banner",
      error: error.message,
    });
  }
};
