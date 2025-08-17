const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const User = require("../models/userModel");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/reset-password", authController.resetPassword);
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/login", authController.login);
router.post("/google-login", authController.googleLogin);
router.post("/send-otp", authController.sendOtp);
// GET currently logged-in user
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "-password -otp -otpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
