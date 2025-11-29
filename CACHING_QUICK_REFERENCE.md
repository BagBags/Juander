# PWA Caching Quick Reference 🚀

## ✅ WHAT WILL BE CACHED

### Static Assets (CacheFirst - Instant Load)
- ✅ JavaScript bundles (`.js`)
- ✅ CSS stylesheets (`.css`)
- ✅ Local images (`.png`, `.jpg`, `.svg`)
- ✅ Fonts (`.woff`, `.woff2`)
- ✅ Videos (`.mp4`) - 90 days
- ✅ 3D Models (`.glb`) - 90 days
- ✅ Google Fonts & CDN libraries
- ✅ Mapbox map tiles (2000 tiles)

### S3 CloudFront Assets (Smart Cache)
- ✅ Pin facades (7 days - StaleWhileRevalidate)
- ✅ 3D AR models (7 days - StaleWhileRevalidate)
- ✅ Admin itinerary images (7 days - StaleWhileRevalidate)
- ✅ Photobooth filters (30 days - CacheFirst)
- ⚠️ User profile photos (1 day - NetworkFirst)
- ⚠️ Review photos (1 day - NetworkFirst)
- ⚠️ User itinerary images (1 day - NetworkFirst)

### API Data (NetworkFirst - Fresh When Online)
- ✅ Public pins data (3 days fallback)
- ✅ Public itineraries (3 days fallback)
- ✅ Public reviews (1 day fallback)
- ✅ Chatbot responses (1 day fallback)
- ✅ Photobooth filter metadata (7 days fallback)

---

## ❌ WHAT WILL NEVER BE CACHED

### Authentication & Security
- ❌ Login/logout endpoints (`/api/auth/*`)
- ❌ User session data
- ❌ JWT tokens (only in memory/localStorage)
- ❌ Admin panel data (`/api/admin/*`)

### User-Specific Data
- ❌ Personal itineraries (`/api/userItineraries/*`)
- ❌ Visited sites tracking (`/api/visited-sites/*`)
- ❌ Itinerary progress (`/api/itinerary-progress/*`)
- ❌ User profile updates (`/api/users/*`)

### Mutations (Create/Update/Delete)
- ❌ POST `/api/reviews` (Create review)
- ❌ PUT `/api/reviews/*` (Update review)
- ❌ DELETE `/api/reviews/*` (Delete review)
- ❌ Any POST/PUT/DELETE to `/api/admin/*`

### Real-Time Data
- ❌ Emergency contacts (`/api/emergency/*`)
- ❌ Admin logs (`/api/logs/*`)
- ❌ Live chat messages

---

## 🎯 Offline Capabilities

### ✅ What Works Offline:
1. **View cached tour sites** - Previously loaded pins and facades
2. **Browse map** - Cached map tiles from Mapbox
3. **View saved itineraries** - Public itineraries you've visited
4. **Access photos** - Cached S3 images from pins/itineraries
5. **Use photobooth** - Filters are cached locally
6. **Navigate pages** - App shell is fully cached

### ❌ What Doesn't Work Offline:
1. **Login/Register** - Requires server authentication
2. **Create reviews** - Network required for submission
3. **Update profile** - Real-time server update needed
4. **Track visited sites** - Database write operation
5. **Admin panel** - Real-time data management
6. **Emergency contacts** - Must be current

---

## 🔄 Cache Update Strategy

| Content Type | Strategy | Update Frequency |
|-------------|----------|-----------------|
| JS/CSS | CacheFirst | On new build (versioned) |
| Pin Facades | StaleWhileRevalidate | Background update |
| User Photos | NetworkFirst | On page load |
| API Data | NetworkFirst | On page load |
| Map Tiles | CacheFirst | 30 days |
| Fonts | CacheFirst | 1 year |

---

## 🧪 Testing Commands

### Check Service Worker Status:
```javascript
// Browser console:
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW State:', reg.active.state);
});
```

### View All Caches:
```javascript
// Browser console:
caches.keys().then(console.log);
```

### Clear All Caches:
```javascript
// Browser console:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
location.reload();
```

### Test Offline Mode:
1. Open DevTools → Application
2. Check "Offline" checkbox
3. Navigate app
4. Verify cached content loads

---

## 🚀 Deployment Steps

1. **Build production bundle:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Verify service worker generated:**
   ```bash
   ls dist/sw.js        # Should exist
   ls dist/registerSW.js # Should exist
   ```

3. **Upload to S3:**
   - Upload all `dist/` files
   - Ensure proper Content-Type headers

4. **Invalidate CloudFront:**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E2J47HTDXC2VFF \
     --paths "/*"
   ```

5. **Test production:**
   - Visit https://juanderintra.com
   - Hard refresh (Ctrl+Shift+R)
   - Check DevTools → Application → Service Workers
   - Verify "activated" status

6. **Test offline:**
   - Enable offline mode in DevTools
   - Navigate to different pages
   - Verify cached content loads

---

## 💾 Storage Estimates

### Typical Cache Sizes:
```
Local Assets:      ~100 MB   (JS, CSS, images)
Map Tiles:         ~500 MB   (Mapbox)
S3 Pin Assets:     ~100 MB   (Facades, models)
S3 User Content:   ~50 MB    (Reviews, profiles)
API Data:          ~10 MB    (JSON responses)
Photobooth:        ~200 MB   (Filters)
-----------------------------------
TOTAL:             ~960 MB
```

### Browser Quota:
- **Chrome/Edge:** ~60% of available disk space
- **Firefox:** Up to 10 GB
- **Safari:** ~1 GB (more with user permission)

**Note:** Service worker automatically manages quota with `maxEntries` limits.

---

## ⚡ Performance Gains

### Expected Improvements:
```
Initial Load:      2.5 MB → 2.5 MB (same)
Repeat Visit:      2.5 MB → 500 KB (80% reduction)
Map Load:          1-2s → Instant
API Response:      200-500ms → Instant (cached)
Total Savings:     ~972 KB per page load
```

### Lighthouse Improvements:
- **Performance:** +15-20 points
- **Best Practices:** +5 points (efficient caching)
- **PWA:** +10 points (offline capability)

---

## 🐛 Common Issues & Fixes

### Issue: Old content showing up
**Fix:** Hard refresh (Ctrl+Shift+R) or clear service worker

### Issue: Service worker not updating
**Fix:** 
1. DevTools → Application → Service Workers
2. Click "Unregister"
3. Hard refresh

### Issue: Offline page not showing
**Fix:** 
1. Verify `offline.html` exists in `public/`
2. Check `navigateFallback` in vite.config.js
3. Clear caches and re-register SW

### Issue: Cache storage full
**Fix:** 
1. Reduce `maxEntries` for mapbox-cache
2. Lower video/3D model cache limits
3. Manually clear old caches

---

## 📊 Monitoring Cache Health

### Check Cache Sizes:
```javascript
// Browser console:
caches.keys().then(async names => {
  for (const name of names) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    console.log(`${name}: ${keys.length} entries`);
  }
});
```

### Monitor Storage Quota:
```javascript
// Browser console:
navigator.storage.estimate().then(estimate => {
  const percent = (estimate.usage / estimate.quota * 100).toFixed(2);
  console.log(`Storage used: ${percent}%`);
  console.log(`Available: ${(estimate.quota / 1024 / 1024 / 1024).toFixed(2)} GB`);
});
```

---

## 🎯 Cache Strategy Summary

```
┌─────────────────────────────────────────┐
│         NETWORK ONLY (Never Cache)      │
├─────────────────────────────────────────┤
│ • Authentication                        │
│ • User mutations (POST/PUT/DELETE)      │
│ • Real-time data                        │
│ • Admin operations                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      NETWORK FIRST (Try Fresh First)    │
├─────────────────────────────────────────┤
│ • Public API data (pins, reviews)       │
│ • User content from S3 (photos)         │
│ • Chatbot responses                     │
│ • Dynamic content                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  STALE WHILE REVALIDATE (Serve + Update)│
├─────────────────────────────────────────┤
│ • S3 pin facades                        │
│ • S3 3D models                          │
│ • S3 itinerary images                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       CACHE FIRST (Instant Load)        │
├─────────────────────────────────────────┤
│ • Static assets (JS, CSS)               │
│ • Local images                          │
│ • Fonts                                 │
│ • Map tiles                             │
│ • Photobooth filters                    │
│ • CDN resources                         │
└─────────────────────────────────────────┘
```

---

**Remember:** 
- ✅ Static = Cache aggressively
- ⚠️ Dynamic = Cache with freshness check
- ❌ User-specific = Never cache
- 🔐 Mutations = Always network only

---

**File:** `vite.config.js` (lines 69-370)  
**Documentation:** `PWA_CACHING_STRATEGY.md`
