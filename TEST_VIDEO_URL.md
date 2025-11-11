# Test Video URL in Production

## Test This URL Directly

Open this URL in your browser:
```
https://juander-frontend.s3.ap-southeast-2.amazonaws.com/uploads/media/1762847735936-1.mp4
```

This is the video from "Bahay Tsinoy" pin.

---

## What to Check:

### ✅ If Video Plays:
- CORS is working
- Content-Type is correct
- Issue is in the frontend code

### ❌ If Video Shows Error:
- Check browser console (F12) for CORS error
- Check Network tab for HTTP status code

---

## Browser Console Test

Open your **deployed website** in Chrome:
1. Press **F12** → Console tab
2. Paste this code:

```javascript
// Test video loading
const video = document.createElement('video');
video.src = 'https://juander-frontend.s3.ap-southeast-2.amazonaws.com/uploads/media/1762847735936-1.mp4';
video.crossOrigin = 'anonymous';
video.controls = true;
video.style.width = '400px';
document.body.appendChild(video);

video.addEventListener('loadeddata', () => {
  console.log('✅ Video loaded successfully!');
});

video.addEventListener('error', (e) => {
  console.error('❌ Video failed to load:', e);
  console.error('Error code:', video.error?.code);
  console.error('Error message:', video.error?.message);
});
```

This will:
- Create a video element
- Try to load the S3 video
- Show if it succeeds or fails

---

## Common Issues:

### Issue 1: CORS Not Applied Yet
**Solution:** Wait 5-10 minutes after updating S3 CORS, then clear browser cache

### Issue 2: Content-Type Wrong
**Check in S3 Console:**
1. Go to S3 → `juander-frontend` bucket
2. Navigate to `uploads/media/1762847735936-1.mp4`
3. Click on the file → **Properties** tab
4. Check **Metadata** → **Content-Type**
5. Should be: `video/mp4`

**If wrong:**
1. Click **Edit metadata**
2. Change **Content-Type** to `video/mp4`
3. Save

### Issue 3: S3 Bucket Policy
Your bucket might need public read access for videos.

**Check Bucket Policy:**
1. S3 Console → `juander-frontend` bucket
2. **Permissions** tab → **Bucket policy**
3. Should have:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::juander-frontend/*"
        }
    ]
}
```

### Issue 4: CloudFront Cache
If using CloudFront for S3, the cache might be stale.

**Solution:** Invalidate CloudFront cache for `/uploads/media/*`

---

## Network Tab Check

In your deployed site:
1. Press **F12** → **Network** tab
2. Navigate to a pin with video
3. Swipe to the video in carousel
4. Look for the video request (filter by "media" or ".mp4")

**Check:**
- **Request URL:** Should be the full S3 URL
- **Status Code:** Should be 200 (not 403, 404, or CORS error)
- **Response Headers:** Should include:
  - `access-control-allow-origin: https://d39zx5gyblzxjs.cloudfront.net`
  - `content-type: video/mp4`
  - `accept-ranges: bytes`

---

## Quick Fix: Check MediaCarousel in Production Build

The issue might be that the environment variable isn't being read correctly in production.

**Check the built file:**
The `VITE_API_BASE_URL` should be replaced during build time, not runtime.

If the video URL is being constructed as:
```
undefined/uploads/media/video.mp4
```

Then the environment variable isn't being loaded.

**Solution:** Rebuild and redeploy frontend after confirming `.env.production` is correct.
