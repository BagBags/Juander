const express = require('express');
const router = express.Router();
const ItineraryProgress = require('../models/ItineraryProgress');
const { verifyToken } = require('../middleware/authMiddleware');

// Get progress for a specific itinerary
router.get('/:itineraryId', verifyToken, async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const userId = req.user.id;

    const progress = await ItineraryProgress.findOne({
      userId,
      itineraryId
    });

    if (!progress) {
      return res.json({
        currentPinIndex: 0,
        visitedSites: [],
        lastPosition: null
      });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error fetching itinerary progress:', error);
    res.status(500).json({ message: 'Error fetching progress' });
  }
});

// Save/Update progress for an itinerary
router.post('/:itineraryId', verifyToken, async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const userId = req.user.id;
    const { currentPinIndex, visitedSites, lastPosition } = req.body;

    let progress = await ItineraryProgress.findOne({
      userId,
      itineraryId
    });

    if (progress) {
      // Update existing progress
      progress.currentPinIndex = currentPinIndex;
      progress.visitedSites = visitedSites;
      progress.lastPosition = lastPosition;
      progress.lastUpdated = new Date();
      await progress.save();
    } else {
      // Create new progress
      progress = new ItineraryProgress({
        userId,
        itineraryId,
        currentPinIndex,
        visitedSites,
        lastPosition
      });
      await progress.save();
    }

    res.json({ message: 'Progress saved successfully', progress });
  } catch (error) {
    console.error('Error saving itinerary progress:', error);
    res.status(500).json({ message: 'Error saving progress' });
  }
});

// Reset progress for an itinerary
router.delete('/:itineraryId', verifyToken, async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const userId = req.user.id;

    await ItineraryProgress.deleteOne({
      userId,
      itineraryId
    });

    res.json({ message: 'Progress reset successfully' });
  } catch (error) {
    console.error('Error resetting itinerary progress:', error);
    res.status(500).json({ message: 'Error resetting progress' });
  }
});

module.exports = router;
