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

// GET all pins (excluding archived)
exports.getPins = async (req, res) => {
  try {
    const pins = await Pin.find({ isArchived: { $ne: true } }).populate("category", "name");
    res.json(pins);
  } catch (err) {
    console.error("❌ Error fetching pins:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// CREATE pin
exports.createPin = async (req, res) => {
  try {
    const pinData = { ...req.body };
    
    // Ensure feeType has a default if not provided
    if (!pinData.feeType) {
      pinData.feeType = 'none';
    }
    
    const pin = new Pin(pinData);
    await pin.save();

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    await Log.create({
      adminName,
      action: `Created pin: ${formatPinLabel(pin)}`,
      targetType: "pin",
      targetId: pin._id,
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
    console.log("📝 Updating pin:", req.params.id);
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
    
    // Prepare update data
    const updateData = { ...req.body };
    
    // Ensure feeType has a default if not provided
    if (!updateData.feeType) {
      updateData.feeType = 'none';
    }
    
    // If feeType is 'none', set feeAmount and feeAmountDiscounted to null
    if (updateData.feeType === 'none') {
      updateData.feeAmount = null;
      updateData.feeAmountDiscounted = null;
    }
    
    // Handle empty string values for fee amounts
    if (updateData.feeAmount === '') {
      updateData.feeAmount = null;
    }
    if (updateData.feeAmountDiscounted === '') {
      updateData.feeAmountDiscounted = null;
    }
    
    console.log("✅ Processed update data:", JSON.stringify(updateData, null, 2));
    
    // Create update object with $set and $unset operations
    const updateObject = {
      $set: updateData,
      $unset: { insideFortSantiago: 1 } // Remove old field if it exists
    };
    
    const pin = await Pin.findByIdAndUpdate(
      req.params.id, 
      updateObject,
      { new: true, runValidators: true }
    );

    if (!pin) {
      return res.status(404).json({ message: "Pin not found" });
    }

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    await Log.create({
      adminName,
      action: `Updated pin: ${formatPinLabel(pin)}`,
      targetType: "pin",
      targetId: pin._id,
    });

    console.log("✅ Pin updated successfully");
    res.json(pin);
  } catch (err) {
    console.error("❌ Error updating pin:", err);
    console.error("❌ Error stack:", err.stack);
    res.status(400).json({ error: err.message, details: err.toString() });
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
        targetType: "pin",
        targetId: deleted._id,
      });
    }

    res.json({ message: "Pin deleted" });
  } catch (err) {
    console.error("❌ Error deleting pin:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET archived pins
exports.getArchivedPins = async (req, res) => {
  try {
    const archivedPins = await Pin.find({ isArchived: true }).populate("category", "name");
    res.json(archivedPins);
  } catch (err) {
    console.error("❌ Error fetching archived pins:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ARCHIVE pin
exports.archivePin = async (req, res) => {
  try {
    const pin = await Pin.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    if (!pin) {
      return res.status(404).json({ message: "Pin not found" });
    }

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    await Log.create({
      adminName,
      action: `Archived pin: ${formatPinLabel(pin)}`,
      targetType: "pin",
      targetId: pin._id,
    });

    res.json(pin);
  } catch (err) {
    console.error("❌ Error archiving pin:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// RESTORE pin
exports.restorePin = async (req, res) => {
  try {
    const pin = await Pin.findByIdAndUpdate(
      req.params.id,
      { isArchived: false },
      { new: true }
    );

    if (!pin) {
      return res.status(404).json({ message: "Pin not found" });
    }

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    await Log.create({
      adminName,
      action: `Restored pin: ${formatPinLabel(pin)}`,
      targetType: "pin",
      targetId: pin._id,
    });

    res.json(pin);
  } catch (err) {
    console.error("❌ Error restoring pin:", err.message);
    res.status(500).json({ error: err.message });
  }
};
