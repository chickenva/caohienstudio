const PublicGallery = require("../models/PublicGallery");
const googleDriveService = require("../services/googleDriveService");

const PUBLIC_CACHE_HEADER = "public, max-age=60, stale-while-revalidate=300";

// Tách folderId từ link Google Drive hoặc trả lại ID nếu admin nhập trực tiếp.
const extractDriveFolderId = (input = "") => {
  if (!input) return "";

  if (!input.includes("drive.google.com")) {
    return input.trim();
  }

  const folderMatch = input.match(/\/folders\/([^?]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1].trim();
  }

  const idMatch = input.match(/[?&]id=([^&]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1].trim();
  }

  return "";
};

// Chuẩn hóa link ảnh Drive về thumbnail đủ lớn để frontend hiển thị ổn định.
const normalizeStoredImage = (url, size = "s1800") => {
  if (!url) return "";
  return googleDriveService.normalizeDriveImageUrl(url, size);
};

// Tạo bộ URL ảnh bìa nhiều kích thước cho card, grid và preview.
const buildCoverPayload = (coverImage, images = []) => {
  const firstImage = images[0] || {};
  const normalizedCover = normalizeStoredImage(coverImage, "s1800");
  const bestCover =
    normalizedCover ||
    firstImage.coverUrl ||
    firstImage.imageUrl ||
    firstImage.gridUrl ||
    firstImage.thumbnailLink ||
    "";

  return {
    coverImage: normalizeStoredImage(bestCover, "s1800") || bestCover,
    coverThumbUrl:
      normalizeStoredImage(bestCover, "s480") ||
      firstImage.thumbUrl ||
      firstImage.gridUrl ||
      bestCover,
    coverGridUrl:
      normalizeStoredImage(bestCover, "s1200") ||
      firstImage.gridUrl ||
      firstImage.coverUrl ||
      bestCover,
    coverPreviewUrl:
      normalizeStoredImage(bestCover, "s2560") ||
      firstImage.previewUrl ||
      firstImage.coverUrl ||
      bestCover,
  };
};

// Chuyển gallery document thành object plain và gắn thông tin ảnh bìa.
const toGalleryObject = (gallery, images = []) => {
  const galleryObject = gallery.toObject ? gallery.toObject() : { ...gallery };
  return {
    ...galleryObject,
    ...buildCoverPayload(galleryObject.coverImage, images),
  };
};

// Tự lấy ảnh đầu tiên từ Drive làm cover nếu album chưa có cover lưu sẵn.
const resolveGalleryCover = async (gallery) => {
  const galleryObject = gallery.toObject ? gallery.toObject() : { ...gallery };

  if (normalizeStoredImage(galleryObject.coverImage)) {
    return toGalleryObject(galleryObject);
  }

  try {
    const images = await googleDriveService.listImagesInFolder(
      galleryObject.drive_folder_id,
    );
    return toGalleryObject(galleryObject, images);
  } catch (error) {
    console.error(
      `Resolve gallery cover error for gallery ${galleryObject._id}:`,
      error.message,
    );
    return toGalleryObject(galleryObject);
  }
};

// Bổ sung ảnh bìa cho danh sách album trước khi trả về frontend.
const hydrateGalleryList = async (galleries) => {
  return Promise.all(galleries.map((gallery) => resolveGalleryCover(gallery)));
};

// Lấy cover cuối cùng khi admin tạo/cập nhật album từ folder Google Drive.
const getCoverFromDrive = async (gallery) => {
  const normalizedCover = normalizeStoredImage(gallery.coverImage, "s1800");

  if (normalizedCover) {
    return normalizedCover;
  }

  if (!gallery.drive_folder_id) {
    return "";
  }

  try {
    const images = await googleDriveService.listImagesInFolder(
      gallery.drive_folder_id,
    );

    if (images.length === 0) {
      return "";
    }

    return images[0].coverUrl || images[0].imageUrl || images[0].gridUrl || "";
  } catch (error) {
    console.error(
      `Get cover from Drive error for gallery ${gallery._id}:`,
      error.message,
    );

    return "";
  }
};

// PUBLIC: Lấy danh sách album đang hiển thị theo danh mục.
exports.getAllGalleries = async (req, res) => {
  try {
    const { category } = req.query;

    const query = {
      is_active: true,
    };

    if (category && category !== "ALL") {
      query.category = category;
    }

    const galleries = await PublicGallery.find(query)
      .populate("photographer_id", "full_name portfolio.avatar")
      .populate("service_ids", "name base_price duration_hours")
      .sort({ featured: -1, order: 1, createdAt: -1 });

    const hydratedGalleries = await hydrateGalleryList(galleries);

    res.set("Cache-Control", PUBLIC_CACHE_HEADER);
    res.status(200).json(hydratedGalleries);
  } catch (error) {
    console.error("Get galleries error:", error);

    res.status(500).json({
      message: "Loi lay danh sach thu vien",
      error: error.message,
    });
  }
};

// PUBLIC: Lấy chi tiết album và danh sách ảnh từ Drive.
exports.getGalleryById = async (req, res) => {
  try {
    const gallery = await PublicGallery.findById(req.params.id)
      .populate("photographer_id", "full_name email phone portfolio.avatar")
      .populate("service_ids", "name description base_price duration_hours");

    if (!gallery || !gallery.is_active) {
      return res.status(404).json({
        message: "Khong tim thay album",
      });
    }

    const images = await googleDriveService.listImagesInFolder(
      gallery.drive_folder_id,
    );

    res.set("Cache-Control", PUBLIC_CACHE_HEADER);
    res.status(200).json({
      gallery: toGalleryObject(gallery, images),
      images,
    });
  } catch (error) {
    console.error("Get gallery detail error:", error);

    res.status(500).json({
      message: "Loi lay chi tiet album",
      error: error.message,
    });
  }
};

// ADMIN: Lấy tất cả album, kể cả album đã ẩn.
exports.getAllGalleriesAdmin = async (req, res) => {
  try {
    const { category } = req.query;

    const query = {};

    if (category && category !== "ALL") {
      query.category = category;
    }

    const galleries = await PublicGallery.find(query)
      .populate("photographer_id", "full_name portfolio.avatar")
      .populate("service_ids", "name base_price duration_hours")
      .sort({ featured: -1, order: 1, createdAt: -1 });

    const hydratedGalleries = await hydrateGalleryList(galleries);

    res.status(200).json(hydratedGalleries);
  } catch (error) {
    console.error("Get all galleries admin error:", error);

    res.status(500).json({
      message: "Loi lay danh sach thu vien",
      error: error.message,
    });
  }
};

// ADMIN: Tạo album mới từ folder Google Drive.
exports.createGallery = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      drive_folder_url,
      drive_folder_id,
      coverImage,
      photographer_id,
      service_ids,
      featured,
      is_active,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        message: "Vui long nhap ten album va danh muc",
      });
    }

    const finalDriveFolderId =
      drive_folder_id || extractDriveFolderId(drive_folder_url);

    if (!finalDriveFolderId) {
      return res.status(400).json({
        message: "Vui long nhap link hoac ID folder Google Drive",
      });
    }

    const existingGallery = await PublicGallery.findOne({
      drive_folder_id: finalDriveFolderId,
    });

    if (existingGallery) {
      return res.status(400).json({
        message: "Folder Google Drive nay da duoc dung cho album khac",
      });
    }

    googleDriveService.clearFolderImageCache(finalDriveFolderId);

    const finalCoverImage = await getCoverFromDrive({
      coverImage,
      drive_folder_id: finalDriveFolderId,
    });

    const newGallery = await PublicGallery.create({
      title,
      description,
      category,
      location,
      drive_folder_id: finalDriveFolderId,
      drive_folder_url,
      coverImage: finalCoverImage,
      photographer_id: photographer_id || null,
      service_ids: service_ids || [],
      featured: Boolean(featured),
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json({
      message: "Tao album thanh cong",
      gallery: newGallery,
    });
  } catch (error) {
    console.error("Create gallery error:", error);

    res.status(500).json({
      message: "Loi tao album",
      error: error.message,
    });
  }
};

// ADMIN: Cập nhật thông tin album và làm mới cover nếu cần.
exports.updateGallery = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      drive_folder_url,
      drive_folder_id,
      coverImage,
      photographer_id,
      service_ids,
      featured,
      is_active,
    } = req.body;

    const gallery = await PublicGallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        message: "Khong tim thay album",
      });
    }

    const previousDriveFolderId = gallery.drive_folder_id;
    const finalDriveFolderId =
      drive_folder_id || extractDriveFolderId(drive_folder_url);

    if (finalDriveFolderId && finalDriveFolderId !== gallery.drive_folder_id) {
      const existingGallery = await PublicGallery.findOne({
        drive_folder_id: finalDriveFolderId,
        _id: { $ne: gallery._id },
      });

      if (existingGallery) {
        return res.status(400).json({
          message: "Folder Google Drive nay da duoc dung cho album khac",
        });
      }

      gallery.drive_folder_id = finalDriveFolderId;
    }

    if (title !== undefined) gallery.title = title;
    if (description !== undefined) gallery.description = description;
    if (category !== undefined) gallery.category = category;
    if (location !== undefined) gallery.location = location;
    if (drive_folder_url !== undefined) {
      gallery.drive_folder_url = drive_folder_url;
    }

    if (previousDriveFolderId) {
      googleDriveService.clearFolderImageCache(previousDriveFolderId);
    }
    if (gallery.drive_folder_id) {
      googleDriveService.clearFolderImageCache(gallery.drive_folder_id);
    }

    const finalCoverImage = await getCoverFromDrive({
      coverImage: coverImage !== undefined ? coverImage : gallery.coverImage,
      drive_folder_id: gallery.drive_folder_id,
    });
    gallery.coverImage = finalCoverImage;

    if (photographer_id !== undefined) {
      gallery.photographer_id = photographer_id || null;
    }
    if (service_ids !== undefined) gallery.service_ids = service_ids || [];
    if (featured !== undefined) gallery.featured = Boolean(featured);
    if (is_active !== undefined) gallery.is_active = is_active;

    await gallery.save();

    res.status(200).json({
      message: "Cap nhat album thanh cong",
      gallery,
    });
  } catch (error) {
    console.error("Update gallery error:", error);

    res.status(500).json({
      message: "Loi cap nhat album",
      error: error.message,
    });
  }
};

// ADMIN: Ẩn/hiện album trên website khách hàng.
exports.toggleGalleryActive = async (req, res) => {
  try {
    const gallery = await PublicGallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        message: "Khong tim thay album",
      });
    }

    gallery.is_active = !gallery.is_active;
    await gallery.save();

    res.status(200).json({
      message: gallery.is_active ? "Da hien thi album" : "Da an album",
      gallery,
    });
  } catch (error) {
    res.status(500).json({
      message: "Loi cap nhat trang thai album",
      error: error.message,
    });
  }
};

// ADMIN: Xóa album và xóa cache ảnh Drive liên quan.
exports.deleteGallery = async (req, res) => {
  try {
    const gallery = await PublicGallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        message: "Khong tim thay album",
      });
    }

    await PublicGallery.findByIdAndDelete(req.params.id);

    if (gallery.drive_folder_id) {
      googleDriveService.clearFolderImageCache(gallery.drive_folder_id);
    }

    res.status(200).json({
      message: "Xoa album thanh cong",
    });
  } catch (error) {
    res.status(500).json({
      message: "Loi xoa album",
      error: error.message,
    });
  }
};

// ADMIN: Cập nhật thứ tự hiển thị album hàng loạt.
exports.reorderGalleries = async (req, res) => {
  try {
    const { items } = req.body;
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
      await PublicGallery.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: "Cap nhat thu tu thanh cong" });
  } catch (error) {
    res.status(500).json({
      message: "Loi cap nhat thu tu",
      error: error.message,
    });
  }
};
