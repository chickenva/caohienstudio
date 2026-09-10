/**
 * cameraRentalRoutes.js
 * Định tuyến API cho Dịch vụ cho thuê máy ảnh.
 */
const express = require("express");
const router = express.Router();
const cameraRentalController = require("../controllers/cameraRentalController");
const { verifyAdmin } = require("../middleware/authMiddleware");

// Public: Lấy danh sách thiết bị cho thuê
router.get("/", cameraRentalController.getActiveCameras);

// Admin routes — phải đặt TRƯỚC /:id để Express không nhầm "admin" là id
router.get("/admin/all", verifyAdmin, cameraRentalController.getAllCamerasAdmin);
router.post("/admin", verifyAdmin, cameraRentalController.createCamera);
router.put("/admin/:id", verifyAdmin, cameraRentalController.updateCamera);
router.patch("/admin/:id/toggle", verifyAdmin, cameraRentalController.toggleCamera);
router.delete("/admin/:id", verifyAdmin, cameraRentalController.deleteCamera);

// Public: Chi tiết 1 thiết bị (đặt sau admin routes)
router.get("/:id", cameraRentalController.getCameraById);

module.exports = router;
