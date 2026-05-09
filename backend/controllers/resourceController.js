const Resource = require("../models/Resource");

// Lấy danh sách đồ cho thuê (Dành cho khách hàng)
exports.getRentals = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {
      usage_type: { $in: ["RENTAL", "BOTH"] },
      is_active: true,
    };

    // Lọc theo loại (Camera, Lens...)
    if (type && type !== "ALL") {
      query.type = type;
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });
    res.status(200).json(resources);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách thiết bị", error: error.message });
  }
};
