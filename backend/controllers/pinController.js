const Pin = require("../models/pinModel");
const Log = require("../models/logModel");
const { toCdnUrl } = require("../utils/cdnUtil");

// Helper to format pin for logs
const formatPinLabel = (pin) => {
  return pin.siteName
    ? `"${pin.siteName}" [${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(
        4
      )}]`
    : `[${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}]`;
};

// GET all pins (excluding archived)
// Helper to convert URL fields on a pin object (mutates object)
const applyCdnUrls = (pin) => {
  const convertIfString = (val) =>
    typeof val === "string" ? toCdnUrl(val) : val;

  pin.mediaUrl = convertIfString(pin.mediaUrl);
  pin.arLink = convertIfString(pin.arLink);
  pin.glbUrl = convertIfString(pin.glbUrl);
  pin.facadeUrl = convertIfString(pin.facadeUrl);

  if (Array.isArray(pin.mediaFiles)) {
    pin.mediaFiles = pin.mediaFiles.map((f) => ({
      ...f,
      url: convertIfString(f.url),
    }));
  }
  return pin;
};

exports.getPins = async (req, res) => {
  try {
    const pins = await Pin.find({ isArchived: { $ne: true } })
      .populate("category", "name")
      .lean();

    pins.forEach(applyCdnUrls);

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
    if (pinData.averageTimeSpent === "") {
      pinData.averageTimeSpent = null;
    }
    if (
      pinData.averageTimeSpent !== undefined &&
      pinData.averageTimeSpent !== null
    ) {
      const n = Number(pinData.averageTimeSpent);
      pinData.averageTimeSpent = Number.isFinite(n) ? n : null;
    }
    if (pinData.openingTime === "") {
      pinData.openingTime = null;
    }
    if (pinData.closingTime === "") {
      pinData.closingTime = null;
    }

    // Ensure feeType has a default if not provided
    if (!pinData.feeType) {
      pinData.feeType = "none";
    }

    const pin = new Pin(pinData);
    await pin.save();

    // Populate category before returning
    await pin.populate("category", "name");

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    await Log.create({
      adminName,
      action: `Added ${pin.siteName || "Pin"}`,
      role: "admin",
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
    if (updateData.averageTimeSpent === "") {
      updateData.averageTimeSpent = null;
    }
    if (
      updateData.averageTimeSpent !== undefined &&
      updateData.averageTimeSpent !== null
    ) {
      const n = Number(updateData.averageTimeSpent);
      updateData.averageTimeSpent = Number.isFinite(n) ? n : null;
    }
    if (updateData.openingTime === "") {
      updateData.openingTime = null;
    }
    if (updateData.closingTime === "") {
      updateData.closingTime = null;
    }

    // Ensure feeType has a default if not provided
    if (!updateData.feeType) {
      updateData.feeType = "none";
    }

    // If feeType is 'none', set feeAmount and feeAmountDiscounted to null
    if (updateData.feeType === "none") {
      updateData.feeAmount = null;
      updateData.feeAmountDiscounted = null;
    }

    // Handle empty string values for fee amounts
    if (updateData.feeAmount === "") {
      updateData.feeAmount = null;
    }
    if (updateData.feeAmountDiscounted === "") {
      updateData.feeAmountDiscounted = null;
    }

    console.log(
      "✅ Processed update data:",
      JSON.stringify(updateData, null, 2)
    );
    // Fetch existing pin for change diff
    const existingPin = await Pin.findById(req.params.id).lean();
    if (!existingPin) {
      return res.status(404).json({ message: "Pin not found" });
    }

    // Compute changes (top-level fields only)
    const changes = {};
    for (const key of Object.keys(updateData)) {
      const prev = existingPin[key];
      const next = updateData[key];
      const prevStr = prev === undefined ? null : prev;
      const nextStr = next === undefined ? null : next;
      const isEqual = JSON.stringify(prevStr) === JSON.stringify(nextStr);
      if (!isEqual) {
        changes[key] = { from: prevStr, to: nextStr };
      }
    }

    // Create update object with $set and $unset operations
    const updateObject = {
      $set: updateData,
      $unset: { insideFortSantiago: 1 },
    };

    const pin = await Pin.findByIdAndUpdate(req.params.id, updateObject, {
      new: true,
      runValidators: true,
    }).populate("category", "name");

    if (!pin) {
      return res.status(404).json({ message: "Pin not found" });
    }

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    const changedKeys = Object.keys(changes);
    const changesSummary = changedKeys
      .map(
        (k) =>
          `${k}: ${JSON.stringify(changes[k].from)} → ${JSON.stringify(
            changes[k].to
          )}`
      )
      .join(", ");

    await Log.create({
      adminName,
      action: `Updated ${pin.siteName || "Pin"} Details`,
      role: "admin",
      targetType: "pin",
      targetId: pin._id,
      details: {
        changes,
        previousData: changedKeys.reduce((acc, k) => {
          acc[k] = changes[k].from;
          return acc;
        }, {}),
      },
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
        action: `Deleted ${deleted.siteName || "Pin"}`,
        role: "admin",
        targetType: "pin",
        targetId: deleted._id,
        details: {
          previousData: {
            siteName: deleted.siteName,
            latitude: deleted.latitude,
            longitude: deleted.longitude,
            category: deleted.category,
            status: deleted.status,
            feeType: deleted.feeType,
          },
        },
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
    const archivedPins = await Pin.find({ isArchived: true })
      .populate("category", "name")
      .lean();

    archivedPins.forEach(applyCdnUrls);
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
    ).populate("category", "name");

    if (!pin) {
      return res.status(404).json({ message: "Pin not found" });
    }

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    await Log.create({
      adminName,
      action: `Archived ${pin.siteName || "Pin"}`,
      role: "admin",
      targetType: "pin",
      targetId: pin._id,
      details: {
        changes: { isArchived: { from: false, to: true } },
        previousData: { isArchived: false },
      },
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
    ).populate("category", "name");

    if (!pin) {
      return res.status(404).json({ message: "Pin not found" });
    }

    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";

    await Log.create({
      adminName,
      action: `Restored ${pin.siteName || "Pin"}`,
      role: "admin",
      targetType: "pin",
      targetId: pin._id,
      details: {
        changes: { isArchived: { from: true, to: false } },
        previousData: { isArchived: true },
      },
    });

    res.json(pin);
  } catch (err) {
    console.error("❌ Error restoring pin:", err.message);
    res.status(500).json({ error: err.message });
  }
};
