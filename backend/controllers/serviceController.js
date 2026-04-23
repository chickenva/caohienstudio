const Service = require("../models/Service");

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách dịch vụ" });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service)
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};
