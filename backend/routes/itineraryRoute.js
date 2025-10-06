const express = require("express");
const router = express.Router();
const Itinerary = require("../models/itineraryModel");
const Log = require("../models/logModel"); // import Log model
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // your Multer setup

// Upload itinerary image for user
router.post(
  "/upload",
  verifyToken,
  upload.single("image"), // multer handles 'image' field
  (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const imageUrl = `/uploads/userItineraries/${req.file.filename}`;
      res.status(200).json({ imageUrl });
    } catch (err) {
      console.error("Upload failed:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

// Helper to get admin/user name
const getUserName = (user) =>
  user ? `${user.firstName} ${user.lastName || ""}`.trim() : "Unknown User";

router.post(
  "/upload",
  verifyToken,
  upload.single("image"), // the "image" field matches FormData key from frontend
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Return the file path as URL
      const imageUrl = `/uploads/itineraries/${req.file.filename}`;
      res.status(200).json({ imageUrl });
    } catch (err) {
      console.error("Upload failed:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

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
      isAdminCreated: isAdminCreated || false,
    });

    await itinerary.save();

    // Log action
    await Log.create({
      adminName: getUserName(req.user),
      action: `Created itinerary: "${itinerary.name}"`,
    });

    res.status(201).json(itinerary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET itineraries for a user (include admin ones)
router.get("/", verifyToken, async (req, res) => {
  try {
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

    // Log action
    await Log.create({
      adminName: getUserName(req.user),
      action: `Updated itinerary: "${itinerary.name}"`,
    });

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

    if (
      !req.user.isAdmin &&
      itinerary.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await itinerary.deleteOne();

    // Log action
    await Log.create({
      adminName: getUserName(req.user),
      action: `Deleted itinerary: "${itinerary.name}"`,
    });

    res.json({ message: "Itinerary deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
