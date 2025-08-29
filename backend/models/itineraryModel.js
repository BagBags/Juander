// models/Itinerary.js
const mongoose = require("mongoose");

const itinerarySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String }, // cover photo URL
    sites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pin", // reference to your existing Pin model
      },
    ],
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("Itinerary", itinerarySchema);
