# GuestItineraryMap & TouristItineraryMap - Offline Caching ✅

## Overview

Both `GuestItineraryMap.jsx` and `TouristItineraryMap.jsx` now have **complete offline support**. All required resources are cached for offline functionality.

---

## ✅ What's Cached for These Components

### 1. **React Components Themselves** (Precached)

```javascript
globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}"]
```

**Cached Files:**
- ✅ `GuestItineraryMap.jsx` (in JS bundle)
- ✅ `TouristItineraryMap.jsx` (in JS bundle)
- ✅ All dependencies (React Router, Mapbox, etc.)
- ✅ All CSS stylesheets
- ✅ Local images and icons

---

### 2. **API Endpoints** (Runtime Caching)

Based on `offlineAwareApi.js`, these maps use the following endpoints:

#### **Pins API** - ✅ CACHED
```javascript
GET /api/pins              → StaleWhileRevalidate (7 days)
GET /api/pins/:id          → StaleWhileRevalidate (7 days)
```
- **Cache name:** `tour-pins-cache`
- **Max entries:** 150
- **Pattern:** `/api/pins(/.*)?` ✅ Matches both list and individual

#### **Itineraries API** - ✅ CACHED
```javascript
GET /api/itineraries/guest → StaleWhileRevalidate (7 days)
GET /api/itineraries/:id   → StaleWhileRevalidate (7 days)
GET /api/itineraries       → StaleWhileRevalidate (7 days) [Tourist]
```
- **Cache name:** `tour-itineraries-cache`
- **Max entries:** 100
- **Pattern:** `/api/itineraries/.*` ✅ Matches all GET requests

#### **Reviews API** - ✅ CACHED
```javascript
GET /api/reviews/:pinId    → StaleWhileRevalidate (3 days)
GET /api/reviews?query     → StaleWhileRevalidate (3 days)
```
- **Cache name:** `tour-reviews-cache`
- **Max entries:** 200
- **Pattern:** `/api/reviews(/[^/]+)?(\?.*)?` ✅ Matches both path and query params

---

### 3. **S3 CloudFront Assets** (Tour-Critical)

#### **Pin Facades** - ✅ CACHED
```javascript
https://d39zx5gyblzxjs.cloudfront.net/uploads/facades/*
https://d3des4qdhz53rp.cloudfront.net/uploads/facades/*
https://juander-frontend.s3.ap-southeast-2.amazonaws.com/uploads/facades/*
```
- **Handler:** `CacheFirst`
- **Cache:** 30 days, 200 entries
- **Why:** Instant offline load

#### **AR Models** - ✅ CACHED
```javascript
https://.../uploads/arModels/*.glb
```
- **Handler:** `CacheFirst`
- **Cache:** 30 days, 200 entries
- **Why:** 3D models load offline

#### **Itinerary Images** - ✅ CACHED
```javascript
https://.../uploads/itineraries/*
```
- **Handler:** `StaleWhileRevalidate`
- **Cache:** 7 days, 100 entries
- **Why:** Background updates

---

### 4. **Mapbox Tiles** - ✅ CACHED

```javascript
https://api.mapbox.com/*
```
- **Handler:** `CacheFirst`
- **Cache:** 30 days, 2000 tiles
- **Why:** Offline maps!

---

### 5. **Additional LocalStorage Caching**

The `offlineAwareApi.js` also uses **localStorage** for additional offline support:

```javascript
// Guest cache keys:
guest_admin_itineraries
guest_itinerary_{id}
guest_pins
guest_pin_{id}
guest_reviews_{pinId}

// Tourist cache keys:
user_itineraries
```

This **double-layer caching** (Service Worker + localStorage) ensures maximum offline reliability!

---

## 🚀 What Works Offline

### ✅ GuestItineraryMap (Guest Users):
| Feature | Status | Why |
|---------|--------|-----|
| Load itinerary by ID | ✅ Works | Cached in SW + localStorage |
| View all pins | ✅ Works | Cached pins data |
| View pin details | ✅ Works | Individual pin API cached |
| View pin facades | ✅ Works | S3 images cached |
| View AR models | ✅ Works | GLB files cached |
| View map tiles | ✅ Works | 2000 tiles cached |
| View reviews | ✅ Works | Reviews API cached |
| Navigate routes | ✅ Works | Mapbox directions cached |

### ✅ TouristItineraryMap (Logged-in Users):
| Feature | Status | Why |
|---------|--------|-----|
| View saved itineraries | ✅ Works | Cached in SW + localStorage |
| Start tour | ✅ Works | All tour data cached |
| View pins & facades | ✅ Works | Same as Guest |
| View reviews | ✅ Works | Same as Guest |
| **Create/edit itinerary** | ❌ Online only | NetworkOnly (requires auth) |
| **Track progress** | ❌ Online only | NetworkOnly (real-time) |
| **Submit reviews** | ❌ Online only | NetworkOnly (mutations) |

---

## 🧪 Testing Offline Functionality

### Step 1: Prime the Cache (Online)
1. Visit your app while **online**
2. Navigate to `GuestItineraryMap` or `TouristItineraryMap`
3. Browse pins, itineraries, and reviews
4. Open DevTools → Application → Cache Storage
5. Verify caches exist:
   - `tour-pins-cache`
   - `tour-itineraries-cache`
   - `tour-reviews-cache`
   - `tour-static-assets` (facades/models)
   - `mapbox-tiles-cache`

### Step 2: Test Offline
1. DevTools → Application → Service Workers
2. Check **"Offline"** checkbox
3. **Navigate to map:**
   - `/guest-itinerary/:id`
   - `/tourist-itinerary/:id`
4. **Expected Results:**
   - ✅ Map loads with tiles
   - ✅ Pins appear on map
   - ✅ Click pin → Details load
   - ✅ Facades load from cache
   - ✅ Reviews load from cache
   - ✅ "Start Tour" button works

### Step 3: Verify Cache Contents
```javascript
// Browser console (while offline):

// Check pins
caches.open('tour-pins-cache').then(cache => 
  cache.keys().then(keys => {
    console.log('📍 Pins cached:', keys.length);
    keys.forEach(req => console.log(req.url));
  })
);

// Check itineraries
caches.open('tour-itineraries-cache').then(cache => 
  cache.keys().then(keys => {
    console.log('🗺️ Itineraries cached:', keys.length);
    keys.forEach(req => console.log(req.url));
  })
);

// Check facades
caches.open('tour-static-assets').then(cache => 
  cache.keys().then(keys => {
    console.log('🏛️ Facades cached:', keys.length);
    keys.forEach(req => console.log(req.url));
  })
);

// Check localStorage
Object.keys(localStorage)
  .filter(k => k.startsWith('guest_') || k.startsWith('user_'))
  .forEach(key => console.log('💾', key));
```

---

## 🔄 Cache Update Strategy

### API Data (StaleWhileRevalidate):
```
1. User requests /api/pins
2. Service Worker returns cached pins INSTANTLY
3. Service Worker fetches fresh data in BACKGROUND
4. Next request gets updated data
```

**Benefits:**
- ⚡ Instant load (0ms)
- 🔄 Always updating in background
- 📡 Works offline with last cached data

### Static Assets (CacheFirst):
```
1. User requests facade image
2. Service Worker checks cache first
3. If cached → Return immediately
4. If not cached → Fetch from network → Cache → Return
```

**Benefits:**
- ⚡ Instant load for repeated assets
- 💾 Minimal bandwidth usage
- 🚀 Perfect for unchanging content

---

## 📊 Cache Storage Estimate

```
tour-pins-cache:           ~2 MB   (150 JSON responses)
tour-itineraries-cache:    ~1 MB   (100 JSON responses)
tour-reviews-cache:        ~3 MB   (200 JSON responses)
tour-static-assets:        ~100 MB (facades + AR models)
mapbox-tiles-cache:        ~500 MB (2000 map tiles)
localStorage:              ~5 MB   (duplicate API data)
─────────────────────────────────────────────────────
TOTAL:                     ~611 MB (for full offline tour)
```

---

## 🐛 Troubleshooting

### Issue: "Map not loading offline"
**Solution:**
1. Ensure you visited the map **online first** (to prime cache)
2. Check cache exists: DevTools → Application → Cache Storage
3. Verify service worker is **activated**
4. Hard refresh (Ctrl+Shift+R) and try again

### Issue: "Pins not showing offline"
**Solution:**
1. Check `tour-pins-cache` has entries
2. Verify pattern matches your API URL
3. Check console for service worker errors
4. Clear all caches and re-prime (visit online)

### Issue: "Facades not loading offline"
**Solution:**
1. Check `tour-static-assets` cache
2. Verify S3 URLs match the regex pattern:
   ```
   d39zx5gyblzxjs.cloudfront.net
   d3des4qdhz53rp.cloudfront.net
   juander-frontend.s3.ap-southeast-2.amazonaws.com
   ```
3. Ensure CORS headers are correct on S3

### Issue: "Component not rendering offline"
**Solution:**
1. The React component IS cached in the JS bundle
2. Check network tab for 404s (missing API calls)
3. Verify all API endpoints are in runtimeCaching config
4. Check localStorage for fallback data

---

## 🔐 What's Protected (NOT Cached)

These endpoints remain **NetworkOnly** for security:

```javascript
❌ POST /api/itineraries      (Create - requires auth)
❌ PUT /api/itineraries/:id   (Update - requires auth)
❌ DELETE /api/itineraries/:id (Delete - requires auth)
❌ POST /api/reviews          (Submit review - requires auth)
❌ /api/visited-sites/*       (Tracking - real-time)
❌ /api/itinerary-progress/*  (Progress - real-time)
❌ /api/auth/*                (Authentication)
❌ /api/admin/*               (Admin operations)
```

**Why not cached:**
- Require authentication
- Mutate server state
- Need real-time updates
- Security-sensitive

---

## ✅ Summary

**GuestItineraryMap & TouristItineraryMap now have:**

✅ **Complete offline support** for viewing tours  
✅ **Instant loading** with StaleWhileRevalidate  
✅ **Full map functionality** with 2000 cached tiles  
✅ **All pin data, facades, and AR models** cached  
✅ **Double-layer caching** (Service Worker + localStorage)  
✅ **Background updates** when online  
✅ **Protected mutations** (NetworkOnly for safety)  

**Result:** Users can start and complete tours even if they go offline mid-tour! 🎉

---

**Last Updated:** November 2025  
**Service Worker:** Workbox + VitePWA  
**Cache Strategy:** Multi-tier (StaleWhileRevalidate + CacheFirst)
