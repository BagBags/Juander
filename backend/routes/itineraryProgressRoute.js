const express = require('express');
const router = express.Router();
const ItineraryProgress = require('../models/ItineraryProgress');
const { verifyToken } = require('../middleware/authMiddleware');

// ========== ROUTE FILE LOADED - VERSION 2.0 ==========
console.log('🔄 itineraryProgressRoute.js LOADED - NEW VERSION with optimizedOrder support');

// Get progress for a specific itinerary
router.get('/:itineraryId', verifyToken, async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const userId = req.user.id;

    let progress = await ItineraryProgress.findOne({
      userId,
      itineraryId
    });

    if (!progress) {
      return res.json({
        currentPinIndex: 0,
        visitedSites: [],
        skippedSites: [],
        optimizedOrder: [],
        lastPosition: null
      });
    }

    // CRITICAL: If optimizedOrder field doesn't exist, add it to the document NOW
    if (!progress.optimizedOrder || !Array.isArray(progress.optimizedOrder)) {
      console.log('Field optimizedOrder missing - adding it to document');
      progress.optimizedOrder = [];
      progress.markModified('optimizedOrder');
      await progress.save();
      console.log('Document updated with optimizedOrder field');
    }

    // Convert to object for response
    const progressData = progress.toObject();
    
    console.log('Returning progress data:', {
      currentPinIndex: progressData.currentPinIndex,
      visitedSitesCount: progressData.visitedSites?.length,
      optimizedOrderCount: progressData.optimizedOrder?.length,
      hasOptimizedOrder: !!progressData.optimizedOrder
    });

    res.json(progressData);
  } catch (error) {
    console.error('Error fetching itinerary progress:', error);
    res.status(500).json({ message: 'Error fetching progress' });
  }
});

// Save/Update progress for an itinerary
router.post('/:itineraryId', verifyToken, async (req, res) => {
  console.log('🎯 POST /itinerary-progress/:itineraryId route HIT!');
  
  try {
    const { itineraryId } = req.params;
    const userId = req.user.id;
    const { currentPinIndex, visitedSites, skippedSites, lastPosition, optimizedOrder } = req.body;

    console.log('Saving progress for itinerary:', itineraryId);
    console.log('Request body:', { currentPinIndex, visitedSitesCount: visitedSites?.length, skippedSitesCount: skippedSites?.length, optimizedOrderCount: optimizedOrder?.length });

    // First, check if document exists
    let progress = await ItineraryProgress.findOne({ userId, itineraryId });
    
    if (progress) {
      // Update existing document - EXPLICITLY set each field
      console.log('Updating existing progress document');
      console.log('Existing data:', {
        currentPinIndex: progress.currentPinIndex,
        visitedSitesCount: progress.visitedSites?.length,
        optimizedOrderCount: progress.optimizedOrder?.length
      });
      
      // Update fields - ALWAYS update when data is provided
      progress.currentPinIndex = currentPinIndex;
      progress.lastPosition = lastPosition;
      progress.lastUpdated = new Date();
      
      // Update visitedSites - with protection against empty overwrites
      if (visitedSites && visitedSites.length > 0) {
        progress.visitedSites = visitedSites;
        console.log('✓ Updated visitedSites:', visitedSites.length, 'items');
      } else if (!progress.visitedSites || progress.visitedSites.length === 0) {
        progress.visitedSites = [];
        console.log('✓ Set visitedSites to empty (was already empty)');
      } else {
        console.log('⚠️ Protected: Keeping existing visitedSites (', progress.visitedSites.length, 'items)');
      }
      
      // Update skippedSites
      progress.skippedSites = skippedSites || [];
      
      // CRITICAL: Update optimizedOrder - ALWAYS when provided
      if (optimizedOrder && Array.isArray(optimizedOrder) && optimizedOrder.length > 0) {
        progress.optimizedOrder = optimizedOrder;
        progress.markModified('optimizedOrder');
        console.log('✓ Updated optimizedOrder:', optimizedOrder.length, 'items -', optimizedOrder.slice(0, 2).join(', '), '...');
      } else if (!progress.optimizedOrder) {
        // Initialize if doesn't exist
        progress.optimizedOrder = [];
        progress.markModified('optimizedOrder');
        console.log('✓ Initialized optimizedOrder as empty array');
      } else {
        console.log('⚠️ No optimizedOrder provided - keeping existing:', progress.optimizedOrder?.length || 0, 'items');
      }
      
      // Ensure field changes are tracked
      progress.markModified('visitedSites');
      
      await progress.save();
      console.log('✅ Document saved successfully');
      
      // Verify what was actually saved by re-fetching
      const saved = await ItineraryProgress.findById(progress._id);
      console.log('📋 Verified saved data:', {
        currentPinIndex: saved.currentPinIndex,
        visitedSitesCount: saved.visitedSites?.length,
        optimizedOrderCount: saved.optimizedOrder?.length,
        optimizedOrderSample: saved.optimizedOrder?.slice(0, 2)
      });
    } else {
      // Create new document
      console.log('Creating new progress document');
      progress = new ItineraryProgress({
        userId,
        itineraryId,
        currentPinIndex,
        visitedSites,
        skippedSites: skippedSites || [],
        optimizedOrder: optimizedOrder || [],
        lastPosition
      });
      await progress.save();
      console.log('✅ New document created');
      
      // Verify what was actually saved
      const saved = await ItineraryProgress.findById(progress._id);
      console.log('📋 Verified saved data:', {
        currentPinIndex: saved.currentPinIndex,
        visitedSitesCount: saved.visitedSites?.length,
        optimizedOrderCount: saved.optimizedOrder?.length,
        optimizedOrderSample: saved.optimizedOrder?.slice(0, 2)
      });
    }

    console.log('Progress saved successfully:', { 
      currentPinIndex: progress.currentPinIndex, 
      visitedSitesCount: progress.visitedSites?.length, 
      optimizedOrderCount: progress.optimizedOrder?.length 
    });
    
    res.json({ message: 'Progress saved successfully', progress });
  } catch (error) {
    console.error('Error saving itinerary progress:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
    if (error.name === 'MongoServerError') {
      console.error('MongoDB error code:', error.code);
    }
    res.status(500).json({ 
      message: 'Error saving progress', 
      error: error.message,
      errorType: error.name 
    });
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

// One-time migration endpoint to add optimizedOrder field to all existing records
router.post('/admin/migrate-optimized-order', verifyToken, async (req, res) => {
  try {
    console.log('Starting migration: Adding optimizedOrder field to existing records');
    
    // Find all records without optimizedOrder field or with undefined/null
    const recordsToUpdate = await ItineraryProgress.find({
      $or: [
        { optimizedOrder: { $exists: false } },
        { optimizedOrder: null },
        { optimizedOrder: undefined }
      ]
    });
    
    console.log(`Found ${recordsToUpdate.length} records to update`);
    
    let updatedCount = 0;
    for (const record of recordsToUpdate) {
      record.optimizedOrder = [];
      record.markModified('optimizedOrder');
      await record.save();
      updatedCount++;
    }
    
    console.log(`Migration complete: Updated ${updatedCount} records`);
    
    res.json({ 
      message: 'Migration completed successfully', 
      recordsFound: recordsToUpdate.length,
      recordsUpdated: updatedCount 
    });
  } catch (error) {
    console.error('Error during migration:', error);
    res.status(500).json({ message: 'Migration failed', error: error.message });
  }
});

module.exports = router;
