const express = require("express");
const router = express.Router();
const galleryController = require("../controllers/galleryController");

router.get("/", galleryController.getAllGalleries);
router.get("/:id", galleryController.getGalleryById);

module.exports = router;
