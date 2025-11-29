// Load environment variables
require("dotenv").config();

console.log("🚀 Starting Juander Backend...");
console.log("📦 NODE_ENV:", process.env.NODE_ENV);
console.log("🔌 PORT:", process.env.PORT || 5000);
console.log("🗄️  MONGO_URI:", process.env.MONGO_URI ? "SET ✓" : "MISSING ✗");
console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET ? "SET ✓" : "MISSING ✗");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const mongoSanitize = require("express-mongo-sanitize");
const https = require("https");
const fs = require("fs");
const authRoute = require("./routes/authRoute");
const emergencyRoute = require("./routes/emergencyRoute");
const filters = require("./routes/filterRoute");
const adminRoutes = require("./routes/adminRoutes");
const adminBotRoute = require("./routes/adminBotRoute");
const publicBotRoute = require("./routes/publicBotRoute");
const pinRoute = require("./routes/pinRoute");
const maskRoute = require("./routes/maskRoute");
const itineraryRoute = require("./routes/itineraryRoute");
const photoboothFilterRoute = require("./routes/photoboothFilterRoute");
const tagRoutes = require("./routes/adminTagRoute");
const categoryRoute = require("./routes/categoryRoute");
const visitedSiteRoute = require("./routes/visitedSiteRoute");
const reviewRoute = require("./routes/reviewRoute");
const tourRoute = require("./routes/tourRoute");
const openaiRoute = require("./routes/openaiRoute");
const geminiRoute = require("./routes/geminiRoute");
const ttsRoute = require("./routes/tts");
const itineraryProgressRoute = require("./routes/itineraryProgressRoute");
const logRoute = require("./routes/logRoute");

const { verifyAdmin } = require("./middleware/authMiddleware");

// Needed for resolving __dirname in CommonJS
const app = express();

// Disable Express fingerprinting
app.disable('x-powered-by');

// Health check endpoint (for EB)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Juander Backend API',
    status: 'running',
    version: '1.0.0'
  });
});

app.use(
  cors({
    origin: [
      "http://localhost:5173", // Development
      "http://localhost:4173",
      "http://juander-frontend.s3-website-ap-southeast-2.amazonaws.com", // Production S3
      "https://d39zx5gyblzxjs.cloudfront.net", // Production Frontend CloudFront
      "https://d3des4qdhz53rp.cloudfront.net", // Production Backend CloudFront
      "https://juanderintra.com",
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600,
  })
);

// Security Headers Middleware
app.use((req, res, next) => {
  // Anti-clickjacking protection
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Content Security Policy (strict for API responses)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  );
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy (strict)
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Permissions Policy (restrict features)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(self), camera=(self), microphone=(), payment=(), usb=()'
  );
  
  // Cache-Control for API responses
  if (req.path.startsWith('/api/')) {
    // Dynamic API responses - no cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.path.startsWith('/uploads/')) {
    // Static assets - aggressive caching
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // HSTS - Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Remove server fingerprinting headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
});

// Increase payload size limits for video uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// app.use(
//   mongoSanitize({
//     replaceWith: "_", // Replaces any special characters like $, ., etc. with an underscore
//     sanitizeQuery: false, // Disable sanitizing of query parameters
//   })
// );
// MongoDB connection (non-blocking for EB health checks)
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn("⚠️  MONGO_URI not set. Database features will be unavailable.");
      return;
    }
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("⚠️  App will continue without database. Fix MONGO_URI and restart.");
    // Don't exit - let app start for health checks
  }
};

// Connect to DB (non-blocking)
connectDB().catch(err => console.error("DB connection failed:", err));
// API routes
app.use("/api/tour", tourRoute);

app.use("/api/auth", authRoute);
app.use("/api/emergency", emergencyRoute);
app.use("/api/filters", filters);
app.use("/api/admin", adminRoutes);
app.use("/api/bot", publicBotRoute);
app.use("/api/admin/tags", tagRoutes);
app.use("/api/admin/categories", verifyAdmin, categoryRoute);
app.use("/api/admin/bot", verifyAdmin, adminBotRoute);
app.use("/api/pins", pinRoute);
app.use("/api/mask", maskRoute);
app.use("/api/itineraries", itineraryRoute);
app.use("/api/userItineraries", itineraryRoute);
app.use("/api/photobooth/filters", photoboothFilterRoute);
app.use("/api/visited-sites", visitedSiteRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/openai", openaiRoute);
app.use("/api/tts", ttsRoute);
app.use("/api/gemini", geminiRoute);
app.use("/api/itinerary-progress", itineraryProgressRoute);
app.use("/api/logs", logRoute);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/uploads/profile",
  express.static(path.join(__dirname, "uploads/profile"))
);
app.use(
  "/uploads/emergency",
  express.static(path.join(__dirname, "uploads/emergency"))
);
// // Serve frontend in production +++
// if (process.env.NODE_ENV === "production") {
//   const __dirname = path.resolve();
//   app.use(express.static(path.join(__dirname, "frontend", "build")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
//   });
// }

// Global error handler (prevent stack trace leaks)
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({ 
    error: isDev ? err.message : "Internal Server Error",
    ...(isDev && { stack: err.stack }) // Only include stack in development
  });
});

// Start server with HTTPS
const PORT = process.env.PORT || 5000;

try {
  // Try multiple certificate locations
  let certPath = path.join(__dirname, 'cert', 'backend.pem');
  let keyPath = path.join(__dirname, 'cert', 'backend-key.pem');
  
  // Standard HTTP server for development
  const server = app.listen(PORT, 'localhost', () => {
    console.log(`✅ Server successfully started on port ${PORT}`);
    console.log(`🌐 Listening on http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
  
  server.on('error', (error) => {
    console.error('❌ Server failed to start:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Fatal error starting server:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
