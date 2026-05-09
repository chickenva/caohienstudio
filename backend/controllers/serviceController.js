const Service = require("../models/Service");

// ==========================================
// [API KHÁCH HÀNG] - CHỈ LẤY DỊCH VỤ ĐANG HOẠT ĐỘNG
// ==========================================
exports.getAllServices = async (req, res) => {
  try {
    // Chỉ lấy những dịch vụ có is_active: true để show ra web
    const services = await Service.find({ is_active: true }).sort({
      createdAt: -1,
    });

    // TRICK CỨU FRONTEND: Nếu frontend cũ của bạn đang dùng biến `price`
    // thay vì `base_price`, ta có thể map lại một chút trước khi trả về (hoặc bạn sửa bên Frontend)
    res.status(200).json(services);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách dịch vụ", error: error.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service)
      return res
        .status(404)
        .json({ message: "Không tìm thấy gói dịch vụ này" });

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// ==========================================
// [API ADMIN] - THÊM / SỬA / XÓA DỊCH VỤ
// ==========================================
exports.createService = async (req, res) => {
  try {
    const { name, description, base_price, duration_hours, thumbnail } =
      req.body;

    const newService = await Service.create({
      name,
      description,
      base_price, // Chú ý: Đổi từ price sang base_price
      duration_hours,
      thumbnail,
    });

    res
      .status(201)
      .json({ message: "Tạo gói dịch vụ thành công", data: newService });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo dịch vụ", error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }, // Trả về data mới sau khi update
    );

    if (!updatedService)
      return res
        .status(404)
        .json({ message: "Không tìm thấy dịch vụ để cập nhật" });

    res
      .status(200)
      .json({ message: "Cập nhật thành công", data: updatedService });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật dịch vụ", error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    // Thay vì xóa hẳn (Hard Delete), ta chỉ ẩn nó đi (Soft Delete)
    // để không làm mất lịch sử các đơn hàng cũ đã đặt gói này.
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true },
    );

    if (!service)
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });

    res.status(200).json({ message: "Đã tạm ngưng cung cấp gói dịch vụ này" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa dịch vụ", error: error.message });
  }
};
