import React, { useState, useEffect } from "react";
import MainLayout from "../MainLayout";
import { FaStar } from "react-icons/fa";
import BackHeader from "../BackButton"; // ✅ import BackHeader
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Filter } from "bad-words";

const filter = new Filter();
filter.addWords(
  "putangina",
  "putang ina",
  "tanginamo",
  "anak ng puta",
  "pakyu",
  "pekpek",
  "puke",
  "burat",
  "pwets",
  "ulol",
  "gago",
  "gaga",
  "tanga",
  "bobo",
  "tarantado",
  "hayop",
  "loko",
  "lokohan",
  "pucha",
  "puchang ina",
  "pakshet",
  "gago ka",
  "tangina mo",
  "putangi mo",
  "ulol ka",
  "tanga ka"
);

export default function TripArchivesPage() {
  const [visitedSites, setVisitedSites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const BACKEND_URL = "http://localhost:5000";

  // Utility to resolve relative URLs into absolute URLs
  const resolveUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http")
      ? url
      : `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Fetch visited sites and reviews
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [visitedRes, reviewsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/visited-sites`, config),
          axios.get(`${BACKEND_URL}/api/reviews`, config),
        ]);

        setVisitedSites(visitedRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderStars = (rating, interactive = false, onHover = null, onClick = null) =>
    Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`${
          i < (interactive ? (hoverRating || rating) : rating)
            ? "text-yellow-400"
            : "text-gray-300"
        } ${interactive ? "cursor-pointer" : ""}`}
        onMouseEnter={() => interactive && onHover && onHover(i + 1)}
        onMouseLeave={() => interactive && onHover && onHover(0)}
        onClick={() => interactive && onClick && onClick(i + 1)}
      />
    ));

  const handleGoToNextSite = (itineraryId) => {
    navigate(`/tourist-itinerary/${itineraryId}`, {
      state: { triggerNextSite: true },
    });
  };

  const handleOpenReviewModal = (site) => {
    setSelectedSite(site);
    
    // Check if review already exists for this site
    const existingReview = reviews.find(
      (r) => r.siteId._id === site.siteId._id && r.itineraryId._id === site.itineraryId._id
    );
    
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.reviewText || "");
    } else {
      setRating(0);
      setReviewText("");
    }
    
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedSite || rating === 0) {
      alert("Please select a rating");
      return;
    }

    // Check for profanity in review text
    if (reviewText && filter.isProfane(reviewText)) {
      alert("⚠️ Please avoid using inappropriate language in your review.");
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/reviews`,
        {
          itineraryId: selectedSite.itineraryId._id,
          siteId: selectedSite.siteId._id,
          rating,
          reviewText,
        },
        config
      );

      // Update reviews list
      const updatedReviews = reviews.filter(
        (r) =>
          !(
            r.siteId._id === selectedSite.siteId._id &&
            r.itineraryId._id === selectedSite.itineraryId._id
          )
      );
      setReviews([response.data.review, ...updatedReviews]);

      setShowReviewModal(false);
      setSelectedSite(null);
      setRating(0);
      setReviewText("");
      
      alert(response.data.message);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/reviews/${reviewId}`, config);
      
      // Remove review from state
      setReviews(reviews.filter((r) => r._id !== reviewId));
      
      alert("Review deleted successfully");
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review");
    }
  };

  return (
    <div className="min-h-screen bg-[#f04e37] flex flex-col items-center text-sm relative px-4 md:px-0 text-white">
      {/* ✅ Sticky back header (matching profile layout) */}
      <div className="pt-4 z-10 sticky top-0 bg-[#f04e37] w-full">
        <BackHeader title="Trip Archives" />
      </div>

      <MainLayout includeSideButtons={false}>
        <div className="w-full max-w-xl">
          {/* Page content */}
          <div className="mt-4 text-center">
            {/* Trip Archives */}
            <h2 className="text-3xl font-bold mb-6">Trip Archives</h2>
            {loading ? (
              <p className="text-white">Loading visited sites...</p>
            ) : visitedSites.length === 0 ? (
              <p className="text-white">No visited sites yet. Start exploring!</p>
            ) : (
              <div className="flex flex-col items-center gap-6">
                {visitedSites.map((site, index) => (
                  <div
                    key={index}
                    className="bg-[#f4cc27] text-black rounded-2xl shadow-md flex gap-4 p-4 items-center w-full"
                  >
                    <img
                      src={
                        resolveUrl(site.siteId?.mediaUrl) ||
                        "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=400&q=80"
                      }
                      alt={site.siteId?.siteName || "Site"}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-bold text-[#f04e37]">
                        {site.siteId?.siteName || "Unknown Site"}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {site.itineraryId?.name || "Unknown Itinerary"}
                      </p>
                      <p className="text-xs mt-1 text-gray-600 line-clamp-2">
                        {site.siteId?.siteDescription || "No description available"}
                      </p>
                   
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Manage Reviews */}
            <h2 className="text-3xl font-bold mt-10 mb-6">Manage Reviews</h2>
            {loading ? (
              <p className="text-white">Loading reviews...</p>
            ) : (
              <div className="flex flex-col items-center gap-6">
                {visitedSites.length === 0 ? (
                  <p className="text-white">Visit sites to leave reviews!</p>
                ) : (
                  <>
                    {/* Show visited sites for review */}
                    {visitedSites.map((site, index) => {
                      const existingReview = reviews.find(
                        (r) =>
                          r.siteId._id === site.siteId._id &&
                          r.itineraryId._id === site.itineraryId._id
                      );

                      return (
                        <div
                          key={index}
                          className="bg-white text-black rounded-2xl shadow-md p-4 flex gap-4 items-start w-full"
                        >
                          <img
                            src={
                              resolveUrl(site.siteId?.mediaUrl) ||
                              "https://images.unsplash.com/photo-1549640376-1957636d1ab0?w=400&q=80"
                            }
                            alt={site.siteId?.siteName || "Site"}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 text-left">
                            <h3 className="font-bold text-[#f04e37]">
                              {site.siteId?.siteName || "Unknown Site"}
                            </h3>
                            <p className="text-xs text-gray-600">
                              Visited: {new Date(site.visitedAt).toLocaleDateString()}
                            </p>
                            {existingReview ? (
                              <>
                                <div className="flex items-center gap-1 my-1">
                                  {renderStars(existingReview.rating)}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-3">
                                  {existingReview.reviewText || "No review text"}
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleOpenReviewModal(site)}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Edit Review
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReview(existingReview._id)}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    Delete Review
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button
                                onClick={() => handleOpenReviewModal(site)}
                                className="mt-2 bg-[#f04e37] text-white px-4 py-1 rounded-lg text-xs font-semibold hover:bg-[#d43e2a] transition"
                              >
                                Write Review
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </MainLayout>

      {/* Review Modal */}
      {showReviewModal && selectedSite && (
        <div className="fixed inset-0 bg-[#f04e37] bg-opacity-95 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-[#f04e37] mb-4">
              Review: {selectedSite.siteId?.siteName}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">Rating:</p>
              <div className="flex gap-1">
                {renderStars(rating, true, setHoverRating, setRating)}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">Review (optional):</p>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                rows="4"
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitReview}
                className="flex-1 bg-[#f04e37] text-white py-2 rounded-lg font-semibold hover:bg-[#d43e2a] transition"
              >
                Submit Review
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedSite(null);
                  setRating(0);
                  setReviewText("");
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-10 text-xs text-center text-white opacity-70">
        ©2025 Intramuros Administration
      </p>
    </div>
  );
}
