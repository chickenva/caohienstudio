const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, resourceController.createResource);
router.get("/", verifyToken, resourceController.getAllResources);

module.exports = router;
