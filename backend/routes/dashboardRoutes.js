// Router dashboard admin tổng hợp số liệu hệ thống.
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

router.get(
  "/admin/overview",
  verifyAdmin,
  dashboardController.getAdminOverview,
);

module.exports = router;
