const Resource = require("../models/Resource");

// Thêm tài nguyên mới
exports.createResource = async (req, res) => {
  try {
    const newResource = new Resource(req.body);
    const savedResource = await newResource.save();
    res.status(201).json(savedResource);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm tài nguyên" });
  }
};

// Lấy danh sách tài nguyên
exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách" });
  }
};
