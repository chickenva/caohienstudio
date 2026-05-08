const Album = require("../models/Album");

// Lấy danh sách tất cả album
exports.getAllAlbums = async (req, res) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.status(200).json(albums);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tải thư viện ảnh" });
  }
};

// Lấy chi tiết 1 album theo slug
exports.getAlbumBySlug = async (req, res) => {
  try {
    const album = await Album.findOne({ slug: req.params.slug });
    if (!album)
      return res.status(404).json({ message: "Không tìm thấy album" });
    res.status(200).json(album);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
