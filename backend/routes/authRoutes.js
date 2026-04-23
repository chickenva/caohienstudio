const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOTP); // Dùng chung cho các bước xác thực

// Các route cần đăng nhập
router.get("/me", verifyToken, authController.getMe);
router.post("/send-update-otp", verifyToken, authController.sendUpdateOtp);
router.put("/update-profile", verifyToken, authController.updateProfile);
router.put(
  "/reset-password-profile",
  verifyToken,
  authController.resetPassword,
);

module.exports = router;
