# 🔧 Fix PWA AccessDenied Error

## Problem:
iOS "Add to Home Screen" shows: **AccessDeniedAccessDenied**

This means CloudFront OAC is NOT properly configured to access your S3 bucket.

---

## ✅ Solution: Fix CloudFront Origin Configuration

### Step 1: Check CloudFront Origin Settings

1. **Go to CloudFront Console:**
   https://console.aws.amazon.com/cloudfront/v3/home

2. **Click distribution:** `d39zx5gyblzxjs.cloudfront.net` (E2J47HTDXC2VFF)

3. **Click "Origins" tab**

4. **Select your S3 origin** → Click "Edit"

---

### Step 2: Verify/Fix Origin Access Control

**In the Edit Origin page:**

#### Origin Domain:
- Should be: `juander-frontend.s3.ap-southeast-2.amazonaws.com`
- ✅ Correct format

#### Origin Access:
- **Select:** "Origin access control settings (recommended)"
- **NOT:** "Public" or "Legacy access identities"

#### Origin Access Control:
- Click "Create new OAC" if none exists
- Or select existing OAC from dropdown

**If creating new OAC:**
- Name: `juander-frontend-oac`
- Signing behavior: "Sign requests (recommended)"
- Origin type: S3
- Click "Create"

#### Click "Save changes"

---

### Step 3: Update S3 Bucket Policy

After saving, CloudFront will show a **yellow banner** with a policy to copy.

**Copy the policy** and:

1. Go to **S3 Console** → `juander-frontend` bucket
2. **Permissions** tab
3. **Bucket policy** → Edit
4. **Replace** existing policy with the new one from CloudFront
5. Save

**The policy should look like:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipalOAC",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::juander-frontend/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::739399618984:distribution/E2J47HTDXC2VFF"
                }
            }
        }
    ]
}
```

**Verify the distribution ID matches:** `E2J47HTDXC2VFF`

---

### Step 4: Invalidate CloudFront Cache

**CloudFront Console:**
1. Distribution: `d39zx5gyblzxjs.cloudfront.net`
2. **Invalidations** tab
3. **Create invalidation**
4. Paths: `/*`
5. Create
6. **Wait 5-10 minutes**

---

### Step 5: Test

**After invalidation completes:**

1. **Test manifest in browser:**
   ```
   https://d39zx5gyblzxjs.cloudfront.net/manifest.webmanifest
   ```
   
   **Should show JSON**, not AccessDenied

2. **Test on iOS:**
   - Clear Safari cache
   - Visit: `https://d39zx5gyblzxjs.cloudfront.net`
   - Share → Add to Home Screen
   - Should work! ✅

---

## 🆘 Alternative: Temporarily Make Bucket Public

If OAC is too complex, you can temporarily make the bucket public:

### Step 1: Disable Block Public Access

**S3 Console** → `juander-frontend`:
1. **Permissions** tab
2. **Block public access** → Edit
3. **Uncheck** "Block all public access"
4. Save

### Step 2: Add Public Read Policy

**Bucket policy** → Edit → Paste:

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

Save changes.

### Step 3: Update CloudFront Origin

**CloudFront Console:**
1. Distribution → Origins → Edit
2. **Origin access:** Select "Public"
3. Save

### Step 4: Invalidate and Test

This will make your bucket publicly accessible (which is fine for a public website).

---

## 🔍 Debug: Check What's Wrong

### Test 1: Direct S3 Access (Should Fail)
```
https://juander-frontend.s3.ap-southeast-2.amazonaws.com/manifest.webmanifest
```

**Expected:** AccessDenied (because block public access is ON)

### Test 2: CloudFront Access (Should Work)
```
https://d39zx5gyblzxjs.cloudfront.net/manifest.webmanifest
```

**Expected:** JSON manifest
**If AccessDenied:** OAC not configured correctly

### Test 3: Check CloudFront Response Headers

In browser DevTools → Network tab:
- Visit: `https://d39zx5gyblzxjs.cloudfront.net/manifest.webmanifest`
- Check response headers
- Look for: `x-cache: Hit from cloudfront` or `Miss from cloudfront`

**If you see `x-amz-cf-pop`:** CloudFront is serving the response
**If AccessDenied:** CloudFront can't access S3

---

## 📋 Checklist

- [ ] CloudFront origin uses "Origin access control settings"
- [ ] OAC is created and selected
- [ ] S3 bucket policy matches the one CloudFront provided
- [ ] Distribution ID in policy matches: E2J47HTDXC2VFF
- [ ] Invalidated CloudFront cache
- [ ] Waited 5-10 minutes for invalidation
- [ ] Tested manifest URL - shows JSON
- [ ] Cleared iOS Safari cache
- [ ] Tested "Add to Home Screen"

---

## 🎯 Quick Fix (Recommended)

**Just make the bucket public** - it's simpler and perfectly fine for a public website:

1. S3 → Uncheck "Block public access"
2. Add public read policy (see above)
3. CloudFront → Origin access → "Public"
4. Invalidate cache
5. Test

**Your website files should be public anyway!** 🚀
