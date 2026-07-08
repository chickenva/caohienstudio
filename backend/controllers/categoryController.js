const Category = require("../models/Category");

// [GET] /api/categories?type=SERVICE
exports.getCategories = async (req, res) => {
  try {
    const { type, is_active } = req.query;
    let filter = {};

    if (type) {
      filter.type = type;
    }

    if (is_active !== undefined) {
      filter.is_active = is_active === "true";
    }

    const categories = await Category.find(filter).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// [POST] /api/categories/admin
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, type, description, is_active } = req.body;

    if (!name || !slug || !type) {
      return res.status(400).json({ message: "Vui lòng cung cấp đủ tên, mã (slug) và loại danh mục" });
    }

    // Kiểm tra trùng slug trong cùng type
    const existing = await Category.findOne({ slug, type });
    if (existing) {
      return res.status(400).json({ message: "Mã danh mục (slug) này đã tồn tại cho loại này" });
    }

    const category = new Category({
      name,
      slug,
      type,
      description,
      is_active: is_active !== undefined ? is_active : true,
    });

    await category.save();
    res.status(201).json({ message: "Tạo danh mục thành công", category });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi tạo danh mục", error });
  }
};

// [PUT] /api/categories/admin/:id
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, is_active } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    // Nếu đổi slug, kiểm tra trùng lặp
    if (slug && slug !== category.slug) {
      const existing = await Category.findOne({ slug, type: category.type });
      if (existing) {
        return res.status(400).json({ message: "Mã danh mục (slug) này đã tồn tại" });
      }
      category.slug = slug;
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (is_active !== undefined) category.is_active = is_active;

    await category.save();
    res.status(200).json({ message: "Cập nhật danh mục thành công", category });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi cập nhật danh mục", error });
  }
};

// [DELETE] /api/categories/admin/:id
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ghi chú: Chúng ta có thể kiểm tra xem danh mục này có đang được sử dụng bởi Service hay Gallery nào không
    // Tạm thời cho phép xóa, các item tham chiếu bằng slug sẽ không hiển thị trên bộ lọc. Hoặc ở đây chỉ nên dùng soft delete (is_active = false)
    
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục để xóa" });
    }

    res.status(200).json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi xóa danh mục", error });
  }
};

// [PUT] /api/categories/admin/reorder
exports.reorderCategories = async (req, res) => {
  try {
    const { items } = req.body; // array of { _id, order }
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { order: item.order },
      },
    }));

    if (bulkOps.length > 0) {
      await Category.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: "Cập nhật thứ tự thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật thứ tự", error: error.message });
  }
};
