const express = require("express");
const router = express.Router();
const Log = require("../models/logModel");
const { verifyToken } = require("../middleware/authMiddleware");

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

// @route   GET /api/logs
// @desc    Get all logs (admin only)
// @access  Private (Admin)
router.get("/", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin" && req.user.email !== "aaronbagain@gmail.com") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    // Delete logs older than 30 days before fetching
    await deleteOldLogs();

    const { targetType, limit = 100 } = req.query;

    const query = targetType ? { targetType } : {};

    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// @route   GET /api/logs/reviews
// @desc    Get all review-related logs (admin only)
// @access  Private (Admin)
router.get("/reviews", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin" && req.user.email !== "aaronbagain@gmail.com") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const logs = await Log.find({ targetType: "review" })
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json(logs);
  } catch (err) {
    console.error("Error fetching review logs:", err);
    res.status(500).json({ error: "Failed to fetch review logs" });
  }
});

// @route   DELETE /api/logs/:id
// @desc    Delete a specific log (admin only)
// @access  Private (Admin)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin" && req.user.email !== "aaronbagain@gmail.com") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { id } = req.params;

    const log = await Log.findByIdAndDelete(id);

    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }

    res.status(200).json({ message: "Log deleted successfully" });
  } catch (err) {
    console.error("Error deleting log:", err);
    res.status(500).json({ error: "Failed to delete log" });
  }
});

// @route   DELETE /api/logs/clear/all
// @desc    Clear all logs (admin only)
// @access  Private (Admin)
router.delete("/clear/all", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin" && req.user.email !== "aaronbagain@gmail.com") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    await Log.deleteMany({});

    res.status(200).json({ message: "All logs cleared successfully" });
  } catch (err) {
    console.error("Error clearing logs:", err);
    res.status(500).json({ error: "Failed to clear logs" });
  }
});

module.exports = router;
