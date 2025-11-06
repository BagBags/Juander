# Fix: Access Denied on Navigation/Refresh in PWA

## Problem
When you navigate to routes like `/settings`, `/photobooth`, or use back button, you get "Access Denied" error. This happens because:

1. **Service Worker blocking**: Your `vite.config.js` had restrictive navigation fallback rules
2. **S3 Static Hosting**: S3 doesn't know how to handle SPA routes - it tries to find actual files

## Solution

### Step 1: Fix Service Worker Configuration ✅ DONE

I've already updated `vite.config.js` to remove the restrictive navigation fallback lists. Now it only blocks `/api` calls and allows all other routes to fallback to `index.html`.

### Step 2: Configure S3 for SPA Routing

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3/)
2. Click on your bucket: `juander-frontend`
3. Go to **Properties** tab
4. Scroll down to **Static website hosting**
5. Click **Edit**
6. Configure as follows:
   - **Static website hosting**: Enable
   - **Hosting type**: Host a static website
   - **Index document**: `index.html`
   - **Error document**: `index.html` ⚠️ **IMPORTANT - Set this to index.html**
7. Click **Save changes**

**Why this works**: When S3 can't find a route like `/settings`, it serves the error document (`index.html`), which loads your React app, and React Router handles the routing.

### Step 3: Rebuild and Redeploy

After making these changes, you need to rebuild your frontend:

```bash
cd frontend
npm run build
```

Then upload the new `dist` folder to S3:

**Option A: Using AWS CLI**
```bash
aws s3 sync dist/ s3://juander-frontend/ --delete
```

**Option B: Using AWS Console**
1. Go to S3 bucket
2. Delete old files (except `uploads/` folder!)
3. Upload all files from `dist/` folder

### Step 4: Clear Service Worker Cache

After deploying, users need to clear their service worker cache:

**For Testing:**
1. Open your PWA
2. Press F12 (DevTools)
3. Go to **Application** tab
4. Click **Service Workers** in left sidebar
5. Click **Unregister** next to your service worker
6. Click **Clear storage** → **Clear site data**
7. Refresh the page

**For Production Users:**
The service worker will auto-update on next visit, but you can force it by incrementing the version in `package.json` or adding a cache-busting query parameter.

### Step 5: Verify CloudFront (if using)

If you're using CloudFront in front of S3:

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Click on your distribution
3. Go to **Error Pages** tab
4. Click **Create Custom Error Response**
5. Configure:
   - **HTTP Error Code**: 403 Forbidden
   - **Customize Error Response**: Yes
   - **Response Page Path**: `/index.html`
   - **HTTP Response Code**: 200 OK
6. Click **Create**
7. Repeat for **404 Not Found** error code
8. Create invalidation: `/*` to clear cache

## What Changed

### Before:
```javascript
navigateFallbackDenylist: [
  /^\/api/,
  /^\/admin/,
  /^\/create-itinerary/,
  /^\/profile/,
  /^\/homepage/,
],
```
❌ This blocked navigation to many routes, causing "Access Denied"

### After:
```javascript
navigateFallbackDenylist: [
  /^\/api/,  // Only block API calls
],
```
✅ Only blocks API calls, allows all app routes to work

## Testing

After deploying, test these scenarios:

1. **Direct URL access**: Type `https://your-domain.com/settings` in browser
2. **Refresh**: Go to Settings page and press F5
3. **Back button**: Navigate from Settings → Photobooth → Press back
4. **Deep links**: Click a shared link to a specific page

All should work without "Access Denied" errors.

## Common Issues

### Issue 1: Still Getting Access Denied After Deploy
- **Check**: Did you set S3 error document to `index.html`?
- **Check**: Did you clear service worker cache?
- **Check**: Did you upload the new build?

### Issue 2: Works on Desktop but not Mobile PWA
- **Fix**: Uninstall and reinstall the PWA
- **Why**: Old service worker is still cached

### Issue 3: API Calls Failing
- **Check**: Make sure `/api` is still in denylist
- **Check**: Backend CORS is configured correctly

### Issue 4: CloudFront Still Showing Old Version
- **Fix**: Create invalidation for `/*`
- **Wait**: Invalidations take 5-15 minutes

## Quick Deployment Script

Create this script to automate deployment:

**deploy-frontend.sh**
```bash
#!/bin/bash
echo "🏗️  Building frontend..."
cd frontend
npm run build

echo "📤 Uploading to S3..."
aws s3 sync dist/ s3://juander-frontend/ --delete --exclude "uploads/*"

echo "🔄 Creating CloudFront invalidation..."
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy-frontend.sh
```

Run it:
```bash
./deploy-frontend.sh
```

## Verification Checklist

- [ ] `vite.config.js` updated (navigateFallbackDenylist only has `/api`)
- [ ] S3 error document set to `index.html`
- [ ] Frontend rebuilt with `npm run build`
- [ ] New build uploaded to S3
- [ ] Service worker cache cleared
- [ ] CloudFront error pages configured (if using)
- [ ] CloudFront invalidation created (if using)
- [ ] Tested direct URL access
- [ ] Tested refresh on different pages
- [ ] Tested back button navigation
- [ ] No "Access Denied" errors in console

## Need Help?

If you're still getting errors:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application → Service Workers for status
5. Share the error messages for further debugging
