# 🚀 AWS Elastic Beanstalk Deployment Guide

## 📋 Prerequisites

- AWS Account
- AWS CLI installed (optional but recommended)
- EB CLI installed (optional but recommended)
- Your backend code ready

## 📦 Required Files (Already Created)

Your backend folder now includes:

- ✅ `package.json` - Dependencies and start script
- ✅ `Procfile` - Tells EB how to start your app
- ✅ `.ebextensions/nodecommand.config` - Node.js configuration
- ✅ `.ebextensions/uploads.config` - Creates uploads directory
- ✅ `.npmrc` - NPM configuration for permissions

## 🎯 Step-by-Step Deployment

### Method 1: Using AWS Console (Easiest)

#### 1. Prepare Your ZIP File

**IMPORTANT:** Create the ZIP from INSIDE the backend folder, not from outside.

**Windows (PowerShell):**
```powershell
cd D:\Desktop\Juander\backend
Compress-Archive -Path * -DestinationPath ..\juander-backend.zip -Force
```

**Or manually:**
1. Open `D:\Desktop\Juander\backend`
2. Select ALL files and folders (Ctrl+A)
3. Right-click → Send to → Compressed (zipped) folder
4. Name it `juander-backend.zip`

**⚠️ CRITICAL:** The ZIP should contain files directly, NOT a backend folder inside:
```
✅ CORRECT:
juander-backend.zip
  ├── server.js
  ├── package.json
  ├── Procfile
  ├── .ebextensions/
  ├── config/
  ├── controllers/
  └── ...

❌ WRONG:
juander-backend.zip
  └── backend/
      ├── server.js
      └── ...
```

#### 2. Create Elastic Beanstalk Application

1. Go to AWS Console → Elastic Beanstalk
2. Click **Create Application**
3. Fill in:
   - **Application name:** `juander-backend`
   - **Platform:** Node.js
   - **Platform branch:** Node.js 20 running on 64bit Amazon Linux 2023
   - **Application code:** Upload your code
   - Click **Choose file** and select `juander-backend.zip`
4. Click **Configure more options** (IMPORTANT!)

#### 3. Configure Environment

**Software Configuration:**
1. Click **Edit** on Software
2. Add Environment Properties:
   ```
   NODE_ENV = production
   MONGO_URI = your-mongodb-atlas-connection-string
   JWT_SECRET = your-strong-secret-key
   GOOGLE_CLIENT_ID = your-google-client-id
   MAIL_USER = your-email@gmail.com
   MAIL_PASS = your-app-password
   FRONTEND_URL = your-frontend-url
   ```
3. Click **Save**

**Instances:**
1. Click **Edit** on Instances
2. Instance type: `t3.small` or `t3.medium` (t2.micro may be too small)
3. Click **Save**

**Capacity:**
1. Click **Edit** on Capacity
2. Environment type: 
   - **Single instance** (for testing/low traffic)
   - **Load balanced** (for production)
3. Click **Save**

**Security:**
1. Click **Edit** on Security
2. Select or create an EC2 key pair (for SSH access)
3. Click **Save**

#### 4. Create Environment

1. Click **Create environment**
2. Wait 5-10 minutes for deployment
3. Monitor the events log

### Method 2: Using EB CLI (Advanced)

#### 1. Install EB CLI

```bash
pip install awsebcli --upgrade --user
```

#### 2. Initialize EB

```bash
cd D:\Desktop\Juander\backend
eb init
```

Follow prompts:
- Select region
- Enter application name: `juander-backend`
- Select Node.js platform
- Setup SSH (optional)

#### 3. Create Environment

```bash
eb create juander-prod
```

#### 4. Set Environment Variables

```bash
eb setenv NODE_ENV=production MONGO_URI="your-connection-string" JWT_SECRET="your-secret" GOOGLE_CLIENT_ID="your-client-id" MAIL_USER="your-email" MAIL_PASS="your-password" FRONTEND_URL="your-frontend-url"
```

#### 5. Deploy Updates

```bash
eb deploy
```

## 🔧 Environment Variables to Set

Set these in Elastic Beanstalk Console → Configuration → Software → Environment properties:

```
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-change-this
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-specific-password
FRONTEND_URL=https://your-frontend-domain.com
```

## 🔍 Troubleshooting

### Issue: "None of the instances are sending data"

**Possible causes:**

1. **Wrong ZIP structure** - Files must be at root of ZIP, not in a subfolder
2. **Missing package.json** - Now created ✅
3. **Wrong Node.js version** - Use Node.js 18 or 20
4. **Port configuration** - App must listen on `process.env.PORT` (default 8080)
5. **Dependencies failing** - Check logs for npm install errors

### Check Logs

**AWS Console:**
1. Go to your environment
2. Click **Logs** → **Request Logs** → **Last 100 Lines**
3. Download and review

**EB CLI:**
```bash
eb logs
```

### Common Fixes

**1. Application won't start:**
```bash
# Check if package.json has correct start script
"scripts": {
  "start": "node server.js"
}
```

**2. Database connection fails:**
- Whitelist `0.0.0.0/0` in MongoDB Atlas (or specific EB IP)
- Verify MONGO_URI environment variable is set correctly

**3. Port binding error:**
```javascript
// server.js should have:
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**4. File upload issues:**
- Uploads directory is created by `.ebextensions/uploads.config`
- For production, consider using S3 for file storage

## 📊 Health Check

Elastic Beanstalk checks if your app is healthy by making HTTP requests.

**Add a health check endpoint to server.js:**

```javascript
// Add this before your other routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});
```

Then configure in EB Console → Configuration → Load Balancer → Health check path: `/health`

## 🔐 Security Best Practices

1. **Never commit .env files** - Use EB environment variables
2. **Use strong JWT_SECRET** - Generate random string
3. **Whitelist specific IPs** in MongoDB Atlas if possible
4. **Enable HTTPS** - EB provides free SSL certificate
5. **Set up CloudWatch alarms** for monitoring

## 📈 Scaling

**Auto Scaling (Load Balanced Environment):**
1. Go to Configuration → Capacity
2. Set:
   - Min instances: 1
   - Max instances: 4
   - Scaling triggers: CPU > 75%

## 💰 Cost Optimization

- **t3.micro** - Free tier eligible, good for testing (~$0)
- **t3.small** - ~$15/month, good for small apps
- **t3.medium** - ~$30/month, good for production

## 🚀 Deployment Checklist

Before deploying:

- [ ] `package.json` exists with correct dependencies
- [ ] `Procfile` exists with `web: node server.js`
- [ ] `.ebextensions/` folder with config files
- [ ] Environment variables configured in EB
- [ ] MongoDB Atlas IP whitelist updated
- [ ] ZIP file created from INSIDE backend folder
- [ ] Node.js version compatible (18 or 20)
- [ ] PORT uses `process.env.PORT`

## 🔄 Update Deployment

When you make changes:

**Using Console:**
1. Create new ZIP file (same method as before)
2. Go to EB Console → Upload and deploy
3. Select new ZIP file
4. Click **Deploy**

**Using EB CLI:**
```bash
cd D:\Desktop\Juander\backend
eb deploy
```

## 🌐 Access Your Application

After successful deployment:

**URL Format:**
```
http://juander-prod.us-east-1.elasticbeanstalk.com
```

Your API will be available at:
```
http://your-eb-url.elasticbeanstalk.com/api/auth/login
http://your-eb-url.elasticbeanstalk.com/api/pins
etc.
```

## 📝 Next Steps

1. **Setup Custom Domain** (optional)
   - Route 53 → Create hosted zone
   - Add CNAME record pointing to EB URL

2. **Enable HTTPS**
   - EB Console → Configuration → Load Balancer
   - Add listener on port 443
   - Select ACM certificate

3. **Setup CloudWatch Monitoring**
   - Enable enhanced health reporting
   - Create alarms for errors

4. **Configure CORS**
   - Update `FRONTEND_URL` environment variable
   - Ensure server.js CORS allows your frontend domain

## 🆘 Still Having Issues?

1. **Check EB Events** - Shows deployment progress and errors
2. **Check Logs** - Download full logs from EB console
3. **Verify Environment Variables** - Configuration → Software
4. **Test Locally** - Run `npm start` locally first
5. **Check MongoDB Connection** - Verify connection string and whitelist

---

**Your backend is now ready for Elastic Beanstalk deployment!** 🎉

Follow the steps above and your application should deploy successfully.
