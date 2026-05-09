const PublicGallery = require("../models/PublicGallery");

exports.getAllGalleries = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    // Lọc theo danh mục nếu có truyền lên (khác 'ALL')
    if (category && category !== "ALL") {
      query.category = category;
    }

    // Lấy ảnh mới nhất lên đầu
    const galleries = await PublicGallery.find(query).sort({ createdAt: -1 });
    res.status(200).json(galleries);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách thư viện", error: error.message });
  }
};

exports.getGalleryById = async (req, res) => {
  try {
    const gallery = await PublicGallery.findById(req.params.id);
    if (!gallery)
      return res.status(404).json({ message: "Không tìm thấy album" });
    res.status(200).json(gallery);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy chi tiết album", error: error.message });
  }
};
