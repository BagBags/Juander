# CSP Fix for 3D Model Texture Loading

## Problem
3D GLB models with embedded textures were failing to load with errors:
```
Connecting to 'blob:https://d39zx5gyblzxjs.cloudfront.net/[uuid]' 
violates the following Content Security Policy directive: "connect-src..."

THREE.GLTFLoader: Couldn't load texture blob:https://d39zx5gyblzxjs.cloudfront.net/[uuid]
```

## Root Cause
GLB files with embedded textures create **blob URLs** that Three.js loads using the Fetch API. These blob URLs need permission in **BOTH `connect-src` and `img-src`** CSP directives:
- **`connect-src blob:`** - Allows Fetch API to connect to blob URLs
- **`img-src blob:`** - Allows loading blob URLs as images

## Solution ✅

### Updated `index.html` CSP Configuration:

Added `blob:` and CloudFront domains to critical CSP directives:

1. **`connect-src blob:`** - **CRITICAL FIX!**
   ```
   connect-src 'self' ... blob: wss:
   ```
   **Without this, Fetch API cannot load blob texture URLs!**

2. **`img-src blob:`** - Required for texture images
   ```
   img-src 'self' data: blob: 
     https://d3des4qdhz53rp.cloudfront.net 
     https://d39zx5gyblzxjs.cloudfront.net 
     https://juander-frontend.s3.ap-southeast-2.amazonaws.com 
     https: http:
   ```
   
3. **`media-src`** - For GLB files
   ```
   media-src 'self' 
     https://juander-frontend.s3.ap-southeast-2.amazonaws.com 
     https://d3des4qdhz53rp.cloudfront.net 
     https://d39zx5gyblzxjs.cloudfront.net 
     blob: data:
   ```

4. **`script-src`** - For Draco decoder WASM
   ```
   script-src ... 
     https://www.gstatic.com/draco/ 
     blob:
   ```

## Why This Works

**GLB Texture Loading Flow:**
1. Three.js GLTFLoader fetches the GLB file from CloudFront (needs `connect-src` for HTTPS URLs)
2. Draco-compressed models fetch decoder WASM (needs `script-src` + `connect-src`)
3. **Embedded textures are extracted and create blob URLs**
4. **Fetch API connects to blob URLs to load texture data** (needs `connect-src blob:`) ← **THIS WAS MISSING!**
5. Blob URLs are loaded as images for materials (needs `img-src blob:`)

**Without `blob:` in `connect-src`:** 
```
Error: "Connecting to 'blob:...' violates Content Security Policy directive: connect-src..."
```
Textures fail to load → models render without textures

**With `blob:` in `connect-src` AND `img-src`:** All textures load properly ✅

## Testing

After applying this fix:
1. **Clear browser cache** completely
2. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console - no more CSP errors
4. 3D models should load with textures

## Files Modified
- `frontend/index.html` - CSP meta tag

## Key Takeaway
For GLB models with embedded textures:
- **Add `blob:` to `connect-src`** (CRITICAL - allows Fetch API to load blob texture URLs)
- Add `blob:` to `img-src` (allows loading blob URLs as images)
- Add CloudFront domains to `img-src`, `media-src`, and `connect-src` (for fetching GLB files)
