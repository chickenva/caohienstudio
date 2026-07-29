// Router xác thực: đăng ký, đăng nhập, OTP và hồ sơ cá nhân.
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// ==========================================
// 1. PUBLIC ROUTES (Không cần đăng nhập)
// ==========================================
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOTP);

// Các route phục vụ gửi Email OTP (Vừa được bổ sung)
router.post("/send-register-otp", authController.sendRegisterOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// ==========================================
// 2. PROTECTED ROUTES (Bắt buộc phải có Token)
// ==========================================
router.get("/me", verifyToken, authController.getMe);
router.post("/send-update-otp", verifyToken, authController.sendUpdateOtp);
router.put("/update-profile", verifyToken, authController.updateProfile);
router.put(
  "/reset-password-profile",
  verifyToken,
  authController.resetPassword,
);

module.exports = router;
