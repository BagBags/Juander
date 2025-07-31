const EmergencyContact = require("../models/emergencyModel");

// CREATE
exports.createContact = async (req, res) => {
  try {
    // Count current documents to assign position if not provided
    const count = await EmergencyContact.countDocuments();

    const contact = await EmergencyContact.create({
      name: req.body.name,
      contactChannels: req.body.contactChannels,
      position: req.body.position ?? count, // ✅ Assign position explicitly
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error("❌ Error creating contact:", error.message);
    res.status(500).json({ error: error.message });
  }
};
// READ ALL
exports.getContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find().sort({ position: 1 }); // ✅ sort by position
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
exports.deleteContact = async (req, res) => {
  try {
    await EmergencyContact.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//REORDER
exports.reorderContacts = async (req, res) => {
  try {
    console.log("🛠️ Request body:", req.body);
    const { agencies } = req.body;

    if (!Array.isArray(agencies)) {
      return res.status(400).json({ error: "agencies must be an array" });
    }

    for (const agency of agencies) {
      await EmergencyContact.findByIdAndUpdate(agency._id, {
        position: agency.position,
      });
    }

    res.status(200).json({ message: "Reordered successfully" });
  } catch (err) {
    console.error("❌ Error in reorderContacts:", err);
    res.status(500).json({ message: "Server error while reordering" });
  }
};
