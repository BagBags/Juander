const Pin = require("../models/pinModel");
const Log = require("../models/logModel");

// Helper to format pin for logs
const formatPinLabel = (pin) => {
  return pin.siteName
    ? `"${pin.siteName}" [${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(
        4
      )}]`
    : `[${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}]`;
};

// GET all pins
exports.getPins = async (req, res) => {
  try {
    const pins = await Pin.find();
    res.json(pins);
  } catch (err) {
    console.error("❌ Error fetching pins:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// CREATE pin
exports.createPin = async (req, res) => {
  try {
    const pin = new Pin(req.body);
    await pin.save();

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    await Log.create({
      adminName,
      action: `Created pin: ${formatPinLabel(pin)}`,
    });

    res.status(201).json(pin);
  } catch (err) {
    console.error("❌ Error creating pin:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// UPDATE pin
exports.updatePin = async (req, res) => {
  try {
    const pin = await Pin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    await Log.create({
      adminName,
      action: `Updated pin: ${formatPinLabel(pin)}`,
    });

    res.json(pin);
  } catch (err) {
    console.error("❌ Error updating pin:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// DELETE pin
exports.deletePin = async (req, res) => {
  try {
    const deleted = await Pin.findByIdAndDelete(req.params.id);

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    if (deleted) {
      await Log.create({
        adminName,
        action: `Deleted pin: ${formatPinLabel(deleted)}`,
      });
    }

    res.json({ message: "Pin deleted" });
  } catch (err) {
    console.error("❌ Error deleting pin:", err.message);
    res.status(500).json({ error: err.message });
  }
};
