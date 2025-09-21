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
const path = require("path");
const fs = require("fs");

const router = express.Router();

router.get("/", getPins);
router.post("/", createPin);
router.put("/:id", updatePin);
router.delete("/:id", deletePin);

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

module.exports = router;
