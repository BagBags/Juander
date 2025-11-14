/**
 * Migration Script: Upload Local Files to S3 and Update Database URLs
 * 
 * This script:
 * 1. Finds all pins with local file paths (starts with "/uploads/")
 * 2. Uploads those files to S3
 * 3. Updates the database with S3 URLs
 * 4. Optionally deletes local files after successful upload
 * 
 * Run: node backend/scripts/migrate-local-to-s3.js
 */

const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/juander';

// S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'juander-frontend';
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';

// Upload file to S3
async function uploadToS3(localPath, s3Key) {
  try {
    const fullPath = path.join(__dirname, '..', localPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`   ⚠️  File not found: ${fullPath}`);
      return null;
    }

    const fileContent = fs.readFileSync(fullPath);
    const contentType = mime.lookup(fullPath) || 'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
    });

    await s3Client.send(command);
    
    const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
    console.log(`   ✅ Uploaded: ${s3Key}`);
    return s3Url;
  } catch (error) {
    console.error(`   ❌ Upload failed for ${localPath}:`, error.message);
    return null;
  }
}

// Migrate a single pin
async function migratePin(pin) {
  let updated = false;
  const updates = {};

  console.log(`\n📍 Processing: ${pin.siteName || pin._id}`);

  // Migrate mediaFiles array
  if (pin.mediaFiles && Array.isArray(pin.mediaFiles)) {
    const newMediaFiles = [];
    
    for (const media of pin.mediaFiles) {
      if (media.url && media.url.startsWith('/uploads/')) {
        // Local path - needs migration
        const s3Key = media.url.substring(1); // Remove leading slash
        console.log(`   📤 Uploading: ${media.url}`);
        
        const s3Url = await uploadToS3(media.url, s3Key);
        
        if (s3Url) {
          newMediaFiles.push({
            ...media.toObject(),
            url: s3Url
          });
          updated = true;
        } else {
          // Keep original if upload failed
          newMediaFiles.push(media);
        }
      } else {
        // Already S3 URL or other format
        newMediaFiles.push(media);
      }
    }
    
    if (updated) {
      updates.mediaFiles = newMediaFiles;
    }
  }

  // Migrate facadeUrl
  if (pin.facadeUrl && pin.facadeUrl.startsWith('/uploads/')) {
    console.log(`   📤 Uploading facade: ${pin.facadeUrl}`);
    const s3Key = pin.facadeUrl.substring(1);
    const s3Url = await uploadToS3(pin.facadeUrl, s3Key);
    
    if (s3Url) {
      updates.facadeUrl = s3Url;
      updated = true;
    }
  }

  // Migrate glbUrl
  if (pin.glbUrl && pin.glbUrl.startsWith('/uploads/')) {
    console.log(`   📤 Uploading GLB: ${pin.glbUrl}`);
    const s3Key = pin.glbUrl.substring(1);
    const s3Url = await uploadToS3(pin.glbUrl, s3Key);
    
    if (s3Url) {
      updates.glbUrl = s3Url;
      updated = true;
    }
  }

  // Update database if changes were made
  if (updated) {
    await mongoose.connection.db.collection('pins').updateOne(
      { _id: pin._id },
      { $set: updates }
    );
    console.log(`   ✅ Database updated`);
    return true;
  } else {
    console.log(`   ℹ️  No migration needed`);
    return false;
  }
}

// Main migration function
async function migrateAllPins() {
  try {
    console.log('========================================');
    console.log('  Local to S3 Migration Script');
    console.log('========================================\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const pinsCollection = db.collection('pins');

    // Find all pins with local paths
    const pinsWithLocalPaths = await pinsCollection.find({
      $or: [
        { 'mediaFiles.url': { $regex: '^/uploads/' } },
        { facadeUrl: { $regex: '^/uploads/' } },
        { glbUrl: { $regex: '^/uploads/' } }
      ]
    }).toArray();

    console.log(`📊 Found ${pinsWithLocalPaths.length} pins with local file paths\n`);

    if (pinsWithLocalPaths.length === 0) {
      console.log('✅ No pins need migration!');
      return;
    }

    // Migrate each pin
    let successCount = 0;
    let skipCount = 0;

    for (const pin of pinsWithLocalPaths) {
      const migrated = await migratePin(pin);
      if (migrated) {
        successCount++;
      } else {
        skipCount++;
      }
    }

    console.log('\n========================================');
    console.log('  Migration Complete');
    console.log('========================================');
    console.log(`✅ Successfully migrated: ${successCount} pins`);
    console.log(`ℹ️  Skipped: ${skipCount} pins`);
    console.log(`📊 Total processed: ${pinsWithLocalPaths.length} pins\n`);

    // Verify migration
    const remainingLocalPaths = await pinsCollection.countDocuments({
      $or: [
        { 'mediaFiles.url': { $regex: '^/uploads/' } },
        { facadeUrl: { $regex: '^/uploads/' } },
        { glbUrl: { $regex: '^/uploads/' } }
      ]
    });

    console.log(`📊 Pins with local paths remaining: ${remainingLocalPaths}`);

    if (remainingLocalPaths === 0) {
      console.log('✅ All local paths successfully migrated to S3!');
    } else {
      console.log('⚠️  Some local paths still remain. Check logs for errors.');
    }

  } catch (error) {
    console.error('\n❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 MongoDB connection closed');
  }
}

// Run migration
migrateAllPins();
