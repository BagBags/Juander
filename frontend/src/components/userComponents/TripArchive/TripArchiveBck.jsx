import React, { useState, useEffect } from "react";
import MainLayout from "../MainLayout";
import { FaStar } from "react-icons/fa";
import BackHeader from "../BackButton"; // ✅ import BackHeader
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Filter } from "bad-words";
import { Camera, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import NotificationModal from "../../shared/NotificationModal";

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
  const { t } = useTranslation();
  const [visitedSites, setVisitedSites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    autoClose: false,
    autoCloseDuration: 2000,
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const BACKEND_URL =
    import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
    "http://localhost:5000";

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

  const renderStars = (
    rating,
    interactive = false,
    onHover = null,
    onClick = null
  ) =>
    Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`${
          i < (interactive ? hoverRating || rating : rating)
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
      (r) =>
        r.siteId?._id === site.siteId?._id &&
        r.itineraryId?._id === site.itineraryId?._id
    );

    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.reviewText || "");
      // Load existing photos if available
      if (existingReview.photos && existingReview.photos.length > 0) {
        setPhotoPreviewUrls(existingReview.photos.map((p) => resolveUrl(p)));
      } else {
        setPhotoPreviewUrls([]);
      }
    } else {
      setRating(0);
      setReviewText("");
      setPhotoPreviewUrls([]);
    }
    setReviewPhotos([]);

    setShowReviewModal(true);
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 photos total
    const remainingSlots = 5 - photoPreviewUrls.length;
    const filesToAdd = files.slice(0, remainingSlots);

    // Create preview URLs
    const newPreviewUrls = filesToAdd.map((file) => URL.createObjectURL(file));
    setPhotoPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setReviewPhotos((prev) => [...prev, ...filesToAdd]);
  };

  const handleRemovePhoto = (index) => {
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setReviewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!selectedSite || rating === 0) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Select a rating",
        message: "Please select a rating before submitting.",
        autoClose: true,
        autoCloseDuration: 2000,
      });
      return;
    }

    // Check for profanity in review text
    if (reviewText && filter.isProfane(reviewText)) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Inappropriate language",
        message: "Please avoid using inappropriate language in your review.",
        autoClose: true,
        autoCloseDuration: 2500,
      });
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append(
        "itineraryId",
        selectedSite.itineraryId?._id || selectedSite.itineraryId
      );
      formData.append(
        "siteId",
        selectedSite.siteId?._id || selectedSite.siteId
      );
      formData.append("rating", rating);
      formData.append("reviewText", reviewText);

      // Append photos
      reviewPhotos.forEach((photo) => {
        formData.append("photos", photo);
      });

      const response = await axios.post(
        `${BACKEND_URL}/api/reviews`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update reviews list
      const updatedReviews = reviews.filter(
        (r) =>
          !(
            r.siteId?._id === selectedSite.siteId?._id &&
            r.itineraryId?._id === selectedSite.itineraryId?._id
          )
      );
      setReviews([response.data.review, ...updatedReviews]);

      setShowReviewModal(false);
      setSelectedSite(null);
      setRating(0);
      setReviewText("");
      setReviewPhotos([]);
      setPhotoPreviewUrls([]);

      setNotification({
        isOpen: true,
        type: "success",
        title: "Review submitted",
        message: response.data.message || "Your review was submitted.",
        autoClose: true,
        autoCloseDuration: 2000,
      });
    } catch (err) {
      console.error("Error submitting review:", err);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Submit failed",
        message: "Failed to submit review",
      });
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

      setNotification({
        isOpen: true,
        type: "success",
        title: "Review deleted",
        message: "Review deleted successfully",
        autoClose: true,
        autoCloseDuration: 2000,
      });
    } catch (err) {
      console.error("Error deleting review:", err);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Delete failed",
        message: "Failed to delete review",
      });
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
              <p className="text-white">
                No visited sites yet. Start exploring!
              </p>
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
                        {site.siteId?.siteDescription ||
                          "No description available"}
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
                          r.siteId?._id === site.siteId?._id &&
                          r.itineraryId?._id === site.itineraryId?._id
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
                              Visited:{" "}
                              {new Date(site.visitedAt).toLocaleDateString()}
                            </p>
                            {existingReview ? (
                              <>
                                <div className="flex items-center gap-1 my-1">
                                  {renderStars(existingReview.rating)}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-3">
                                  {existingReview.reviewText ||
                                    "No review text"}
                                </p>
                                {/* Display review photos */}
                                {existingReview.photos &&
                                  existingReview.photos.length > 0 && (
                                    <div className="flex gap-1 mt-2 overflow-x-auto">
                                      {existingReview.photos.map(
                                        (photo, idx) => (
                                          <img
                                            key={idx}
                                            src={resolveUrl(photo)}
                                            alt={`Review photo ${idx + 1}`}
                                            className="w-16 h-16 object-cover rounded border border-gray-300"
                                          />
                                        )
                                      )}
                                    </div>
                                  )}
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleOpenReviewModal(site)}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Edit Review
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteReview(existingReview._id)
                                    }
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
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-base bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f04e37] focus:border-transparent"
                style={{ fontSize: "16px" }}
                rows="4"
                placeholder="Share your experience..."
              />
            </div>

            {/* Photo Upload Section */}
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                Add Photos (optional, max 5):
              </p>

              {/* Photo Preview Grid */}
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {photoPreviewUrls.length < 5 && (
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-[#f04e37] hover:bg-gray-50 transition">
                  <Camera className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {photoPreviewUrls.length === 0
                      ? "Upload Photos"
                      : `Add More (${5 - photoPreviewUrls.length} left)`}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
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
                  setReviewPhotos([]);
                  setPhotoPreviewUrls([]);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <p className="mb-8 text-xs text-center text-gray-400">
        © {new Date().getFullYear()} {t("intramurosAdmin")}. Developed by UST
        College of Information and Computing Sciences.
      </p>
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose={notification.autoClose}
        autoCloseDuration={notification.autoCloseDuration}
      />
    </div>
  );
}
