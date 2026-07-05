const express = require("express");
const router = express.Router();
const aiChatController = require("../controllers/aiChatController");

// POST /api/ai-chat - Public, không cần auth
router.post("/", aiChatController.chat);

module.exports = router;
