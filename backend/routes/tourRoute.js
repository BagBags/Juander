const express = require("express");
const router = express.Router();
const { protect, touristOnly } = require("../middleware/authMiddleware");
const {
  completeTour,
  resetTour,
  getTourStatus,
  completeCreateItineraryTour,
  resetCreateItineraryTour,
  getCreateItineraryTourStatus,
  completeEmergencyTour,
  resetEmergencyTour,
  getEmergencyTourStatus,
  completeProfileTour,
  resetProfileTour,
  getProfileTourStatus,
  completeGuestProfileTour,
  resetGuestProfileTour,
  getGuestProfileTourStatus,
  completeTouristItineraryTour,
  resetTouristItineraryTour,
  getTouristItineraryTourStatus,
  completeTourMapTour,
  resetTourMapTour,
  getTourMapTourStatus,
  completePhotoboothTour,
  resetPhotoboothTour,
  getPhotoboothTourStatus,
  completeTripArchiveTour,
  resetTripArchiveTour,
  getTripArchiveTourStatus,
} = require("../controllers/tourController");

// All routes require authentication and tourist role
router.patch("/complete", protect, touristOnly, completeTour);
router.patch("/reset", protect, touristOnly, resetTour);
router.get("/status", protect, touristOnly, getTourStatus);

// Create Itinerary tutorial endpoints
router.patch("/create-itinerary/complete", protect, touristOnly, completeCreateItineraryTour);
router.patch("/create-itinerary/reset", protect, touristOnly, resetCreateItineraryTour);
router.get("/create-itinerary/status", protect, touristOnly, getCreateItineraryTourStatus);

// Emergency tutorial endpoints
router.patch("/emergency/complete", protect, touristOnly, completeEmergencyTour);
router.patch("/emergency/reset", protect, touristOnly, resetEmergencyTour);
router.get("/emergency/status", protect, touristOnly, getEmergencyTourStatus);

// Profile tutorial (tourist)
router.patch("/profile/complete", protect, completeProfileTour);
router.patch("/profile/reset", protect, resetProfileTour);
router.get("/profile/status", protect, getProfileTourStatus);

// Guest Profile tutorial (guest)
router.patch("/guest-profile/complete", protect, completeGuestProfileTour);
router.patch("/guest-profile/reset", protect, resetGuestProfileTour);
router.get("/guest-profile/status", protect, getGuestProfileTourStatus);

// Tourist Itinerary tutorial (tourist)
router.patch("/tourist-itinerary/complete", protect, completeTouristItineraryTour);
router.patch("/tourist-itinerary/reset", protect, resetTouristItineraryTour);
router.get("/tourist-itinerary/status", protect, getTouristItineraryTourStatus);

// Tour Map tutorial (tourist)
router.patch("/tour-map/complete", protect, completeTourMapTour);
router.patch("/tour-map/reset", protect, resetTourMapTour);
router.get("/tour-map/status", protect, getTourMapTourStatus);

// Photobooth tutorial (tourist)
router.patch("/photobooth/complete", protect, completePhotoboothTour);
router.patch("/photobooth/reset", protect, resetPhotoboothTour);
router.get("/photobooth/status", protect, getPhotoboothTourStatus);

router.patch("/trip-archive/complete", protect, completeTripArchiveTour);
router.patch("/trip-archive/reset", protect, resetTripArchiveTour);
router.get("/trip-archive/status", protect, getTripArchiveTourStatus);

module.exports = router;