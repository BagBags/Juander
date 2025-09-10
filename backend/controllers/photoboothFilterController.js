const PhotoboothFilter = require("../models/photoboothFilterModel");

// GET all filters
const getFilters = async (req, res) => {
  try {
    const filters = await PhotoboothFilter.find().sort({ position: 1 });
    res.json(filters);
  } catch (error) {
    res.status(500).json({ message: "Error fetching filters", error });
  }
};

// CREATE filter
const createFilter = async (req, res) => {
  try {
    let imagePath = "";

    if (req.file) {
      // always return full URL
      imagePath = `${req.protocol}://${req.get("host")}/uploads/photobooth/${req.file.originalname}`;
    } else if (req.body.image) {
      imagePath = req.body.image;
    }

    const newFilter = new PhotoboothFilter({
      name: req.body.name,
      category: req.body.category,
      image: imagePath,
    });

    await newFilter.save();
    res.status(201).json(newFilter);
  } catch (err) {
    console.error("❌ Error creating filter:", err);
    res.status(500).json({ error: "Failed to create filter" });
  }
};

// UPDATE filter
const updateFilter = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `${req.protocol}://${req.get("host")}/uploads/photobooth/${req.file.originalname}`;
    }

    const updated = await PhotoboothFilter.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Filter not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Error updating filter", error });
  }
};

// DELETE filter
const deleteFilter = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PhotoboothFilter.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Filter not found" });
    res.json({ message: "Filter deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting filter", error });
  }
};

// REORDER filters
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
