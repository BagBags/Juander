// models/Itinerary.js
const mongoose = require("mongoose");

const itinerarySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    sites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pin",
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Itinerary", itinerarySchema);
