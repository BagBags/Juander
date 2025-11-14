# Database Cleanup Guide - Remove Redundant Pin Fields

## Problem

The pins collection has **inconsistent data structure** with redundant fields:

### Old Structure (Manila Cathedral - works):
```javascript
{
  media: [{ url: "...", type: "image" }],  // OLD FIELD
  mediaUrl: "https://...",                  // REDUNDANT
  mediaFiles: [{ url: "...", type: "image" }]
}
```

### New Structure (Recoletos - broken):
```javascript
{
  mediaUrl: "",                             // EMPTY
  mediaFiles: [{ url: "...", type: "image" }]
  // No 'media' field
}
```

## Root Cause

The AdminItinerary component was prepending backend URL to S3 URLs, breaking the images.

**Example broken URL:**
```
http://localhost:5000https://juander-frontend.s3.ap-southeast-2.amazonaws.com/uploads/media/...
```

## Solution

### 1. Frontend Fix (DONE ✅)

Updated `adminItineraryMain.jsx` to:
- Check if URL starts with `http` (S3 URL)
- Only prepend backend URL for relative paths
- Support both `mediaFiles` and `media` arrays
- Add error handling with placeholder

### 2. Database Cleanup (REQUIRED)

Remove redundant fields from MongoDB:

#### Fields to Remove:
1. **`media`** - Old array field, replaced by `mediaFiles`
2. **`mediaUrl`** - Redundant single URL field

#### Option A: Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to your database
3. Go to `pins` collection
4. Click **"Update"** tab
5. Filter: `{}`
6. Update:
   ```json
   {
     "$unset": {
       "media": "",
       "mediaUrl": ""
     }
   }
   ```
7. Options: Check **"Update multiple documents"**
8. Click **"Update"**

#### Option B: Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh "your-mongodb-connection-string"

# Switch to database
use juander

# Remove deprecated fields
db.pins.updateMany(
  {},
  {
    $unset: {
      media: "",
      mediaUrl: ""
    }
  }
)
```

#### Option C: Using Node.js Script

```bash
# Run the cleanup script
cd backend
node scripts/cleanup-pin-fields.js
```

## Verification

After cleanup, check a few pins in MongoDB:

```javascript
db.pins.findOne({ siteName: "Recoletos Church (San Nicolas de Tolentino)" })
```

Should NOT have:
- ❌ `media` field
- ❌ `mediaUrl` field

Should HAVE:
- ✅ `mediaFiles` array with images

## Expected Result

All site images in AdminItinerary will display correctly:
- ✅ S3 URLs load directly
- ✅ Relative paths get backend URL prepended
- ✅ Broken images show placeholder
- ✅ Consistent data structure across all pins

## Backup Recommendation

**Before running cleanup, backup your database:**

```bash
# Using mongodump
mongodump --uri="your-mongodb-connection-string" --out=./backup-$(date +%Y%m%d)

# Or export just the pins collection
mongoexport --uri="your-mongodb-connection-string" --collection=pins --out=pins-backup.json
```

## Rollback (if needed)

If something goes wrong, restore from backup:

```bash
# Restore entire database
mongorestore --uri="your-mongodb-connection-string" ./backup-YYYYMMDD

# Or import just pins
mongoimport --uri="your-mongodb-connection-string" --collection=pins --file=pins-backup.json
```

---

## Summary

1. ✅ **Frontend fixed** - Image URLs now handle both S3 and relative paths
2. ⏳ **Database cleanup** - Remove `media` and `mediaUrl` fields
3. ✅ **Backward compatible** - Code supports both old and new structure during transition
4. 🎯 **Final state** - All pins use only `mediaFiles` array

After cleanup, rebuild and redeploy frontend to production.
