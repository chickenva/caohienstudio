const Staff = require("../models/Staff");

// Thêm nhân sự mới
exports.createStaff = async (req, res) => {
  try {
    const newStaff = new Staff(req.body);
    const savedStaff = await newStaff.save();
    res.status(201).json(savedStaff);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm nhân sự" });
  }
};

// Lấy danh sách nhân sự
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 });
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách" });
  }
};
