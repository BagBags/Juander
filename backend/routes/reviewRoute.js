const express = require("express");
const router = express.Router();
const Review = require("../models/reviewModel");
const VisitedSite = require("../models/visitedSiteModel");
const Log = require("../models/logModel");
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

    // Process uploaded photos - use S3 URLs if available
    const photoPaths = req.files ? req.files.map(file => file.location || `/uploads/reviews/${file.filename}`) : [];

    // Always create new review (allow multiple reviews per user per site)
    const review = await Review.create({
      userId,
      itineraryId,
      siteId,
      rating,
      reviewText: reviewText || "",
      photos: photoPaths,
    });

    // Automatically mark site as visited when review is created or updated
    try {
      const existingVisit = await VisitedSite.findOne({
        userId,
        itineraryId,
        siteId,
      });

      if (!existingVisit) {
        await VisitedSite.create({
          userId,
          itineraryId,
          siteId,
        });
        console.log(`Site ${siteId} marked as visited for user ${userId}`);
      }
    } catch (visitErr) {
      console.error("Error marking site as visited:", visitErr);
      // Continue even if visited site creation fails
    }

    const populated = await Review.findById(review._id)
      .populate("userId", "firstName lastName email")
      .populate("itineraryId", "name")
      .populate("siteId", "siteName siteDescription mediaUrl");

    // Log the review creation
    try {
      await Log.create({
        adminName: `${populated.userId.firstName} ${populated.userId.lastName}`,
        action: "Created review",
        role: "tourist",
        targetType: "review",
        targetId: review._id,
        details: {
          userName: `${populated.userId.firstName} ${populated.userId.lastName}`,
          userEmail: populated.userId.email,
          siteName: populated.siteId.siteName,
          itineraryName: populated.itineraryId.name,
          rating: rating,
          reviewText: reviewText || "",
          photos: photoPaths,
        },
      });
    } catch (logErr) {
      console.error("Error creating log:", logErr);
      // Continue even if logging fails
    }

    res.status(201).json({
      message: "Review created successfully",
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

    // Check content with OpenAI Moderation API if reviewText is provided
    if (reviewText) {
      try {
        const axios = require('axios');
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        
        if (!OPENAI_API_KEY) {
          console.error('OPENAI_API_KEY not found in environment variables');
          return res.status(500).json({ error: 'Content moderation service unavailable' });
        }

        const moderationResponse = await axios.post(
          'https://api.openai.com/v1/moderations',
          {
            model: "omni-moderation-latest",
            input: reviewText
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const results = moderationResponse.data.results[0];
        
        if (results.flagged) {
          // Get the flagged categories
          const flaggedCategories = Object.entries(results.categories)
            .filter(([_, value]) => value)
            .map(([key, _]) => key);
            
          return res.status(400).json({ 
            error: "Your review contains inappropriate content",
            flagged: true,
            categories: flaggedCategories
          });
        }
      } catch (error) {
        console.error('OpenAI Moderation API Error:', error.response?.data || error.message);
        // Continue with the review update even if moderation fails
      }
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

    const review = await Review.findOne({ _id: id, userId })
      .populate("userId", "firstName lastName email")
      .populate("itineraryId", "name")
      .populate("siteId", "siteName siteDescription");

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Log the deletion before deleting
    try {
      await Log.create({
        adminName: `${review.userId.firstName} ${review.userId.lastName}`,
        action: "Deleted own review",
        role: "tourist",
        targetType: "review",
        targetId: review._id,
        details: {
          userName: `${review.userId.firstName} ${review.userId.lastName}`,
          userEmail: review.userId.email,
          siteName: review.siteId.siteName,
          itineraryName: review.itineraryId.name,
          rating: review.rating,
          reviewText: review.reviewText,
          photos: review.photos,
          previousData: {
            deletedAt: new Date(),
            reviewId: review._id,
          },
        },
      });
    } catch (logErr) {
      console.error("Error creating log:", logErr);
      // Continue even if logging fails
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// @route   DELETE /api/reviews/admin/:id
// @desc    Delete any review (admin only)
// @access  Private (Admin)
router.delete("/admin/:id", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin" && req.user.email !== "aaronbagain@gmail.com") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { id } = req.params;

    const review = await Review.findById(id)
      .populate("userId", "firstName lastName email")
      .populate("itineraryId", "name")
      .populate("siteId", "siteName siteDescription");

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Log the deletion before deleting
    try {
      await Log.create({
        adminName: `${req.user.firstName} ${req.user.lastName}`,
        action: "Deleted review (Admin)",
        role: "admin",
        targetType: "review",
        targetId: review._id,
        details: {
          userName: `${review.userId.firstName} ${review.userId.lastName}`,
          userEmail: review.userId.email,
          siteName: review.siteId.siteName,
          itineraryName: review.itineraryId.name,
          rating: review.rating,
          reviewText: review.reviewText,
          photos: review.photos,
          previousData: {
            deletedAt: new Date(),
            reviewId: review._id,
            deletedBy: `${req.user.firstName} ${req.user.lastName}`,
          },
        },
      });
    } catch (logErr) {
      console.error("Error creating log:", logErr);
      // Continue even if logging fails
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

module.exports = router;
