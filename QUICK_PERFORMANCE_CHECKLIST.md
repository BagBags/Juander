# ⚡ Quick Performance Fix Checklist

## ✅ COMPLETED (Just Now)

### 1. Vite Build Optimization
- ✅ Changed target from `esnext` to `es2020` (better compatibility)
- ✅ Implemented dynamic code splitting (vendor chunks)
- ✅ Optimized chunk naming for caching
- ✅ Disabled compressed size reporting (faster builds)

### 2. Frontend HTML
- ✅ Added DNS prefetch for critical domains
- ✅ Added preconnect for Mapbox & CloudFront
- ✅ Optimized font loading (async)
- ✅ Updated CSP with `upgrade-insecure-requests`

### 3. Backend Security
- ✅ Stricter security headers (X-Frame-Options: DENY)
- ✅ Added Permissions-Policy
- ✅ Removed server fingerprinting
- ✅ Optimized caching (aggressive for static, none for API)
- ✅ Strict CSP for API responses

---

## 🚀 NEXT STEPS (Do These Now)

### Priority 1: Backend Compression ⏱️ 2 minutes
```bash
cd backend
npm install compression --save
```

Add to `backend/server.js` (line 40, after `const app = express();`):
```javascript
const compression = require('compression');

// Gzip compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6 // Balance between speed and compression
}));
```

**Impact:** 60-80% reduction in response size

---

### Priority 2: CloudFront Compression ⏱️ 5 minutes

1. Go to AWS Console → CloudFront
2. Select your distribution (`d39zx5gyblzxjs.cloudfront.net`)
3. Go to **Behaviors** tab
4. Edit the default behavior
5. **Compress Objects Automatically**: Change to **Yes**
6. Save and wait for deployment (~5 minutes)

**Impact:** Automatic compression for all assets

---

### Priority 3: Build & Deploy ⏱️ 10 minutes

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Check bundle analysis
# Look for dist/stats.html in browser

# 3. Test locally
npm run preview
# Open http://localhost:4173

# 4. Deploy frontend (if satisfied)
# Upload dist/ to S3 or use your deployment script

# 5. Restart backend
cd ../backend
pm2 restart juander-backend-prod
```

---

### Priority 4: Test Performance ⏱️ 5 minutes

1. **PageSpeed Insights**
   - Go to: https://pagespeed.web.dev/
   - Test: `https://juanderintra.com`
   - Target: 75-85 (mobile), 85-95 (desktop)

2. **Chrome Lighthouse**
   - Open Chrome DevTools (F12)
   - Go to Lighthouse tab
   - Select "Desktop" and "Mobile"
   - Run audit

---

## 📊 Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| **Performance Score** | 59 | 75-85 |
| **First Contentful Paint** | 3.5s | ~2.0s |
| **Largest Contentful Paint** | 5.8s | ~3.5s |
| **Bundle Size (gzipped)** | ~1.2MB | ~400KB |
| **API Response Size** | 100% | 20-40% |

---

## 🔍 Verify Changes

### Check Service Worker Caching
```javascript
// Open browser console on your site
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});

// Check cache
caches.keys().then(keys => {
  console.log('Cache Keys:', keys);
});
```

### Check Compression
```bash
# Test if compression is working
curl -H "Accept-Encoding: gzip" -I https://juanderintra.com/api/pins

# Should see: Content-Encoding: gzip
```

### Check Security Headers
```bash
curl -I https://juanderintra.com

# Should see:
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000
# X-Content-Type-Options: nosniff
# Permissions-Policy: geolocation=(self)...
```

---

## 🛑 Common Issues

### Issue: Build fails
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build
```

### Issue: Service worker not updating
```javascript
// Unregister old SW
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
// Hard refresh: Ctrl+Shift+R
```

### Issue: CSP errors in console
- Check `frontend/index.html` line 20-21
- Ensure all domains are whitelisted
- Mapbox requires `unsafe-eval` (this is normal)

---

## 📞 Need Help?

- Full documentation: `PERFORMANCE_SECURITY_FIXES.md`
- Vite config: `frontend/vite.config.js`
- Backend config: `backend/server.js`
- Frontend HTML: `frontend/index.html`

---

## 🎯 Success Criteria

✅ Performance score > 75 (mobile)  
✅ Performance score > 85 (desktop)  
✅ No CSP warnings (except expected Mapbox ones)  
✅ Gzip compression enabled  
✅ Bundle size < 500KB (gzipped)  
✅ First Contentful Paint < 2.5s  
✅ Largest Contentful Paint < 4.0s  

---

**Good luck! 🚀**
