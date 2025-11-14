# ✅ Elastic Beanstalk Deployment Checklist

## Before Creating ZIP

- [ ] All files are in `D:\Desktop\Juander\backend` folder
- [ ] `package.json` exists with correct start script
- [ ] `Procfile` exists with `web: node server.js`
- [ ] `.ebextensions/` folder exists with config files
- [ ] No old `node_modules` folder (will be installed by EB)

## Creating ZIP File

- [ ] Opened `D:\Desktop\Juander\backend` folder
- [ ] Selected ALL files (Ctrl+A)
- [ ] Created ZIP from selected files (NOT from backend folder)
- [ ] Verified ZIP contains files at root level (not in subfolder)
- [ ] Named ZIP: `juander-backend.zip`

## Elastic Beanstalk Setup

- [ ] Logged into AWS Console
- [ ] Navigated to Elastic Beanstalk
- [ ] Clicked "Create a new environment"
- [ ] Selected "Web server environment"
- [ ] Platform: **Node.js 20 on Amazon Linux 2023**
- [ ] Uploaded `juander-backend.zip`
- [ ] Clicked "Configure more options"

## Environment Configuration

### Software Settings
- [ ] Clicked Edit on Software
- [ ] Added environment variables:
  - [ ] `NODE_ENV = production`
  - [ ] `MONGO_URI = [your-mongodb-connection]`
  - [ ] `JWT_SECRET = [strong-random-string]`
  - [ ] `GOOGLE_CLIENT_ID = [your-client-id]`
  - [ ] `MAIL_USER = [your-email]`
  - [ ] `MAIL_PASS = [your-app-password]`
  - [ ] `FRONTEND_URL = [your-frontend-url]`
- [ ] Clicked Save

### Instance Settings
- [ ] Clicked Edit on Instances
- [ ] Selected instance type: **t3.small** (minimum)
- [ ] Clicked Save

### Security (Optional)
- [ ] Clicked Edit on Security
- [ ] Selected EC2 key pair (for SSH)
- [ ] Clicked Save

## Deployment

- [ ] Clicked "Create environment"
- [ ] Waited 5-10 minutes
- [ ] Monitored Events tab
- [ ] Environment status shows "Ok" (green)

## Post-Deployment

### MongoDB Atlas
- [ ] Logged into MongoDB Atlas
- [ ] Network Access → Add IP Address
- [ ] Added `0.0.0.0/0` or specific EB IP
- [ ] Clicked Confirm

### Testing
- [ ] Opened environment URL
- [ ] Tested API endpoint: `http://[your-url]/api/`
- [ ] Verified no errors in logs
- [ ] All API routes working

### Frontend Update
- [ ] Updated frontend `.env.production`
- [ ] Set `VITE_API_BASE_URL` to EB URL
- [ ] Redeployed frontend

## Troubleshooting (If Needed)

If deployment fails:
- [ ] Downloaded logs from EB Console
- [ ] Checked for error messages
- [ ] Verified ZIP structure is correct
- [ ] Confirmed environment variables are set
- [ ] Checked MongoDB IP whitelist
- [ ] Verified platform is Amazon Linux 2023

## Success Criteria

- [ ] ✅ Environment health: Ok (green checkmark)
- [ ] ✅ No errors in Events tab
- [ ] ✅ Application URL loads
- [ ] ✅ API endpoints respond correctly
- [ ] ✅ Database connections working
- [ ] ✅ No errors in application logs

---

**Environment URL:** `______________________________`

**Deployment Date:** `______________________________`

**Version:** `______________________________`
