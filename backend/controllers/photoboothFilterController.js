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
  } catch (error) {
    res.status(500).json({ message: "Error fetching filters", error });
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

    // Log action
    await logAction(req, `Created photobooth filter: "${newFilter.name}"`);

    res.status(201).json(newFilter);
  } catch (err) {
    console.error("❌ Error creating filter:", err);
    res.status(500).json({ error: "Failed to create filter" });
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

    // Log action
    await logAction(req, `Updated photobooth filter: "${updated.name}"`);

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Error updating filter", error });
  }
};

// --- DELETE filter ---
const deleteFilter = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PhotoboothFilter.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Filter not found" });

    // Log action
    await logAction(req, `Deleted photobooth filter: "${deleted.name}"`);

    res.json({ message: "Filter deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting filter", error });
  }
};

// --- REORDER filters ---
const reorderFilters = async (req, res) => {
  try {
    const { filters } = req.body; // [{ _id, position }]
    const bulkOps = filters.map((filter) => ({
      updateOne: {
        filter: { _id: filter._id },
        update: { position: filter.position },
      },
    }));
    await PhotoboothFilter.bulkWrite(bulkOps);

    // Log action
    await logAction(req, "Reordered photobooth filters");

    res.json({ message: "Filters reordered successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error reordering filters", error });
  }
};

module.exports = {
  getFilters,
  createFilter,
  updateFilter,
  deleteFilter,
  reorderFilters,
};
