const Pin = require("../models/pinModel.js");

exports.getPins = async (req, res) => {
  try {
    const pins = await Pin.find();
    res.json(pins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPin = async (req, res) => {
  try {
    const pin = new Pin(req.body);
    await pin.save();
    res.status(201).json(pin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePin = async (req, res) => {
  try {
    const pin = await Pin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(pin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePin = async (req, res) => {
  try {
    await Pin.findByIdAndDelete(req.params.id);
    res.json({ message: "Pin deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
