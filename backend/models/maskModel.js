// models/Mask.js
const mongoose = require("mongoose");

const maskSchema = new mongoose.Schema(
  {
    geometry: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
      },
      coordinates: {
        type: [[[Number]]], // array of arrays of [lng, lat]
        required: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mask", maskSchema);
