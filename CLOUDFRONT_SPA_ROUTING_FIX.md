# CloudFront SPA Routing Fix - White Screen on Refresh

## Issue
White screen when refreshing on nested routes like `/Profile/Account`, `/AdminProfile/Birthday`, etc.

## Root Cause
Single Page Applications (SPAs) need special configuration because all routes are handled client-side by React Router, but the server doesn't know about these routes.

---

## Complete Fix Checklist

### ✅ Step 1: S3 Bucket - Static Website Hosting

1. Go to S3 Console → **juander-frontend** bucket
2. Click **Properties** tab
3. Scroll to **Static website hosting**
4. Click **Edit**
5. Select **Enable**
6. **Index document:** `index.html`
7. **Error document:** `index.html`
8. Click **Save changes**

**Why:** This makes S3 return `index.html` for all paths.

---

### ✅ Step 2: CloudFront Error Pages (Already Done)

You already have:
- 403 → /index.html (200 response) ✅
- 404 → /index.html (200 response) ✅

---

### ✅ Step 3: CloudFront Origin Settings

1. CloudFront Console → `d39zx5gyblzxjs.cloudfront.net`
2. **Origins** tab
3. Select your S3 origin → Click **Edit**
4. **Origin domain** should be one of:
   - `juander-frontend.s3-website-ap-southeast-2.amazonaws.com` (if using website hosting)
   - OR `juander-frontend.s3.ap-southeast-2.amazonaws.com` (direct S3)

**If using website hosting URL:** Make sure Protocol is **HTTP only**
**If using direct S3:** Make sure you have error pages configured (you do)

5. Click **Save changes**

---

### ✅ Step 4: CloudFront Default Root Object

1. Same distribution → **General** tab
2. Click **Edit**
3. **Default root object:** `index.html`
4. Click **Save changes**

---

### ✅ Step 5: Invalidate Cache (Already Done)

You already invalidated `/*` ✅

**But:** Make sure you wait **5 full minutes** after invalidation before testing!

---

### ✅ Step 6: Clear Browser Cache

CloudFront cache is cleared, but your **browser** also caches!

**Hard refresh:**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Or test in incognito/private window**

---

## Testing After All Steps

### Test 1: Direct URL
Open directly: `https://d39zx5gyblzxjs.cloudfront.net/Profile/Account`
- ✅ Should load the Profile Account page
- ❌ If white screen, check S3 static website hosting

### Test 2: Refresh
1. Navigate to Profile → Account
2. Press F5 (refresh)
- ✅ Should stay on Account page
- ❌ If white screen, check CloudFront error pages

### Test 3: Browser Console
Open browser console (F12) and check:
- Network tab → Look for 200 status on `index.html`
- Console tab → Look for any errors

---

## Most Likely Issue

Since you already have error pages and invalidation done, the issue is probably:

### Option A: Browser Cache
- Try **incognito window** first
- If works in incognito → Clear browser cache completely

### Option B: S3 Static Website Hosting Not Enabled
- Check Step 1 above
- S3 needs to be configured as static website hosting
- Error document must be set to `index.html`

### Option C: CloudFront Invalidation Not Complete
- Wait full 5 minutes
- Check invalidation status: Should say "Completed"

---

## Quick Diagnostic

Run this in browser console on the white screen:

```javascript
console.log('Current URL:', window.location.href);
fetch(window.location.href)
  .then(r => {
    console.log('Response status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    return r.text();
  })
  .then(html => {
    console.log('Response length:', html.length);
    console.log('Is HTML?', html.includes('<html>'));
    console.log('Has React root?', html.includes('id="root"'));
  });
```

**Expected output:**
```
Response status: 200
Content-Type: text/html
Response length: >1000
Is HTML? true
Has React root? true
```

**If you see:**
- Status: 403/404 → CloudFront error pages not working
- Content-Type: application/xml → S3 returning error XML instead of HTML
- Response length: <100 → Not getting index.html

---

## Next Steps

Please check:
1. **S3 Static Website Hosting** (Step 1) - Most likely culprit!
2. **Test in incognito window** - Rules out browser cache
3. **Wait 5 minutes** after invalidation
4. **Share the diagnostic output** from browser console

---

**Status:** Needs S3 static website hosting verification! 🔍
