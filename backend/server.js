// Load environment variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const mongoSanitize = require("express-mongo-sanitize");
const authRoute = require("./routes/authRoute");
const emergencyRoute = require("./routes/emergencyRoute");
const filters = require("./routes/filterRoute");
const adminRoutes = require("./routes/adminRoutes");
const adminBotRoute = require("./routes/adminBotRoute");
const pinRoute = require("./routes/pinRoute");
const maskRoute = require("./routes/maskRoute");
const itineraryRoute = require("./routes/itineraryRoute");
const { verifyAdmin } = require("./middleware/authMiddleware");

// Needed for resolving __dirname in CommonJS
const app = express();

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "http://localhost:5000",
//       "https://juander-dbd5.onrender.com",
//       "https://juander.onrender.com",
//     ],
//     credentials: true,
//   })
// );

app.use(cors());

app.use(express.json());
// app.use(
//   mongoSanitize({
//     replaceWith: "_", // Replaces any special characters like $, ., etc. with an underscore
//     sanitizeQuery: false, // Disable sanitizing of query parameters
//   })
// );
// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

connectDB();
// API routes
app.use("/api/auth", authRoute);
app.use("/api/emergency", emergencyRoute);
app.use("/api/filters", filters);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/bot", verifyAdmin, adminBotRoute);
app.use("/api/pins", pinRoute);
app.use("/api/mask", maskRoute);
app.use("/api/itineraries", itineraryRoute);

// // Serve frontend in production +++
// if (process.env.NODE_ENV === "production") {
//   const __dirname = path.resolve();
//   app.use(express.static(path.join(__dirname, "frontend", "build")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
//   });
// }

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
