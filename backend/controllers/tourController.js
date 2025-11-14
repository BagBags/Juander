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