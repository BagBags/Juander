# 🔧 Fix Upload Issues - Deployment Guide

## 🔍 Problem Identified

**Error:** `ERR_CONNECTION_RESET` when uploading 3D models to Elastic Beanstalk

**Root Causes:**
1. ❌ Nginx default upload limit is 1MB (too small for 3D models)
2. ❌ Request timeout too short for large file uploads
3. ❌ Missing upload directories on server
4. ❌ Frontend using localhost fallback

## ✅ Fixes Applied

### 1. Frontend Fix (AdminPinCard.jsx)
**Changed:** Hardcoded localhost to dynamic URL
```javascript
// Before
const BACKEND_URL = "http://localhost:5000";

// After  
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
  : window.location.origin;
```

### 2. Backend Middleware Fix (upload.js)
**Already fixed** - Directories are created in `.ebextensions/uploads.config`

### 3. Nginx Configuration (NEW FILE)
**Created:** `backend/.ebextensions/02_nginx_upload.config`
```yaml
files:
  "/etc/nginx/conf.d/proxy.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      client_max_body_size 100M;
      client_body_timeout 600s;
      proxy_connect_timeout 600s;
      proxy_send_timeout 600s;
      proxy_read_timeout 600s;
```

### 4. Upload Directories (UPDATED)
**Updated:** `backend/.ebextensions/uploads.config`
```yaml
container_commands:
  01_create_uploads_dir:
    command: "mkdir -p uploads/arModels uploads/facades uploads/media uploads/profile uploads/emergency uploads/photobooth uploads/itineraries uploads/userItineraries uploads/reviews"
  02_set_permissions:
    command: "chmod -R 777 uploads"
```

## 🚀 Deployment Steps

### Step 1: Rebuild Frontend
```bash
cd frontend
npm run build
```

### Step 2: Create New Backend ZIP
**IMPORTANT:** Create ZIP from INSIDE the backend folder

**Windows PowerShell:**
```powershell
cd D:\Desktop\Juander\backend
Compress-Archive -Path * -DestinationPath ..\juander-backend-fixed.zip -Force
```

**Or manually:**
1. Open `D:\Desktop\Juander\backend`
2. Select ALL files (Ctrl+A)
3. Right-click → Send to → Compressed folder
4. Name it `juander-backend-fixed.zip`

### Step 3: Deploy to Elastic Beanstalk

**Option A: AWS Console (Recommended)**
1. Go to AWS Console → Elastic Beanstalk
2. Select your environment
3. Click **Upload and deploy**
4. Choose `juander-backend-fixed.zip`
5. Click **Deploy**
6. Wait 5-10 minutes

**Option B: EB CLI**
```bash
cd D:\Desktop\Juander\backend
eb deploy
```

### Step 4: Verify Deployment
1. Wait for deployment to complete (check Events tab)
2. Check health status (should be green)
3. Test upload functionality

## 🧪 Testing After Deployment

### Test 1: Check Nginx Config
SSH into your EB instance and verify:
```bash
cat /etc/nginx/conf.d/proxy.conf
```
Should show the 100M limit.

### Test 2: Check Upload Directories
```bash
ls -la /var/app/current/uploads/
```
Should show all subdirectories with 777 permissions.

### Test 3: Upload a 3D Model
1. Log into admin panel
2. Click on a pin
3. Try uploading a .glb file
4. Should upload successfully without ERR_CONNECTION_RESET

## 📋 Checklist

Before deploying:
- [x] Frontend: Fixed BACKEND_URL in AdminPinCard.jsx
- [x] Backend: Created 02_nginx_upload.config
- [x] Backend: Updated uploads.config with all directories
- [ ] Frontend: Run `npm run build`
- [ ] Backend: Create new ZIP file
- [ ] Deploy to Elastic Beanstalk
- [ ] Wait for deployment to complete
- [ ] Test 3D model upload

## 🔍 Troubleshooting

### Still Getting ERR_CONNECTION_RESET?

**Check EB Logs:**
1. EB Console → Logs → Request Logs → Last 100 Lines
2. Look for:
   - `413 Request Entity Too Large` - Nginx limit not applied
   - `ENOENT` - Directory doesn't exist
   - `EACCES` - Permission denied

**Verify Environment:**
```bash
# SSH into EB instance
eb ssh

# Check nginx config
sudo cat /etc/nginx/conf.d/proxy.conf

# Check if directories exist
ls -la /var/app/current/uploads/

# Check server logs
sudo tail -f /var/log/nodejs/nodejs.log
```

### Upload Works Locally But Not on Server?

**Check CORS:**
Make sure your frontend URL is in the CORS whitelist in `server.js`:
```javascript
cors({
  origin: [
    "http://localhost:5173",
    "http://juander-frontend.s3-website-ap-southeast-2.amazonaws.com",
    // Add your actual frontend URL here
  ],
  credentials: true,
})
```

### Files Upload But Don't Display?

**Check Static File Serving:**
In `server.js`, verify:
```javascript
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```

## 📊 What Changed

| File | Change | Purpose |
|------|--------|---------|
| `AdminPinCard.jsx` | Fixed BACKEND_URL | Use deployed server, not localhost |
| `02_nginx_upload.config` | NEW | Allow 100MB uploads, 10min timeout |
| `uploads.config` | Updated | Create all upload directories |

## 🎯 Expected Results

After deployment:
- ✅ Can upload 3D models up to 100MB
- ✅ Upload completes within 10 minutes
- ✅ Files display correctly in admin panel
- ✅ No more ERR_CONNECTION_RESET errors
- ✅ Works on deployed server (not just localhost)

## 🆘 Still Having Issues?

If uploads still fail after deployment:

1. **Check EB Environment Health** - Must be green
2. **Verify .ebextensions files** - Must be in ZIP root
3. **Check EB logs** - Download full logs from console
4. **Test with small file first** - Upload a small .glb (< 1MB)
5. **Check browser console** - Look for CORS or network errors

---

**Ready to deploy!** Follow the steps above and your uploads should work. 🚀
