const User = require("../models/User");

// GET /api/users/photographers
exports.getPhotographers = async (req, res) => {
  try {
    const photographers = await User.find({
      role: "PHOTOGRAPHER",
      is_active: true,
    }).select("full_name email phone portfolio is_active createdAt");

    res.status(200).json({
      message: "Lấy danh sách thợ chụp thành công",
      photographers,
    });
  } catch (error) {
    console.error("Get photographers error:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách thợ chụp",
      error: error.message,
    });
  }
};
