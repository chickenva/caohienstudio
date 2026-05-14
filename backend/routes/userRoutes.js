const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Public hoặc protected đều được.
// Mình để public để khách chưa login vẫn xem được danh sách thợ chụp.
router.get("/photographers", userController.getPhotographers);

module.exports = router;
