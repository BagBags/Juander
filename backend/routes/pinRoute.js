// routes/pins.js
const express = require("express");
const {
  getPins,
  createPin,
  updatePin,
  deletePin,
  getArchivedPins,
  archivePin,
  restorePin,
} = require("../controllers/pinController.js");
const Pin = require("../models/pinModel");
const upload = require("../middleware/upload");
const { verifyAdmin } = require("../middleware/authMiddleware");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Archive routes - must come before /:id routes
router.get("/archived", getArchivedPins);
router.put("/:id/archive", verifyAdmin, archivePin);
router.put("/:id/restore", verifyAdmin, restorePin);

// Standard CRUD routes
router.get("/", getPins);
router.post("/", verifyAdmin, createPin);
router.put("/:id", verifyAdmin, updatePin);
router.delete("/:id", verifyAdmin, deletePin);

// GET /api/pins/inactive
router.get("/inactive", async (req, res) => {
  try {
    const inactivePins = await Pin.find({ status: "inactive" });
    res.json(inactivePins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Handle CORS preflight for upload-ar
router.options("/upload-ar", (req, res) => {
  res.status(200).end();
});

// 👇 New route for uploading AR models (.glb)
router.post("/upload-ar", upload.single("arModel"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  // multer-s3 provides req.file.location (S3 URL)
  const fileUrl = req.file.location || `/uploads/arModels/${req.file.filename}`;
  return res.json({ url: fileUrl });
});

// 👇 Temporary facade upload (doesn't save to DB, only uploads file)
router.post("/upload-facade-temp", upload.single("facade"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  // multer-s3 provides req.file.location (S3 URL)
  const fileUrl = req.file.location || `/uploads/facades/${req.file.filename}`;
  return res.json({ url: fileUrl });
});

router.post("/:id/upload-facade", upload.single("facade"), async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ msg: "Pin not found" });

    // multer-s3 provides req.file.location (S3 URL)
    pin.facadeUrl = req.file.location || `/uploads/facades/${req.file.filename}`;
    await pin.save();

    res.json({ success: true, facadeUrl: pin.facadeUrl });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
});

// 👇 Remove Facade
router.delete("/:id/remove-facade", async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ msg: "Pin not found" });

    if (pin.facadeUrl) {
      const filePath = path.join(
        __dirname,
        "..",
        pin.facadeUrl.replace(/^\//, "")
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      pin.facadeUrl = ""; // reset to empty string (schema default)
      await pin.save();
    }

    res.json({ success: true, message: "Facade removed successfully" });
  } catch (err) {
    console.error("❌ Remove facade error:", err);
    res.status(500).json({ msg: "Server error", err });
  }
});

// 👇 Remove 3D Model
router.delete("/:id/remove-glb", async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ msg: "Pin not found" });

    if (pin.glbUrl) {
      const filePath = path.join(
        __dirname,
        "..",
        pin.glbUrl.replace(/^\//, "")
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      pin.glbUrl = ""; // reset to empty string
      await pin.save();
    }

    res.json({ success: true, message: "3D model removed successfully" });
  } catch (err) {
    console.error("❌ Remove 3D model error:", err);
    res.status(500).json({ msg: "Server error", err });
  }
});

// Upload Media Files (Images/Videos)
router.post("/upload-media", (req, res) => {
  upload.array("mediaFiles", 10)(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "File too large. Maximum size is 50MB",
          error: "LIMIT_FILE_SIZE"
        });
      }
      return res.status(400).json({ 
        message: err.message || "File upload failed",
        error: err.message 
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    
    // multer-s3 provides file.location (S3 URL)
    const uploadedFiles = req.files.map((file) => ({
      url: file.location || `/uploads/media/${file.filename}`,
      type: file.mimetype.startsWith("video/") ? "video" : "image",
    }));
    
    return res.json({ files: uploadedFiles });
  });
});

// 👇 Remove Single Media File
router.delete("/:id/remove-media/:index", async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ msg: "Pin not found" });

    const index = parseInt(req.params.index);
    if (index < 0 || index >= pin.mediaFiles.length) {
      return res.status(400).json({ msg: "Invalid media index" });
    }

    const mediaFile = pin.mediaFiles[index];
    
    // Delete from S3 if it's an S3 URL, otherwise delete from local filesystem
    if (mediaFile.url.startsWith('http')) {
      // S3 URL - use deleteFromS3
      await deleteFromS3(mediaFile.url);
    } else {
      // Local path - use filesystem
      const filePath = path.join(
        __dirname,
        "..",
        mediaFile.url.replace(/^\//, "")
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    pin.mediaFiles.splice(index, 1);
    await pin.save();

    res.json({ success: true, message: "Media file removed successfully", mediaFiles: pin.mediaFiles });
  } catch (err) {
    console.error("❌ Remove media file error:", err);
    res.status(500).json({ msg: "Server error", err });
  }
});

module.exports = router;
