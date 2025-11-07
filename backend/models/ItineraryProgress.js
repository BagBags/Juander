const mongoose = require('mongoose');

const itineraryProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itineraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
    required: true
  },
  currentPinIndex: {
    type: Number,
    default: 0
  },
  visitedSites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site'
  }],
  skippedSites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site'
  }],
  lastPosition: {
    latitude: Number,
    longitude: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one progress per user per itinerary
itineraryProgressSchema.index({ userId: 1, itineraryId: 1 }, { unique: true });

module.exports = mongoose.model('ItineraryProgress', itineraryProgressSchema);
