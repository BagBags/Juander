# 🚨 URGENT: Fix Upload Errors - Deploy Now

## Current Errors
1. ❌ **CORS Error** - Backend blocking frontend requests
2. ❌ **413 Request Too Large** - Nginx config not applied

## ✅ Fixes Applied (Ready to Deploy)

### Backend Changes Made:
1. **server.js** - Enhanced CORS with explicit headers for uploads
2. **02_nginx_upload.config** - 100MB limit + CORS passthrough
3. **uploads.config** - Create all upload directories

## 🚀 DEPLOY NOW - 3 Steps

### Step 1: Create Deployment ZIP (30 seconds)

**Option A: Run the batch file**
```
Double-click: backend\DEPLOY_NOW.bat
```

**Option B: Manual PowerShell**
```powershell
cd D:\Desktop\Juander\backend
Compress-Archive -Path * -DestinationPath ..\juander-backend-deploy.zip -Force
```

This creates: `D:\Desktop\Juander\juander-backend-deploy.zip`

### Step 2: Deploy to Elastic Beanstalk (5-10 minutes)

1. **Open AWS Console**
   - Go to: https://console.aws.amazon.com/elasticbeanstalk
   
2. **Select Your Environment**
   - Click: `juander-backend-env` (or your environment name)
   
3. **Upload and Deploy**
   - Click: **"Upload and deploy"** button
   - Click: **"Choose file"**
   - Select: `juander-backend-deploy.zip`
   - Version label: `v2-upload-fix` (or any name)
   - Click: **"Deploy"**

4. **Wait for Deployment**
   - Watch the **Events** tab
   - Wait for: "Environment update completed successfully"
   - Status should turn **Green**

### Step 3: Test Upload (1 minute)

1. Open your admin panel
2. Click on any pin
3. Try uploading a .glb file
4. Should work without errors!

## 🔍 What Gets Fixed

After deployment:

| Issue | Before | After |
|-------|--------|-------|
| CORS Error | ❌ Blocked | ✅ Allowed |
| 413 Too Large | ❌ 1MB limit | ✅ 100MB limit |
| Timeout | ❌ 60s | ✅ 10 minutes |
| Upload Dirs | ❌ Missing | ✅ Created |

## ⚠️ IMPORTANT NOTES

### Why You're Getting Errors Now:
- The `.ebextensions` config files only apply **AFTER deployment**
- Your current server still has the old 1MB nginx limit
- CORS headers need the explicit configuration

### What Happens During Deployment:
1. EB creates new EC2 instance
2. Installs your code
3. Runs `.ebextensions` commands (creates dirs, configures nginx)
4. Switches traffic to new instance
5. Old instance is terminated

### If Deployment Fails:
Check **Events** tab for errors. Common issues:
- **Syntax error in .ebextensions** - Check YAML formatting
- **Health check failing** - Check if server starts properly
- **Timeout** - Wait longer, EB can take 10-15 minutes

## 📋 Deployment Checklist

- [x] Updated server.js with CORS config
- [x] Created 02_nginx_upload.config
- [x] Updated uploads.config
- [ ] **Create deployment ZIP** ← DO THIS NOW
- [ ] **Upload to Elastic Beanstalk** ← THEN THIS
- [ ] **Wait for deployment** ← BE PATIENT
- [ ] **Test upload** ← VERIFY IT WORKS

## 🆘 Still Getting Errors After Deployment?

### Check 1: Verify Deployment Completed
```
EB Console → Events tab → Look for "Environment update completed successfully"
```

### Check 2: SSH and Verify Nginx Config
```bash
eb ssh
sudo cat /etc/nginx/conf.d/proxy.conf
# Should show: client_max_body_size 100M;
```

### Check 3: Check Upload Directories
```bash
eb ssh
ls -la /var/app/current/uploads/
# Should show: arModels, facades, media, etc.
```

### Check 4: Test with Small File First
- Try uploading a tiny .glb file (< 1MB)
- If small works but large fails → nginx config issue
- If small fails → CORS or route issue

## 📞 Error Messages Guide

| Error | Meaning | Solution |
|-------|---------|----------|
| `ERR_NETWORK` | Can't reach server | Check EB health status |
| `CORS policy` | CORS blocking | Redeploy with new server.js |
| `413 Too Large` | Nginx limit | Redeploy with nginx config |
| `ERR_CONNECTION_RESET` | Timeout | Redeploy with timeout config |

---

## ⏰ TIME TO DEPLOY: ~15 minutes total

1. Create ZIP: **30 seconds**
2. Upload to EB: **2 minutes**
3. Wait for deployment: **10 minutes**
4. Test: **1 minute**

**👉 START NOW: Run `backend\DEPLOY_NOW.bat` or follow Step 1 above!**
