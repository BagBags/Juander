// models/Itinerary.js
const mongoose = require("mongoose");

const itinerarySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    duration: { type: Number, default: 0 }, // duration in hours
    recommendedStartMinutes: { type: Number },
    sites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pin",
      },
    ],
    breaks: [
      {
        position: { type: Number, required: true },
        minutes: { type: Number, required: true },
        label: { type: String, default: "Break" },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // every itinerary must have a creator
    },
    isAdminCreated: {
      type: Boolean,
      default: false, // admin itineraries = true
    },
    isArchived: {
      type: Boolean,
      default: false, // false = active, true = archived
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Itinerary", itinerarySchema);
