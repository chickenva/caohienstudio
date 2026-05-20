const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get(
  "/admin/overview",
  verifyToken,
  dashboardController.getAdminOverview,
);

module.exports = router;
