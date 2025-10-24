# Photobooth Border Asset Standard

## Overview
This document defines the standard for Border Assets in the Photobooth feature, ensuring consistent behavior across all mobile devices regardless of screen size or aspect ratio.

## Border Asset Specifications

### What are Border Assets?
Border assets are full-screen decorative frames/borders that overlay the entire camera view in the photobooth. Unlike face-tracking filters (eyes, head, etc.), border assets:
- Cover the entire screen
- Do not track facial features
- Remain fixed in position
- Automatically adapt to any screen size

### Asset Requirements

#### 1. **Image Dimensions**
- **Recommended Base Size**: 1080 x 1920 pixels (9:16 aspect ratio)
- **Format**: PNG with transparency support
- **File Size**: Optimized for web (< 500KB recommended)

#### 2. **Design Guidelines**
- Design with a **transparent center area** where the user's face/body will be visible
- Border decorations should be on the edges/corners
- Consider safe zones for UI elements (top 80px, bottom 150px)
- Test design at multiple aspect ratios (16:9, 9:16, 4:3, etc.)

#### 3. **Category Configuration**
When uploading border assets to the backend, set the category to **`"border"`**:

```javascript
{
  name: "Border Name",
  category: "border",  // ← Important!
  image: "/path/to/border.png",
  value: "border-name"
}
```

## Technical Implementation

### How Border Assets Work

#### 1. **Automatic Screen Adaptation**
Border assets automatically adapt to the device's screen dimensions:
- Width: Uses full screen width (`window.innerWidth`)
- Height: Uses full screen height (`window.innerHeight`)
- Maximum width: 430px (mobile-optimized)
- Maximum height: 932px (mobile-optimized)

#### 2. **Responsive Behavior**
The system handles:
- **Device rotation**: Automatically adjusts when switching portrait ↔ landscape
- **Window resize**: Updates dimensions in real-time
- **Different screen sizes**: Scales appropriately for all mobile devices

#### 3. **Rendering Properties**
Border assets use specific rendering settings:
```javascript
{
  useFullScreen: true,        // Covers entire screen
  widthRatio: 1.0,           // 100% of screen width
  heightRatio: 1.0,          // 100% of screen height
  anchorPoint: 'center',     // Centered on screen
  maintainAspectRatio: false // Stretches to fit screen
}
```

### CSS Object-Fit Behavior
- **Border category**: Uses `object-fit: cover` to fill the entire screen
- **Other categories**: Use `object-fit: contain` to maintain aspect ratio

## Usage Examples

### Example 1: Creating a Border Asset
```javascript
// Backend: photoboothFilterController.js
const newBorder = {
  name: "Sunflower Border",
  category: "border",
  image: "https://example.com/sunflower-border.png",
  value: "sunflower-border",
  label: "Sunflower Border"
};
```

### Example 2: Border Asset File Structure
```
/uploads/photobooth/borders/
  ├── sunflower-border.png      (1080 x 1920)
  ├── christmas-border.png      (1080 x 1920)
  └── birthday-border.png       (1080 x 1920)
```

## Comparison: Border vs Frame vs Other Categories

| Category | Screen Coverage | Face Tracking | Rotation | Aspect Ratio |
|----------|----------------|---------------|----------|--------------|
| **border** | Full screen | No | No | Stretches to fit |
| **frame** | Full screen | No | No | Maintains ratio |
| **eyes** | Partial | Yes | Yes | Maintains ratio |
| **head** | Partial | Yes | Yes | Maintains ratio |
| **general** | Partial | Yes | Yes | Maintains ratio |

## Testing Checklist

When adding new border assets, verify:
- [ ] Asset displays correctly on portrait mode (9:16)
- [ ] Asset displays correctly on landscape mode (16:9)
- [ ] Asset covers entire screen without gaps
- [ ] Transparent center area shows camera feed
- [ ] Asset loads within 2 seconds
- [ ] Captured photo includes the border correctly
- [ ] No distortion or pixelation on different devices

## Common Issues & Solutions

### Issue 1: Border doesn't cover full screen
**Solution**: Ensure category is set to `"border"` (not "frame" or other)

### Issue 2: Border is distorted
**Solution**: Use PNG format with transparent background. Design should work at various aspect ratios.

### Issue 3: Border appears behind other elements
**Solution**: Border assets automatically have z-index of 80. This is correct - they should be behind face-tracking overlays.

### Issue 4: Border doesn't update on device rotation
**Solution**: The system automatically handles this. If not working, check that resize event listeners are active in Photobooth.jsx.

## File Locations

### Frontend Files
- **Component**: `/frontend/src/components/userComponents/photoboothComponents/Photobooth.jsx`
- **Overlay Logic**: `/frontend/src/components/userComponents/photoboothComponents/overlay.jsx`
- **Styles**: `/frontend/src/Photobooth.css`

### Backend Files
- **Controller**: `/backend/controllers/photoboothFilterController.js`
- **Model**: `/backend/models/photoboothFilterModel.js`
- **Routes**: `/backend/routes/photoboothFilterRoute.js`
- **Uploads**: `/backend/uploads/photobooth/`

## API Reference

### Get All Filters (Including Borders)
```http
GET /api/photobooth/filters
```

**Response:**
```json
[
  {
    "_id": "...",
    "name": "Sunflower Border",
    "category": "border",
    "image": "https://...",
    "value": "sunflower-border",
    "label": "Sunflower Border"
  }
]
```

### Upload New Border Asset
```http
POST /api/photobooth/filters
Content-Type: multipart/form-data

{
  "name": "Border Name",
  "category": "border",
  "image": [file]
}
```

## Best Practices

1. **Design for Multiple Aspect Ratios**
   - Test your border on both tall (9:16) and wide (16:9) screens
   - Keep important decorative elements away from edges

2. **Optimize File Size**
   - Compress PNG files without losing quality
   - Target < 500KB for fast loading

3. **Use Transparency Wisely**
   - Central area should be fully transparent
   - Border decorations can have varying opacity

4. **Consider UI Elements**
   - Top 80px: Reserved for back button and controls
   - Bottom 150px: Reserved for filter slider and capture button

5. **Test on Real Devices**
   - Emulators may not accurately represent all screen sizes
   - Test on at least 3 different devices

## Version History

- **v1.0** (Current): Initial border asset standard with automatic screen adaptation
  - Dynamic screen dimension detection
  - Responsive to device rotation
  - Support for multiple aspect ratios
  - Optimized rendering with object-fit: cover

---

**Last Updated**: October 22, 2025  
**Maintained By**: Development Team
