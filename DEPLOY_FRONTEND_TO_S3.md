# Deploy Frontend to S3 - Complete Guide

## Problem
Environment variables not loading in production, causing video URLs to break.

## Solution
Rebuild and redeploy frontend to S3.

---

## Step 1: Rebuild Frontend

Open terminal in `d:\Desktop\Juander\frontend` and run:

```bash
npm run build
```

This will:
- Read `.env.production` file
- Bake environment variables into the build
- Create optimized production files in `dist/` folder

**Wait for build to complete** (usually 30-60 seconds)

---

## Step 2: Upload to S3

### Option A: Using AWS Console (Easiest)

1. **Go to AWS S3 Console**
   - Open: https://s3.console.aws.amazon.com/
   - Click on bucket: `juander-frontend`

2. **Delete Old Files (Important!)**
   - Select ALL files in the root (except `uploads/` folder)
   - Click **Delete**
   - Confirm deletion
   - **DO NOT delete the `uploads/` folder!**

3. **Upload New Build**
   - Click **Upload** button
   - Click **Add files** and **Add folder**
   - Select ALL files and folders from `d:\Desktop\Juander\frontend\dist\`
   - Click **Upload**
   - Wait for upload to complete

4. **Verify Upload**
   - Check that `index.html` is in the root
   - Check that `assets/` folder exists
   - Check that `uploads/` folder is still there

---

### Option B: Using AWS CLI (Faster)

If you have AWS CLI installed:

```bash
cd d:\Desktop\Juander\frontend

# Sync dist folder to S3 (preserves uploads folder)
aws s3 sync dist/ s3://juander-frontend/ --delete --exclude "uploads/*"
```

The `--exclude "uploads/*"` ensures your uploaded media files are not deleted.

---

## Step 3: Invalidate CloudFront Cache

Your CloudFront distribution caches files, so you need to clear the cache:

1. **Go to CloudFront Console**
   - Open: https://console.aws.amazon.com/cloudfront/
   - Click on distribution: `d39zx5gyblzxjs.cloudfront.net`

2. **Create Invalidation**
   - Go to **Invalidations** tab
   - Click **Create invalidation**
   - Enter paths:
     ```
     /index.html
     /assets/*
     /*.js
     /*.css
     ```
   - Click **Create invalidation**
   - Wait 2-5 minutes for invalidation to complete

---

## Step 4: Test

1. **Clear Browser Cache**
   - Press `Ctrl + Shift + Delete`
   - Clear cached images and files
   - Or use Incognito/Private mode

2. **Open Your Site**
   - Go to: https://d39zx5gyblzxjs.cloudfront.net

3. **Test Environment Variable**
   - Press `F12` → Console
   - Type: `import.meta.env.VITE_API_BASE_URL`
   - Should show: `https://d3des4qdhz53rp.cloudfront.net/api`
   - **NOT** `undefined` or `not available`

4. **Test Video Playback**
   - Navigate to a pin with video
   - Swipe to video in carousel
   - Video should play! ✅

---

## Troubleshooting

### Issue: Environment variable still shows "not available"

**Cause:** Build didn't pick up `.env.production`

**Solution:**
1. Verify `.env.production` exists in `d:\Desktop\Juander\frontend\`
2. Check it contains:
   ```
   VITE_API_BASE_URL=https://d3des4qdhz53rp.cloudfront.net/api
   ```
3. Delete `dist/` folder
4. Run `npm run build` again
5. Redeploy

### Issue: Videos still broken after deployment

**Cause:** CloudFront cache not cleared

**Solution:**
1. Create CloudFront invalidation for `/*` (all files)
2. Wait 5 minutes
3. Hard refresh browser (Ctrl + Shift + R)

### Issue: "Access Denied" when accessing site

**Cause:** S3 bucket permissions or CloudFront settings

**Solution:**
1. Check S3 bucket policy allows public read
2. Check CloudFront origin settings point to S3 website endpoint

---

## Quick Commands Summary

```bash
# 1. Navigate to frontend
cd d:\Desktop\Juander\frontend

# 2. Rebuild
npm run build

# 3. Upload to S3 (if using AWS CLI)
aws s3 sync dist/ s3://juander-frontend/ --delete --exclude "uploads/*"

# 4. Invalidate CloudFront (if using AWS CLI)
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

---

## Important Notes

⚠️ **Always exclude `uploads/` folder** when syncing to S3  
⚠️ **Always invalidate CloudFront cache** after deployment  
⚠️ **Always test in incognito mode** to avoid browser cache issues  

---

## Expected Result

After following these steps:
- ✅ Environment variables load correctly
- ✅ Videos play in SiteCard
- ✅ Videos play in SiteModalFullScreen
- ✅ Videos play in AdminPinCard preview
- ✅ All S3 media files display correctly
