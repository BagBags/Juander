/**
 * Script to fix ACL permissions on existing photobooth filter images in S3
 * Run this once to make all existing filter images publicly readable
 * 
 * Usage: node scripts/fix-photobooth-acl.js
 */

require('dotenv').config();
const { S3Client, ListObjectsV2Command, PutObjectAclCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'juander-frontend';
const PHOTOBOOTH_PREFIX = 'uploads/photobooth/';

async function fixPhotoboothACLs() {
  console.log('🔧 Fixing ACL permissions for photobooth filters in S3...');
  console.log(`📦 Bucket: ${S3_BUCKET}`);
  console.log(`📁 Prefix: ${PHOTOBOOTH_PREFIX}`);
  console.log('');

  try {
    // List all objects in uploads/photobooth/
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: PHOTOBOOTH_PREFIX,
    });

    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('⚠️  No files found in uploads/photobooth/');
      return;
    }

    console.log(`📋 Found ${listResponse.Contents.length} files`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    // Update ACL for each object
    for (const object of listResponse.Contents) {
      const key = object.Key;
      
      // Skip if it's just the folder itself
      if (key.endsWith('/')) continue;

      try {
        const aclCommand = new PutObjectAclCommand({
          Bucket: S3_BUCKET,
          Key: key,
          ACL: 'public-read',
        });

        await s3Client.send(aclCommand);
        console.log(`✅ ${key}`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${key}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Success: ${successCount} files`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} files`);
    }
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('🎉 Done! All photobooth filter images are now publicly readable.');
    console.log('   You can now access them directly from S3 without CORS issues.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
fixPhotoboothACLs();
