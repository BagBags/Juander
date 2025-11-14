# 🔧 Fix Backend CloudFront Configuration

## Problem:
Backend CloudFront (`https://d3des4qdhz53rp.cloudfront.net`) returns:
```
Cannot GET /api/auth/google-login
```

This means CloudFront is NOT properly forwarding requests to your Elastic Beanstalk backend.

---

## ✅ Solution: Configure CloudFront Behavior

### Step 1: Open CloudFront Console

1. Go to: https://console.aws.amazon.com/cloudfront/v3/home
2. Click on distribution: `d3des4qdhz53rp.cloudfront.net`

---

### Step 2: Check Origin Settings

Click **"Origins"** tab:

**Verify:**
- Origin Domain: `juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com`
- Protocol: **HTTP Only** (Elastic Beanstalk default)
- Origin Path: **Leave EMPTY** (important!)

**If Origin Path has `/api`:** ❌ REMOVE IT
- CloudFront will add `/api` twice: `/api/api/auth/google-login`

---

### Step 3: Configure Default Cache Behavior

Click **"Behaviors"** tab → Select default behavior → Click **"Edit"**

**Required Settings:**

#### Viewer Protocol Policy:
- ✅ **Redirect HTTP to HTTPS** (or HTTPS only)

#### Allowed HTTP Methods:
- ✅ **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**

#### Cache Policy:
- ✅ **CachingDisabled** (for API, don't cache)
- Or create custom policy with TTL = 0

#### Origin Request Policy:
- ✅ **AllViewer** (forwards all headers, query strings, cookies)
- Or create custom policy that forwards:
  - All headers
  - All query strings
  - All cookies

#### Response Headers Policy (Optional):
- None (your backend handles CORS)

**Click "Save changes"**

---

### Step 4: Test Backend Directly

After saving, wait 2-3 minutes for CloudFront to update.

**Test in browser:**
```
https://d3des4qdhz53rp.cloudfront.net/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T...",
  "mongodb": "connected"
}
```

**If you get 404 or error:** CloudFront config is wrong.

---

## 🎯 Correct CloudFront Configuration Summary

### Origin Settings:
```
Origin Domain: juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com
Protocol: HTTP Only
Origin Path: (empty)
```

### Behavior Settings:
```
Viewer Protocol: Redirect HTTP to HTTPS
Allowed Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
Cache Policy: CachingDisabled
Origin Request Policy: AllViewer
```

---

## 🆘 Alternative: Use Elastic Beanstalk HTTPS Directly

If CloudFront configuration is too complex, you can use Elastic Beanstalk's HTTPS endpoint directly:

### Option A: Check if EB Already Has HTTPS

Try accessing:
```
https://juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com/health
```

**If it works:** ✅ Use this URL directly!

Update `.env.production`:
```env
VITE_API_BASE_URL=https://juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com/api
```

Then rebuild and redeploy frontend.

---

### Option B: Enable HTTPS on Elastic Beanstalk

**If EB doesn't have HTTPS:**

1. **EB Console** → Your environment → **Configuration**
2. **Load Balancer** → **Edit**
3. **Add Listener:**
   - Port: 443
   - Protocol: HTTPS
   - SSL Certificate: Use AWS Certificate Manager (ACM)
4. **Save**

**Note:** You need a custom domain and SSL certificate for this.

---

## 🔍 Debug Steps

### Test 1: Check CloudFront Origin
```bash
curl -I https://d3des4qdhz53rp.cloudfront.net/health
```

**Expected:** 200 OK
**If 404:** CloudFront not forwarding correctly

### Test 2: Check Elastic Beanstalk Directly
```bash
curl -I http://juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com/health
```

**Expected:** 200 OK
**If fails:** Backend issue

### Test 3: Check CloudFront Headers
```bash
curl -v https://d3des4qdhz53rp.cloudfront.net/api/health
```

Look for:
- `X-Cache: Miss from cloudfront` (first request)
- `access-control-allow-origin` header

---

## 📋 Quick Fix Checklist

- [ ] CloudFront origin domain = Elastic Beanstalk URL
- [ ] CloudFront origin path = EMPTY (not `/api`)
- [ ] CloudFront behavior allows all HTTP methods
- [ ] CloudFront cache policy = CachingDisabled
- [ ] CloudFront origin request policy = AllViewer
- [ ] Test: `https://d3des4qdhz53rp.cloudfront.net/health` returns 200 OK
- [ ] Backend CORS includes both CloudFront URLs
- [ ] Frontend rebuilt with correct backend URL
- [ ] Frontend uploaded to S3
- [ ] Frontend CloudFront cache invalidated

---

## 🎯 Recommended Approach

**For simplicity, I recommend:**

1. **Check if Elastic Beanstalk already supports HTTPS:**
   ```
   https://juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com/health
   ```

2. **If YES:** Use EB HTTPS directly (no CloudFront needed for backend)
   - Update `.env.production` to use EB HTTPS URL
   - Rebuild frontend
   - Redeploy

3. **If NO:** Fix CloudFront configuration as described above

---

**🚀 START: Check if EB HTTPS works first!**
