const PhotoboothFilter = require("../models/photoboothFilterModel");
const Log = require("../models/logModel");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// --- Helper for logging actions ---
const logAction = async (req, action, targetId = null) => {
  try {
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    await Log.create({ 
      adminName, 
      action,
      role: "admin",
      targetType: "photobooth",
      targetId: targetId,
    });
  } catch (err) {
    console.error("❌ Failed to log action:", err);
  }
};

// --- GET all filters (active only) ---
const getFilters = async (req, res) => {
  try {
    const filters = await PhotoboothFilter.find({ isArchived: false }).sort({ position: 1 });
    res.json(filters);
  } catch (err) {
    console.error("❌ Error fetching filters:", err);
    res.status(500).json({ message: "Error fetching filters", error: err });
  }
};

// --- GET archived filters ---
const getArchivedFilters = async (req, res) => {
  try {
    const filters = await PhotoboothFilter.find({ isArchived: true }).sort({ updatedAt: -1 });
    res.json(filters);
  } catch (err) {
    console.error("❌ Error fetching archived filters:", err);
    res.status(500).json({ message: "Error fetching archived filters", error: err });
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
    console.log("📝 Creating filter...");
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("File:", req.file ? JSON.stringify(req.file, null, 2) : "No file");
    console.log("Headers:", req.headers);
    
    let imagePath = "";

    if (req.file) {
      imagePath = `${req.protocol}://${req.get("host")}/uploads/photobooth/${
        req.file.originalname
      }`;
      console.log("✅ Image path from file:", imagePath);
    } else if (req.body.image) {
      imagePath = req.body.image;
      console.log("✅ Image path from body:", imagePath);
    } else {
      console.log("❌ No image provided - req.file:", !!req.file, "req.body.image:", !!req.body.image);
      return res.status(400).json({ 
        message: "No image provided",
        debug: {
          hasFile: !!req.file,
          hasBodyImage: !!req.body.image,
          body: req.body
        }
      });
    }

    const newFilter = new PhotoboothFilter({
      name: req.body.name,
      category: req.body.category,
      image: imagePath,
    });

    await newFilter.save();
    console.log("✅ Filter saved to database:", newFilter._id);

    await logAction(req, `Created photobooth filter: "${newFilter.name}"`, newFilter._id);

    res.status(201).json(newFilter);
  } catch (err) {
    console.error("❌ Error creating filter:", err);
    console.error("Error details:", err.message);
    res.status(500).json({ message: "Failed to create filter", error: err.message });
  }
};

// --- UPDATE filter ---
const updateFilter = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the existing filter to check if we need to delete old image
    const existingFilter = await PhotoboothFilter.findById(id);
    if (!existingFilter) return res.status(404).json({ message: "Filter not found" });

    const updateData = { ...req.body };
    
    // If new file is uploaded, delete the old one
    if (req.file) {
      updateData.image = `${req.protocol}://${req.get(
        "host"
      )}/uploads/photobooth/${req.file.originalname}`;
      
      // Delete old file if it exists and is different from new file
      if (existingFilter.image && existingFilter.image.includes('/uploads/photobooth/')) {
        try {
          const oldFilename = existingFilter.image.split('/uploads/photobooth/').pop();
          const newFilename = req.file.originalname;
          
          // Only delete if it's a different file
          if (oldFilename !== newFilename) {
            const oldFilePath = path.join(__dirname, '../uploads/photobooth', oldFilename);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
              console.log(`✅ Deleted old file: ${oldFilename}`);
            }
          }
        } catch (fileErr) {
          console.error("❌ Error deleting old file:", fileErr);
          // Continue even if file deletion fails
        }
      }
    }

    const updated = await PhotoboothFilter.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    await logAction(req, `Updated photobooth filter: "${updated.name}"`, updated._id);

    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating filter:", err);
    res.status(400).json({ message: "Error updating filter", error: err });
  }
};

// --- ARCHIVE filter (soft delete) ---
const archiveFilter = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = await PhotoboothFilter.findByIdAndUpdate(
      id,
      { isArchived: true },
      { new: true }
    );
    
    if (!filter) return res.status(404).json({ message: "Filter not found" });

    await logAction(req, `Archived photobooth filter: "${filter.name}"`, filter._id);

    res.json({ message: "Filter archived successfully", filter });
  } catch (err) {
    console.error("❌ Error archiving filter:", err);
    res.status(500).json({ message: "Error archiving filter", error: err });
  }
};

// --- RESTORE filter from archive ---
const restoreFilter = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = await PhotoboothFilter.findByIdAndUpdate(
      id,
      { isArchived: false },
      { new: true }
    );
    
    if (!filter) return res.status(404).json({ message: "Filter not found" });

    await logAction(req, `Restored photobooth filter: "${filter.name}"`, filter._id);

    res.json({ message: "Filter restored successfully", filter });
  } catch (err) {
    console.error("❌ Error restoring filter:", err);
    res.status(500).json({ message: "Error restoring filter", error: err });
  }
};

// --- DELETE filter permanently ---
const deleteFilter = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PhotoboothFilter.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Filter not found" });

    // Delete the physical file if it exists in uploads/photobooth
    if (deleted.image) {
      try {
        // Extract filename from URL or path
        const imageUrl = deleted.image;
        
        // Check if it's a local file (not an external URL)
        if (imageUrl.includes('/uploads/photobooth/')) {
          const filename = imageUrl.split('/uploads/photobooth/').pop();
          const filePath = path.join(__dirname, '../uploads/photobooth', filename);
          
          // Check if file exists before deleting
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Deleted file: ${filename}`);
          } else {
            console.log(`⚠️ File not found: ${filename}`);
          }
        } else {
          console.log(`ℹ️ External URL, skipping file deletion: ${imageUrl}`);
        }
      } catch (fileErr) {
        console.error("❌ Error deleting file:", fileErr);
        // Continue even if file deletion fails
      }
    }

    await logAction(req, `Permanently deleted photobooth filter: "${deleted.name}"`, deleted._id);

    res.json({ message: "Filter permanently deleted successfully" });
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
  getArchivedFilters,
  getFilterImage,
  createFilter,
  updateFilter,
  archiveFilter,
  restoreFilter,
  deleteFilter,
  reorderFilters,
};
