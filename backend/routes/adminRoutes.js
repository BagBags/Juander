const express = require("express");
const router = express.Router();
const User = require("../models/userModel"); // adjust path if needed
const Log = require("../models/logModel");
const { verifyAdmin } = require("../middleware/authMiddleware");

// GET all users (exclude otp, otpExpires, and password)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password -otp -otpExpires");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE user role + log
router.put("/users/:id/role", verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["tourist", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: "-password -otp -otpExpires" }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // log with real admin's name
    const adminName = `${req.user.firstName} ${req.user.lastName || ""}`;
    await Log.create({
      adminName,
      action: `Changed role of ${updatedUser.firstName} ${updatedUser.lastName} to ${role}`,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET logs
router.get("/logs", verifyAdmin, async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
