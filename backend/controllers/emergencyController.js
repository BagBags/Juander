const EmergencyContact = require("../models/emergencyModel");

// CREATE
exports.createContact = async (req, res) => {
  console.log("✅ POST hit:", req.body);
  try {
    const contact = await EmergencyContact.create(req.body);
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ ALL
exports.getContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find();
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
