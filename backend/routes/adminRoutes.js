const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Log = require("../models/logModel");
const { verifyAdmin } = require("../middleware/authMiddleware");
const { SUPER_ADMIN_EMAIL } = require("../config/superAdmin");

// GET all users
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

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const requester = req.user;

    // 🚫 Nobody can change the super admin
    if (targetUser.email === SUPER_ADMIN_EMAIL) {
      return res
        .status(403)
        .json({ message: "Super Admin role cannot be modified" });
    }

    // ✅ If requester is admin (but not super admin)
    if (requester.email !== SUPER_ADMIN_EMAIL) {
      // Admins can modify tourists and admins
      if (!["tourist", "admin"].includes(targetUser.role)) {
        return res
          .status(403)
          .json({ message: "Admins can only modify Tourists or Admins" });
      }
    }

    // ✅ Apply role change
    targetUser.role = role;
    const updatedUser = await targetUser.save();

    // Log action
    const adminName = `${requester.firstName} ${
      requester.lastName || ""
    }`.trim();
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
