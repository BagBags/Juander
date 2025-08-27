// controllers/maskController.js
const Mask = require("../models/maskModel.js");

// Get the single mask
exports.getMask = async (req, res) => {
  try {
    const mask = await Mask.findOne(); // only get the first (and only) mask
    if (!mask) {
      return res.json(null); // no mask yet
    }
    res.json(mask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Save or update the mask (only 1 allowed)
exports.saveMask = async (req, res) => {
  try {
    const { geometry } = req.body;
    if (!geometry) {
      return res.status(400).json({ error: "No geometry provided" });
    }

    let mask = await Mask.findOne(); // check if mask already exists
    if (mask) {
      // update existing
      mask.geometry = geometry;
      await mask.save();
    } else {
      // create new
      mask = new Mask({ geometry });
      await mask.save();
    }

    res.status(200).json(mask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
