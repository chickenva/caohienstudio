const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");

// Tuyến cho Khách vãng lai (Public)
router.get("/", serviceController.getAllServices);
router.get("/:id", serviceController.getServiceById);

// Tuyến cho Admin (Thêm/Sửa/Xóa)
// (Thực tế sau này bạn sẽ cần chèn middleware check quyền Admin vào đây)
router.post("/", serviceController.createService);
router.put("/:id", serviceController.updateService);
router.delete("/:id", serviceController.deleteService);

module.exports = router;
