const mongoose = require('mongoose');
require('dotenv').config();

async function dropReviewIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Juander');
    console.log('Connected to MongoDB');

    // Get the reviews collection
    const db = mongoose.connection.db;
    const collection = db.collection('reviews');

    // Drop the unique compound index
    try {
      await collection.dropIndex('userId_1_itineraryId_1_siteId_1');
      console.log('✅ Successfully dropped unique compound index on reviews');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️  Index does not exist (already dropped)');
      } else {
        throw err;
      }
    }

    console.log('✅ Migration complete - users can now submit multiple reviews per site');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropReviewIndex();
