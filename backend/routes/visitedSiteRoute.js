const express = require("express");
const router = express.Router();
const VisitedSite = require("../models/visitedSiteModel");
const { verifyToken } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(verifyToken);

// @route   POST /api/visited-sites
// @desc    Mark a site as visited
// @access  Private
router.post("/", async (req, res) => {
  try {
    const { itineraryId, siteId } = req.body;
    const userId = req.user.id;

    if (!itineraryId || !siteId) {
      return res.status(400).json({ error: "Itinerary ID and Site ID are required" });
    }

    // Check if already visited
    const existingVisit = await VisitedSite.findOne({
      userId,
      itineraryId,
      siteId,
    });

    if (existingVisit) {
      return res.status(200).json({
        message: "Site already marked as visited",
        visitedSite: existingVisit,
      });
    }

    // Create new visited site record
    const visitedSite = await VisitedSite.create({
      userId,
      itineraryId,
      siteId,
    });

    const populated = await VisitedSite.findById(visitedSite._id)
      .populate("itineraryId", "name")
      .populate("siteId", "siteName siteDescription mediaUrl latitude longitude");

    res.status(201).json({
      message: "Site marked as visited",
      visitedSite: populated,
    });
  } catch (err) {
    console.error("Error marking site as visited:", err);
    res.status(500).json({ error: "Failed to mark site as visited" });
  }
});

// @route   GET /api/visited-sites
// @desc    Get all visited sites for the logged-in user
// @access  Private
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const visitedSites = await VisitedSite.find({ userId })
      .populate("itineraryId", "name")
      .populate("siteId", "siteName siteDescription mediaUrl latitude longitude")
      .sort({ visitedAt: -1 });

    res.status(200).json(visitedSites);
  } catch (err) {
    console.error("Error fetching visited sites:", err);
    res.status(500).json({ error: "Failed to fetch visited sites" });
  }
});

// @route   GET /api/visited-sites/:itineraryId
// @desc    Get visited sites for a specific itinerary
// @access  Private
router.get("/:itineraryId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { itineraryId } = req.params;

    const visitedSites = await VisitedSite.find({ userId, itineraryId })
      .populate("siteId", "siteName siteDescription mediaUrl latitude longitude")
      .sort({ visitedAt: -1 });

    res.status(200).json(visitedSites);
  } catch (err) {
    console.error("Error fetching visited sites:", err);
    res.status(500).json({ error: "Failed to fetch visited sites" });
  }
});

// @route   DELETE /api/visited-sites/:id
// @desc    Remove a visited site record
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const visitedSite = await VisitedSite.findOne({ _id: id, userId });

    if (!visitedSite) {
      return res.status(404).json({ error: "Visited site not found" });
    }

    await VisitedSite.findByIdAndDelete(id);

    res.status(200).json({ message: "Visited site record deleted" });
  } catch (err) {
    console.error("Error deleting visited site:", err);
    res.status(500).json({ error: "Failed to delete visited site" });
  }
});

module.exports = router;
