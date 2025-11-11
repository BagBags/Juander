/**
 * MongoDB Cleanup Script for Pin Collection
 * 
 * This script removes redundant/deprecated fields from the pins collection:
 * - `media` (old field, replaced by `mediaFiles`)
 * - `mediaUrl` (redundant, should use first image from `mediaFiles`)
 * 
 * Run this script using:
 * node backend/scripts/cleanup-pin-fields.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juander';

async function cleanupPinFields() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    const pinsCollection = db.collection('pins');

    // Count total pins
    const totalPins = await pinsCollection.countDocuments();
    console.log(`\nTotal pins in database: ${totalPins}`);

    // Count pins with deprecated fields
    const pinsWithMedia = await pinsCollection.countDocuments({ media: { $exists: true } });
    const pinsWithMediaUrl = await pinsCollection.countDocuments({ mediaUrl: { $exists: true, $ne: "" } });
    
    console.log(`\nPins with 'media' field: ${pinsWithMedia}`);
    console.log(`Pins with 'mediaUrl' field: ${pinsWithMediaUrl}`);

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will remove the following fields from ALL pins:');
    console.log('   - media (old array field)');
    console.log('   - mediaUrl (redundant field)');
    console.log('\nMake sure you have a backup before proceeding!');
    
    // In production, you would add a confirmation prompt here
    // For now, we'll proceed automatically
    
    console.log('\nProceeding with cleanup...\n');

    // Remove the deprecated fields
    const result = await pinsCollection.updateMany(
      {},
      {
        $unset: {
          media: "",
          mediaUrl: ""
        }
      }
    );

    console.log(`✅ Cleanup completed!`);
    console.log(`   Modified ${result.modifiedCount} documents`);
    console.log(`   Matched ${result.matchedCount} documents`);

    // Verify cleanup
    const remainingMedia = await pinsCollection.countDocuments({ media: { $exists: true } });
    const remainingMediaUrl = await pinsCollection.countDocuments({ mediaUrl: { $exists: true } });
    
    console.log(`\n📊 Verification:`);
    console.log(`   Pins with 'media' field remaining: ${remainingMedia}`);
    console.log(`   Pins with 'mediaUrl' field remaining: ${remainingMediaUrl}`);

    if (remainingMedia === 0 && remainingMediaUrl === 0) {
      console.log('\n✅ All deprecated fields successfully removed!');
    } else {
      console.log('\n⚠️  Some fields still remain. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the cleanup
cleanupPinFields();
