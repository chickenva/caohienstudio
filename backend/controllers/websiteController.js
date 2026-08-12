/**
 * websiteController.js
 * Xử lý các yêu cầu liên quan đến quản lý hình ảnh website (Trang chủ, Trang giới thiệu...).
 */
const WebsiteImage = require("../models/WebsiteImage");
const SiteLock = require("../models/SiteLock");

// Dữ liệu hình ảnh mặc định khi chưa có cấu hình trong DB
const DEFAULT_IMAGES = {
  HOME: [
    {
      page: "HOME",
      key: "hero_banner",
      title: "Hình ảnh Banner Trang chủ (Hero Banner)",
      description: "Hình ảnh nền lớn tràn màn hình ở đầu trang chủ",
      imageUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2070&auto=format&fit=crop",
      altText: "Hero Banner Cao Hiển Studio",
      order: 1,
      isActive: true,
    },
  ],
  ABOUT: [
    {
      page: "ABOUT",
      key: "artist_portrait",
      title: "Hình ảnh Chân dung Nhiếp ảnh gia (Trang Giới thiệu)",
      description: "Hình ảnh chân dung đại diện nhiếp ảnh gia Cao Hiển ở trang Giới thiệu",
      imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop",
      altText: "Nhiếp ảnh gia Cao Hiển",
      order: 1,
      isActive: true,
    },
  ],
};

/**
 * Đảm bảo các hình ảnh mặc định tồn tại trong cơ sở dữ liệu
 */
const ensureDefaultImages = async (page) => {
  try {
    // Chỉ giữ lại 1 hình ảnh duy nhất cho mỗi vị trí: hero_banner (HOME), artist_portrait (ABOUT) và payment_qr (SETTINGS)
    await WebsiteImage.deleteMany({ key: { $nin: ["hero_banner", "artist_portrait", "payment_qr"] } });

    const pagesToCheck = page ? [page] : ["HOME", "ABOUT"];
    for (const p of pagesToCheck) {
      const count = await WebsiteImage.countDocuments({ page: p });
      if (count === 0 && DEFAULT_IMAGES[p]) {
        await WebsiteImage.insertMany(DEFAULT_IMAGES[p]);
      }
    }
  } catch (error) {
    console.error("Lỗi khi tạo dữ liệu hình ảnh website mặc định:", error);
  }
};

/**
 * Lấy danh sách hình ảnh công khai cho Khách hàng
 * GET /api/website/images?page=HOME
 */
exports.getPublicImages = async (req, res) => {
  try {
    const { page } = req.query;
    const filter = { isActive: true };
    if (page) {
      filter.page = page.toUpperCase();
      await ensureDefaultImages(filter.page);
    }

    const images = await WebsiteImage.find(filter).sort({ order: 1, createdAt: -1 });
    return res.status(200).json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("Error in getPublicImages:", error);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách hình ảnh website",
      error: error.message,
    });
  }
};

/**
 * Lấy danh sách toàn bộ hình ảnh cho Admin
 * GET /api/website/admin/images?page=HOME
 */
exports.getAdminImages = async (req, res) => {
  try {
    const { page } = req.query;
    const filter = {};
    if (page) {
      filter.page = page.toUpperCase();
      await ensureDefaultImages(filter.page);
    } else {
      await ensureDefaultImages();
    }

    const images = await WebsiteImage.find(filter).sort({ page: 1, order: 1, createdAt: -1 });
    return res.status(200).json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("Error in getAdminImages:", error);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách quản lý hình ảnh website",
      error: error.message,
    });
  }
};

/**
 * Tạo mới hoặc cập nhật hình ảnh
 * POST /api/website/admin/images (Tạo mới)
 * PUT /api/website/admin/images/:id (Cập nhật)
 */
exports.saveImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, key, title, description, imageUrl, altText, order, isActive } = req.body;

    const payload = {
      page: page.toUpperCase(),
      key: key || (page.toUpperCase() === "HOME" ? "hero_banner" : "artist_portrait"),
      title: title || (page.toUpperCase() === "HOME" ? "Hình ảnh Trang Chủ" : "Hình ảnh Trang Giới Thiệu"),
      description: description || "",
      imageUrl: imageUrl || "",
      altText: altText || "",
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    };

    let image;
    if (id) {
      image = await WebsiteImage.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
      if (!image) {
        return res.status(404).json({ message: "Không tìm thấy hình ảnh cần cập nhật" });
      }
    } else {
      image = new WebsiteImage(payload);
      await image.save();
    }

    return res.status(200).json({
      message: id ? "Cập nhật hình ảnh thành công" : "Thêm hình ảnh thành công",
      image,
    });
  } catch (error) {
    console.error("Error in saveImage:", error);
    return res.status(500).json({
      message: "Lỗi khi lưu thông tin hình ảnh website",
      error: error.message,
    });
  }
};

/**
 * Bật/Tắt trạng thái hiển thị hình ảnh
 * PATCH /api/website/admin/images/:id/toggle
 */
exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await WebsiteImage.findById(id);

    if (!image) {
      return res.status(404).json({ message: "Không tìm thấy hình ảnh" });
    }

    image.isActive = !image.isActive;
    await image.save();

    return res.status(200).json({
      message: `Đã ${image.isActive ? "bật" : "tắt"} hiển thị hình ảnh`,
      image,
    });
  } catch (error) {
    console.error("Error in toggleActive:", error);
    return res.status(500).json({
      message: "Lỗi khi thay đổi trạng thái hình ảnh",
      error: error.message,
    });
  }
};

/**
 * Xóa hình ảnh
 * DELETE /api/website/admin/images/:id
 */
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await WebsiteImage.findByIdAndDelete(id);

    if (!image) {
      return res.status(404).json({ message: "Không tìm thấy hình ảnh để xóa" });
    }

    return res.status(200).json({
      message: "Xóa hình ảnh thành công",
    });
  } catch (error) {
    console.error("Error in deleteImage:", error);
    return res.status(500).json({
      message: "Lỗi khi xóa hình ảnh",
      error: error.message,
    });
  }
};

// ==========================================
// SITE LOCK (Khóa toàn bộ website)
// ==========================================

/**
 * Lấy trạng thái khóa website (công khai — dành cho frontend kiểm tra)
 * GET /api/website/site-lock
 */
exports.getSiteLockStatus = async (req, res) => {
  try {
    let lock = await SiteLock.findOne();
    if (!lock) lock = { isLocked: false };
    return res.status(200).json({ isLocked: lock.isLocked });
  } catch (error) {
    console.error("Error in getSiteLockStatus:", error);
    return res.status(500).json({ message: "Lỗi khi lấy trạng thái website", error: error.message });
  }
};

/**
 * Bật/tắt khóa website — chỉ Super Admin
 * POST /api/website/admin/site-lock
 * Body: { isLocked: true/false, reason?: string }
 */
exports.toggleSiteLock = async (req, res) => {
  try {
    // Chỉ Super Admin mới được dùng
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ message: "Chỉ Super Admin mới có quyền khóa website" });
    }

    const { isLocked, reason } = req.body;

    let lock = await SiteLock.findOne();
    if (!lock) {
      lock = new SiteLock();
    }

    lock.isLocked = Boolean(isLocked);
    lock.lockedAt = isLocked ? new Date() : null;
    lock.lockedBy = req.user.email || "super-admin";
    lock.reason   = reason || "";
    await lock.save();

    return res.status(200).json({
      message: lock.isLocked ? "Đã khóa website thành công" : "Đã mở khóa website thành công",
      isLocked: lock.isLocked,
      lockedAt: lock.lockedAt,
      reason: lock.reason,
    });
  } catch (error) {
    console.error("Error in toggleSiteLock:", error);
    return res.status(500).json({ message: "Lỗi khi thay đổi trạng thái khóa website", error: error.message });
  }
};

// PAYMENT QR CODE SETTINGS (QR Thanh toán Studio mặc định)
// ==========================================

/**
 * Lấy QR thanh toán mặc định của Studio (Công khai)
 * GET /api/website/payment-qr
 */
exports.getPaymentQr = async (req, res) => {
  try {
    const qrImage = await WebsiteImage.findOne({ page: "SETTINGS", key: "payment_qr" });
    const qrUrl = qrImage?.imageUrl || process.env.PAYMENT_QR_URL || "";
    return res.status(200).json({
      success: true,
      paymentQrUrl: qrUrl,
    });
  } catch (error) {
    console.error("Error in getPaymentQr:", error);
    return res.status(500).json({ message: "Lỗi khi lấy QR thanh toán studio", error: error.message });
  }
};

/**
 * Lưu/Cập nhật QR thanh toán mặc định của Studio — Admin
 * POST /api/website/admin/payment-qr
 * Body: { imageUrl: "..." }
 */
exports.savePaymentQr = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Thiếu URL hình ảnh QR thanh toán!" });
    }

    let qrImage = await WebsiteImage.findOne({ page: "SETTINGS", key: "payment_qr" });

    if (qrImage) {
      qrImage.imageUrl = imageUrl;
      qrImage.isActive = true;
      await qrImage.save();
    } else {
      qrImage = new WebsiteImage({
        page: "SETTINGS",
        key: "payment_qr",
        title: "QR Thanh toán Studio Mặc định",
        description: "Hình ảnh QR tài khoản ngân hàng của Studio hiển thị trên tất cả đơn hàng",
        imageUrl,
        altText: "QR Code Thanh Toán Cao Hiển Studio",
        order: 1,
        isActive: true,
      });
      await qrImage.save();
    }

    return res.status(200).json({
      message: "Cập nhật QR thanh toán mặc định của Studio thành công!",
      paymentQrUrl: qrImage.imageUrl,
    });
  } catch (error) {
    console.error("Error in savePaymentQr:", error);
    return res.status(500).json({ message: "Lỗi khi lưu QR thanh toán studio", error: error.message });
  }
};

