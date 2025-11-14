const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  adminName: { type: String, required: true },
  action: { type: String, required: true },
  role: { type: String, enum: ["admin", "tourist"], default: "admin" },
  targetType: { type: String, enum: ["review", "itinerary", "pin", "user", "photobooth", "other"], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: {
    userName: String,
    userEmail: String,
    siteName: String,
    itineraryName: String,
    rating: Number,
    reviewText: String,
    photos: [String],
    previousData: mongoose.Schema.Types.Mixed,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Log", logSchema);
