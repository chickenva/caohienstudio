/**
 * holidayController.js
 * Quản lý danh sách ngày lễ quốc gia và ngày nghỉ/sự kiện của studio.
 */
const Holiday = require("../models/Holiday");

// Dữ liệu ngày lễ quốc gia mẫu của Việt Nam
const DEFAULT_NATIONAL_HOLIDAYS = [
  {
    name: "Tết Dương Lịch",
    type: "NATIONAL",
    start_date: "2026-01-01",
    end_date: "2026-01-01",
    is_recurring_yearly: true,
    is_closed: false,
    color: "#cf1322",
    surcharge_note: "Phụ thu ngày lễ",
    description: "Nghỉ Tết Dương Lịch hàng năm",
  },
  {
    name: "Ngày Giải phóng Miền Nam & Quốc tế Lao động",
    type: "NATIONAL",
    start_date: "2026-04-30",
    end_date: "2026-05-01",
    is_recurring_yearly: true,
    is_closed: false,
    color: "#cf1322",
    surcharge_note: "Phụ thu ngày lễ",
    description: "Đại lễ 30/4 - 1/5",
  },
  {
    name: "Quốc khánh nước CHXHCN Việt Nam",
    type: "NATIONAL",
    start_date: "2026-09-02",
    end_date: "2026-09-03",
    is_recurring_yearly: true,
    is_closed: false,
    color: "#cf1322",
    surcharge_note: "Phụ thu ngày lễ",
    description: "Kỷ niệm Quốc khánh 2/9",
  },
  {
    name: "Giỗ Tổ Hùng Vương (10/3 Âm lịch)",
    type: "NATIONAL",
    start_date: "2026-04-26",
    end_date: "2026-04-26",
    is_recurring_yearly: false,
    is_closed: false,
    color: "#cf1322",
    surcharge_note: "Phụ thu ngày lễ",
    description: "Ngày Giỗ Tổ Hùng Vương (10 tháng 3 Âm lịch)",
  },
  {
    name: "Nghỉ Tết Nguyên Đán (Dự kiến)",
    type: "STUDIO",
    start_date: "2026-02-15",
    end_date: "2026-02-21",
    is_recurring_yearly: false,
    is_closed: true,
    color: "#722ed1",
    surcharge_note: "",
    description: "Studio tạm nghỉ nhận lịch trong kỳ nghỉ Tết Nguyên Đán",
  },
];

/**
 * [GET] /api/holidays
 * Lấy danh sách ngày lễ.
 * Public cho khách xem lịch & admin quản lý.
 */
exports.getHolidays = async (req, res) => {
  try {
    const { type, is_active } = req.query;
    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (is_active !== undefined) {
      filter.is_active = is_active === "true";
    } else {
      // Mặc định khách lấy các ngày active
      filter.is_active = true;
    }

    // Nếu chưa có ngày lễ nào trong DB, tự động nạp ngày lễ mẫu
    const count = await Holiday.countDocuments();
    if (count === 0) {
      await Holiday.insertMany(DEFAULT_NATIONAL_HOLIDAYS);
    }

    const holidays = await Holiday.find(filter).sort({ start_date: 1 });
    return res.status(200).json({ holidays });
  } catch (error) {
    console.error("Lỗi getHolidays:", error);
    return res.status(500).json({ message: "Lỗi lấy danh sách ngày lễ", error: error.message });
  }
};

/**
 * [POST] /api/holidays
 * Admin tạo ngày lễ / ngày nghỉ mới.
 */
exports.createHoliday = async (req, res) => {
  try {
    const {
      name,
      type = "NATIONAL",
      start_date,
      end_date,
      is_recurring_yearly = false,
      is_closed = false,
      color,
      surcharge_note = "",
      description = "",
    } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ tên ngày lễ, ngày bắt đầu và ngày kết thúc",
      });
    }

    if (start_date > end_date) {
      return res.status(400).json({
        message: "Ngày bắt đầu không được lớn hơn ngày kết thúc",
      });
    }

    const defaultColor = color || (type === "NATIONAL" ? "#cf1322" : type === "STUDIO" ? "#722ed1" : "#fa8c16");

    const holiday = new Holiday({
      name: name.trim(),
      type,
      start_date,
      end_date,
      is_recurring_yearly: Boolean(is_recurring_yearly),
      is_closed: Boolean(is_closed),
      color: defaultColor,
      surcharge_note: surcharge_note.trim(),
      description: description.trim(),
      is_active: true,
    });

    await holiday.save();
    return res.status(201).json({
      message: "Tạo ngày lễ thành công",
      holiday,
    });
  } catch (error) {
    console.error("Lỗi createHoliday:", error);
    return res.status(500).json({ message: "Lỗi tạo ngày lễ", error: error.message });
  }
};

/**
 * [PUT] /api/holidays/:id
 * Admin cập nhật thông tin ngày lễ.
 */
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      start_date,
      end_date,
      is_recurring_yearly,
      is_closed,
      color,
      surcharge_note,
      description,
      is_active,
    } = req.body;

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ message: "Không tìm thấy ngày lễ" });
    }

    if (start_date && end_date && start_date > end_date) {
      return res.status(400).json({
        message: "Ngày bắt đầu không được lớn hơn ngày kết thúc",
      });
    }

    if (name !== undefined) holiday.name = name.trim();
    if (type !== undefined) holiday.type = type;
    if (start_date !== undefined) holiday.start_date = start_date;
    if (end_date !== undefined) holiday.end_date = end_date;
    if (is_recurring_yearly !== undefined) holiday.is_recurring_yearly = Boolean(is_recurring_yearly);
    if (is_closed !== undefined) holiday.is_closed = Boolean(is_closed);
    if (color !== undefined) holiday.color = color;
    if (surcharge_note !== undefined) holiday.surcharge_note = surcharge_note.trim();
    if (description !== undefined) holiday.description = description.trim();
    if (is_active !== undefined) holiday.is_active = Boolean(is_active);

    await holiday.save();
    return res.status(200).json({
      message: "Cập nhật ngày lễ thành công",
      holiday,
    });
  } catch (error) {
    console.error("Lỗi updateHoliday:", error);
    return res.status(500).json({ message: "Lỗi cập nhật ngày lễ", error: error.message });
  }
};

/**
 * [DELETE] /api/holidays/:id
 * Admin xóa ngày lễ.
 */
exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.findByIdAndDelete(id);
    if (!holiday) {
      return res.status(404).json({ message: "Không tìm thấy ngày lễ" });
    }

    return res.status(200).json({
      message: "Xóa ngày lễ thành công",
      id,
    });
  } catch (error) {
    console.error("Lỗi deleteHoliday:", error);
    return res.status(500).json({ message: "Lỗi xóa ngày lễ", error: error.message });
  }
};

/**
 * [POST] /api/holidays/seed
 * Admin khôi phục danh sách ngày lễ mẫu.
 */
exports.seedHolidays = async (req, res) => {
  try {
    for (const item of DEFAULT_NATIONAL_HOLIDAYS) {
      const exists = await Holiday.findOne({ name: item.name, start_date: item.start_date });
      if (!exists) {
        await Holiday.create(item);
      }
    }
    const holidays = await Holiday.find().sort({ start_date: 1 });
    return res.status(200).json({
      message: "Khôi phục dữ liệu ngày lễ mẫu thành công",
      holidays,
    });
  } catch (error) {
    console.error("Lỗi seedHolidays:", error);
    return res.status(500).json({ message: "Lỗi khôi phục ngày lễ", error: error.message });
  }
};
