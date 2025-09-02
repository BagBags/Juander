const express = require("express");
const router = express.Router();
const Itinerary = require("../models/itineraryModel");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// CREATE a new itinerary (user or admin)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description, imageUrl, sites, isAdminCreated } = req.body;

    const itinerary = new Itinerary({
      name,
      description,
      imageUrl,
      sites,
      createdBy: req.user._id,
      isAdminCreated: isAdminCreated || false, // admin sets true, user = false
    });

    await itinerary.save();
    res.status(201).json(itinerary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET itineraries for a user (include admin ones)
router.get("/", verifyToken, async (req, res) => {
  try {
    // Admin itineraries (everyone can see) + user's own itineraries
    const itineraries = await Itinerary.find({
      $or: [{ isAdminCreated: true }, { createdBy: req.user._id }],
    }).populate("sites");

    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public itineraries for guests
router.get("/guest", async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ isAdminCreated: true }).populate(
      "sites"
    );
    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public itinerary by ID (guest)
router.get("/guest/:id", async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id).populate("sites");
    if (!itinerary)
      return res.status(404).json({ error: "Itinerary not found" });

    if (!itinerary.isAdminCreated) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Not a public itinerary" });
    }

    res.json(itinerary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single itinerary by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id).populate("sites");
    if (!itinerary)
      return res.status(404).json({ error: "Itinerary not found" });

    // Only allow user to access if admin-created or their own
    if (
      !itinerary.isAdminCreated &&
      itinerary.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(itinerary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE an itinerary by ID
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary)
      return res.status(404).json({ error: "Itinerary not found" });

    // Only allow update if admin or owner
    if (
      !req.user.isAdmin &&
      itinerary.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { name, description, imageUrl, sites } = req.body;
    itinerary.name = name || itinerary.name;
    itinerary.description = description || itinerary.description;
    itinerary.imageUrl = imageUrl || itinerary.imageUrl;
    itinerary.sites = sites || itinerary.sites;

    await itinerary.save();
    res.json(await itinerary.populate("sites"));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE an itinerary
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary)
      return res.status(404).json({ error: "Itinerary not found" });

    // Only allow delete if admin or owner
    if (
      !req.user.isAdmin &&
      itinerary.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await itinerary.deleteOne();
    res.json({ message: "Itinerary deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
