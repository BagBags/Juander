# Database Cleanup Guide - Remove Old Pin Fields

## Problem Fixed

AdminItinerary was showing broken images because:
1. Old pins have `media` and `mediaUrl` fields
2. New pins only have `mediaFiles` array
3. Code was incorrectly prepending backend URL to S3 URLs

## Solution

### ✅ Frontend Fixed
Updated `adminItineraryMain.jsx` to:
- Use ONLY `mediaFiles` array
- Check if URL starts with `http` (S3) before prepending backend URL
- Show placeholder for missing images

### ⏳ Database Cleanup Required

Remove deprecated fields from all pins:
- `media` (old array)
- `mediaUrl` (redundant)

---

## Step-by-Step Instructions

### Step 1: Backup Pins Collection

**Windows:**
```bash
cd backend\scripts
backup-pins.bat
```

**Linux/Mac:**
```bash
cd backend/scripts
chmod +x backup-pins.sh
./backup-pins.sh
```

This creates a backup in `backend/scripts/backups/pins-backup-TIMESTAMP/pins.json`

### Step 2: Run Cleanup Script

**Windows:**
```bash
cd backend\scripts
cleanup-pins.bat
```

**Linux/Mac:**
```bash
cd backend/scripts
chmod +x cleanup-pins.sh
./cleanup-pins.sh
```

The script will:
1. Show current state (how many pins have old fields)
2. Ask for confirmation
3. Remove `media` and `mediaUrl` fields
4. Verify cleanup was successful

### Step 3: Verify in MongoDB

**Using MongoDB Compass:**
1. Open MongoDB Compass
2. Connect to your database
3. Go to `pins` collection
4. Check a few documents - they should NOT have `media` or `mediaUrl` fields

**Using mongosh:**
```bash
mongosh "your-connection-string"
use juander
db.pins.findOne({ siteName: "Recoletos Church (San Nicolas de Tolentino)" })
```

Should see:
```javascript
{
  _id: ...,
  siteName: "Recoletos Church (San Nicolas de Tolentino)",
  mediaFiles: [
    { url: "https://...", type: "image", _id: ... },
    ...
  ],
  // NO 'media' field
  // NO 'mediaUrl' field
}
```

---

## Manual Cleanup (Alternative)

If scripts don't work, use MongoDB Compass or mongosh:

### Using MongoDB Compass:
1. Go to `pins` collection
2. Click **"Update"** tab
3. Filter: `{}`
4. Update:
   ```json
   {
     "$unset": {
       "media": "",
       "mediaUrl": ""
     }
   }
   ```
5. Check **"Update multiple documents"**
6. Click **"Update"**

### Using mongosh:
```javascript
use juander

// Check current state
db.pins.countDocuments({ media: { $exists: true } })
db.pins.countDocuments({ mediaUrl: { $exists: true } })

// Remove fields
db.pins.updateMany(
  {},
  {
    $unset: {
      media: "",
      mediaUrl: ""
    }
  }
)

// Verify
db.pins.countDocuments({ media: { $exists: true } })  // Should be 0
db.pins.countDocuments({ mediaUrl: { $exists: true } }) // Should be 0
```

---

## Restore Backup (If Needed)

If something goes wrong:

**Windows:**
```bash
mongoimport --uri="YOUR_MONGODB_URI" --collection=pins --file="backend\scripts\backups\pins-backup-TIMESTAMP\pins.json" --jsonArray --drop
```

**Linux/Mac:**
```bash
mongoimport --uri="YOUR_MONGODB_URI" --collection=pins --file="backend/scripts/backups/pins-backup-TIMESTAMP/pins.json" --jsonArray --drop
```

---

## After Cleanup

1. **Rebuild frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Redeploy to S3** (see REDEPLOY_FRONTEND.md)

3. **Test AdminItinerary:**
   - All site images should display correctly
   - No broken images
   - Placeholder shows for sites without images

---

## Files Modified

1. `frontend/src/components/adminComponents/adminItineraryComponents/adminItineraryMain.jsx`
   - Simplified to use only `mediaFiles` array
   - Fixed S3 URL handling

2. `backend/scripts/backup-pins.sh` (NEW)
3. `backend/scripts/backup-pins.bat` (NEW)
4. `backend/scripts/cleanup-pins.sh` (NEW)
5. `backend/scripts/cleanup-pins.bat` (NEW)

---

## Expected Result

✅ All pins use consistent `mediaFiles` structure
✅ Images display correctly in AdminItinerary
✅ S3 URLs load without backend URL prefix
✅ Database is clean and standardized
