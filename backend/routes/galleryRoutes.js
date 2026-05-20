const express = require("express");
const router = express.Router();
const galleryController = require("../controllers/galleryController");
const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================
// ADMIN ROUTES - PHẢI ĐẶT TRƯỚC /:id
// ==========================================
router.post("/admin", verifyToken, galleryController.createGallery);

router.put("/admin/:id", verifyToken, galleryController.updateGallery);

router.patch(
  "/admin/:id/toggle-active",
  verifyToken,
  galleryController.toggleGalleryActive,
);

router.delete("/admin/:id", verifyToken, galleryController.deleteGallery);

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get("/", galleryController.getAllGalleries);

router.get("/:id", galleryController.getGalleryById);

module.exports = router;
