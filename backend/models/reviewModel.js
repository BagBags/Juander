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

// Compound index to ensure one review per user per site per itinerary
reviewSchema.index({ userId: 1, itineraryId: 1, siteId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
