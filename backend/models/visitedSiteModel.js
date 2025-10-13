const mongoose = require("mongoose");

const visitedSiteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Itinerary",
      required: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin",
      required: true,
    },
    visitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate visits
visitedSiteSchema.index({ userId: 1, itineraryId: 1, siteId: 1 }, { unique: true });

module.exports = mongoose.model("VisitedSite", visitedSiteSchema);
