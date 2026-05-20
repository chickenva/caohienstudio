const PublicGallery = require("../models/PublicGallery");
const googleDriveService = require("../services/googleDriveService");

const extractDriveFolderId = (input = "") => {
  if (!input) return "";

  // Nếu admin dán thẳng folder ID
  if (!input.includes("drive.google.com")) {
    return input.trim();
  }

  // Link dạng: https://drive.google.com/drive/folders/FOLDER_ID
  const folderMatch = input.match(/\/folders\/([^?]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1].trim();
  }

  // Link dạng có id=
  const idMatch = input.match(/[?&]id=([^&]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1].trim();
  }

  return "";
};

const getCoverFromDrive = async (gallery) => {
  if (gallery.coverImage) {
    return gallery.coverImage;
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

    return images[0].thumbnailLink || images[0].imageUrl || "";
  } catch (error) {
    console.error(
      `Get cover from Drive error for gallery ${gallery._id}:`,
      error.message,
    );

    return "";
  }
};

// GET /api/galleries?category=ALL
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
      .populate("service_id", "name base_price duration_hours")
      .sort({ featured: -1, createdAt: -1 });

    const result = await Promise.all(
      galleries.map(async (gallery) => {
        const item = gallery.toObject();

        item.coverImage = await getCoverFromDrive(gallery);

        return item;
      }),
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Get galleries error:", error);

    res.status(500).json({
      message: "Lỗi lấy danh sách thư viện",
      error: error.message,
    });
  }
};

// GET /api/galleries/:id
exports.getGalleryById = async (req, res) => {
  try {
    const gallery = await PublicGallery.findById(req.params.id)
      .populate("photographer_id", "full_name email phone portfolio.avatar")
      .populate("service_id", "name description base_price duration_hours");

    if (!gallery || !gallery.is_active) {
      return res.status(404).json({
        message: "Không tìm thấy album",
      });
    }

    const images = await googleDriveService.listImagesInFolder(
      gallery.drive_folder_id,
    );

    const galleryObject = gallery.toObject();

    if (!galleryObject.coverImage && images.length > 0) {
      galleryObject.coverImage = images[0].thumbnailLink || images[0].imageUrl;
    }

    res.status(200).json({
      gallery: galleryObject,
      images,
    });
  } catch (error) {
    console.error("Get gallery detail error:", error);

    res.status(500).json({
      message: "Lỗi lấy chi tiết album",
      error: error.message,
    });
  }
};

// ADMIN: POST /api/galleries
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
      service_id,
      featured,
      is_active,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        message: "Vui lòng nhập tên album và danh mục",
      });
    }

    const finalDriveFolderId =
      drive_folder_id || extractDriveFolderId(drive_folder_url);

    if (!finalDriveFolderId) {
      return res.status(400).json({
        message: "Vui lòng nhập link hoặc ID folder Google Drive",
      });
    }

    const existingGallery = await PublicGallery.findOne({
      drive_folder_id: finalDriveFolderId,
    });

    if (existingGallery) {
      return res.status(400).json({
        message: "Folder Google Drive này đã được dùng cho album khác",
      });
    }

    const newGallery = await PublicGallery.create({
      title,
      description,
      category,
      location,
      drive_folder_id: finalDriveFolderId,
      drive_folder_url,
      coverImage,
      photographer_id: photographer_id || null,
      service_id: service_id || null,
      featured: featured || false,
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json({
      message: "Tạo album thành công",
      gallery: newGallery,
    });
  } catch (error) {
    console.error("Create gallery error:", error);

    res.status(500).json({
      message: "Lỗi tạo album",
      error: error.message,
    });
  }
};

// ADMIN: PUT /api/galleries/:id
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
      service_id,
      featured,
      is_active,
    } = req.body;

    const gallery = await PublicGallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        message: "Không tìm thấy album",
      });
    }

    const finalDriveFolderId =
      drive_folder_id || extractDriveFolderId(drive_folder_url);

    if (finalDriveFolderId && finalDriveFolderId !== gallery.drive_folder_id) {
      const existingGallery = await PublicGallery.findOne({
        drive_folder_id: finalDriveFolderId,
        _id: { $ne: gallery._id },
      });

      if (existingGallery) {
        return res.status(400).json({
          message: "Folder Google Drive này đã được dùng cho album khác",
        });
      }

      gallery.drive_folder_id = finalDriveFolderId;
    }

    if (title !== undefined) gallery.title = title;
    if (description !== undefined) gallery.description = description;
    if (category !== undefined) gallery.category = category;
    if (location !== undefined) gallery.location = location;
    if (drive_folder_url !== undefined)
      gallery.drive_folder_url = drive_folder_url;
    if (coverImage !== undefined) gallery.coverImage = coverImage;
    if (photographer_id !== undefined)
      gallery.photographer_id = photographer_id || null;
    if (service_id !== undefined) gallery.service_id = service_id || null;
    if (featured !== undefined) gallery.featured = featured;
    if (is_active !== undefined) gallery.is_active = is_active;

    await gallery.save();

    res.status(200).json({
      message: "Cập nhật album thành công",
      gallery,
    });
  } catch (error) {
    console.error("Update gallery error:", error);

    res.status(500).json({
      message: "Lỗi cập nhật album",
      error: error.message,
    });
  }
};

// ADMIN: PATCH /api/galleries/:id/toggle-active
exports.toggleGalleryActive = async (req, res) => {
  try {
    const gallery = await PublicGallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        message: "Không tìm thấy album",
      });
    }

    gallery.is_active = !gallery.is_active;
    await gallery.save();

    res.status(200).json({
      message: gallery.is_active ? "Đã hiển thị album" : "Đã ẩn album",
      gallery,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật trạng thái album",
      error: error.message,
    });
  }
};

// ADMIN: DELETE /api/galleries/:id
exports.deleteGallery = async (req, res) => {
  try {
    const gallery = await PublicGallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        message: "Không tìm thấy album",
      });
    }

    await PublicGallery.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Xóa album thành công",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi xóa album",
      error: error.message,
    });
  }
};
