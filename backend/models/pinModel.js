const mongoose = require("mongoose");

const pinSchema = new mongoose.Schema(
  {
    siteName: { type: String, required: true },
    siteDescription: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    arEnabled: { type: Boolean, default: false },
    arLink: { type: String },
    glbUrl: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pin", pinSchema);
