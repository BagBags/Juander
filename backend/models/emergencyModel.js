const mongoose = require("mongoose");

const contactChannelSchema = new mongoose.Schema({
  label: { type: String, required: true },
  number: { type: String, required: true },
});

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contactChannels: [contactChannelSchema],
    position: { type: Number, default: 0 },
    icon: { type: String, default: null },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmergencyContact", emergencyContactSchema);
