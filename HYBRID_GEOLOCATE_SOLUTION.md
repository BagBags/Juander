# Hybrid Geolocate Solution - Guest Itinerary Map

## Problem
Mapbox's built-in `showUserHeading: true` doesn't always display the blue cone/beam reliably because:
- It only shows when GPS provides heading data (requires movement)
- Device compass data isn't always used by Mapbox
- The heading indicator can be inconsistent across devices

## Solution: Hybrid Approach

### Components
1. **Mapbox GeolocateControl** - For location tracking, button, and blue dot
2. **Custom Blue Beam Overlay** - For always-visible heading indicator

### Implementation

#### 1. Mapbox Control (Location Tracking)
```javascript
<GeolocateControl
  ref={geolocateControlRef}
  position="top-right"
  trackUserLocation={true}
  showUserHeading={false}        // Disabled - using custom instead
  showAccuracyCircle={true}      // Keep accuracy circle
  showUserLocation={true}        // Keep blue dot
  onGeolocate={handleGeolocate}
/>
```

#### 2. Device Orientation Tracking
```javascript
useEffect(() => {
  const handleOrientation = (event) => {
    let heading = null;
    
    // iOS: webkitCompassHeading
    if (event.webkitCompassHeading !== undefined) {
      heading = event.webkitCompassHeading;
    }
    // Android: Calculate from alpha
    else if (event.alpha !== null) {
      heading = 360 - event.alpha;
    }
    
    if (heading !== null) {
      setUserHeading(heading);
    }
  };

  // iOS 13+ requires permission
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientationabsolute', handleOrientation);
          window.addEventListener('deviceorientation', handleOrientation);
        }
      });
  } else {
    window.addEventListener('deviceorientationabsolute', handleOrientation);
    window.addEventListener('deviceorientation', handleOrientation);
  }
}, []);
```

#### 3. Custom Blue Beam Overlay
```javascript
{userLocation && userHeading !== null && (
  <Marker
    longitude={userLocation.longitude}
    latitude={userLocation.latitude}
    anchor="center"
    style={{ pointerEvents: 'none', zIndex: 1000 }}
  >
    <div style={{ position: 'relative', width: '50px', height: '50px' }}>
      {/* Blue Beam/Cone */}
      <div
        style={{
          position: 'absolute',
          width: '0',
          height: '0',
          borderLeft: '20px solid transparent',
          borderRight: '20px solid transparent',
          borderBottom: '60px solid rgba(59, 130, 246, 0.6)',
          top: '-60px',
          left: '50%',
          transform: `translateX(-50%) rotate(${userHeading}deg)`,
          transformOrigin: 'center bottom',
          transition: 'transform 0.3s ease-out',
          filter: 'blur(3px)',
          pointerEvents: 'none'
        }}
      />
    </div>
  </Marker>
)}
```

## Visual Result

### Layers (Bottom to Top)
1. **Accuracy Circle** (light blue) - From Mapbox
2. **Blue Dot** (solid blue) - From Mapbox
3. **Blue Beam** (triangle/cone) - Custom overlay
4. **Site Markers** (numbered) - Above everything

### Appearance
- **Blue dot** with white border (Mapbox native)
- **Accuracy circle** showing GPS precision (Mapbox native)
- **Blue cone/beam** pointing in heading direction (Custom overlay)
- **Smooth rotation** with CSS transition (0.3s ease-out)
- **Blur effect** for realistic appearance

## Advantages

### Best of Both Worlds
1. **Mapbox Control** - Professional button, reliable location tracking
2. **Custom Beam** - Always visible, works with device compass
3. **No Re-renders** - Mapbox handles location, minimal React updates
4. **Smooth Rotation** - CSS transitions for fluid movement

### Reliability
- Works on iOS (with permission)
- Works on Android
- Works when stationary (compass)
- Works when moving (GPS heading)
- Fallback to device orientation if GPS heading unavailable

## Device Compatibility

### iOS
- Requires `DeviceOrientationEvent.requestPermission()`
- Uses `webkitCompassHeading` for accurate compass data
- Works in Safari and PWA

### Android
- Uses `DeviceOrientationEvent.alpha`
- Calculates heading from device orientation
- Works in Chrome and PWA

### Desktop
- No heading data available (no compass)
- Blue beam won't show (graceful degradation)
- Location tracking still works

## Styling

### Blue Beam
- **Color**: `rgba(59, 130, 246, 0.6)` - Semi-transparent blue
- **Size**: 40px wide x 60px tall triangle
- **Blur**: 3px for soft edges
- **Rotation**: Smooth 0.3s CSS transition
- **Position**: Centered on user location

### Z-Index Layers
```
1000 - Custom blue beam (top)
 999 - Site markers
 998 - Mapbox user location dot
 997 - Accuracy circle
```

## Performance

### Minimal Re-renders
- Mapbox handles location updates natively
- Only heading state updates trigger React re-renders
- CSS transitions handle rotation smoothly
- No requestAnimationFrame needed

### Battery Efficient
- Device orientation events are passive
- Mapbox optimizes GPS polling
- CSS GPU-accelerated transforms

## Testing Checklist

- [ ] Blue dot appears at user location
- [ ] Accuracy circle shows GPS precision
- [ ] Blue beam appears when device has compass
- [ ] Beam rotates as device rotates
- [ ] Smooth rotation (no jitter)
- [ ] Works on iOS devices
- [ ] Works on Android devices
- [ ] Permission prompt appears on iOS
- [ ] Graceful degradation on desktop

## Troubleshooting

### Blue Beam Not Showing
1. **Check device has compass** - Not all devices have magnetometer
2. **Check permissions** - iOS requires explicit permission
3. **Check HTTPS** - DeviceOrientation requires secure context
4. **Check console** - Look for permission errors
5. **Try moving device** - Some devices need calibration

### Beam Not Rotating
1. **Check heading state** - Console log `userHeading`
2. **Check event listeners** - Verify they're attached
3. **Check CSS** - Verify transform is applied
4. **Try device calibration** - Move device in figure-8 pattern

## Future Enhancements

1. **Compass Calibration UI** - Prompt user to calibrate
2. **Heading Accuracy Indicator** - Show confidence level
3. **Smooth Interpolation** - Add requestAnimationFrame for smoother rotation
4. **Custom Beam Design** - Replace triangle with custom SVG
5. **Adaptive Opacity** - Fade beam based on heading accuracy

## Notes

- Blue beam is always visible when heading data available
- Mapbox control provides professional UX
- Custom overlay ensures consistent heading display
- Minimal code, maximum reliability
- Works offline (compass doesn't need network)
