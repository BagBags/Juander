// routes/pins.js
const express = require("express");
const {
  getPins,
  createPin,
  updatePin,
  deletePin,
} = require("../controllers/pinController.js");
const Pin = require("../models/pinModel");
const upload = require("../middleware/upload");
const { verifyAdmin } = require("../middleware/authMiddleware");
const path = require("path");
const fs = require("fs");

const router = express.Router();

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

// 👇 New route for uploading AR models (.glb)
router.post("/upload-ar", upload.single("arModel"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const filePath = `/uploads/arModels/${req.file.filename}`;
  return res.json({ url: filePath });
});

router.post("/:id/upload-facade", upload.single("facade"), async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) return res.status(404).json({ msg: "Pin not found" });

    // ✅ Save with the facades folder
    pin.facadeUrl = `/uploads/facades/${req.file.filename}`;
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

module.exports = router;
