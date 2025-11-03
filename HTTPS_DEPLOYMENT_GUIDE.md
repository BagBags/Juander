# 🔒 HTTPS Deployment Guide - Fix Mixed Content Error

## ✅ Changes Made

### 1. Frontend Environment Variables Updated
**File:** `frontend/.env.production`

```env
VITE_API_BASE_URL=https://juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com/api
VITE_FRONTEND_URL=https://d39zx5gyblzxjs.cloudfront.net
```

**Changes:**
- ✅ Backend URL: `http://` → `https://`
- ✅ Frontend URL: S3 HTTP → CloudFront HTTPS

### 2. Backend CORS Configuration Updated
**File:** `backend/server.js`

Added CloudFront HTTPS URL to allowed origins:
```javascript
origin: [
  "http://localhost:5173", // Development
  "http://juander-frontend.s3-website-ap-southeast-2.amazonaws.com", // Production S3
  "https://d39zx5gyblzxjs.cloudfront.net", // Production CloudFront HTTPS ✅ NEW
]
```

### 3. Frontend Fallback URL Updated
**File:** `frontend/src/components/adminComponents/adminTourMapComponents/AdminPinCard.jsx`

```javascript
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
  : "https://juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com"; // ✅ HTTPS
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend (Elastic Beanstalk)

**Option A: Using AWS Console**
```bash
# 1. Navigate to backend folder
cd D:\Desktop\Juander\backend

# 2. Create deployment ZIP (use 7-Zip method from previous guide)
# Run: CREATE_ZIP_7ZIP.bat

# 3. Upload to Elastic Beanstalk
# - AWS Console → Elastic Beanstalk
# - Environment: juander-backend-env
# - Upload: juander-backend-UNIX.zip
# - Version: v8-https-cors-fix
# - Deploy
```

**Option B: Using EB CLI**
```bash
cd D:\Desktop\Juander\backend
eb deploy
```

**Wait for deployment:** 10-15 minutes
**Expected:** Health status = Green ✅

---

### Step 2: Rebuild Frontend

```bash
cd D:\Desktop\Juander\frontend

# Install dependencies (if needed)
npm install

# Build for production (uses .env.production)
npm run build
```

**This will:**
- ✅ Use HTTPS backend URL
- ✅ Use CloudFront frontend URL
- ✅ Generate optimized production build in `dist/` folder

---

### Step 3: Deploy Frontend to S3

**Option A: Using AWS Console**
1. Open AWS S3 Console
2. Navigate to bucket: `juander-frontend`
3. **Delete old files** in bucket (select all → Delete)
4. **Upload new files:**
   - Select all files from `frontend/dist/` folder
   - Upload to S3 bucket root
   - Set permissions: Public read (if needed)

**Option B: Using AWS CLI**
```bash
cd D:\Desktop\Juander\frontend

# Sync dist folder to S3
aws s3 sync dist/ s3://juander-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

**Replace `YOUR_DISTRIBUTION_ID`** with your CloudFront distribution ID (find in CloudFront console)

---

### Step 4: Invalidate CloudFront Cache

**Why?** CloudFront caches your files. You need to clear the cache to serve the new version.

**Using AWS Console:**
1. AWS Console → CloudFront
2. Select distribution: `d39zx5gyblzxjs.cloudfront.net`
3. Click "Invalidations" tab
4. Click "Create Invalidation"
5. Enter paths: `/*`
6. Click "Create"

**Wait:** 5-10 minutes for invalidation to complete

---

## 🧪 Testing

### 1. Clear Browser Cache
```
Chrome: Ctrl + Shift + Delete
- Select "Cached images and files"
- Time range: "All time"
- Clear data
```

### 2. Test HTTPS Frontend
```
Open: https://d39zx5gyblzxjs.cloudfront.net
```

**Check:**
- ✅ Page loads over HTTPS (🔒 in address bar)
- ✅ No Mixed Content warnings in console
- ✅ Login works
- ✅ API calls succeed

### 3. Check Console for Errors
```
F12 → Console tab
```

**Should NOT see:**
- ❌ "Mixed Content" errors
- ❌ "blocked an insecure request" errors

**Should see:**
- ✅ API calls to `https://juander-backend-env...`
- ✅ Successful responses (200 OK)

---

## 🔍 Verification Checklist

- [ ] Backend deployed successfully (Health: Green)
- [ ] Frontend built with production env vars
- [ ] Frontend uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] Browser cache cleared
- [ ] HTTPS frontend loads correctly
- [ ] Login works
- [ ] Google OAuth works
- [ ] API calls succeed (no Mixed Content errors)
- [ ] Images load correctly
- [ ] 3D models load correctly

---

## ⚠️ Important Notes

### 1. Elastic Beanstalk HTTPS
Your Elastic Beanstalk environment **already supports HTTPS** by default!
- HTTP: `http://juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com`
- HTTPS: `https://juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com` ✅

No additional SSL certificate configuration needed for EB.

### 2. CloudFront HTTPS
CloudFront automatically provides HTTPS with AWS's SSL certificate.
- Your URL: `https://d39zx5gyblzxjs.cloudfront.net` ✅

### 3. Mixed Content Policy
Browsers block HTTP requests from HTTPS pages for security:
- ✅ HTTPS page → HTTPS API = Allowed
- ❌ HTTPS page → HTTP API = Blocked

That's why we changed all URLs to HTTPS!

---

## 🆘 Troubleshooting

### Issue: Still getting Mixed Content errors

**Solution:**
1. Hard refresh: `Ctrl + Shift + R`
2. Clear browser cache completely
3. Check console for which URL is still HTTP
4. Verify `.env.production` has HTTPS URLs
5. Verify you rebuilt frontend after changing `.env.production`

### Issue: CORS errors after deployment

**Solution:**
1. Check backend logs in Elastic Beanstalk
2. Verify `server.js` has CloudFront URL in CORS origins
3. Verify backend deployment succeeded
4. Test backend health: `https://juander-backend-env.eba-3v3p4pbh.ap-southeast-2.elasticbeanstalk.com/health`

### Issue: Google OAuth not working

**Solution:**
1. Update Google OAuth Console:
   - Authorized JavaScript origins: `https://d39zx5gyblzxjs.cloudfront.net`
   - Authorized redirect URIs: `https://d39zx5gyblzxjs.cloudfront.net/login`
2. Update `.env.production` with correct `VITE_GOOGLE_CLIENT_ID`

---

## 📋 Quick Commands Summary

```bash
# Backend deployment
cd D:\Desktop\Juander\backend
# Run CREATE_ZIP_7ZIP.bat, then upload to EB

# Frontend build
cd D:\Desktop\Juander\frontend
npm run build

# Frontend deployment (AWS CLI)
aws s3 sync dist/ s3://juander-frontend --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

## ✅ Success Indicators

When everything works:
1. 🔒 HTTPS lock icon in browser
2. ✅ No console errors
3. ✅ Login successful
4. ✅ API calls return data
5. ✅ Images and 3D models load
6. ✅ All features work as expected

---

**🎉 Once deployed, your app will be fully HTTPS-secured!**
