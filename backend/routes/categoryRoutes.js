// Router danh mục dịch vụ/album.
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { verifyAdmin } = require("../middleware/authMiddleware");

// Public routes
router.get("/", categoryController.getCategories);

// Admin routes
router.post("/admin", verifyAdmin, categoryController.createCategory);
router.put("/admin/reorder", verifyAdmin, categoryController.reorderCategories);
router.put("/admin/:id", verifyAdmin, categoryController.updateCategory);
router.delete("/admin/:id", verifyAdmin, categoryController.deleteCategory);

module.exports = router;
