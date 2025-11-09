/**
 * Migration Script: Add feeAmountDiscounted field to existing pins
 * Run this once to add the new field to all existing pins in the database
 * 
 * Usage: node scripts/addDiscountedFeeField.js
 */

const mongoose = require('mongoose');
const Pin = require('../models/pinModel');
require('dotenv').config();

async function addDiscountedFeeField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/juander', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Update all pins to add feeAmountDiscounted field if it doesn't exist
    const result = await Pin.updateMany(
      { feeAmountDiscounted: { $exists: false } },
      { $set: { feeAmountDiscounted: null } }
    );
    
    console.log(`✅ Migration complete!`);
    console.log(`   - Pins updated: ${result.modifiedCount}`);
    console.log(`   - Pins matched: ${result.matchedCount}`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addDiscountedFeeField();
