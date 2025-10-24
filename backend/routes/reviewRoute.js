const express = require("express");
const router = express.Router();
const Review = require("../models/reviewModel");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// @route   POST /api/reviews
// @desc    Create or update a review
// @access  Private
router.post("/", verifyToken, upload.array("photos", 5), async (req, res) => {
  try {
    const { itineraryId, siteId, rating, reviewText } = req.body;
    const userId = req.user.id;

    if (!itineraryId || !siteId || !rating) {
      return res.status(400).json({ error: "Itinerary ID, Site ID, and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Process uploaded photos
    const photoPaths = req.files ? req.files.map(file => `/uploads/reviews/${file.filename}`) : [];

    // Check if review already exists
    const existingReview = await Review.findOne({
      userId,
      itineraryId,
      siteId,
    });

    let review;

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.reviewText = reviewText || "";
      // If new photos are uploaded, replace old photos, otherwise keep existing
      if (photoPaths.length > 0) {
        existingReview.photos = photoPaths;
      }
      review = await existingReview.save();
    } else {
      // Create new review
      review = await Review.create({
        userId,
        itineraryId,
        siteId,
        rating,
        reviewText: reviewText || "",
        photos: photoPaths,
      });
    }

    const populated = await Review.findById(review._id)
      .populate("userId", "firstName lastName email")
      .populate("itineraryId", "name")
      .populate("siteId", "siteName siteDescription mediaUrl");

    res.status(existingReview ? 200 : 201).json({
      message: existingReview ? "Review updated successfully" : "Review created successfully",
      review: populated,
    });
  } catch (err) {
    console.error("Error creating/updating review:", err);
    res.status(500).json({ error: "Failed to save review" });
  }
});

// @route   GET /api/reviews
// @desc    Get all reviews for the logged-in user
// @access  Private
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.find({ userId })
      .populate("itineraryId", "name")
      .populate("siteId", "siteName siteDescription mediaUrl latitude longitude")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// @route   GET /api/reviews/admin/all
// @desc    Get all reviews (admin only)
// @access  Private (Admin)
router.get("/admin/all", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin" && req.user.email !== "aaronbagain@gmail.com") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const reviews = await Review.find()
      .populate("userId", "firstName lastName email")
      .populate("itineraryId", "name")
      .populate("siteId", "siteName siteDescription")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error fetching all reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// @route   GET /api/reviews/site/:siteId
// @desc    Get all reviews for a specific site (public)
// @access  Private
router.get("/site/:siteId", async (req, res) => {
  try {
    const { siteId } = req.params;

    const reviews = await Review.find({ siteId })
      .populate("userId", "firstName lastName email")
      .populate("siteId", "siteName")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.status(200).json({
      reviews,
      averageRating: avgRating.toFixed(1),
      totalReviews: reviews.length,
    });
  } catch (err) {
    console.error("Error fetching site reviews:", err);
    res.status(500).json({ error: "Failed to fetch site reviews" });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get a specific review
// @access  Private
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const review = await Review.findOne({ _id: id, userId })
      .populate("itineraryId", "name")
      .populate("siteId", "siteName siteDescription mediaUrl");

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.status(200).json(review);
  } catch (err) {
    console.error("Error fetching review:", err);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, reviewText } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const review = await Review.findOne({ _id: id, userId });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (rating !== undefined) review.rating = rating;
    if (reviewText !== undefined) review.reviewText = reviewText;

    await review.save();

    const populated = await Review.findById(review._id)
      .populate("userId", "firstName lastName email")
      .populate("itineraryId", "name")
      .populate("siteId", "siteName siteDescription mediaUrl");

    res.status(200).json({
      message: "Review updated successfully",
      review: populated,
    });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ error: "Failed to update review" });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const review = await Review.findOne({ _id: id, userId });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

module.exports = router;
