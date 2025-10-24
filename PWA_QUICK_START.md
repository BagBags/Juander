# PWA Quick Start Guide

## 🚀 Getting Started

### 1. Build the App
```bash
cd frontend
npm run build
```

### 2. Preview/Test PWA
```bash
npm run preview
```
The app will run at `http://localhost:4173`

### 3. Test Offline Mode

#### Option A: Using DevTools
1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Select **Offline** from throttling dropdown
4. Refresh page - app should still work!

#### Option B: Using Service Worker
1. Open DevTools (F12)
2. Go to **Application** > **Service Workers**
3. Check "Offline" checkbox
4. Refresh page

### 4. Test PWA Installation

#### Desktop (Chrome/Edge)
1. Build and preview the app
2. Look for install icon (⊕) in address bar
3. Click to install
4. Or wait 30 seconds for custom prompt

#### Mobile (Android)
1. Open in Chrome/Edge
2. Tap menu (⋮)
3. Select "Install app" or "Add to Home Screen"
4. Follow prompts

#### Mobile (iOS)
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Confirm

## ✅ Verification Checklist

### Service Worker
- [ ] Open DevTools > Application > Service Workers
- [ ] Status should be "activated and running"
- [ ] Green dot next to service worker

### Cache Storage
- [ ] Open DevTools > Application > Cache Storage
- [ ] Should see multiple caches:
  - `workbox-precache`
  - `api-cache`
  - `image-cache`
  - `video-cache`
  - `3d-model-cache`
  - `font-cache`
  - `mapbox-cache`
  - `cdn-cache`

### Manifest
- [ ] Open DevTools > Application > Manifest
- [ ] Name: "Juander - Intramuros Tour Guide"
- [ ] Icons present
- [ ] Display: "standalone"

### Offline Functionality
- [ ] Go offline (DevTools > Network > Offline)
- [ ] Navigate between pages - should work
- [ ] View cached images - should load
- [ ] Try API calls - should use cached data

## 🎯 What to Test

### While Online
1. **Browse all pages** to cache them
2. **Open tour sites** to cache images/videos
3. **View 3D models** to cache GLB files
4. **Load itineraries** to cache data
5. **Navigate map** to cache tiles

### While Offline
1. **Navigate pages** - should work instantly
2. **View tour sites** - cached content loads
3. **See images/videos** - from cache
4. **View 3D models** - if previously loaded
5. **Check map** - cached tiles visible

## 📱 User Experience Flow

### First Visit (Online)
1. User opens app
2. Service worker installs
3. Critical assets cached
4. After 30 seconds: Install prompt appears
5. User browses content (gets cached)

### Subsequent Visits (Online)
1. App loads from cache (instant)
2. Service worker checks for updates
3. Fresh content loads in background
4. If update available: Prompt to reload

### Offline Visit
1. App loads from cache
2. Offline indicator appears
3. Cached content available
4. API calls use cached responses
5. When online: Auto-sync

## 🔧 Common Issues & Solutions

### Issue: Service Worker Not Installing
**Solution:**
```bash
# Clear cache and rebuild
npm run build
# Hard refresh browser (Ctrl+Shift+R)
```

### Issue: Offline Mode Not Working
**Solution:**
1. Check DevTools > Application > Service Workers
2. Verify "activated and running"
3. Check Cache Storage has entries
4. Try unregister and re-register

### Issue: Install Prompt Not Showing
**Solution:**
1. Must be on HTTPS or localhost
2. Wait 30 seconds after page load
3. Check if previously dismissed (wait 7 days)
4. Check browser console for errors

### Issue: Old Content Showing
**Solution:**
1. Service worker checks updates hourly
2. Force update: DevTools > Application > Service Workers > Update
3. Or clear cache and reload

## 📊 Performance Metrics

### Before PWA
- First Load: ~3-5 seconds
- Subsequent Loads: ~1-2 seconds
- Offline: ❌ Not available

### After PWA
- First Load: ~3-5 seconds (same)
- Subsequent Loads: ~0.5 seconds ⚡
- Offline: ✅ Fully functional

## 🎨 UI Components

### Offline Indicator
- Appears at top center when offline
- Shows "You're offline - Using cached content"
- Auto-hides when back online
- Shows "Back online!" for 3 seconds

### Install Prompt
- Appears bottom-right after 30 seconds
- Dismissible for 7 days
- Shows app benefits
- Install/Not now buttons

## 📝 Testing Checklist

```
Frontend Testing:
□ npm run build completes successfully
□ npm run preview starts server
□ Service worker registers (check console)
□ Manifest loads (check DevTools)
□ Install prompt appears after 30s
□ Offline indicator works
□ Cache storage populated

Offline Testing:
□ Go offline in DevTools
□ Navigate between pages
□ View cached images
□ Load cached videos
□ View 3D models
□ Check map tiles
□ Try API calls (should use cache)

Installation Testing:
□ Install prompt appears
□ Click Install button
□ App installs successfully
□ App opens in standalone mode
□ App icon on desktop/home screen
□ App works offline after install

Update Testing:
□ Make code change
□ Rebuild app
□ Service worker detects update
□ Update prompt appears
□ Click reload
□ New version loads
```

## 🚨 Production Deployment

### Before Deploying:
1. ✅ Test all offline features
2. ✅ Verify service worker works
3. ✅ Check cache sizes (< 50MB)
4. ✅ Test on multiple browsers
5. ✅ Test on mobile devices
6. ✅ Verify HTTPS enabled

### Deployment Steps:
```bash
# 1. Build production version
npm run build

# 2. Test production build locally
npm run preview

# 3. Deploy dist folder to hosting
# (Netlify, Vercel, Firebase, etc.)

# 4. Verify HTTPS is enabled

# 5. Test PWA on production URL
```

## 📚 Additional Resources

- **PWA Implementation Guide**: See `PWA_IMPLEMENTATION_GUIDE.md`
- **Vite PWA Plugin**: https://vite-pwa-org.netlify.app/
- **Workbox**: https://developers.google.com/web/tools/workbox
- **PWA Checklist**: https://web.dev/pwa-checklist/

## 💡 Tips

1. **Cache Strategy**: Network First for API, Cache First for assets
2. **Update Frequency**: Service worker checks hourly
3. **Cache Limits**: 50MB max, auto-cleanup when full
4. **Offline First**: Always design with offline in mind
5. **Testing**: Test offline mode regularly during development

## ✨ Success Indicators

Your PWA is working correctly when:
- ✅ Lighthouse PWA score > 90
- ✅ App installs on desktop/mobile
- ✅ Works offline after first visit
- ✅ Loads instantly on repeat visits
- ✅ Updates automatically
- ✅ No console errors
- ✅ Offline indicator appears when offline
- ✅ Install prompt appears for new users

---

**Need Help?** Check the full implementation guide or browser console for detailed error messages.
