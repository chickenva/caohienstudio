const googleDriveService = require("../services/googleDriveService");

exports.createFolder = async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Vui lòng nhập tên folder",
      });
    }

    const targetParentFolderId =
      parentFolderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    if (!targetParentFolderId) {
      return res.status(500).json({
        message: "Chưa cấu hình GOOGLE_DRIVE_ROOT_FOLDER_ID",
      });
    }

    const folder = await googleDriveService.createFolder(
      name,
      targetParentFolderId,
    );

    return res.status(201).json({
      message: "Tạo folder Google Drive thành công",
      folder,
    });
  } catch (error) {
    console.error("Create Drive folder error:", error);

    return res.status(500).json({
      message: "Lỗi tạo folder Google Drive",
      error: error.message,
    });
  }
};

exports.listImages = async (req, res) => {
  try {
    const { folderId } = req.params;

    if (!folderId) {
      return res.status(400).json({
        message: "Thiếu folderId",
      });
    }

    const images = await googleDriveService.listImagesInFolder(folderId);

    return res.status(200).json({
      message: "Lấy danh sách ảnh Google Drive thành công",
      images,
    });
  } catch (error) {
    console.error("List Drive images error:", error);

    return res.status(500).json({
      message: "Lỗi lấy danh sách ảnh Google Drive",
      error: error.message,
    });
  }
};

exports.uploadImages = async (req, res) => {
  try {
    const { folderId } = req.params;

    if (!folderId) {
      return res.status(400).json({
        message: "Thiếu folderId",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Vui lòng chọn ít nhất 1 ảnh",
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const uploaded = await googleDriveService.uploadImageToFolder(
        file,
        folderId,
      );

      uploadedImages.push(uploaded);
    }

    return res.status(201).json({
      message: "Upload ảnh lên Google Drive thành công",
      images: uploadedImages,
    });
  } catch (error) {
    console.error("Upload Drive images error:", error);

    return res.status(500).json({
      message: "Lỗi upload ảnh Google Drive",
      error: error.message,
    });
  }
};
