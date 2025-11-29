# Fix Facebook/Messenger 403 Forbidden Error

## Problem
When sharing your domain link (https://juanderintra.com) to Facebook Messenger, it shows "403 Forbidden" error.

## Root Cause
1. **Missing Open Graph Meta Tags** - Facebook's crawler couldn't read site metadata
2. **No Social Media Preview Image** - SVG images don't work well with Facebook
3. **Possible CloudFront/S3 blocking** - May need to whitelist Facebook's crawlers

## Solution Applied

### ✅ 1. Added Open Graph Meta Tags
Added to `frontend/index.html`:

```html
<!-- Open Graph Meta Tags for Facebook/Messenger -->
<meta property="og:title" content="Juander - Intramuros Tour Guide" />
<meta property="og:description" content="Explore Intramuros with an interactive AR tour guide..." />
<meta property="og:image" content="https://d39zx5gyblzxjs.cloudfront.net/JuanderBG.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta property="og:url" content="https://juanderintra.com" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Juander" />
<meta property="og:locale" content="en_US" />
```

### ✅ 2. Added Twitter Card Tags
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Juander - Intramuros Tour Guide" />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://d39zx5gyblzxjs.cloudfront.net/JuanderBG.png" />
```

### ✅ 3. Used PNG Image for Preview
Changed from SVG to PNG for better Facebook compatibility:
- **Image**: `JuanderBG.png`
- **Dimensions**: 1200x630 (Facebook recommended)
- **Format**: PNG (not SVG)

## Next Steps - If Still Getting 403

### Option 1: Check CloudFront Settings
1. Go to AWS Console → CloudFront
2. Select distribution `E2J47HTDXC2VFF`
3. Go to **Behaviors** tab
4. Check if WAF is enabled and blocking crawlers

### Option 2: Add CloudFront Response Headers Policy
Create a custom policy to allow social media crawlers:

```
Access-Control-Allow-Origin: *
X-Frame-Options: ALLOWALL
```

### Option 3: Check S3 Bucket Policy
Verify `juander-frontend` bucket allows public reads:

```json
{
  "Sid": "PublicReadGetObject",
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::juander-frontend/*"
}
```

### Option 4: Add User-Agent Whitelist (Backend)
If you're using rate limiting or bot protection, whitelist Facebook's crawler:

Add to `backend/server.js` before CORS:
```javascript
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  
  // Allow Facebook/social media crawlers
  const isSocialBot = /facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|LinkedInBot/i.test(userAgent);
  
  if (isSocialBot) {
    res.set('X-Robots-Tag', 'index, follow');
  }
  
  next();
});
```

## Testing

### 1. Facebook Debugger
Test your link here: https://developers.facebook.com/tools/debug/

Steps:
1. Enter URL: `https://juanderintra.com`
2. Click "Debug"
3. Check if Open Graph tags are detected
4. Click "Scrape Again" to refresh cache

### 2. Clear Facebook Cache
If still showing old cached data:
1. Use Facebook Debugger
2. Click "Scrape Again" button multiple times
3. Wait 5-10 minutes for cache to clear

### 3. Test Messenger Share
1. Send link in Messenger
2. Should now show preview with:
   - Title: "Juander - Intramuros Tour Guide"
   - Description: Tour guide info
   - Image: JuanderBG.png

## Deployment

After making changes:

```bash
cd frontend
npm run build

# If using S3 + CloudFront
aws s3 sync dist/ s3://juander-frontend/ --delete
aws cloudfront create-invalidation --distribution-id E2J47HTDXC2VFF --paths "/*"
```

## Troubleshooting

### Still Getting 403?

**Check 1: Is your domain actually working?**
- Open https://juanderintra.com in browser
- If you see the site, domain is working

**Check 2: Is CloudFront blocking?**
- Try sharing the CloudFront URL directly: `https://d39zx5gyblzxjs.cloudfront.net`
- If this works but domain doesn't, DNS issue

**Check 3: Is S3 blocking?**
- Check S3 bucket "Block Public Access" settings
- Should be: ALL DISABLED for public website

**Check 4: Is image accessible?**
- Open: `https://d39zx5gyblzxjs.cloudfront.net/JuanderBG.png`
- Should load the image directly
- If 403, image file has wrong permissions

## Files Modified
- ✅ `frontend/index.html` - Added Open Graph and Twitter Card meta tags

## Additional Resources
- [Facebook Open Graph Documentation](https://developers.facebook.com/docs/sharing/webmasters/)
- [Facebook Debugger Tool](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
