const Resource = require("../models/Resource");

// Lấy danh sách đồ cho thuê (Dành cho khách hàng)
exports.getRentals = async (req, res) => {
  try {
    const { type } = req.query;

    const query = {
      usage_type: { $in: ["RENTAL", "BOTH"] },
      is_active: true,
    };

    // Lọc theo loại: CAMERA, LENS, LIGHT, STUDIO, ACCESSORY
    if (type && type !== "ALL") {
      query.type = type;
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });

    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách thiết bị",
      error: error.message,
    });
  }
};

// Lấy chi tiết 1 thiết bị cho thuê
exports.getRentalDetail = async (req, res) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      usage_type: { $in: ["RENTAL", "BOTH"] },
      is_active: true,
    });

    if (!resource) {
      return res.status(404).json({
        message: "Không tìm thấy thiết bị cho thuê",
      });
    }

    res.status(200).json(resource);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy chi tiết thiết bị",
      error: error.message,
    });
  }
};
