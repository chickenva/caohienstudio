const express = require("express");
const router = express.Router();
const galleryController = require("../controllers/galleryController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// ==========================================
// ADMIN ROUTES
// ==========================================
router.post("/admin", verifyAdmin, galleryController.createGallery);

router.put("/admin/:id", verifyAdmin, galleryController.updateGallery);

router.patch(
  "/admin/:id/toggle-active",
  verifyAdmin,
  galleryController.toggleGalleryActive,
);

router.delete("/admin/:id", verifyAdmin, galleryController.deleteGallery);

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get("/", galleryController.getAllGalleries);

router.get("/:id", galleryController.getGalleryById);

module.exports = router;
