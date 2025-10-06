const PhotoboothFilter = require("../models/photoboothFilterModel");
const Log = require("../models/logModel");

// --- Helper for logging actions ---
const logAction = async (req, action) => {
  try {
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    await Log.create({ adminName, action });
  } catch (err) {
    console.error("❌ Failed to log action:", err);
  }
};

// --- GET all filters ---
const getFilters = async (req, res) => {
  try {
    const filters = await PhotoboothFilter.find().sort({ position: 1 });
    res.json(filters);
  } catch (err) {
    console.error("❌ Error fetching filters:", err);
    res.status(500).json({ message: "Error fetching filters", error: err });
  }
};

// --- GET filter image by ID ---
const getFilterImage = async (req, res) => {
  try {
    const filter = await PhotoboothFilter.findById(req.params.id);
    if (!filter) return res.status(404).json({ message: "Filter not found" });
    res.json({ image: filter.image });
  } catch (err) {
    console.error("❌ Error fetching filter image:", err);
    res
      .status(500)
      .json({ message: "Error fetching filter image", error: err });
  }
};

// --- CREATE filter ---
const createFilter = async (req, res) => {
  try {
    let imagePath = "";

    if (req.file) {
      imagePath = `${req.protocol}://${req.get("host")}/uploads/photobooth/${
        req.file.originalname
      }`;
    } else if (req.body.image) {
      imagePath = req.body.image;
    }

    const newFilter = new PhotoboothFilter({
      name: req.body.name,
      category: req.body.category,
      image: imagePath,
    });

    await newFilter.save();

    await logAction(req, `Created photobooth filter: "${newFilter.name}"`);

    res.status(201).json(newFilter);
  } catch (err) {
    console.error("❌ Error creating filter:", err);
    res.status(500).json({ message: "Failed to create filter", error: err });
  }
};

// --- UPDATE filter ---
const updateFilter = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `${req.protocol}://${req.get(
        "host"
      )}/uploads/photobooth/${req.file.originalname}`;
    }

    const updated = await PhotoboothFilter.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Filter not found" });

    await logAction(req, `Updated photobooth filter: "${updated.name}"`);

    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating filter:", err);
    res.status(400).json({ message: "Error updating filter", error: err });
  }
};

// --- DELETE filter ---
const deleteFilter = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PhotoboothFilter.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Filter not found" });

    await logAction(req, `Deleted photobooth filter: "${deleted.name}"`);

    res.json({ message: "Filter deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting filter:", err);
    res.status(500).json({ message: "Error deleting filter", error: err });
  }
};

// --- REORDER filters ---
const reorderFilters = async (req, res) => {
  try {
    const { filters } = req.body; // [{ _id, position }]
    const bulkOps = filters.map((f) => ({
      updateOne: { filter: { _id: f._id }, update: { position: f.position } },
    }));

    await PhotoboothFilter.bulkWrite(bulkOps);

    await logAction(req, "Reordered photobooth filters");

    res.json({ message: "Filters reordered successfully" });
  } catch (err) {
    console.error("❌ Error reordering filters:", err);
    res.status(400).json({ message: "Error reordering filters", error: err });
  }
};

module.exports = {
  getFilters,
  getFilterImage,
  createFilter,
  updateFilter,
  deleteFilter,
  reorderFilters,
};
