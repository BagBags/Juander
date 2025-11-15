const PhotoboothFilter = require("../models/photoboothFilterModel");
const Log = require("../models/logModel");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { deleteFromS3 } = require("../middleware/upload");

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
      // Use S3 URL if available, fallback to local path
      imagePath = req.file.location || `/uploads/photobooth/${req.file.filename}`;
      console.log("✅ Image path from file:", imagePath);
      console.log("📦 S3 URL:", req.file.location);
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
      // Use S3 URL if available, fallback to local path
      updateData.image = req.file.location || `/uploads/photobooth/${req.file.filename}`;
      console.log("✅ Updated image path:", updateData.image);
      console.log("📦 S3 URL:", req.file.location);
      
      // Delete old file from S3 if it exists and is different from new file
      if (existingFilter.image) {
        try {
          const oldImageUrl = existingFilter.image;
          const newImageUrl = updateData.image;
          
          // Only delete if it's a different file
          if (oldImageUrl !== newImageUrl) {
            await deleteFromS3(oldImageUrl);
            console.log(`✅ Deleted old file from S3: ${oldImageUrl}`);
          }
        } catch (fileErr) {
          console.error("❌ Error deleting old file from S3:", fileErr);
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

    // Delete the file from S3
    if (deleted.image) {
      try {
        await deleteFromS3(deleted.image);
        console.log(`✅ Deleted file from S3: ${deleted.image}`);
      } catch (fileErr) {
        console.error("❌ Error deleting file from S3:", fileErr);
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

// --- PROXY remote image (same-origin for canvas & PWA caching) ---
const proxyImage = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: "Missing url query param" });

    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    const contentType = response.headers["content-type"] || "image/png";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (response.headers.etag) res.setHeader("ETag", response.headers.etag);
    if (response.headers["last-modified"]) res.setHeader("Last-Modified", response.headers["last-modified"]);
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error("❌ Proxy image failed:", err?.message || err);
    res.status(502).json({ message: "Proxy fetch failed" });
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
  proxyImage,
};
