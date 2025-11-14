const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      default: "",
    },
    photos: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Removed unique compound index to allow multiple reviews per user per site
// Users can now submit multiple reviews for the same site in the same itinerary

module.exports = mongoose.model("Review", reviewSchema);
