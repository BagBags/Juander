const EmergencyContact = require("../models/emergencyModel");
const Log = require("../models/logModel"); // import Log model
const { deleteFromS3 } = require("../middleware/upload");
const { toCdnUrl } = require("../utils/cdnUtil");

// CREATE
exports.createContact = async (req, res) => {
  try {
    const count = await EmergencyContact.countDocuments();

    const contact = await EmergencyContact.create({
      name: req.body.name,
      contactChannels: JSON.parse(req.body.contactChannels), // ✅ parse string
      position: req.body.position ?? count,
      icon: req.file ? (require("../utils/cdnUtil").toCdnUrl(req.file.location || `/uploads/emergency/${req.file.filename}`)) : null,
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error("❌ Error creating contact:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
exports.updateContact = async (req, res) => {
  try {
    const updatedData = {
      name: req.body.name,
      contactChannels: JSON.parse(req.body.contactChannels), // ✅ parse string
    };
    if (req.file) updatedData.icon = require("../utils/cdnUtil").toCdnUrl(req.file.location || `/uploads/emergency/${req.file.filename}`);

    const updated = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error updating contact:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getContacts = async (req, res) => {
  try {
    // Fetch only non-archived contacts in sorted order
    // Use $ne: true to also include documents without isArchived field (existing records)
    const contacts = await EmergencyContact.find({ isArchived: { $ne: true } })
      .sort({ position: 1 })
      .lean();

    // Ensure icon uses CloudFront URL before sending
    contacts.forEach((c) => {
      if (typeof c.icon === "string") c.icon = toCdnUrl(c.icon);
    });

    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ARCHIVED
exports.getArchivedContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ isArchived: true })
      .sort({ updatedAt: -1 })
      .lean();

    contacts.forEach((c) => {
      if (typeof c.icon === "string") c.icon = toCdnUrl(c.icon);
    });

    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching archived contacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ARCHIVE
exports.archiveContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Log action
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    await Log.create({
      adminName,
      action: `Archived emergency contact: "${contact.name}"`,
      role: "admin",
      targetType: "other",
      targetId: contact._id,
    });

    res.status(200).json(contact);
  } catch (error) {
    console.error("Error archiving contact:", error);
    res.status(500).json({ error: error.message });
  }
};

// RESTORE
exports.restoreContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      { isArchived: false },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Log action
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    await Log.create({
      adminName,
      action: `Restored emergency contact: "${contact.name}"`,
      role: "admin",
      targetType: "other",
      targetId: contact._id,
    });

    res.status(200).json(contact);
  } catch (error) {
    console.error("Error restoring contact:", error);
    res.status(500).json({ error: error.message });
  }
};

// PERMANENT DELETE (only for archived items)
exports.deleteContact = async (req, res) => {
  try {
    const deleted = await EmergencyContact.findByIdAndDelete(req.params.id);
    
    // Delete icon from S3 if it exists
    if (deleted && deleted.icon) {
      try {
        await deleteFromS3(deleted.icon);
        console.log(`✅ Deleted icon from S3: ${deleted.icon}`);
      } catch (fileErr) {
        console.error("❌ Error deleting icon from S3:", fileErr);
      }
    }

    // Log action
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    if (deleted) {
      await Log.create({
        adminName,
        action: `Permanently deleted emergency contact: "${deleted.name}"`,
        role: "admin",
        targetType: "other",
        targetId: deleted._id,
      });
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// REORDER
exports.reorderContacts = async (req, res) => {
  try {
    const { agencies } = req.body;

    if (!Array.isArray(agencies)) {
      return res.status(400).json({ error: "agencies must be an array" });
    }

    for (const agency of agencies) {
      await EmergencyContact.findByIdAndUpdate(agency._id, {
        position: agency.position,
      });
    }

    // Fetch the updated sorted list
    const updatedContacts = await EmergencyContact.find().sort({ position: 1 });

    // Log action
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    await Log.create({
      adminName,
      action: `Reordered emergency contact agencies`,
      role: "admin",
      targetType: "other",
    });

    res.status(200).json(updatedContacts);
  } catch (err) {
    console.error("❌ Error in reorderContacts:", err);
    res.status(500).json({ message: "Server error while reordering" });
  }
};
