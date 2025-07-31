const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/reset-password", authController.resetPassword);
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/login", authController.login);
router.post("/google-login", authController.googleLogin);
router.post("/send-otp", authController.sendOtp); // ✅ Added this

module.exports = router;
