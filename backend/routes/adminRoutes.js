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
      role: "admin",
      targetType: "user",
      targetId: updatedUser._id,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create log entry
router.post("/logs", verifyAdmin, async (req, res) => {
  try {
    const { action, targetType, targetId } = req.body;
    
    if (!action) {
      return res.status(400).json({ message: "Action is required" });
    }

    const adminName = `${req.user.firstName} ${req.user.lastName || ""}`.trim();
    
    const log = await Log.create({
      adminName,
      action,
      role: req.user.role || "admin",
      targetType: targetType || "other",
      targetId: targetId || null,
    });

    res.status(201).json(log);
  } catch (error) {
    console.error("Error creating log:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to delete logs older than 30 days
const deleteOldLogs = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Log.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`Deleted ${result.deletedCount} logs older than 30 days`);
    }
  } catch (err) {
    console.error("Error deleting old logs:", err);
  }
};

// GET logs (all actions - admin and user)
router.get("/logs", verifyAdmin, async (req, res) => {
  try {
    // Delete logs older than 30 days before fetching
    await deleteOldLogs();
    
    const logs = await Log.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
