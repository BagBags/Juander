# PWA Guest Mode Offline Guide

## Overview
The PWA offline functionality is specifically configured for **Guest Mode** only. This ensures that public content (tour sites, reviews, admin-created itineraries) is available offline, while keeping authenticated user data secure and requiring online access.

## What Works Offline in Guest Mode

### ✅ Cached Content
- **Tour Sites/Pins** - All public tour locations
- **Site Images & Videos** - Media for tour sites
- **Reviews** - Public reviews for sites
- **Admin-Created Itineraries** - Pre-made tour itineraries
- **Map Tiles** - Mapbox tiles for navigation
- **3D Models** - AR models for sites
- **App Assets** - HTML, CSS, JavaScript, fonts

### ❌ Requires Online (Not Cached)
- **User Authentication** - Login/Signup
- **User Profile** - Personal account data
- **User-Created Itineraries** - Personal itineraries
- **Admin Dashboard** - Admin-only features
- **Create/Edit Content** - Any POST/PUT/DELETE operations
- **User-Specific Data** - Requires authentication

## Configuration Details

### API Endpoint Caching

**Cached (Guest Mode):**
```javascript
/api/pins/*              // Tour sites
/api/reviews/*           // Site reviews  
/api/itineraries/admin/* // Admin-created itineraries
```

**Not Cached (Authenticated):**
```javascript
/api/admin/*            // Admin endpoints
/api/auth/*             // Authentication
/api/users/*            // User data
/api/userItineraries/*  // User itineraries
```

### Route Access Offline

**Allowed Offline:**
- `/guest-itinerary` - Guest itinerary viewer (main offline route)
- `/` - Landing page
- `/login` - Login page (UI only)
- `/signup` - Signup page (UI only)

**Blocked Offline:**
- `/admin/*` - All admin routes
- `/create-itinerary` - User itinerary creation
- `/profile` - User profile
- `/homepage` - User homepage

## PWA Manifest Settings

```javascript
{
  name: "Juander - Intramuros Tour Guide",
  short_name: "Juander",
  start_url: "/guest-itinerary",  // Opens to guest mode
  theme_color: "#f04e37",          // Intramuros red
  display: "standalone"
}
```

## Testing Guest Mode Offline

### Step 1: Load Content While Online
```bash
# Start the app
npm run dev

# Visit guest itinerary page
http://localhost:5173/guest-itinerary
```

Browse through:
1. All tour sites
2. Site images and videos
3. Reviews
4. Admin-created itineraries
5. Map with pins

### Step 2: Go Offline
1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Select **"Offline"** from dropdown
4. Or: Application > Service Workers > Check "Offline"

### Step 3: Test Offline Access
```
✅ Refresh /guest-itinerary → Works
✅ View cached tour sites → Works
✅ See images/videos → Works from cache
✅ Read reviews → Works from cache
✅ View map → Cached tiles work
✅ Navigate between sites → Works

❌ Try /homepage → Blocked
❌ Try /admin → Blocked
❌ Try /create-itinerary → Blocked
❌ Try to login → UI shows but can't authenticate
```

## Cache Duration

| Content Type | Duration | Max Entries |
|--------------|----------|-------------|
| Guest API Data | 7 days | 200 |
| Images | 30 days | 200 |
| Videos | 30 days | 50 |
| 3D Models | 30 days | 30 |
| Fonts | 1 year | 30 |
| Map Tiles | 7 days | 500 |
| CDN Resources | 30 days | 100 |

## User Experience Flow

### First Visit (Online)
1. User opens app
2. Service worker installs
3. User browses guest itinerary
4. Content gets cached automatically
5. Install prompt appears (optional)

### Subsequent Visit (Offline)
1. User opens app (offline)
2. App loads from cache instantly
3. Guest itinerary page shows cached content
4. Can browse all previously viewed sites
5. Offline indicator shows at top

### Back Online
1. Connection restored
2. "Back online!" notification appears
3. Fresh content fetched in background
4. Cache updated automatically

## Installation

When users install the PWA:
- **Start URL**: Opens directly to `/guest-itinerary`
- **Icon**: Juander logo
- **Display**: Standalone (no browser UI)
- **Orientation**: Portrait (mobile-optimized)

## Security Considerations

### Why Guest Mode Only?

1. **Data Privacy**: User data requires authentication
2. **Security**: Tokens shouldn't be cached offline
3. **Data Integrity**: User actions need server validation
4. **Public Content**: Guest content is meant to be public

### What's Protected

- ❌ User authentication tokens not cached
- ❌ Personal itineraries not cached
- ❌ Admin data not cached
- ❌ User profiles not cached
- ✅ Only public, non-sensitive content cached

## Development vs Production

### Development (`npm run dev`)
```javascript
devOptions: {
  enabled: true,  // Service worker works in dev
  type: 'module',
}
```

### Production (`npm run build`)
```bash
npm run build
npm run preview

# Test at: http://localhost:4173
```

Production build has better caching and performance.

## Troubleshooting

### Service Worker Not Caching Guest Content

**Check:**
1. Visit `/guest-itinerary` while online
2. Browse through sites
3. Check DevTools > Application > Cache Storage
4. Should see `guest-api-cache` with entries

### Offline Mode Not Working

**Solutions:**
1. Clear cache: DevTools > Application > Clear storage
2. Unregister service worker
3. Reload page while online
4. Browse content to cache it
5. Try offline again

### Content Not Loading Offline

**Verify:**
```javascript
// In DevTools Console
caches.open('guest-api-cache').then(cache => {
  cache.keys().then(keys => {
    console.log('Cached URLs:', keys.map(k => k.url));
  });
});
```

Should show cached API endpoints for pins, reviews, etc.

## Benefits of Guest-Only Offline

### For Users
- 📱 Browse tour sites without internet
- 🗺️ View maps with cached tiles
- 📸 See images and videos offline
- ⭐ Read reviews offline
- 🎯 Access curated itineraries

### For Developers
- 🔒 Better security (no cached auth)
- 💾 Smaller cache size
- ⚡ Faster performance
- 🎯 Focused use case
- 🛡️ Protected user data

### For System
- 📊 Reduced server load
- 🌐 Better offline UX
- 💰 Lower bandwidth costs
- 🚀 Faster guest experience

## Future Enhancements

Potential additions (if needed):
- [ ] Background sync for guest feedback
- [ ] Push notifications for new sites
- [ ] Offline analytics tracking
- [ ] Share target API for itineraries
- [ ] Periodic background sync

## Support

### Check Service Worker Status
```
DevTools > Application > Service Workers
Status: "activated and running"
```

### Check Cache Contents
```
DevTools > Application > Cache Storage
- workbox-precache (app files)
- guest-api-cache (API responses)
- image-cache (images)
- video-cache (videos)
- 3d-model-cache (3D models)
- font-cache (fonts)
- mapbox-cache (map tiles)
```

### Verify Offline Access
```
1. Load /guest-itinerary online
2. Browse sites
3. Go offline (DevTools)
4. Refresh page
5. Should work perfectly!
```

## Summary

✅ **Guest Mode**: Full offline support
❌ **User Mode**: Requires online access
🔒 **Admin Mode**: Requires online access
🎯 **Focus**: Public tourism content offline
🚀 **Performance**: Optimized for guest experience

The PWA is specifically designed to enhance the guest/tourist experience by making all public tour content available offline, while keeping user and admin features secure and online-only.
