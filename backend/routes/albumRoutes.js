const express = require("express");
const router = express.Router();
const albumController = require("../controllers/albumController");

// API Public không cần verifyToken vì ai cũng xem được thư viện ảnh
router.get("/", albumController.getAllAlbums);
router.get("/:slug", albumController.getAlbumBySlug);

module.exports = router;
