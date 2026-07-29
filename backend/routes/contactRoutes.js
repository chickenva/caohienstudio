// Router liên hệ tư vấn và OTP liên hệ.
const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

router.post("/send-otp", contactController.sendContactOtp);
router.post("/verify-otp", contactController.verifyContactOtp);
router.post("/", contactController.submitContact);

module.exports = router;
