const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const User = require("../models/userModel");
const { saveCountry } = require("../controllers/authController");
const { saveLanguage } = require("../controllers/authController");

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

// Update birthday
router.post("/birthday", verifyToken, async (req, res) => {
  try {
    const { month, date, year } = req.body;

    if (!month || !date || !year) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Convert month string (e.g., "Jan") into a number
    const monthIndex = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].indexOf(month);

    if (monthIndex === -1) {
      return res.status(400).json({ message: "Invalid month" });
    }

    // Construct a Date object
    const birthday = new Date(year, monthIndex, date);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { birthday },
      { new: true, select: "-password -otp -otpExpires" }
    );

    res.json({ message: "Birthday updated successfully", user });
  } catch (err) {
    console.error("Error updating birthday:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update gender
router.post("/gender", verifyToken, async (req, res) => {
  try {
    const { gender } = req.body;
    if (!gender) return res.status(400).json({ message: "Gender is required" });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { gender },
      { new: true, select: "-password -otp -otpExpires" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error updating gender:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/country", verifyToken, saveCountry);
router.post("/language", verifyToken, saveLanguage);

module.exports = router;
