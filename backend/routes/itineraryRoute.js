const express = require("express");
const router = express.Router();
const Itinerary = require("../models/itineraryModel");
const Log = require("../models/logModel"); // import Log model
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // your Multer setup
const { deleteFromS3 } = require("../middleware/upload");

// Upload itinerary image (for both admin and user itineraries)
router.post(
  "/upload",
  verifyToken,
  upload.single("image"), // multer handles 'image' field
  (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      // The upload middleware automatically determines the correct folder based on baseUrl
      // For /api/userItineraries/upload -> uploads/userItineraries/
      // For /api/itineraries/upload -> uploads/itineraries/
      const folder = req.baseUrl.includes("userItineraries")
        ? "userItineraries"
        : "itineraries";
      const imageUrl = `/uploads/${folder}/${req.file.filename}`;

      console.log("Image uploaded successfully:", imageUrl);
      res.status(200).json({ imageUrl });
    } catch (err) {
      console.error("Upload failed:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

// Delete itinerary image from S3
router.delete("/delete-image", verifyToken, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Delete from S3 (or local storage as fallback)
    const deleted = await deleteFromS3(imageUrl);

    if (deleted) {
      console.log("Image deleted successfully:", imageUrl);
      res.status(200).json({ message: "Image deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete image from S3" });
    }
  } catch (err) {
    console.error("Error deleting image:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// Helper to get admin/user name
const getUserName = (user) =>
  user ? `${user.firstName} ${user.lastName || ""}`.trim() : "Unknown User";

// CREATE a new itinerary (user or admin)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description, imageUrl, duration, sites, isAdminCreated } =
      req.body;

    console.log("Creating itinerary with data:", {
      name,
      description,
      imageUrl,
      duration,
      sitesCount: sites?.length,
      isAdminCreated: isAdminCreated || false,
    });

    const itinerary = new Itinerary({
      name,
      description,
      imageUrl,
      duration,
      sites,
      createdBy: req.user._id,
      isAdminCreated: isAdminCreated || false,
    });

    await itinerary.save();

    console.log("Itinerary saved successfully:", {
      id: itinerary._id,
      name: itinerary.name,
      imageUrl: itinerary.imageUrl,
    });

    // Log action
    await Log.create({
      adminName: getUserName(req.user),
      action: `Created itinerary: "${itinerary.name}"`,
      role: isAdminCreated ? "admin" : "tourist",
      targetType: "itinerary",
      targetId: itinerary._id,
    });

    res.status(201).json(itinerary);
  } catch (err) {
    console.error("Error creating itinerary:", err);
    res.status(400).json({ error: err.message });
  }
});

// GET itineraries for a user (include admin ones, exclude archived)
router.get("/", verifyToken, async (req, res) => {
  try {
    const itineraries = await Itinerary.find({
      $or: [{ isAdminCreated: true }, { createdBy: req.user._id }],
      isArchived: false,
    }).populate({
      path: "sites",
      populate: { path: "category", select: "name" }
    });

    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET archived itineraries (admin only)
router.get("/archived", verifyAdmin, async (req, res) => {
  try {
    const itineraries = await Itinerary.find({
      isArchived: true,
    })
      .populate({
        path: "sites",
        populate: { path: "category", select: "name" }
      })
      .sort({ updatedAt: -1 });

    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public itineraries for guests (exclude archived)
router.get("/guest", async (req, res) => {
  try {
    const itineraries = await Itinerary.find({
      isAdminCreated: true,
      isArchived: false,
    }).populate({
      path: "sites",
      populate: { path: "category", select: "name" }
    });
    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public itinerary by ID (guest)
router.get("/guest/:id", async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id).populate({
      path: "sites",
      populate: { path: "category", select: "name" }
    });
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
    const itinerary = await Itinerary.findById(req.params.id).populate({
      path: "sites",
      populate: { path: "category", select: "name" }
    });
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
      req.user.role !== "admin" &&
      itinerary.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { name, description, imageUrl, sites, duration } = req.body;
    itinerary.name = name || itinerary.name;
    itinerary.description = description || itinerary.description;
    // Allow empty string to clear imageUrl
    if (imageUrl !== undefined) {
      itinerary.imageUrl = imageUrl;
    }
    // Allow duration to be set to 0 or any number; only fallback to existing when undefined
    if (duration !== undefined) {
      itinerary.duration = Number(duration) || 0;
    }
    itinerary.sites = sites || itinerary.sites;

    await itinerary.save();

    // Log action
    await Log.create({
      adminName: getUserName(req.user),
      action: `Updated itinerary: "${itinerary.name}"`,
      role: itinerary.isAdminCreated ? "admin" : "tourist",
      targetType: "itinerary",
      targetId: itinerary._id,
    });

    res.json(await itinerary.populate({
      path: "sites",
      populate: { path: "category", select: "name" }
    }));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ARCHIVE an itinerary (soft delete)
router.put("/:id/archive", verifyToken, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary)
      return res.status(404).json({ error: "Itinerary not found" });

    if (
      req.user.role !== "admin" &&
      itinerary.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    itinerary.isArchived = true;
    await itinerary.save();

    // Log action
    await Log.create({
      adminName: getUserName(req.user),
      action: `Archived itinerary: "${itinerary.name}"`,
      role: itinerary.isAdminCreated ? "admin" : "tourist",
      targetType: "itinerary",
      targetId: itinerary._id,
    });

    res.json({ message: "Itinerary archived successfully", itinerary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RESTORE an itinerary from archive
router.put("/:id/restore", verifyToken, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary)
      return res.status(404).json({ error: "Itinerary not found" });

    if (
      req.user.role !== "admin" &&
      itinerary.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    itinerary.isArchived = false;
    await itinerary.save();

    // Log action
    await Log.create({
      adminName: getUserName(req.user),
      action: `Restored itinerary: "${itinerary.name}"`,
      role: itinerary.isAdminCreated ? "admin" : "tourist",
      targetType: "itinerary",
      targetId: itinerary._id,
    });

    res.json({ message: "Itinerary restored successfully", itinerary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an itinerary permanently
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary)
      return res.status(404).json({ error: "Itinerary not found" });

    if (
      req.user.role !== "admin" &&
      itinerary.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await itinerary.deleteOne();

    // Log action
    await Log.create({
      adminName: getUserName(req.user),
      action: `Permanently deleted itinerary: "${itinerary.name}"`,
      role: itinerary.isAdminCreated ? "admin" : "tourist",
      targetType: "itinerary",
      targetId: itinerary._id,
    });

    res.json({ message: "Itinerary permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
