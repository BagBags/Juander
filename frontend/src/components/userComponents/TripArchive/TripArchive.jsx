import React, { useState, useEffect } from "react";
import MainLayout from "../MainLayout";
import { FaStar } from "react-icons/fa";
import BackHeader from "../BackButton"; // ✅ import BackHeader
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Filter } from "bad-words";
import { Camera, X, MapPin, Calendar, Star as StarIcon } from "lucide-react";

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
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const [showAllArchives, setShowAllArchives] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

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
        const [visitedRes, reviewsRes, pinsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/visited-sites`, config),
          axios.get(`${BACKEND_URL}/api/reviews`, config),
          axios.get(`${BACKEND_URL}/api/pins`), // Fetch all pins to get media URLs
        ]);

        // Enrich visited sites with pin media data
        const pins = pinsRes.data;
        const enrichedSites = visitedRes.data.map(site => {
          const pin = pins.find(p => p._id === site.siteId?._id);
          return {
            ...site,
            siteId: {
              ...site.siteId,
              mediaUrl: pin?.mediaUrl || site.siteId?.mediaUrl,
              mediaFiles: pin?.mediaFiles || site.siteId?.mediaFiles,
            }
          };
        });

        setVisitedSites(enrichedSites);
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
      (r) => r.siteId?._id === site.siteId?._id && r.itineraryId?._id === site.itineraryId?._id
    );
    
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.reviewText || "");
      // Load existing photos if available
      if (existingReview.photos && existingReview.photos.length > 0) {
        setPhotoPreviewUrls(existingReview.photos.map(p => resolveUrl(p)));
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
    const newPreviewUrls = filesToAdd.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setReviewPhotos(prev => [...prev, ...filesToAdd]);
  };

  const handleRemovePhoto = (index) => {
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setReviewPhotos(prev => prev.filter((_, i) => i !== index));
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
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("itineraryId", selectedSite.itineraryId?._id || selectedSite.itineraryId);
      formData.append("siteId", selectedSite.siteId?._id || selectedSite.siteId);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center text-sm relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f04e37]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* ✅ Sticky back header (matching profile layout) */}
      <div className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm px-4 md:px-0 pb-2 pt-4">
        <BackHeader title="Trip Archives" />
      </div>

      <MainLayout includeSideButtons={false}>
        <div className="w-full max-w-4xl relative z-10">
          {/* Page content */}
          <div className="mt-4">
            {/* Trip Archives Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#f04e37] to-orange-600 rounded-full shadow-lg mb-4">
                <MapPin className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Trip Archives</h2>
              <p className="text-gray-600 text-sm">Your journey through Intramuros</p>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-[#f04e37]/30 border-t-[#f04e37] rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 text-lg">Loading visited sites...</p>
              </div>
            ) : visitedSites.length === 0 ? (
              <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-200">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No visited sites yet. Start exploring!</p>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(showAllArchives ? visitedSites : visitedSites.slice(0, 4)).map((site, index) => (
                  <div
                    key={index}
                    className="bg-white/95 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group hover:scale-[1.02]"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={
                          site.siteId?.mediaFiles?.find(m => m.type === "image")?.url
                            ? resolveUrl(site.siteId.mediaFiles.find(m => m.type === "image").url)
                            : site.siteId?.mediaUrl
                              ? resolveUrl(site.siteId.mediaUrl)
                              : "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=400&q=80"
                        }
                        alt={site.siteId?.siteName || "Site"}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=400&q=80";
                        }}
                      />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-xl font-bold text-white drop-shadow-lg">
                            {site.siteId?.siteName || "Unknown Site"}
                          </h3>
                        </div>
                      </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4 text-[#f04e37]" />
                        <span>{site.itineraryId?.name || "Unknown Itinerary"}</span>
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2 space-y-1">
                        {site.siteId?.siteDescription ? (
                          site.siteId.siteDescription.split('\n\n').map((paragraph, index) => (
                            <p key={index}>{paragraph.trim()}</p>
                          ))
                        ) : (
                          <p>No description available</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Show More/Less Button */}
              {visitedSites.length > 4 && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setShowAllArchives(!showAllArchives)}
                    className="px-8 py-3 bg-gradient-to-r from-[#f04e37] to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    {showAllArchives ? (
                      <>
                        <span>Show Less</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>Show More ({visitedSites.length - 4} more)</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
              </>
            )}

            {/* Manage Reviews */}
            <div className="text-center mt-16 mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg mb-4">
                <StarIcon className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Manage Reviews</h2>
              <p className="text-gray-600 text-sm">Share your experiences with others</p>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-[#f04e37]/30 border-t-[#f04e37] rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 text-lg">Loading reviews...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                {visitedSites.length === 0 ? (
                  <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-200">
                    <StarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Visit sites to leave reviews!</p>
                  </div>
                ) : (
                  <>
                    {/* Show visited sites for review */}
                    {(showAllReviews ? visitedSites : visitedSites.slice(0, 4)).map((site, index) => {
                      const existingReview = reviews.find(
                        (r) =>
                          r.siteId?._id === site.siteId?._id &&
                          r.itineraryId?._id === site.itineraryId?._id
                      );

                      return (
                        <div
                          key={index}
                          className="bg-white/95 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 flex gap-5 items-start w-full border border-gray-100 group"
                        >
                          <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-[#f04e37]/10 rounded-2xl blur-md"></div>
                            <img
                              src={
                                site.siteId?.mediaFiles?.find(m => m.type === "image")?.url
                                  ? resolveUrl(site.siteId.mediaFiles.find(m => m.type === "image").url)
                                  : site.siteId?.mediaUrl
                                    ? resolveUrl(site.siteId.mediaUrl)
                                    : "https://images.unsplash.com/photo-1549640376-1957636d1ab0?w=400&q=80"
                              }
                              alt={site.siteId?.siteName || "Site"}
                              className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md relative"
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1549640376-1957636d1ab0?w=400&q=80";
                              }}
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-[#f04e37] transition-colors">
                              {site.siteId?.siteName || "Unknown Site"}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>Visited: {new Date(site.visitedAt).toLocaleDateString()}</span>
                            </div>
                            {existingReview ? (
                              <>
                                <div className="flex items-center gap-1 my-1">
                                  {renderStars(existingReview.rating)}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-3 mt-2">
                                  {existingReview.reviewText || "No review text"}
                                </p>
                                {/* Display review photos */}
                                {existingReview.photos && existingReview.photos.length > 0 && (
                                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                    {existingReview.photos.map((photo, idx) => (
                                      <img
                                        key={idx}
                                        src={resolveUrl(photo)}
                                        alt={`Review photo ${idx + 1}`}
                                        className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 shadow-sm hover:scale-110 transition-transform"
                                      />
                                    ))}
                                  </div>
                                )}
                                <div className="flex gap-3 mt-4">
                                  <button
                                    onClick={() => handleOpenReviewModal(site)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                                  >
                                    Edit Review
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReview(existingReview._id)}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                                  >
                                    Delete Review
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button
                                onClick={() => handleOpenReviewModal(site)}
                                className="mt-3 bg-gradient-to-r from-[#f04e37] to-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                              >
                                Write Review
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Show More/Less Button for Reviews */}
                    {visitedSites.length > 4 && (
                      <div className="flex justify-center mt-8 w-full">
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                          {showAllReviews ? (
                            <>
                              <span>Show Less</span>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>Show More ({visitedSites.length - 4} more)</span>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </MainLayout>

      {/* Review Modal */}
      {showReviewModal && selectedSite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-12 h-12 bg-gradient-to-br from-[#f04e37] to-orange-600 rounded-full flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Review: {selectedSite.siteId?.siteName}
                </h3>
                <p className="text-xs text-gray-500">Share your experience</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Rating:</p>
              <div className="flex gap-2">
                {renderStars(rating, true, setHoverRating, setRating)}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Review (optional):</p>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-2xl p-4 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f04e37] focus:border-transparent transition-all"
                rows="4"
                placeholder="Share your experience..."
              />
            </div>

            {/* Photo Upload Section */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Add Photos (optional, max 5):</p>
              
              {/* Photo Preview Grid */}
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
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
                <label className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-gray-300 rounded-2xl p-5 cursor-pointer hover:border-[#f04e37] hover:bg-orange-50 transition-all group">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-[#f04e37]/10 transition-colors">
                    <Camera className="w-5 h-5 text-gray-500 group-hover:text-[#f04e37] transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-[#f04e37] transition-colors">
                    {photoPreviewUrls.length === 0 ? "Upload Photos" : `Add More (${5 - photoPreviewUrls.length} left)`}
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

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSubmitReview}
                className="flex-1 bg-gradient-to-r from-[#f04e37] to-orange-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
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
                className="flex-1 bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-300 hover:scale-105 active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto py-8 text-center relative z-10">
        <p className="text-xs text-gray-400">
          © 2025 Intramuros Administration. All rights reserved.
        </p>
      </div>
    </div>
  );
}
