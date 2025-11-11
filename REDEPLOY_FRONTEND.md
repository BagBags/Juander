# Frontend Redeployment Guide

## What Was Fixed

### 1. **Chatbot API Issues**
- ✅ Added missing `VITE_API_BASE_URL` to `.env`
- ✅ Fixed inconsistent API URL construction in `Chatbot.jsx`
- ✅ Added service worker caching rules for chatbot endpoints

### 2. **PWA Service Worker Issues**
- ✅ Removed aggressive cache prevention headers from `index.html`
- ✅ Added proper service worker registration with auto-update
- ✅ Added OpenAI API to Content Security Policy

### 3. **Service Worker Configuration**
- ✅ Added chatbot API caching rules in `vite.config.js`
- ✅ Configured NetworkFirst strategy with 30s timeout for OpenAI

---

## Redeployment Steps

### Step 1: Build Frontend
```bash
cd frontend
npm run build
```

### Step 2: Upload to S3

#### Option A: AWS CLI (Recommended)
```bash
aws s3 sync dist/ s3://juander-frontend --delete --exclude "uploads/*"
```

#### Option B: Manual Upload
1. Go to AWS S3 Console → `juander-frontend` bucket
2. **⚠️ DO NOT DELETE `uploads/` folder**
3. Delete all other files (index.html, assets/, etc.)
4. Upload all files from `frontend/dist/` folder

### Step 3: Invalidate CloudFront Cache (REQUIRED!)

#### Option A: AWS CLI
```bash
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

#### Option B: AWS Console
1. Go to CloudFront Console
2. Select distribution: `d39zx5gyblzxjs.cloudfront.net`
3. Go to **Invalidations** tab
4. Click **Create Invalidation**
5. Enter: `/*`
6. Click **Create Invalidation**
7. Wait 2-5 minutes for completion

### Step 4: Test on iPhone X

1. **Clear Safari Cache**
   - Settings → Safari → Clear History and Website Data

2. **Remove PWA**
   - Long press app icon → Remove App

3. **Reinstall PWA**
   - Visit: `https://d39zx5gyblzxjs.cloudfront.net`
   - Share → Add to Home Screen

4. **Test Chatbot**
   - Open PWA
   - Navigate to Chatbot
   - Send a test message
   - Should work without "Failed to Load Page" error

---

## Troubleshooting

### If chatbot still doesn't work:

1. **Check browser console** (on desktop):
   - Open `https://d39zx5gyblzxjs.cloudfront.net` in Chrome
   - Press F12 → Console tab
   - Look for API errors

2. **Check service worker**:
   - F12 → Application tab → Service Workers
   - Click "Unregister" if old SW is stuck
   - Refresh page

3. **Check environment variables**:
   - Console should show:
     ```
     VITE_API_BASE_URL: https://d3des4qdhz53rp.cloudfront.net/api
     ```

4. **Force clear cache on iPhone**:
   - Settings → Safari → Advanced → Website Data
   - Find your domain → Swipe left → Delete

---

## Files Modified

1. `frontend/.env` - Added `VITE_API_BASE_URL`
2. `frontend/src/components/userComponents/ChatbotComponents/Chatbot.jsx` - Fixed API URLs
3. `frontend/vite.config.js` - Added chatbot API caching
4. `frontend/index.html` - Removed cache prevention headers, added OpenAI to CSP
5. `frontend/src/registerSW.js` - NEW: Service worker registration with auto-update
6. `frontend/src/main.jsx` - Added SW registration call

---

## Expected Behavior After Fix

✅ Chatbot loads without errors
✅ Can send messages in PWA mode
✅ Service worker caches chatbot API calls
✅ Auto-updates when new version is deployed
✅ Works offline (with cached responses)

---

## Notes

- The service worker will auto-update every 60 seconds
- Old caches are automatically cleaned up
- NetworkFirst strategy ensures fresh data when online
- 30-second timeout for OpenAI API calls
