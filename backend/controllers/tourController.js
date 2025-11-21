const User = require("../models/userModel");

/**
 * @desc    Mark tour as completed for the authenticated user
 * @route   PATCH /api/tour/complete
 * @access  Private (Tourist only)
 */
exports.completeTour = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasCompletedTour: true,
        tourCompletedAt: new Date(),
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Tour completed successfully",
      user: {
        hasCompletedTour: user.hasCompletedTour,
        tourCompletedAt: user.tourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error completing tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Reset tour (allow user to replay it)
 * @route   PATCH /api/tour/reset
 * @access  Private (Tourist only)
 */
exports.resetTour = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasCompletedTour: false,
        tourCompletedAt: null,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Tour reset successfully. You can now replay the tutorial.",
      user: {
        hasCompletedTour: user.hasCompletedTour,
        tourCompletedAt: user.tourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error resetting tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Get tour status for the authenticated user
 * @route   GET /api/tour/status
 * @access  Private (Tourist only)
 */
exports.getTourStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "hasCompletedTour tourCompletedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      hasCompletedTour: user.hasCompletedTour,
      tourCompletedAt: user.tourCompletedAt,
    });
  } catch (error) {
    console.error("Error fetching tour status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Mark Create Itinerary tour as completed
 * @route   PATCH /api/tour/create-itinerary/complete
 * @access  Private (Tourist only)
 */
exports.completeCreateItineraryTour = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasCompletedCreateItineraryTour: true,
        createItineraryTourCompletedAt: new Date(),
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Create Itinerary tour completed successfully",
      user: {
        hasCompletedCreateItineraryTour: user.hasCompletedCreateItineraryTour,
        createItineraryTourCompletedAt: user.createItineraryTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error completing Create Itinerary tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Reset Create Itinerary tour (allow replay)
 * @route   PATCH /api/tour/create-itinerary/reset
 * @access  Private (Tourist only)
 */
exports.resetCreateItineraryTour = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasCompletedCreateItineraryTour: false,
        createItineraryTourCompletedAt: null,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Create Itinerary tour reset successfully",
      user: {
        hasCompletedCreateItineraryTour: user.hasCompletedCreateItineraryTour,
        createItineraryTourCompletedAt: user.createItineraryTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error resetting Create Itinerary tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Get Create Itinerary tour status for the authenticated user
 * @route   GET /api/tour/create-itinerary/status
 * @access  Private (Tourist only)
 */
exports.getCreateItineraryTourStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "hasCompletedCreateItineraryTour createItineraryTourCompletedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      hasCompletedCreateItineraryTour: user.hasCompletedCreateItineraryTour,
      createItineraryTourCompletedAt: user.createItineraryTourCompletedAt,
    });
  } catch (error) {
    console.error("Error fetching Create Itinerary tour status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Mark Emergency tour as completed
 * @route   PATCH /api/tour/emergency/complete
 * @access  Private (Tourist only)
 */
exports.completeEmergencyTour = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasCompletedEmergencyTour: true,
        emergencyTourCompletedAt: new Date(),
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Emergency tour completed successfully",
      user: {
        hasCompletedEmergencyTour: user.hasCompletedEmergencyTour,
        emergencyTourCompletedAt: user.emergencyTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error completing Emergency tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Reset Emergency tour (allow replay)
 * @route   PATCH /api/tour/emergency/reset
 * @access  Private (Tourist only)
 */
exports.resetEmergencyTour = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasCompletedEmergencyTour: false,
        emergencyTourCompletedAt: null,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Emergency tour reset successfully",
      user: {
        hasCompletedEmergencyTour: user.hasCompletedEmergencyTour,
        emergencyTourCompletedAt: user.emergencyTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error resetting Emergency tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Get Emergency tour status for the authenticated user
 * @route   GET /api/tour/emergency/status
 * @access  Private (Tourist only)
 */
exports.getEmergencyTourStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "hasCompletedEmergencyTour emergencyTourCompletedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      hasCompletedEmergencyTour: user.hasCompletedEmergencyTour,
      emergencyTourCompletedAt: user.emergencyTourCompletedAt,
    });
  } catch (error) {
    console.error("Error fetching Emergency tour status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Profile tutorial (tourist)
exports.completeProfileTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { hasCompletedProfileTour: true, profileTourCompletedAt: new Date() },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Profile tour completion acknowledged",
        user: {
          hasCompletedProfileTour: true,
          profileTourCompletedAt: new Date(),
        },
      });
    }
    return res.status(200).json({
      message: "Profile tour completed successfully",
      user: {
        hasCompletedProfileTour: user.hasCompletedProfileTour,
        profileTourCompletedAt: user.profileTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error completing Profile tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.resetProfileTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { hasCompletedProfileTour: false, profileTourCompletedAt: null },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Profile tour reset acknowledged",
        user: {
          hasCompletedProfileTour: false,
          profileTourCompletedAt: null,
        },
      });
    }
    return res.status(200).json({
      message: "Profile tour reset successfully",
      user: {
        hasCompletedProfileTour: user.hasCompletedProfileTour,
        profileTourCompletedAt: user.profileTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error resetting Profile tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getProfileTourStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "hasCompletedProfileTour profileTourCompletedAt"
    );
    if (!user) {
      return res.status(200).json({
        hasCompletedProfileTour: true,
        profileTourCompletedAt: null,
      });
    }
    return res.status(200).json({
      hasCompletedProfileTour: user.hasCompletedProfileTour,
      profileTourCompletedAt: user.profileTourCompletedAt,
    });
  } catch (error) {
    console.error("Error fetching Profile tour status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Guest Profile tutorial (guest)
exports.completeGuestProfileTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { hasCompletedGuestProfileTour: true, guestProfileTourCompletedAt: new Date() },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Guest Profile tour completion acknowledged",
        user: {
          hasCompletedGuestProfileTour: true,
          guestProfileTourCompletedAt: new Date(),
        },
      });
    }
    return res.status(200).json({
      message: "Guest Profile tour completed successfully",
      user: {
        hasCompletedGuestProfileTour: user.hasCompletedGuestProfileTour,
        guestProfileTourCompletedAt: user.guestProfileTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error completing Guest Profile tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.resetGuestProfileTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { hasCompletedGuestProfileTour: false, guestProfileTourCompletedAt: null },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Guest Profile tour reset acknowledged",
        user: {
          hasCompletedGuestProfileTour: false,
          guestProfileTourCompletedAt: null,
        },
      });
    }
    return res.status(200).json({
      message: "Guest Profile tour reset successfully",
      user: {
        hasCompletedGuestProfileTour: user.hasCompletedGuestProfileTour,
        guestProfileTourCompletedAt: user.guestProfileTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error resetting Guest Profile tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getGuestProfileTourStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "hasCompletedGuestProfileTour guestProfileTourCompletedAt"
    );
    if (!user) {
      return res.status(200).json({
        hasCompletedGuestProfileTour: true,
        guestProfileTourCompletedAt: null,
      });
    }
    return res.status(200).json({
      hasCompletedGuestProfileTour: user.hasCompletedGuestProfileTour,
      guestProfileTourCompletedAt: user.guestProfileTourCompletedAt,
    });
  } catch (error) {
    console.error("Error fetching Guest Profile tour status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Tourist Itinerary tutorial (tourist)
exports.completeTouristItineraryTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasCompletedTouristItineraryTour: true,
        touristItineraryTourCompletedAt: new Date(),
      },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Tourist Itinerary tour completion acknowledged",
        user: {
          hasCompletedTouristItineraryTour: true,
          touristItineraryTourCompletedAt: new Date(),
        },
      });
    }
    return res.status(200).json({
      message: "Tourist Itinerary tour completed successfully",
      user: {
        hasCompletedTouristItineraryTour: user.hasCompletedTouristItineraryTour,
        touristItineraryTourCompletedAt: user.touristItineraryTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error completing Tourist Itinerary tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.resetTouristItineraryTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        hasCompletedTouristItineraryTour: false,
        touristItineraryTourCompletedAt: null,
      },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Tourist Itinerary tour reset acknowledged",
        user: {
          hasCompletedTouristItineraryTour: false,
          touristItineraryTourCompletedAt: null,
        },
      });
    }
    return res.status(200).json({
      message: "Tourist Itinerary tour reset successfully",
      user: {
        hasCompletedTouristItineraryTour: user.hasCompletedTouristItineraryTour,
        touristItineraryTourCompletedAt: user.touristItineraryTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error resetting Tourist Itinerary tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTouristItineraryTourStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "hasCompletedTouristItineraryTour touristItineraryTourCompletedAt"
    );
    if (!user) {
      return res.status(200).json({
        hasCompletedTouristItineraryTour: true,
        touristItineraryTourCompletedAt: null,
      });
    }
    return res.status(200).json({
      hasCompletedTouristItineraryTour: user.hasCompletedTouristItineraryTour,
      touristItineraryTourCompletedAt: user.touristItineraryTourCompletedAt,
    });
  } catch (error) {
    console.error("Error fetching Tourist Itinerary tour status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Tour Map tutorial (tourist)
exports.completeTourMapTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { hasCompletedTourMapTour: true, tourMapTourCompletedAt: new Date() },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Tour Map tour completion acknowledged",
        user: {
          hasCompletedTourMapTour: true,
          tourMapTourCompletedAt: new Date(),
        },
      });
    }
    return res.status(200).json({
      message: "Tour Map tour completed successfully",
      user: {
        hasCompletedTourMapTour: user.hasCompletedTourMapTour,
        tourMapTourCompletedAt: user.tourMapTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error completing Tour Map tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.resetTourMapTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { hasCompletedTourMapTour: false, tourMapTourCompletedAt: null },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Tour Map tour reset acknowledged",
        user: {
          hasCompletedTourMapTour: false,
          tourMapTourCompletedAt: null,
        },
      });
    }
    return res.status(200).json({
      message: "Tour Map tour reset successfully",
      user: {
        hasCompletedTourMapTour: user.hasCompletedTourMapTour,
        tourMapTourCompletedAt: user.tourMapTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error resetting Tour Map tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTourMapTourStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "hasCompletedTourMapTour tourMapTourCompletedAt"
    );
    if (!user) {
      return res.status(200).json({
        hasCompletedTourMapTour: true,
        tourMapTourCompletedAt: null,
      });
    }
    return res.status(200).json({
      hasCompletedTourMapTour: user.hasCompletedTourMapTour,
      tourMapTourCompletedAt: user.tourMapTourCompletedAt,
    });
  } catch (error) {
    console.error("Error fetching Tour Map tour status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Photobooth tutorial (tourist)
exports.completePhotoboothTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { hasCompletedPhotoboothTour: true, photoboothTourCompletedAt: new Date() },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Photobooth tour completion acknowledged",
        user: {
          hasCompletedPhotoboothTour: true,
          photoboothTourCompletedAt: new Date(),
        },
      });
    }
    return res.status(200).json({
      message: "Photobooth tour completed successfully",
      user: {
        hasCompletedPhotoboothTour: user.hasCompletedPhotoboothTour,
        photoboothTourCompletedAt: user.photoboothTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error completing Photobooth tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.resetPhotoboothTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { hasCompletedPhotoboothTour: false, photoboothTourCompletedAt: null },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Photobooth tour reset acknowledged",
        user: {
          hasCompletedPhotoboothTour: false,
          photoboothTourCompletedAt: null,
        },
      });
    }
    return res.status(200).json({
      message: "Photobooth tour reset successfully",
      user: {
        hasCompletedPhotoboothTour: user.hasCompletedPhotoboothTour,
        photoboothTourCompletedAt: user.photoboothTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error resetting Photobooth tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPhotoboothTourStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "hasCompletedPhotoboothTour photoboothTourCompletedAt"
    );
    if (!user) {
      return res.status(200).json({
        hasCompletedPhotoboothTour: true,
        photoboothTourCompletedAt: null,
      });
    }
    return res.status(200).json({
      hasCompletedPhotoboothTour: user.hasCompletedPhotoboothTour,
      photoboothTourCompletedAt: user.photoboothTourCompletedAt,
    });
  } catch (error) {
    console.error("Error fetching Photobooth tour status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.completeTripArchiveTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { hasCompletedTripArchiveTour: true, tripArchiveTourCompletedAt: new Date() },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Trip Archive tour completion acknowledged",
        user: {
          hasCompletedTripArchiveTour: true,
          tripArchiveTourCompletedAt: new Date(),
        },
      });
    }
    return res.status(200).json({
      message: "Trip Archive tour completed successfully",
      user: {
        hasCompletedTripArchiveTour: user.hasCompletedTripArchiveTour,
        tripArchiveTourCompletedAt: user.tripArchiveTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error completing Trip Archive tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.resetTripArchiveTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { hasCompletedTripArchiveTour: false, tripArchiveTourCompletedAt: null },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(200).json({
        message: "Trip Archive tour reset acknowledged",
        user: {
          hasCompletedTripArchiveTour: false,
          tripArchiveTourCompletedAt: null,
        },
      });
    }
    return res.status(200).json({
      message: "Trip Archive tour reset successfully",
      user: {
        hasCompletedTripArchiveTour: user.hasCompletedTripArchiveTour,
        tripArchiveTourCompletedAt: user.tripArchiveTourCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error resetting Trip Archive tour:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTripArchiveTourStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "hasCompletedTripArchiveTour tripArchiveTourCompletedAt"
    );
    if (!user) {
      return res.status(200).json({
        hasCompletedTripArchiveTour: true,
        tripArchiveTourCompletedAt: null,
      });
    }
    return res.status(200).json({
      hasCompletedTripArchiveTour: user.hasCompletedTripArchiveTour,
      tripArchiveTourCompletedAt: user.tripArchiveTourCompletedAt,
    });
  } catch (error) {
    console.error("Error fetching Trip Archive tour status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};