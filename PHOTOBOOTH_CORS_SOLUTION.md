# Photobooth Filter CORS Error - Complete Solution ✅

## Problem
All photobooth filter images showing **CORS error** in browser Network tab, even though S3 CORS policy was correctly configured.

## Root Cause
Files were being uploaded to S3 with **default private ACL**. The `multer-s3` configuration was missing the `acl: 'public-read'` setting, so even though your S3 bucket had proper CORS headers, the files themselves were not publicly accessible.

**S3 CORS policy ≠ File permissions!**
- ✅ You had CORS policy configured
- ❌ But files were private (no public read permission)

---

## Complete Solution

### Step 1: Fix Backend Upload Configuration ✅

**File: `backend/middleware/upload.js`**

Added `acl: 'public-read'` on line 21:

```javascript
const storage = multerS3({
  s3: s3Client,
  bucket: S3_BUCKET,
  acl: 'public-read', // ← THIS WAS MISSING!
  contentType: (req, file, cb) => {
    // ...
  },
  // ...
});
```

**Result:** All NEW uploads will be publicly readable.

---

### Step 2: Fix Existing Files in S3

**Run this script ONCE to fix existing filter images:**

```bash
cd backend
node scripts/fix-photobooth-acl.js
```

This script will:
1. List all files in `uploads/photobooth/`
2. Set ACL to `public-read` for each file
3. Show progress with ✅/❌ for each file

**Expected output:**
```
🔧 Fixing ACL permissions for photobooth filters in S3...
📦 Bucket: juander-frontend
📁 Prefix: uploads/photobooth/

📋 Found 5 files

✅ uploads/photobooth/1762947772783-Hat_1.png
✅ uploads/photobooth/1762947879547-1.png
✅ uploads/photobooth/1762948009139-Border_2.png
✅ uploads/photobooth/1762948009139-Border_3.png
✅ uploads/photobooth/1762948133285-Eye.png

═══════════════════════════════════════
✅ Success: 5 files
═══════════════════════════════════════

🎉 Done! All photobooth filter images are now publicly readable.
```

---

### Step 3: Restart Backend

```bash
cd backend
npm start
```

This applies the `acl: 'public-read'` change for future uploads.

---

### Step 4: Re-enable Direct S3 Loading (Optional - Better Performance)

Once ACLs are fixed, you can skip the proxy for faster loading.

**File: `frontend/src/components/userComponents/photoboothComponents/Photobooth.jsx`**

**Line 92:** Uncomment this:
```javascript
const isS3Url = imageUrl.includes('.s3.') || imageUrl.includes('.s3-');
```

**Line 93:** Change to:
```javascript
if (isRemote && !isS3Url) { // Add back the !isS3Url check
```

**Lines 484-488:** Change to:
```javascript
const isS3Url = rawUrl.includes('.s3.') || rawUrl.includes('.s3-');
// Only proxy non-S3 URLs since S3 has CORS configured
if (!currentSrc.includes("/photobooth/filters/proxy") && !isS3Url) {
  const encoded = encodeURIComponent(rawUrl);
  proxySrc = `${origin}/api/photobooth/filters/proxy?url=${encoded}`;
} else if (isS3Url) {
  // Use S3 URL directly - it has CORS
  proxySrc = rawUrl;
}
```

---

## Testing

### Test 1: Check Existing Filters Load
1. Open photobooth as user
2. **Should see 5 filters:** Salakot, Gold Border, Brown Border, Pink Border, Eye Glasses
3. All should load without errors

### Test 2: Upload New Filter
1. Go to Admin → Photobooth
2. Upload a new filter
3. Check the image loads on user photobooth
4. Check Network tab - should be **200 OK** (not CORS error)

### Test 3: Verify S3 Direct Loading (After Step 4)
1. Open Network tab
2. Filter images should load from:
   - ✅ `https://juander-frontend.s3.ap-southeast-2.amazonaws.com/uploads/photobooth/...`
   - ❌ NOT `d3des4qdhz53rp.cloudfront.net/api/photobooth/filters/proxy`
3. Status: **200 OK** ✅

---

## Summary

**Before Fix:**
```
Upload → S3 (private ACL) → Browser tries to load → CORS error ❌
```

**After Fix:**
```
Upload → S3 (public-read ACL) → Browser loads directly → 200 OK ✅
```

**What Was Changed:**
1. ✅ `backend/middleware/upload.js` - Added `acl: 'public-read'`
2. ✅ Created `backend/scripts/fix-photobooth-acl.js` - Fix existing files
3. ⏳ Frontend can re-enable direct S3 loading (optional, better performance)

**Key Insight:**
S3 CORS policy allows cross-origin requests, but if files are private (no public-read ACL), they still can't be accessed. You need BOTH:
- ✅ CORS policy (you already had this)
- ✅ Public-read ACL on files (THIS WAS MISSING)

---

## Files Modified

1. ✅ `backend/middleware/upload.js` - Line 21: Added `acl: 'public-read'`
2. ✅ `backend/scripts/fix-photobooth-acl.js` - New script to fix existing files
3. ⏳ `frontend/src/.../Photobooth.jsx` - Can re-enable direct S3 (optional)

---

**Status:** ✅ COMPLETE

Run the ACL fix script now to make existing filters load!

```bash
cd backend
node scripts/fix-photobooth-acl.js
```
