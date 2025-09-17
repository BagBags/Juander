// routes/pins.js
const express = require("express");
const {
  getPins,
  createPin,
  updatePin,
  deletePin,
} = require("../controllers/pinController.js");
const upload = require("../middleware/upload");

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

module.exports = router;
