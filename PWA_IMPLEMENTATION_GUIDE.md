# PWA Offline Caching Implementation Guide

## Overview
The Juander app now has full Progressive Web App (PWA) capabilities with comprehensive offline caching strategies. Users can install the app on their devices and use it even without an internet connection.

## Features Implemented

### 1. **Service Worker with Advanced Caching**
- **Network First**: API calls try network first, fall back to cache
- **Cache First**: Images, videos, 3D models, fonts load from cache first
- **Stale While Revalidate**: Mapbox tiles and CDN resources
- **50MB cache limit**: Supports large media files and 3D models

### 2. **Offline Detection**
- Real-time online/offline status indicator
- Automatic notification when connection is restored
- Visual feedback for offline mode

### 3. **PWA Install Prompt**
- Custom install prompt appears after 30 seconds
- Dismissible for 7 days
- Beautiful UI with clear call-to-action

### 4. **Automatic Updates**
- Service worker checks for updates every hour
- Prompts user to reload when new version is available
- Seamless update process

### 5. **Offline Fallback Page**
- Custom offline page with helpful information
- Auto-retry when connection is restored
- Lists available offline features

## Caching Strategies

### API Calls (`NetworkFirst`)
- **Pattern**: `http://localhost:5000/api/*`
- **Cache Duration**: 24 hours
- **Max Entries**: 100
- **Timeout**: 10 seconds
- **Behavior**: Tries network first, falls back to cache if offline

### Images (`CacheFirst`)
- **Pattern**: `.png, .jpg, .jpeg, .svg, .gif, .webp, .ico`
- **Cache Duration**: 30 days
- **Max Entries**: 200
- **Behavior**: Loads from cache first for instant display

### Videos (`CacheFirst`)
- **Pattern**: `.mp4, .webm, .ogg, .mov`
- **Cache Duration**: 30 days
- **Max Entries**: 50
- **Behavior**: Supports range requests for video streaming

### 3D Models (`CacheFirst`)
- **Pattern**: `.glb, .gltf`
- **Cache Duration**: 30 days
- **Max Entries**: 30
- **Behavior**: Caches 3D models for AR features

### Fonts (`CacheFirst`)
- **Pattern**: `.woff, .woff2, .ttf, .eot`
- **Cache Duration**: 1 year
- **Max Entries**: 30
- **Behavior**: Long-term caching for fonts

### Mapbox Tiles (`StaleWhileRevalidate`)
- **Pattern**: `https://api.mapbox.com/*`
- **Cache Duration**: 7 days
- **Max Entries**: 500
- **Behavior**: Shows cached tiles while fetching updates

### CDN Resources (`StaleWhileRevalidate`)
- **Pattern**: CDN domains (googleapis, unpkg, etc.)
- **Cache Duration**: 30 days
- **Max Entries**: 100
- **Behavior**: Caches external libraries and resources

## Files Created/Modified

### New Files
1. **`frontend/src/components/shared/OfflineIndicator.jsx`**
   - Shows online/offline status
   - Auto-hides when online

2. **`frontend/src/components/shared/PWAInstallPrompt.jsx`**
   - Custom install prompt
   - Dismissible with 7-day cooldown

3. **`frontend/src/hooks/useOfflineStorage.js`**
   - Custom hooks for offline data management
   - `useOfflineStorage`: Store data in localStorage
   - `useCachedAPI`: Cache API responses

4. **`frontend/public/offline.html`**
   - Beautiful offline fallback page
   - Auto-retry functionality

### Modified Files
1. **`frontend/vite.config.js`**
   - Enhanced PWA configuration
   - Comprehensive caching strategies
   - Workbox settings

2. **`frontend/src/main.jsx`**
   - Enhanced service worker registration
   - Update notifications
   - Periodic update checks

3. **`frontend/src/App.jsx`**
   - Added OfflineIndicator component
   - Added PWAInstallPrompt component

4. **`frontend/src/App.css`**
   - Added PWA animations
   - slideDown and slideUp keyframes

## How to Use

### For Development
```bash
cd frontend
npm run dev
```
The PWA will work in development mode for testing.

### For Production
```bash
cd frontend
npm run build
npm run preview
```

### Testing Offline Mode
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from the throttling dropdown
4. Refresh the page
5. App should work with cached content

### Testing PWA Installation
1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. Open in Chrome/Edge
4. Click install icon in address bar
5. Or wait 30 seconds for custom prompt

## Offline Capabilities

### What Works Offline:
✅ View previously loaded tour sites
✅ Access cached itineraries
✅ View downloaded images/videos
✅ View 3D models (if previously loaded)
✅ Navigate between pages
✅ View cached map tiles
✅ Access profile information
✅ View trip archives

### What Requires Internet:
❌ Creating new itineraries
❌ Uploading new content
❌ Real-time GPS navigation
❌ Posting reviews
❌ Chatbot functionality
❌ Emergency hotlines
❌ Fresh map tiles

## Best Practices for Users

1. **Pre-cache Content**: Browse all sites while online to cache them
2. **Download Itineraries**: Open itineraries before going offline
3. **Install the App**: Install as PWA for better offline experience
4. **Regular Updates**: Connect to internet periodically for updates

## Cache Management

### Automatic Cache Cleanup
- Old entries are automatically removed when limits are reached
- Least recently used (LRU) strategy
- Expired entries are removed automatically

### Manual Cache Clear
Users can clear cache through:
1. Browser settings
2. DevTools > Application > Clear storage
3. Uninstall and reinstall PWA

## Performance Optimizations

1. **Lazy Loading**: Components load on demand
2. **Code Splitting**: Separate chunks for admin/user/map
3. **Image Optimization**: WebP support, lazy loading
4. **Compression**: Gzip/Brotli in production
5. **Prefetching**: Critical resources prefetched

## Monitoring

### Service Worker Status
Check in DevTools:
- Application > Service Workers
- See registration status
- Force update
- Unregister if needed

### Cache Storage
Check in DevTools:
- Application > Cache Storage
- View all caches
- See cached files
- Clear individual caches

## Troubleshooting

### Service Worker Not Registering
1. Check HTTPS (required for PWA)
2. Check browser console for errors
3. Try hard refresh (Ctrl+Shift+R)
4. Clear browser cache

### Offline Mode Not Working
1. Verify service worker is active
2. Check cache storage has entries
3. Test with DevTools offline mode
4. Check network tab for failed requests

### Install Prompt Not Showing
1. Must be HTTPS or localhost
2. Must have valid manifest
3. Must have service worker
4. User hasn't dismissed recently

## Browser Support

### Full Support:
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 90+
- ✅ Safari 15+
- ✅ Opera 76+

### Partial Support:
- ⚠️ Safari iOS (no install prompt)
- ⚠️ Firefox Android (limited features)

## Security Considerations

1. **HTTPS Required**: PWA only works on HTTPS
2. **Cache Encryption**: Sensitive data should not be cached
3. **Token Management**: Auth tokens stored securely
4. **Content Security**: CSP headers recommended

## Future Enhancements

- [ ] Background sync for offline actions
- [ ] Push notifications
- [ ] Periodic background sync
- [ ] Share target API
- [ ] File system access
- [ ] Badge API for notifications

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)

## Support

For issues or questions:
1. Check browser console for errors
2. Review this guide
3. Check DevTools Application tab
4. Test in incognito mode
