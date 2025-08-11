const EmergencyContact = require("../models/emergencyModel");
const Log = require("../models/logModel"); // import Log model

// CREATE
exports.createContact = async (req, res) => {
  try {
    const count = await EmergencyContact.countDocuments();

    const contact = await EmergencyContact.create({
      name: req.body.name,
      contactChannels: req.body.contactChannels,
      position: req.body.position ?? count,
    });

    // Log action
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    await Log.create({
      adminName,
      action: `Created emergency contact agency: "${contact.name}"`,
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error("❌ Error creating contact:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getContacts = async (req, res) => {
  try {
    // Fetch contacts
    const contacts = await EmergencyContact.find();

    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE
exports.updateContact = async (req, res) => {
  try {
    const updated = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Log action
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    await Log.create({
      adminName,
      action: `Updated emergency contact agency: "${updated.name}"`,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
exports.deleteContact = async (req, res) => {
  try {
    const deleted = await EmergencyContact.findByIdAndDelete(req.params.id);

    // Log action
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    if (deleted) {
      await Log.create({
        adminName,
        action: `Deleted emergency contact agency: "${deleted.name}"`,
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

    // Log action
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    await Log.create({
      adminName,
      action: `Reordered emergency contact agencies`,
    });

    res.status(200).json({ message: "Reordered successfully" });
  } catch (err) {
    console.error("❌ Error in reorderContacts:", err);
    res.status(500).json({ message: "Server error while reordering" });
  }
};
