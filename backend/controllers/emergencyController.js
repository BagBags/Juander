const EmergencyContact = require("../models/emergencyModel");
const Log = require("../models/logModel"); // import Log model

// CREATE
exports.createContact = async (req, res) => {
  try {
    const count = await EmergencyContact.countDocuments();

    const contact = await EmergencyContact.create({
      name: req.body.name,
      contactChannels: JSON.parse(req.body.contactChannels), // ✅ parse string
      position: req.body.position ?? count,
      icon: req.file ? `/uploads/emergency/${req.file.filename}` : null,
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
    if (req.file) updatedData.icon = `/uploads/emergency/${req.file.filename}`;

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
    // Fetch contacts in sorted order
    const contacts = await EmergencyContact.find().sort({ position: 1 });

    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Server error" });
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

    // Fetch the updated sorted list
    const updatedContacts = await EmergencyContact.find().sort({ position: 1 });

    // Log action
    const adminName = req.user
      ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
      : "Unknown Admin";
    await Log.create({
      adminName,
      action: `Reordered emergency contact agencies`,
    });

    res.status(200).json(updatedContacts);
  } catch (err) {
    console.error("❌ Error in reorderContacts:", err);
    res.status(500).json({ message: "Server error while reordering" });
  }
};
