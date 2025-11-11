#!/bin/bash
# MongoDB cleanup script to remove deprecated fields from pins collection
# IMPORTANT: Run backup-pins.sh AND migrate-local-to-s3.js BEFORE running this script!

echo "========================================="
echo "  Pins Collection Cleanup Script"
echo "========================================="
echo ""
echo "⚠️  WARNING: This will remove the following fields from ALL pins:"
echo "   - media (old array field)"
echo "   - mediaUrl (redundant field)"
echo ""
echo "Prerequisites:"
echo "   1. Run backup-pins.sh (backup database)"
echo "   2. Run migrate-local-to-s3.js (upload local files to S3)"
echo ""
echo "Make sure you have completed both steps!"
echo ""

# Get MongoDB connection string from .env
if [ -f "../.env" ]; then
    export $(cat ../.env | grep MONGODB_URI | xargs)
fi

# Check if MONGODB_URI is set
if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MONGODB_URI not found in .env file"
    echo "Please set MONGODB_URI in backend/.env"
    exit 1
fi

# Confirmation prompt
read -p "Do you want to proceed? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

echo ""
echo "🔍 Checking current state..."

# Run MongoDB commands
mongosh "$MONGODB_URI" --quiet --eval '
const db = db.getSiblingDB("juander");

// Count documents with deprecated fields
const totalPins = db.pins.countDocuments();
const pinsWithMedia = db.pins.countDocuments({ media: { $exists: true } });
const pinsWithMediaUrl = db.pins.countDocuments({ mediaUrl: { $exists: true } });

print("\n📊 Current State:");
print(`   Total pins: ${totalPins}`);
print(`   Pins with "media" field: ${pinsWithMedia}`);
print(`   Pins with "mediaUrl" field: ${pinsWithMediaUrl}`);

print("\n🧹 Removing deprecated fields...");

// Remove deprecated fields
const result = db.pins.updateMany(
  {},
  {
    $unset: {
      media: "",
      mediaUrl: ""
    }
  }
);

print(`\n✅ Cleanup completed!`);
print(`   Matched: ${result.matchedCount} documents`);
print(`   Modified: ${result.modifiedCount} documents`);

// Verify cleanup
const remainingMedia = db.pins.countDocuments({ media: { $exists: true } });
const remainingMediaUrl = db.pins.countDocuments({ mediaUrl: { $exists: true } });

print(`\n📊 Verification:`);
print(`   Pins with "media" field remaining: ${remainingMedia}`);
print(`   Pins with "mediaUrl" field remaining: ${remainingMediaUrl}`);

if (remainingMedia === 0 && remainingMediaUrl === 0) {
  print("\n✅ All deprecated fields successfully removed!");
} else {
  print("\n⚠️  Some fields still remain. Please check manually.");
}
'

echo ""
echo "========================================="
echo "  Cleanup Complete"
echo "========================================="
