const express = require("express");
const router = express.Router();
const { protect, touristOnly } = require("../middleware/authMiddleware");
const {
  completeTour,
  resetTour,
  getTourStatus,
} = require("../controllers/tourController");

// All routes require authentication and tourist role
router.patch("/complete", protect, touristOnly, completeTour);
router.patch("/reset", protect, touristOnly, resetTour);
router.get("/status", protect, touristOnly, getTourStatus);

module.exports = router;