const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");

// Khách vãng lai xem đồ cho thuê
router.get("/rentals", resourceController.getRentals);

// Chi tiết 1 thiết bị cho thuê
router.get("/rentals/:id", resourceController.getRentalDetail);

module.exports = router;
