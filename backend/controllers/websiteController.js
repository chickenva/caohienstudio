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
      imageUrl: "https://res.cloudinary.com/zmf6r7og/image/upload/v1790927608/caohienstudio/website/home_hero_banner_1790927597885.jpg",
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
      imageUrl: "https://res.cloudinary.com/zmf6r7og/image/upload/v1790927611/caohienstudio/website/about_artist_portrait_1790927604913.jpg",
      altText: "Nhiếp ảnh gia Cao Hiển",
      order: 1,
      isActive: true,
    },
  ],
  GALLERY: [
    {
      page: "GALLERY",
      key: "gallery_hero_1",
      title: "Ảnh nổi bật 1 (Trái)",
      description: "Hình ảnh nổi bật 1 ở đầu trang Thư viện ảnh (để trống sẽ tự lấy ảnh bìa album 1)",
      imageUrl: "",
      altText: "Ảnh nổi bật 1",
      order: 1,
      isActive: true,
    },
    {
      page: "GALLERY",
      key: "gallery_hero_2",
      title: "Ảnh nổi bật 2 (Phải)",
      description: "Hình ảnh nổi bật 2 ở đầu trang Thư viện ảnh (để trống sẽ tự lấy ảnh bìa album 2)",
      imageUrl: "",
      altText: "Ảnh nổi bật 2",
      order: 2,
      isActive: true,
    },
    {
      page: "GALLERY",
      key: "gallery_hero_3",
      title: "Ảnh nổi bật 3 (Giữa)",
      description: "Hình ảnh nổi bật 3 ở đầu trang Thư viện ảnh (để trống sẽ tự lấy ảnh bìa album 3)",
      imageUrl: "",
      altText: "Ảnh nổi bật 3",
      order: 3,
      isActive: true,
    },
  ],
};

/**
 * Đảm bảo các hình ảnh mặc định tồn tại trong cơ sở dữ liệu
 */
const ensureDefaultImages = async (page) => {
  try {
    const allowedKeys = [
      "hero_banner",
      "artist_portrait",
      "payment_qr",
      "gallery_hero_1",
      "gallery_hero_2",
      "gallery_hero_3",
    ];
    await WebsiteImage.deleteMany({ key: { $nin: allowedKeys } });

    const pagesToCheck = page ? [page] : ["HOME", "ABOUT", "GALLERY"];
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
 * POST /api/website/admin/images (Tạo mới hoặc lưu batch)
 * PUT /api/website/admin/images/:id (Cập nhật)
 */
exports.saveImage = async (req, res) => {
  try {
    // Hỗ trợ lưu danh sách nhiều ảnh cùng lúc (batch)
    if (Array.isArray(req.body.images)) {
      const results = [];
      for (const item of req.body.images) {
        if (!item.key) continue;
        const page = (item.page || req.body.page || "GALLERY").toUpperCase();
        const payload = {
          page,
          key: item.key,
          title: item.title || "",
          description: item.description || "",
          imageUrl: item.imageUrl !== undefined ? item.imageUrl.trim() : "",
          altText: item.altText || "",
          order: item.order !== undefined ? Number(item.order) : 0,
          isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        };

        const updated = await WebsiteImage.findOneAndUpdate(
          { page, key: item.key },
          payload,
          { new: true, upsert: true, runValidators: true }
        );
        results.push(updated);
      }

      return res.status(200).json({
        success: true,
        message: "Lưu danh sách hình ảnh thành công",
        images: results,
      });
    }

    const { id } = req.params;
    const { page, key, title, description, imageUrl, altText, order, isActive } = req.body;

    const pageUpper = (page || "HOME").toUpperCase();
    let defaultKey = "hero_banner";
    let defaultTitle = "Hình ảnh Trang Chủ";
    if (pageUpper === "ABOUT") {
      defaultKey = "artist_portrait";
      defaultTitle = "Hình ảnh Trang Giới Thiệu";
    } else if (pageUpper === "GALLERY") {
      defaultKey = "gallery_hero_1";
      defaultTitle = "Ảnh nổi bật Thư viện ảnh";
    }

    const payload = {
      page: pageUpper,
      key: key || defaultKey,
      title: title || defaultTitle,
      description: description || "",
      imageUrl: imageUrl !== undefined ? imageUrl.trim() : "",
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
      image = await WebsiteImage.findOneAndUpdate(
        { page: payload.page, key: payload.key },
        payload,
        { new: true, upsert: true, runValidators: true }
      );
    }

    return res.status(200).json({
      message: "Lưu thông tin hình ảnh thành công",
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

