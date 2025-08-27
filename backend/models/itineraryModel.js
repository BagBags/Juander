// models/Itinerary.js
const mongoose = require("mongoose");

const itinerarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String, // optional, if you want a cover photo
  sites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin", // reference to your existing Pin model
    },
  ],
});

module.exports = mongoose.model("Itinerary", itinerarySchema);
