# Mapbox GeolocateControl Heading Requirements

## Why the Blue Beam May Not Show

Mapbox's `showUserHeading: true` only displays the blue cone/beam when **specific conditions** are met:

### Requirements for Heading Display

1. **Device Must Be Moving**
   - GPS provides heading data only when device is in motion
   - Stationary devices won't show heading (no movement = no direction)
   - Minimum speed threshold: ~1-2 meters per second

2. **GPS Must Provide Heading**
   - `coords.heading` must be available from GPS
   - Not all GPS signals include heading data
   - Heading accuracy depends on GPS quality

3. **High Accuracy Mode**
   - `enableHighAccuracy: true` must be set
   - Uses GPS instead of network location
   - Better heading data but higher battery usage

4. **Continuous Tracking**
   - `trackUserLocation: true` must be enabled
   - Control must be in "active" state (blue button)
   - Tracking must be continuous, not one-time

## Current Implementation

```javascript
<GeolocateControl
  ref={geolocateControlRef}
  position="top-right"
  positionOptions={{
    enableHighAccuracy: true,  // ✓ GPS mode
    maximumAge: 0,            // ✓ Fresh data
    timeout: 10000            // ✓ Long timeout
  }}
  trackUserLocation={true}     // ✓ Continuous tracking
  showUserHeading={true}       // ✓ Show heading when available
  showAccuracyCircle={true}    // ✓ Show accuracy
  showUserLocation={true}      // ✓ Show blue dot
  fitBoundsOptions={{ maxZoom: 18 }}
  onGeolocate={handleGeolocate}
  onError={handleGeolocateError}
/>
```

## Testing the Heading

### To See the Blue Beam:

1. **Open the app on a mobile device** (not desktop)
2. **Click the geolocate button** (or wait for auto-trigger)
3. **Grant location permission**
4. **Start walking** - Move at least 2-3 meters
5. **Keep moving** - Heading appears after movement is detected
6. **The blue cone will appear** pointing in your direction of travel

### What You'll See:

- **Stationary**: Blue dot only (no cone)
- **Moving**: Blue dot + blue cone pointing forward
- **Turning**: Cone rotates to match your new direction

## Why Desktop Won't Show Heading

- Desktop/laptop GPS doesn't provide heading
- No movement detection on stationary computers
- Heading requires mobile device with GPS

## Device Compatibility

### Works:
- ✓ iOS devices (iPhone/iPad with GPS)
- ✓ Android phones/tablets
- ✓ Any mobile device with GPS

### Doesn't Work:
- ✗ Desktop computers
- ✗ Laptops without GPS
- ✗ Stationary devices
- ✗ Devices in low-accuracy mode

## Alternative: Device Compass

If you need heading while stationary, you would need to:
1. Use DeviceOrientationEvent (compass)
2. Create custom heading indicator
3. Overlay on Mapbox marker

But Mapbox's built-in `showUserHeading` **only uses GPS heading**, not device compass.

## Recommendation

**For Guest Itinerary Map**: Keep the current Mapbox implementation
- Simple, clean, native
- Works perfectly when user is walking (which is the expected use case)
- No custom code needed
- Professional appearance

**For Tourist Itinerary Map**: Consider custom implementation if you need:
- Heading while stationary
- Device compass support
- More control over appearance

## Summary

The blue beam **will show** when:
- User is on a mobile device
- User grants location permission
- User starts walking/moving
- GPS provides heading data

The blue beam **won't show** when:
- User is stationary
- On desktop/laptop
- GPS doesn't provide heading
- In low-accuracy mode

This is **normal Mapbox behavior** and matches Google Maps functionality.
