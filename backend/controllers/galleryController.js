/**
 * galleryController.js
 * Quản lý album ảnh công khai (PublicGallery) liên kết với Google Drive.
 * Hỗ trợ ảnh bìa động từ Drive, cache phía server và hiển thị nhiều kích thước ảnh.
 */
const PublicGallery      = require("../models/PublicGallery");
const googleDriveService = require("../services/googleDriveService");

// Header cache cho public endpoint — cache 60s, stale-while-revalidate 5 phút
const PUBLIC_CACHE_HEADER = "public, max-age=60, stale-while-revalidate=300";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Tách folderId từ link Google Drive hoặc trả lại ID nếu admin nhập trực tiếp.
 * Hỗ trợ 2 dạng: /folders/<id> và ?id=<id>.
 * @param {string} input - Link Drive hoặc ID thuần
 * @returns {string}
 */
const extractDriveFolderId = (input = "") => {
  if (!input) return "";

  // ID thuần, không phải link Drive
  if (!input.includes("drive.google.com")) {
    return input.trim();
  }

  const folderMatch = input.match(/\/folders\/([^?]+)/);
  if (folderMatch?.[1]) return folderMatch[1].trim();

  const idMatch = input.match(/[?&]id=([^&]+)/);
  if (idMatch?.[1]) return idMatch[1].trim();

  return "";
};

/**
 * Chuẩn hóa link ảnh Drive về URL có kích thước phù hợp để frontend hiển thị ổn định.
 * @param {string} url - URL ảnh thô
 * @param {string} size - Kích thước mong muốn (ví dụ: "s1800")
 */
const normalizeStoredImage = (url, size = "s1800") => {
  if (!url) return "";
  return googleDriveService.normalizeDriveImageUrl(url, size);
};

/**
 * Tạo bộ URL ảnh bìa ở nhiều kích thước (thumbnail, grid, cover, preview)
 * từ coverImage đã lưu hoặc ảnh đầu tiên trong folder Drive.
 * @param {string} coverImage - URL ảnh bìa đã lưu trong DB
 * @param {Array}  images     - Danh sách ảnh từ Drive (fallback)
 */
const buildCoverPayload = (coverImage, images = []) => {
  const firstImage     = images[0] || {};
  const normalizedCover = normalizeStoredImage(coverImage, "s1800");
  const bestCover =
    normalizedCover ||
    firstImage.coverUrl ||
    firstImage.imageUrl ||
    firstImage.gridUrl  ||
    firstImage.thumbnailLink ||
    "";

  return {
    coverImage:      normalizeStoredImage(bestCover, "s1800") || bestCover,
    coverThumbUrl:   normalizeStoredImage(bestCover, "s480")  || firstImage.thumbUrl  || firstImage.gridUrl  || bestCover,
    coverGridUrl:    normalizeStoredImage(bestCover, "s1200") || firstImage.gridUrl   || firstImage.coverUrl || bestCover,
    coverPreviewUrl: normalizeStoredImage(bestCover, "s2560") || firstImage.previewUrl || firstImage.coverUrl || bestCover,
  };
};

/**
 * Chuyển gallery document (Mongoose) thành plain object và gắn thêm dữ liệu ảnh bìa.
 */
const toGalleryObject = (gallery, images = []) => {
  const galleryObject = gallery.toObject ? gallery.toObject() : { ...gallery };
  return {
    ...galleryObject,
    ...buildCoverPayload(galleryObject.coverImage, images),
  };
};

/**
 * Tự lấy ảnh đầu tiên từ Drive làm cover nếu album chưa có coverImage lưu sẵn.
 * Fallback về object không có cover nếu Drive lỗi.
 */
const resolveGalleryCover = async (gallery) => {
  const galleryObject = gallery.toObject ? gallery.toObject() : { ...gallery };

  if (normalizeStoredImage(galleryObject.coverImage)) {
    return toGalleryObject(galleryObject);
  }

  try {
    const images = await googleDriveService.listImagesInFolder(galleryObject.drive_folder_id);
    return toGalleryObject(galleryObject, images);
  } catch (error) {
    console.error(`Resolve gallery cover error for gallery ${galleryObject._id}:`, error.message);
    return toGalleryObject(galleryObject);
  }
};

/**
 * Bổ sung ảnh bìa cho danh sách album, chạy song song để tối ưu tốc độ.
 */
const hydrateGalleryList = async (galleries) => {
  return Promise.all(galleries.map((gallery) => resolveGalleryCover(gallery)));
};

/**
 * Lấy URL ảnh bìa cuối cùng từ Drive khi admin tạo/cập nhật album.
 * Nếu có coverImage đã chuẩn hóa → dùng ngay; nếu không → lấy từ ảnh đầu tiên trong folder.
 */
const getCoverFromDrive = async (gallery) => {
  const normalizedCover = normalizeStoredImage(gallery.coverImage, "s1800");

  if (normalizedCover) return normalizedCover;

  if (!gallery.drive_folder_id) return "";

  try {
    const images = await googleDriveService.listImagesInFolder(gallery.drive_folder_id);
    if (images.length === 0) return "";
    return images[0].coverUrl || images[0].imageUrl || images[0].gridUrl || "";
  } catch (error) {
    console.error(`Get cover from Drive error for gallery ${gallery._id}:`, error.message);
    return "";
  }
};

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

/**
 * [GET] /api/galleries?category=...
 * Lấy danh sách album đang hiển thị (is_active = true), có thể lọc theo danh mục.
 */
exports.getAllGalleries = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { is_active: true };

    if (category && category !== "ALL") {
      query.category = category;
    }

    const galleries = await PublicGallery.find(query)
      .populate("photographer_id", "full_name portfolio.avatar")
      .populate("service_ids",     "name base_price duration_hours")
      .sort({ featured: -1, order: 1, createdAt: -1 });

    const hydratedGalleries = await hydrateGalleryList(galleries);

    res.set("Cache-Control", PUBLIC_CACHE_HEADER);
    res.status(200).json(hydratedGalleries);
  } catch (error) {
    console.error("Get galleries error:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách thư viện", error: error.message });
  }
};

/**
 * [GET] /api/galleries/:id
 * Lấy chi tiết album và toàn bộ danh sách ảnh từ Google Drive.
 */
exports.getGalleryById = async (req, res) => {
  try {
    const gallery = await PublicGallery.findById(req.params.id)
      .populate("photographer_id", "full_name email phone portfolio.avatar")
      .populate("service_ids",     "name description base_price duration_hours");

    if (!gallery || !gallery.is_active) {
      return res.status(404).json({ message: "Không tìm thấy album" });
    }

    const images = await googleDriveService.listImagesInFolder(gallery.drive_folder_id);

    res.set("Cache-Control", PUBLIC_CACHE_HEADER);
    res.status(200).json({
      gallery: toGalleryObject(gallery, images),
      images,
    });
  } catch (error) {
    console.error("Get gallery detail error:", error);
    res.status(500).json({ message: "Lỗi lấy chi tiết album", error: error.message });
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

/**
 * [GET] /api/galleries/admin/all
 * Admin lấy tất cả album, kể cả album đã ẩn (is_active = false).
 */
exports.getAllGalleriesAdmin = async (req, res) => {
  try {
    const { category } = req.query;
    const query = {};

    if (category && category !== "ALL") {
      query.category = category;
    }

    const galleries = await PublicGallery.find(query)
      .populate("photographer_id", "full_name portfolio.avatar")
      .populate("service_ids",     "name base_price duration_hours")
      .sort({ featured: -1, order: 1, createdAt: -1 });

    const hydratedGalleries = await hydrateGalleryList(galleries);

    res.status(200).json(hydratedGalleries);
  } catch (error) {
    console.error("Get all galleries admin error:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách thư viện", error: error.message });
  }
};

/**
 * [POST] /api/galleries/admin
 * Admin tạo album mới từ folder Google Drive. Kiểm tra trùng folder.
 */
exports.createGallery = async (req, res) => {
  try {
    const {
      title, description, category, location,
      drive_folder_url, drive_folder_id,
      coverImage, photographer_id, service_ids,
      featured, is_active,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "Vui lòng nhập tên album và danh mục" });
    }

    const finalDriveFolderId = drive_folder_id || extractDriveFolderId(drive_folder_url);

    if (!finalDriveFolderId) {
      return res.status(400).json({
        message: "Vui lòng nhập link hoặc ID folder Google Drive",
      });
    }

    // Kiểm tra folder Drive chưa được dùng cho album khác
    const existingGallery = await PublicGallery.findOne({ drive_folder_id: finalDriveFolderId });
    if (existingGallery) {
      return res.status(400).json({
        message: "Folder Google Drive này đã được dùng cho album khác",
      });
    }

    // Xóa cache cũ (nếu có) để lấy ảnh mới nhất
    googleDriveService.clearFolderImageCache(finalDriveFolderId);

    const finalCoverImage = await getCoverFromDrive({
      coverImage,
      drive_folder_id: finalDriveFolderId,
    });

    const newGallery = await PublicGallery.create({
      title, description, category, location,
      drive_folder_id:  finalDriveFolderId,
      drive_folder_url,
      coverImage:       finalCoverImage,
      photographer_id:  photographer_id || null,
      service_ids:      service_ids     || [],
      featured:         Boolean(featured),
      is_active:        is_active !== undefined ? is_active : true,
    });

    res.status(201).json({ message: "Tạo album thành công", gallery: newGallery });
  } catch (error) {
    console.error("Create gallery error:", error);
    res.status(500).json({ message: "Lỗi tạo album", error: error.message });
  }
};

/**
 * [PUT] /api/galleries/admin/:id
 * Admin cập nhật thông tin album, làm mới ảnh bìa nếu folder Drive thay đổi.
 */
exports.updateGallery = async (req, res) => {
  try {
    const {
      title, description, category, location,
      drive_folder_url, drive_folder_id,
      coverImage, photographer_id, service_ids,
      featured, is_active,
    } = req.body;

    const gallery = await PublicGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ message: "Không tìm thấy album" });
    }

    const previousDriveFolderId = gallery.drive_folder_id;
    const finalDriveFolderId    = drive_folder_id || extractDriveFolderId(drive_folder_url);

    // Nếu đổi folder Drive, kiểm tra folder mới chưa được dùng
    if (finalDriveFolderId && finalDriveFolderId !== gallery.drive_folder_id) {
      const existingGallery = await PublicGallery.findOne({
        drive_folder_id: finalDriveFolderId,
        _id:             { $ne: gallery._id },
      });

      if (existingGallery) {
        return res.status(400).json({
          message: "Folder Google Drive này đã được dùng cho album khác",
        });
      }

      gallery.drive_folder_id = finalDriveFolderId;
    }

    if (title            !== undefined) gallery.title            = title;
    if (description      !== undefined) gallery.description      = description;
    if (category         !== undefined) gallery.category         = category;
    if (location         !== undefined) gallery.location         = location;
    if (drive_folder_url !== undefined) gallery.drive_folder_url = drive_folder_url;

    // Xóa cache của cả folder cũ và mới để đảm bảo ảnh được tải lại
    if (previousDriveFolderId)      googleDriveService.clearFolderImageCache(previousDriveFolderId);
    if (gallery.drive_folder_id)    googleDriveService.clearFolderImageCache(gallery.drive_folder_id);

    const finalCoverImage = await getCoverFromDrive({
      coverImage:      coverImage !== undefined ? coverImage : gallery.coverImage,
      drive_folder_id: gallery.drive_folder_id,
    });
    gallery.coverImage = finalCoverImage;

    if (photographer_id !== undefined) gallery.photographer_id = photographer_id || null;
    if (service_ids     !== undefined) gallery.service_ids     = service_ids     || [];
    if (featured        !== undefined) gallery.featured        = Boolean(featured);
    if (is_active       !== undefined) gallery.is_active       = is_active;

    await gallery.save();

    res.status(200).json({ message: "Cập nhật album thành công", gallery });
  } catch (error) {
    console.error("Update gallery error:", error);
    res.status(500).json({ message: "Lỗi cập nhật album", error: error.message });
  }
};

/**
 * [PATCH] /api/galleries/admin/:id/toggle-active
 * Admin ẩn hoặc hiện album trên website.
 */
exports.toggleGalleryActive = async (req, res) => {
  try {
    const gallery = await PublicGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ message: "Không tìm thấy album" });
    }

    gallery.is_active = !gallery.is_active;
    await gallery.save();

    res.status(200).json({
      message: gallery.is_active ? "Đã hiển thị album" : "Đã ẩn album",
      gallery,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái album", error: error.message });
  }
};

/**
 * [DELETE] /api/galleries/admin/:id
 * Admin xóa album và xóa cache ảnh Drive liên quan.
 */
exports.deleteGallery = async (req, res) => {
  try {
    const gallery = await PublicGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ message: "Không tìm thấy album" });
    }

    await PublicGallery.findByIdAndDelete(req.params.id);

    if (gallery.drive_folder_id) {
      googleDriveService.clearFolderImageCache(gallery.drive_folder_id);
    }

    res.status(200).json({ message: "Xóa album thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa album", error: error.message });
  }
};

/**
 * [PUT] /api/galleries/admin/reorder
 * Admin cập nhật thứ tự hiển thị hàng loạt bằng bulkWrite.
 * @param {Array} items - Mảng { _id, order }
 */
exports.reorderGalleries = async (req, res) => {
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
      await PublicGallery.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: "Cập nhật thứ tự thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật thứ tự", error: error.message });
  }
};
