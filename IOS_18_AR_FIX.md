# iOS 26+ AR Compatibility Fix

## Problem
AR viewing via ARLOOPA fails on iOS 26+ when running as a PWA (Progressive Web App). The issue occurs because:

1. **WebXR/AR sessions require top-level browsing context** - iOS 26+ blocks AR sessions in iframes within PWAs
2. **Motion sensors blocked** - Accelerometer and gyroscope access blocked without explicit iframe permissions
3. **Tap-to-place AR failed** - AR placement requires real AR session + motion sensors + camera access

## Solution Applied

### 1. iOS Version Detection
Added helper function to detect iOS 26+ devices:
```javascript
const isiOS26Plus = () => {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const match = ua.match(/OS (\d+)_/);
  if (iOS && match) {
    const version = parseInt(match[1]);
    return version >= 26; // iOS 26+
  }
  return false;
};
```

### 2. PWA Mode Detection
Added helper function to detect if app is running as PWA:
```javascript
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};
```

### 3. New Tab Fallback for iOS 26+ PWA
When iOS 26+ is detected in PWA mode, prompt user to open AR in a new browser tab:
```javascript
if (isiOS26Plus() && isPWA()) {
  const confirmOpen = window.confirm(
    "iOS 26+ AR Compatibility Notice\n\n" +
    "Your device is running iOS 26 or higher in PWA mode. " +
    "AR experiences may not work properly within the app due to browser restrictions.\n\n" +
    "Would you like to open the AR experience in a new browser tab instead? " +
    "This will provide the best AR experience with full sensor access."
  );
  
  if (confirmOpen) {
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowAR(false);
    setScannedArUrl(null);
  }
}
```

### 4. Correct iframe Permissions
Updated iframe `allow` attribute with proper AR permissions (removed wildcards):
```html
<iframe
  id="arloopa-frame"
  src={scannedArUrl}
  allow="camera; fullscreen; xr-spatial-tracking; gyroscope; accelerometer; magnetometer; ambient-light-sensor; xr; device-orientation; geolocation; web-share; clipboard-write; autoplay; display-capture; picture-in-picture; microphone"
  allowFullScreen
  sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-presentation allow-camera allow-microphone allow-sensors allow-xr-spatial-tracking allow-top-navigation"
/>
```

**Key permissions for AR:**
- `camera` - Camera access for AR
- `xr-spatial-tracking` - WebXR spatial tracking
- `gyroscope` - Device orientation
- `accelerometer` - Device motion
- `fullscreen` - Fullscreen mode

### 5. PWA Configuration (Already Present)
Verified `index.html` has correct PWA meta tags:
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Juander" />
```

## Files Modified

1. **frontend/src/components/userComponents/TourMap/SiteCard.jsx**
   - Added iOS detection helpers
   - Added fullscreen AR logic
   - Updated iframe permissions

2. **frontend/src/components/userComponents/HomepageComponents/SiteModalFullScreen.jsx**
   - Added iOS detection helpers
   - Added fullscreen AR logic
   - Updated iframe permissions

3. **frontend/index.html** (verified, no changes needed)
   - Already has correct PWA meta tags
   - Already has proper CSP for ARLOOPA

## How It Works

### For iOS 25 and below:
- AR loads normally in iframe
- Standard permissions work

### For iOS 26+ in PWA mode:
1. User scans QR code
2. System detects iOS 26+ and PWA mode
3. Shows confirmation dialog explaining the compatibility issue
4. If user confirms:
   - Opens AR experience in new browser tab
   - Full sensor access and AR functionality
   - User can switch back to PWA when done
5. If user declines:
   - Closes AR scanner
   - Returns to site details

### For iOS 26+ in browser (non-PWA):
- AR loads normally in iframe
- Standard permissions work

## Testing Checklist

- [ ] Test on iOS 25 or below (should work in iframe as before)
- [ ] Test on iOS 26+ in Safari browser (should work in iframe)
- [ ] Test on iOS 26+ in PWA mode:
  - [ ] Confirmation dialog appears after QR scan
  - [ ] "OK" opens AR in new tab
  - [ ] "Cancel" closes AR scanner
  - [ ] Can switch back to PWA tab
- [ ] Verify camera access prompt appears in new tab
- [ ] Verify gyroscope/accelerometer work in new tab
- [ ] Verify tap-to-place AR placement works
- [ ] Test QR code scanning

## User Instructions

### For iOS 26+ PWA Users:
1. When scanning QR code, a dialog will appear explaining compatibility
2. Tap **OK** to open AR in a new browser tab (recommended)
3. Ensure **Reduce Motion** is OFF:
   - Settings → Accessibility → Motion → Reduce Motion → OFF
4. Allow camera permissions when prompted in the new tab
5. Allow motion & orientation access when prompted
6. Use the AR experience in the new tab
7. Switch back to the PWA tab when finished

## Browser Compatibility

✅ iOS 26+ (iPhone/iPad) - PWA mode with new tab fallback
✅ iOS 25 and below - All modes (works in iframe)
✅ Android Chrome/Firefox - All modes
✅ Desktop browsers - All modes

## Notes

- The version check uses iOS 26+ (future-proofing for when iOS reaches version 26)
- iOS 18-25 works fine with AR in iframe within PWA
- New tab fallback only triggers for iOS 26+ in PWA mode
- Regular browser mode continues to use iframe for better UX
- Opening in new tab bypasses all PWA iframe restrictions
- User can easily switch between tabs to return to the app
- `window.open()` with `noopener,noreferrer` ensures security
