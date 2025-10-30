# Intramuros Tourism System - Web Hosting & Deployment

## System Architecture Overview

The Intramuros Tourism System is a full-stack web application with the following architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │   Progressive Web App (PWA)                        │     │
│  │   - React 18.x                                     │     │
│  │   - Vite Build Tool                                │     │
│  │   - Service Workers (Offline Support)              │     │
│  │   - Responsive Design (Mobile-First)               │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                        SERVER LAYER                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │   Backend API Server                               │     │
│  │   - Node.js v18+                                   │     │
│  │   - Express.js Framework                           │     │
│  │   - RESTful API Architecture                       │     │
│  │   - JWT Authentication                             │     │
│  │   - Multer (File Upload)                           │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │   MongoDB Atlas (Cloud Database)                   │     │
│  │   - NoSQL Document Database                        │     │
│  │   - Automatic Backups                              │     │
│  │   - Scalable Storage                               │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  - Google OAuth 2.0                                          │
│  - Email Service (SMTP)                                      │
│  - Mapbox GL JS (Maps)                                       │
│  - File Storage (Local/Cloud)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| Vite | Latest | Build Tool & Dev Server |
| React Router | 6.x | Client-side Routing |
| Axios | Latest | HTTP Client |
| Mapbox GL JS | Latest | 3D Maps |
| Framer Motion | Latest | Animations |
| Tailwind CSS | 3.x | Styling Framework |
| Lucide React | Latest | Icon Library |
| i18next | Latest | Internationalization |
| Workbox | Latest | PWA Service Workers |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime Environment |
| Express.js | 4.x | Web Framework |
| MongoDB | 6.x | Database |
| Mongoose | Latest | ODM for MongoDB |
| JWT | Latest | Authentication |
| bcrypt | Latest | Password Hashing |
| Multer | Latest | File Upload |
| Nodemailer | Latest | Email Service |
| CORS | Latest | Cross-Origin Resource Sharing |
| dotenv | Latest | Environment Variables |

---

## Hosting Options

### Option 1: Render.com (Recommended - Current Setup)

**Advantages**:
- ✅ Free tier available
- ✅ Automatic deployments from Git
- ✅ Built-in SSL certificates
- ✅ Easy environment variable management
- ✅ Supports both frontend and backend
- ✅ Good for small to medium traffic

**Deployment URLs**:
- Frontend: `https://juander.onrender.com`
- Backend: `https://juander-dbd5.onrender.com`

**Limitations**:
- Free tier spins down after inactivity (cold starts)
- Limited bandwidth on free tier
- Slower performance compared to paid tiers

---

### Option 2: Vercel (Frontend) + Render/Railway (Backend)

**Advantages**:
- ✅ Excellent frontend performance
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Zero-config deployments
- ✅ Great for React/Vite apps

**Configuration**:
```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    }
  ]
}
```

---

### Option 3: Netlify (Frontend) + Backend Hosting

**Advantages**:
- ✅ Excellent PWA support
- ✅ Form handling
- ✅ Serverless functions
- ✅ Automatic deployments

**Configuration**:
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Service-Worker-Allowed = "/"
```

---

### Option 4: Self-Hosted (VPS)

**Providers**: DigitalOcean, Linode, AWS EC2, Google Cloud

**Advantages**:
- ✅ Full control over infrastructure
- ✅ Better performance
- ✅ No cold starts
- ✅ Custom configurations

**Requirements**:
- Ubuntu 22.04 LTS or similar
- Nginx as reverse proxy
- PM2 for process management
- SSL certificate (Let's Encrypt)

---

## Deployment Guide

### A. Frontend Deployment (Render)

#### 1. Build Configuration

**File**: `package.json` (frontend)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

#### 2. Environment Variables
Create `.env` file in frontend:
```env
VITE_API_URL=https://juander-dbd5.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_MAPBOX_TOKEN=your_mapbox_token
```

#### 3. Render Configuration
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18

#### 4. Deployment Steps
1. Push code to GitHub repository
2. Connect Render to GitHub
3. Create new Static Site
4. Configure build settings
5. Add environment variables
6. Deploy

---

### B. Backend Deployment (Render)

#### 1. Server Configuration

**File**: `package.json` (backend)
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 2. Environment Variables
Create `.env` file in backend:
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/intramuros_tourism_db

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend URL (for CORS)
FRONTEND_URL=https://juander.onrender.com
```

#### 3. CORS Configuration

**File**: `server.js`
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://juander.onrender.com',
    'http://localhost:5173' // for development
  ],
  credentials: true
}));
```

#### 4. Render Configuration
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: 18

#### 5. Deployment Steps
1. Push code to GitHub repository
2. Connect Render to GitHub
3. Create new Web Service
4. Configure build settings
5. Add environment variables
6. Deploy

---

### C. Database Setup (MongoDB Atlas)

#### 1. Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free tier
3. Create new cluster

#### 2. Configure Database
1. **Cluster Name**: `IntramurosCluster`
2. **Region**: Choose closest to your users
3. **Tier**: M0 (Free) or higher

#### 3. Network Access
1. Add IP Address: `0.0.0.0/0` (allow all) for cloud hosting
2. Or add specific Render IP addresses

#### 4. Database User
1. Create database user with read/write permissions
2. Save username and password securely

#### 5. Connection String
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/intramuros_tourism_db?retryWrites=true&w=majority
```

---

## File Storage Configuration

### Option 1: Local Storage (Current Setup)

**Directory Structure**:
```
backend/
├── uploads/
│   ├── profile/          # User profile pictures
│   ├── emergency/        # Emergency contact icons
│   ├── itineraries/      # Itinerary cover images
│   ├── userItineraries/  # User itinerary images
│   ├── pins/             # Site media files
│   ├── reviews/          # Review photos
│   └── filters/          # Photobooth filters
```

**Configuration**: `backend/middleware/upload.js`
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.baseUrl.includes('profile') ? 'profile' :
                   req.baseUrl.includes('emergency') ? 'emergency' :
                   req.baseUrl.includes('pins') ? 'pins' :
                   req.baseUrl.includes('reviews') ? 'reviews' :
                   req.baseUrl.includes('filters') ? 'filters' :
                   req.baseUrl.includes('userItineraries') ? 'userItineraries' :
                   'itineraries';
    cb(null, `uploads/${folder}`);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

module.exports = multer({ storage });
```

**Serving Static Files**:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

---

### Option 2: Cloud Storage (Recommended for Production)

#### AWS S3 Configuration
```javascript
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'intramuros-tourism',
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const folder = req.baseUrl.split('/').pop();
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, `${folder}/${uniqueName}`);
    }
  })
});
```

#### Cloudinary Configuration
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'intramuros-tourism',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp']
  }
});
```

---

## PWA Configuration

### Service Worker Setup

**File**: `frontend/public/service-worker.js`
```javascript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        }
      }
    ]
  })
);
```

### Manifest Configuration

**File**: `frontend/public/manifest.json`
```json
{
  "name": "Intramuros Tourism System",
  "short_name": "Intramuros",
  "description": "Explore the historic walled city of Intramuros",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f04e37",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## SSL/HTTPS Configuration

### Automatic SSL (Render/Vercel/Netlify)
- SSL certificates automatically provisioned
- HTTPS enforced by default
- No manual configuration needed

### Manual SSL (Self-Hosted)

#### Using Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/intramuros-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /uploads/ {
        alias /var/www/intramuros-backend/uploads/;
    }
}
```

---

## Performance Optimization

### Frontend Optimization
1. **Code Splitting**: Lazy load routes
2. **Image Optimization**: WebP format, lazy loading
3. **Caching**: Service worker caching strategy
4. **Minification**: Vite automatically minifies
5. **CDN**: Use CDN for static assets

### Backend Optimization
1. **Database Indexing**: Index frequently queried fields
2. **Caching**: Redis for session/data caching
3. **Compression**: Gzip compression
4. **Rate Limiting**: Prevent abuse
5. **Load Balancing**: Multiple server instances

---

## Monitoring & Maintenance

### Monitoring Tools
- **Render Dashboard**: Built-in metrics
- **MongoDB Atlas**: Database monitoring
- **Google Analytics**: User analytics
- **Sentry**: Error tracking
- **Uptime Robot**: Uptime monitoring

### Backup Strategy
1. **Database**: MongoDB Atlas automatic backups
2. **Files**: Regular backup to cloud storage
3. **Code**: Git version control
4. **Configuration**: Document all environment variables

### Maintenance Schedule
- **Daily**: Monitor error logs
- **Weekly**: Check performance metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

---

## Cost Estimation

### Free Tier (Development/Small Scale)
| Service | Cost | Limitations |
|---------|------|-------------|
| Render (Frontend) | $0 | 100GB bandwidth/month |
| Render (Backend) | $0 | Spins down after inactivity |
| MongoDB Atlas | $0 | 512MB storage |
| **Total** | **$0/month** | Limited performance |

### Production Tier (Recommended)
| Service | Cost | Features |
|---------|------|----------|
| Render (Frontend) | $7/month | Always on, custom domain |
| Render (Backend) | $7/month | Always on, 512MB RAM |
| MongoDB Atlas | $9/month | 2GB storage, backups |
| Cloudinary | $0-$89/month | Image hosting & optimization |
| **Total** | **$23-112/month** | Professional performance |

### Enterprise Tier (High Traffic)
| Service | Cost | Features |
|---------|------|----------|
| AWS/GCP | $50-200/month | Scalable infrastructure |
| MongoDB Atlas | $57/month | 10GB storage, high availability |
| CDN | $20-100/month | Global content delivery |
| **Total** | **$127-357/month** | Enterprise-grade |

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificate obtained
- [ ] CORS configured correctly
- [ ] File upload directories created
- [ ] Email service configured
- [ ] Google OAuth credentials set
- [ ] Mapbox token configured

### Post-Deployment
- [ ] Test all user flows
- [ ] Verify PWA installation
- [ ] Check offline functionality
- [ ] Test file uploads
- [ ] Verify email notifications
- [ ] Test payment integration (if any)
- [ ] Monitor error logs
- [ ] Set up analytics
- [ ] Configure backups
- [ ] Document deployment process

---

## Troubleshooting Common Issues

### Issue 1: CORS Errors
**Solution**: Verify CORS configuration includes frontend URL
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Issue 2: File Upload Fails
**Solution**: Check upload directory permissions
```bash
chmod 755 uploads/
```

### Issue 3: Database Connection Timeout
**Solution**: Verify MongoDB Atlas network access and connection string

### Issue 4: PWA Not Installing
**Solution**: Ensure HTTPS and valid manifest.json

### Issue 5: Cold Start Delays (Render Free Tier)
**Solution**: Upgrade to paid tier or implement keep-alive ping

---

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use strong, random secret keys
3. **Password Hashing**: Use bcrypt with salt rounds ≥ 10
4. **Input Validation**: Validate all user inputs
5. **SQL Injection**: Use parameterized queries (Mongoose handles this)
6. **XSS Protection**: Sanitize user-generated content
7. **Rate Limiting**: Implement API rate limiting
8. **HTTPS Only**: Enforce HTTPS in production
9. **Dependency Updates**: Regularly update npm packages
10. **Security Headers**: Use helmet.js for security headers

```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## Conclusion

This document provides comprehensive guidance for deploying the Intramuros Tourism System. Choose the hosting option that best fits your budget and performance requirements. For production use, the recommended setup is:

- **Frontend**: Vercel or Render (Paid)
- **Backend**: Render or Railway (Paid)
- **Database**: MongoDB Atlas (Shared or Dedicated)
- **File Storage**: Cloudinary or AWS S3
- **Monitoring**: Sentry + Google Analytics

For questions or support, refer to the system documentation or contact the development team.

