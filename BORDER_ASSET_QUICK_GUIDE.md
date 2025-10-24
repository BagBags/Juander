# Border Asset Quick Guide

## 🎯 Quick Start

### What You Need to Know
Border assets in the Photobooth automatically adapt to **any mobile device screen size** - no manual configuration needed!

## 📱 How It Works

### Automatic Adaptation
Your border asset (e.g., 1080 x 1920) will automatically:
- ✅ Stretch to fit the device's screen width
- ✅ Stretch to fit the device's screen height  
- ✅ Update when device rotates (portrait ↔ landscape)
- ✅ Work on all screen sizes (iPhone, Android, tablets)

### Example
```
Your Asset: 1080 x 1920 (9:16 ratio)

iPhone 14 Pro:     393 x 852  → Border adapts automatically ✓
Samsung Galaxy:    412 x 915  → Border adapts automatically ✓
iPad Mini:         768 x 1024 → Border adapts automatically ✓
```

## 🎨 Creating Border Assets

### 1. Design Requirements
- **Size**: 1080 x 1920 pixels (recommended)
- **Format**: PNG with transparency
- **Center**: Keep transparent for camera view
- **Edges**: Add your decorative border elements

### 2. Upload to Backend
Set the category to **`"border"`**:

```javascript
{
  name: "My Border",
  category: "border",  // ← This is the key!
  image: "/path/to/border.png"
}
```

### 3. That's It! 🎉
The system handles everything else automatically.

## 🔧 Technical Details

### What Happens Behind the Scenes

1. **Screen Detection**
   ```javascript
   width: window.innerWidth   // Gets device width
   height: window.innerHeight // Gets device height
   ```

2. **Responsive Updates**
   - Listens for `resize` events
   - Listens for `orientationchange` events
   - Updates dimensions in real-time

3. **Rendering**
   - Uses `object-fit: cover` to fill screen
   - Positioned at `left: 0, top: 0`
   - No rotation or face tracking

## 📊 Category Comparison

| Category | Use Case | Screen Coverage | Face Tracking |
|----------|----------|-----------------|---------------|
| **border** | Full-screen frames | 100% | No |
| frame | Decorative frames | 100% | No |
| eyes | Glasses, masks | Partial | Yes |
| head | Hats, crowns | Partial | Yes |

## ✅ Testing Your Border

1. Upload your border asset with `category: "border"`
2. Open Photobooth on mobile device
3. Select your border from the filter slider
4. Verify:
   - [ ] Border covers entire screen
   - [ ] No gaps or white space
   - [ ] Camera view visible in center
   - [ ] Rotates correctly

## 🐛 Troubleshooting

**Border doesn't cover full screen?**
→ Check that `category` is set to `"border"` (not "frame")

**Border looks stretched?**
→ This is expected! Design should work at multiple aspect ratios

**Border not updating on rotation?**
→ Refresh the page - resize listeners should be active

## 📁 Example Border Asset

```
sunflower-border.png (1080 x 1920)
├─ Top: Sunflower decorations
├─ Center: Transparent area (for camera)
└─ Bottom: More sunflower decorations

Backend Entry:
{
  "name": "Sunflower Border",
  "category": "border",
  "image": "https://example.com/sunflower-border.png",
  "value": "sunflower-border"
}
```

## 🎓 Key Takeaways

1. **Always use `category: "border"`** for full-screen border assets
2. **Design works at any aspect ratio** - system handles stretching
3. **No manual configuration needed** - automatic screen adaptation
4. **Test on real devices** for best results

---

**Need more details?** See `PHOTOBOOTH_BORDER_ASSET_STANDARD.md`
