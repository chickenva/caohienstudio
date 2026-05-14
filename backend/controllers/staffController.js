const User = require("../models/User");

exports.getPhotographers = async (req, res) => {
  try {
    // Chỉ lấy thợ chụp đang active, ẩn đi password_hash để bảo mật
    const photographers = await User.find({
      role: "PHOTOGRAPHER",
      is_active: true,
    })
      .select("-password_hash")
      .sort({ createdAt: 1 });
    res.status(200).json(photographers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách thợ chụp", error: error.message });
  }
};

exports.getStaffDetail = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      role: "PHOTOGRAPHER",
      is_active: true,
    }).select("full_name email phone portfolio is_active createdAt");

    if (!staff) {
      return res.status(404).json({
        message: "Không tìm thấy nhiếp ảnh gia",
      });
    }

    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy chi tiết nhiếp ảnh gia",
      error: error.message,
    });
  }
};
