const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");

router.get("/", staffController.getPhotographers);
router.get("/:id", staffController.getStaffDetail);

module.exports = router;
