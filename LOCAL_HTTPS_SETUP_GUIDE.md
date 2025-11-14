# 🔒 Local HTTPS Setup Guide - Mobile Testing

This guide will help you set up HTTPS for local development so you can test PWA features (compass, GPS, camera) on your phone.

---

## 🎯 Why HTTPS for Local Development?

**PWA features require HTTPS:**
- GPS/Location (DeviceOrientation API)
- Compass (DeviceOrientation API)
- Camera (MediaDevices API)
- Service Workers
- Push Notifications

Browsers block these features on HTTP for security reasons.

---

## 📋 Prerequisites

**Required:**
- Node.js and npm installed
- Windows PC and phone on **same WiFi network**

**Tools needed:**
- mkcert (for SSL certificates)

---

## 🚀 Quick Setup (Recommended)

### Step 1: Install mkcert

**Option A: Manual Download**
```bash
# 1. Download mkcert
# https://github.com/FiloSottile/mkcert/releases
# Download: mkcert-v1.4.4-windows-amd64.exe

# 2. Rename to mkcert.exe

# 3. Move to system path
# Move to: C:\Windows\System32\
```

**Option B: Using Chocolatey** (if installed)
```bash
choco install mkcert
```

### Step 2: Run Setup Script

```bash
# Navigate to frontend folder
cd D:\4ITD\Juander\Juander\frontend

# Run the setup script
SETUP_LOCAL_HTTPS.bat
```

**This will:**
1. Install mkcert root certificate
2. Create `cert/` folder
3. Generate SSL certificates (localhost-key.pem, localhost.pem)

### Step 3: Start Dev Server

```bash
npm run dev
```

**You should see:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   https://localhost:5173/
➜  Network: https://192.168.x.x:5173/
```

### Step 4: Get Your Local IP

**Option A: From Vite output**
- Look at "Network: https://192.168.x.x:5173/"
- Use that URL on your phone

**Option B: Using ipconfig**
```bash
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

### Step 5: Access from Phone

**On your phone:**
1. Connect to **same WiFi** as your PC
2. Open browser (Chrome/Safari)
3. Navigate to: `https://192.168.x.x:5173`
   - Replace `192.168.x.x` with your actual IP
4. **Accept security warning** (self-signed certificate)
   - iOS Safari: "Continue" → "Visit this website"
   - Android Chrome: "Advanced" → "Proceed to site"

---

## 🔧 Manual Setup (Alternative)

If the script doesn't work, follow these steps manually:

### 1. Install mkcert CA
```bash
mkcert -install
```

### 2. Create cert folder
```bash
cd D:\4ITD\Juander\Juander\frontend
mkdir cert
cd cert
```

### 3. Generate certificates
```bash
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
```

**Note:** The certificate will work for your local network IP (e.g., 192.168.x.x) even though it's not explicitly listed.

### 4. Verify files created
```
frontend/cert/
  ├── localhost-key.pem
  └── localhost.pem
```

---

## 📱 Testing PWA Features

Once HTTPS is working, test these features on your phone:

### 1. Compass/Direction
- Go to Tourist Itinerary Map
- Blue beam should rotate as you turn your phone
- If prompted, allow device orientation permission

### 2. GPS/Location
- Allow location permission when prompted
- Your blue dot should show your current location
- Blue beam should point in direction you're facing

### 3. Camera (Photobooth)
- Go to Photobooth feature
- Allow camera permission
- Camera should activate

---

## 🆘 Troubleshooting

### Issue: "mkcert: command not found"

**Solution:**
- Verify mkcert.exe is in system path
- Try closing and reopening Command Prompt
- Verify installation: `mkcert -version`

### Issue: Certificate warnings on phone

**Solution:**
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to site"
- iOS: Settings → General → VPN & Device Management → Trust certificate

### Issue: Can't connect from phone

**Check these:**
1. **Same WiFi network?**
   - PC and phone must be on same network
   - Check WiFi SSID on both devices

2. **Firewall blocking?**
   ```bash
   # Windows: Allow port 5173
   netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173
   ```

3. **Correct IP address?**
   - Use IPv4 (e.g., 192.168.1.100)
   - Don't use 127.0.0.1 or localhost

4. **HTTPS not HTTP?**
   - URL must start with `https://`
   - Not `http://`

### Issue: Compass not working

**Solution:**
1. Ensure you're on HTTPS (check 🔒 in address bar)
2. Grant device orientation permission when prompted
3. On iOS: May need to click GPS center button first
4. Try refreshing the page

### Issue: "net::ERR_CERT_AUTHORITY_INVALID"

**Solution:**
- This is expected for self-signed certificates
- Click "Advanced" → "Proceed"
- Or install mkcert root CA on phone:
  1. `mkcert -CAROOT` to find CA location
  2. Transfer rootCA.pem to phone
  3. Install certificate on phone

---

## 🔥 Quick Reference Commands

```bash
# Install mkcert
choco install mkcert

# Setup certificates
cd D:\4ITD\Juander\Juander\frontend
SETUP_LOCAL_HTTPS.bat

# Start server
npm run dev

# Get IP address
ipconfig

# Allow firewall (if needed)
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173
```

---

## 📊 Testing Checklist

**Before testing on phone:**
- [ ] mkcert installed
- [ ] Certificates generated (cert/ folder exists)
- [ ] Dev server running with HTTPS
- [ ] IP address identified
- [ ] Phone on same WiFi
- [ ] Firewall allows port 5173

**On phone:**
- [ ] Can access `https://YOUR_IP:5173`
- [ ] Certificate warning bypassed
- [ ] Page loads correctly
- [ ] GPS permission granted
- [ ] Compass permission granted (iOS)
- [ ] Blue beam rotates with phone orientation
- [ ] GPS location shown on map

---

## 💡 Pro Tips

**1. Bookmark on phone:**
- Add `https://YOUR_IP:5173` to home screen
- Acts like a native app

**2. Find IP faster:**
```bash
# PowerShell - Get WiFi IP only
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
```

**3. QR Code access:**
- Use a QR code generator
- Create QR for `https://YOUR_IP:5173`
- Scan with phone camera

**4. Keep server running:**
- Don't close terminal/command prompt
- Server must stay active for phone access

---

## 🎉 Success Indicators

**Everything is working when:**
1. ✅ Server shows: `https://192.168.x.x:5173/`
2. ✅ Phone can access the URL
3. ✅ 🔒 HTTPS icon appears in phone browser
4. ✅ Blue beam rotates as you turn phone
5. ✅ GPS shows your location on map
6. ✅ Compass permission granted (iOS)
7. ✅ No console errors related to security

---

## 📞 Need Help?

**Common URLs:**
- Local: `https://localhost:5173`
- Network: `https://192.168.x.x:5173` (replace x.x with your IP)

**Check server is running:**
- Look for Vite output in terminal
- Should show "ready in xxx ms"

**Check certificates exist:**
```bash
dir cert
# Should show:
#   localhost-key.pem
#   localhost.pem
```

---

**🎯 Once set up, you can fully test all PWA features on your actual device!**
