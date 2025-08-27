// controllers/maskController.js
const Mask = require("../models/maskModel.js");

// Get all masks
exports.getMask = async (req, res) => {
  try {
    const masks = await Mask.find();
    res.json(masks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Save new mask
exports.saveMask = async (req, res) => {
  try {
    const mask = new Mask(req.body);
    await mask.save();
    res.status(201).json(mask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
