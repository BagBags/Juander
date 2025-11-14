import React, { useState, Suspense, lazy, useEffect } from "react";
import { X, Volume2, Star, Info, Tag, Glasses, Send, Edit2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import ttsService from "../../../utils/textToSpeech";
import MediaCarousel from "../../shared/MediaCarousel";
import axios from "axios";
import { useParams } from "react-router-dom";

const ModelPreview = lazy(() => import("../TourMap/SiteCardModelPreview"));

export default function SiteModalFullScreen({
  selectedPin,
  onClose,
  distance,
  currentPinIndex,
  pinsLength,
  goToNextStop,
  siteReviews = [],
  reviewsLoading = false,
  simulateGoToNextSite,
  isGuestMode = false,
}) {
  const { t } = useTranslation();
  const { itineraryId } = useParams();
  const [showAR, setShowAR] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userLanguage, setUserLanguage] = useState('english');
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewImages, setReviewImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  // Cancel any ongoing TTS when modal opens
  useEffect(() => {
    if (selectedPin) {
      // Cancel any ongoing TTS (like directions) when modal opens
      ttsService.cancel();
    }
    
    // Fetch user language preference
    const fetchUserLanguage = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/user`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const language = response.data.language || 'english';
          setUserLanguage(language.toLowerCase());
        }
      } catch (error) {
        console.error('Failed to fetch user language:', error);
        setUserLanguage('english');
      }
    };
    fetchUserLanguage();
  }, []);

  // Cleanup: stop TTS when component unmounts (modal closes)
  useEffect(() => {
    return () => {
      ttsService.cancel();
    };
  }, []);

  // Handler to manually play description (triggered by "Listen to Description" button)
  const handlePlayDescription = () => {
    if (selectedPin) {
      const description = selectedPin.description || selectedPin.siteDescription || "";
      if (description) {
        // Temporarily enable TTS if it's disabled, then speak
        const wasEnabled = ttsService.isEnabled;
        if (!wasEnabled) {
          ttsService.enable();
        }
        
        // Get only the first paragraph for TTS
        const firstParagraph = description.split("\n\n")[0].trim();
        ttsService.speak(firstParagraph);
        
        // Restore previous TTS state after speaking
        if (!wasEnabled) {
          setTimeout(() => {
            ttsService.disable();
          }, firstParagraph.length * 50); // Estimate time based on text length
        }
      }
    }
  };

  // Fetch user's reviews for this site
  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = JSON.parse(localStorage.getItem("user"))?._id;
        if (token && userId && selectedPin) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/reviews/site/${selectedPin._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const myReviews = response.data.filter(r => r.userId._id === userId);
          setUserReviews(myReviews);
        }
      } catch (error) {
        console.error("Failed to fetch user reviews:", error);
      }
    };
    fetchUserReviews();
  }, [selectedPin]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + reviewImages.length > 5) {
      alert("You can upload maximum 5 images");
      return;
    }

    setReviewImages([...reviewImages, ...files]);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
  };

  const handleRemoveImage = (index) => {
    const newImages = reviewImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setReviewImages(newImages);
    setImagePreviewUrls(newPreviews);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      
      // Upload images first if any
      let uploadedImageUrls = [];
      if (reviewImages.length > 0) {
        const formData = new FormData();
        reviewImages.forEach((image) => {
          formData.append("photos", image);
        });

        const uploadResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/reviews/upload-photos`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        uploadedImageUrls = uploadResponse.data.photos;
      }

      if (editingReviewId) {
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/reviews/${editingReviewId}`,
          {
            rating: rating,
            reviewText: reviewText.trim(),
            photos: uploadedImageUrls,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert("Review updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/reviews`,
          {
            siteId: selectedPin._id,
            itineraryId: itineraryId,
            rating: rating,
            reviewText: reviewText.trim(),
            photos: uploadedImageUrls,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        alert("Review submitted successfully!");
      }

      // Reset form
      setRating(0);
      setReviewText("");
      setReviewImages([]);
      setImagePreviewUrls([]);
      setShowReviewForm(false);
      setEditingReviewId(null);
      
      // Refresh user reviews
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/reviews/site/${selectedPin._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const userId = JSON.parse(localStorage.getItem("user"))?._id;
      const myReviews = response.data.filter(r => r.userId._id === userId);
      setUserReviews(myReviews);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert(err.response?.data?.error || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setRating(review.rating);
    setReviewText(review.reviewText || "");
    setEditingReviewId(review._id);
    // Note: Existing images from review.photos would need to be handled separately
    // For now, editing will allow adding new images only
    setReviewImages([]);
    setImagePreviewUrls([]);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Review deleted successfully!");
      
      // Refresh user reviews
      setUserReviews(userReviews.filter(r => r._id !== reviewId));
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review");
    }
  };

  return (
    <div 
      className="absolute inset-0 z-50 bg-gradient-to-b from-gray-50 to-white overflow-y-auto"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Modern Header with Close Button */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-5 py-4 flex items-center justify-between shadow-sm z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Site Information</h2>
          <p className="text-xs text-gray-500 mt-0.5">Explore the details</p>
        </div>
        <button
          onClick={() => {
            ttsService.cancel(); // Stop any ongoing speech
            onClose();
          }}
          className="p-2.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Close site information"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-6 pb-20 max-w-3xl mx-auto">
        {/* AR Mode fullscreen inside modal */}
        {showAR ? (
          <div className="flex flex-col h-[70vh]">
            <iframe
              src={selectedPin.arLink}
              title="AR Mode"
              className="flex-1 w-full rounded-lg border border-gray-200"
              allow="camera; gyroscope; accelerometer; fullscreen"
            />
            <button
              onClick={() => setShowAR(false)}
              className="mt-3 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 text-base font-medium rounded-lg shadow transition-colors"
            >
              Exit AR Mode
            </button>
          </div>
        ) : (
          <>
            {/* 3D Model Preview */}
            {selectedPin.glbUrl && selectedPin.glbUrl.endsWith(".glb") && (
              <div className="mb-8 w-full h-64 md:h-80 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Loading 3D model...</p>
                    </div>
                  }
                >
                  <ModelPreview url={selectedPin.glbUrl} />
                </Suspense>
              </div>
            )}

            {/* Title */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-3xl font-bold text-gray-900 leading-tight flex-1">
                  {selectedPin.title || selectedPin.siteName}
                </h3>
              </div>
              
              {/* Badges Container */}
              <div className="flex flex-wrap gap-2">
                {/* Category Badge */}
                {selectedPin.category && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                    style={{
                      backgroundColor: '#fef2f0',
                      color: '#f04e37'
                    }}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{selectedPin.category.name || selectedPin.category}</span>
                  </div>
                )}
                
                {/* Entrance Fee Badge */}
                {selectedPin.feeType && selectedPin.feeType !== "none" && (
                <button
                  onClick={() => setShowFeeModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                  style={{
                    backgroundColor: selectedPin.feeType === "fort_santiago" ? "#FEF3C7" : "#DBEAFE",
                    color: selectedPin.feeType === "fort_santiago" ? "#92400E" : "#1E40AF"
                  }}
                >
                  <span className="font-bold">₱</span>
                  <span>{selectedPin.feeType === "fort_santiago" ? "Fort Santiago Fee" : "Entrance Fee"}</span>
                  <Info className="w-3.5 h-3.5" />
                </button>
                )}
              </div>
            </div>
            
            {/* Fee Hint Modal */}
            {showFeeModal && (
              <div 
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={() => setShowFeeModal(false)}
              >
                <div 
                  className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className="p-4 flex items-center gap-3"
                    style={{ backgroundColor: selectedPin.feeType === "fort_santiago" ? "#f04e37" : "#2563EB" }}
                  >
                    <span className="text-white text-2xl font-bold">₱</span>
                    <h3 className="text-lg font-bold text-white">
                      {selectedPin.feeType === "fort_santiago" ? "Fort Santiago Entrance" : "Entrance Fee Required"}
                    </h3>
                  </div>
                  
                  <div className="p-5">
                    {selectedPin.feeType === "fort_santiago" ? (
                      <>
                        <p className="text-gray-700 text-sm mb-3">
                          This site is located within Fort Santiago and requires an entrance fee.
                        </p>
                        {selectedPin.feeAmount ? (
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-3">
                            <p className="text-sm font-semibold text-gray-800">
                              Fort Santiago Entrance Fee: <span className="text-[#f04e37]">₱{selectedPin.feeAmount}</span>
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Purchase tickets at the Fort Santiago entrance.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-3">
                            <p className="text-sm text-gray-700">
                              Please check the current entrance fee at the Fort Santiago entrance.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-gray-700 text-sm mb-3">
                          An entrance fee is required to visit <span className="font-semibold">{selectedPin.title || selectedPin.siteName}</span>.
                        </p>
                        {selectedPin.feeAmount ? (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                            <p className="text-sm font-semibold text-gray-800">
                              Entrance Fee: <span className="text-blue-700">₱{selectedPin.feeAmount}</span>
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Please have the fee ready when visiting this site.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                            <p className="text-sm text-gray-700">
                              Please check on-site for current entrance fee rates.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => setShowFeeModal(false)}
                      className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors"
                      style={{
                        backgroundColor: selectedPin.feeType === "fort_santiago" ? "#f04e37" : "#2563EB",
                        color: "white"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Media Files Carousel - Modern Design */}
            {selectedPin.mediaFiles && selectedPin.mediaFiles.length > 0 && (
              <div className="mb-6">
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <MediaCarousel mediaFiles={selectedPin.mediaFiles} />
                </div>
              </div>
            )}

            {/* Fallback to old mediaUrl if mediaFiles not available */}
            {(!selectedPin.mediaFiles || selectedPin.mediaFiles.length === 0) && selectedPin.mediaUrl && (
              <div className="mb-10">
                {selectedPin.mediaType === "video" ? (
                  <video
                    src={selectedPin.mediaUrl}
                    className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
                    muted
                    controls
                    crossOrigin="anonymous"
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <img
                    src={selectedPin.mediaUrl}
                    alt={selectedPin.title || selectedPin.siteName}
                    className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
                  />
                )}
              </div>
            )}

            {/* Read Description Button - Modern Design */}
            <button
              onClick={handlePlayDescription}
              className="mb-6 w-full text-white px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-98 bg-gradient-to-r from-[#f04e37] to-[#ff6b54]"
              aria-label="Read site description aloud"
            >
              <Volume2 className="w-5 h-5" />
              <span>Listen to Description</span>
            </button>

            {/* Description - Enhanced Typography with Language Support */}
            <div className="bg-white rounded-xl p-5 mb-8 border border-gray-200 shadow-sm">
              <div className="prose prose-sm max-w-none">
                <div className="text-base leading-relaxed text-gray-700 space-y-4">
                  {(() => {
                    let description = '';
                    if (userLanguage === 'tagalog' && selectedPin.siteDescriptionTagalog) {
                      description = selectedPin.siteDescriptionTagalog;
                    } else if (userLanguage === 'english' && selectedPin.siteDescription) {
                      description = selectedPin.siteDescription;
                    } else {
                      description = selectedPin.description || selectedPin.siteDescription || selectedPin.siteDescriptionTagalog || 'No description available';
                    }
                    
                    return description.split('\n\n').map((paragraph, index) => {
                      if (index === 0 || showFullDescription) {
                        return <p key={index} className="text-gray-800">{paragraph.trim()}</p>;
                      }
                      return null;
                    });
                  })()}
                </div>
                
                {/* Read More/Less Button */}
                {(() => {
                  let description = '';
                  if (userLanguage === 'tagalog' && selectedPin.siteDescriptionTagalog) {
                    description = selectedPin.siteDescriptionTagalog;
                  } else if (userLanguage === 'english' && selectedPin.siteDescription) {
                    description = selectedPin.siteDescription;
                  } else {
                    description = selectedPin.description || selectedPin.siteDescription || selectedPin.siteDescriptionTagalog || '';
                  }
                  return description.split('\n\n').length > 1;
                })() && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-4 font-semibold text-sm flex items-center gap-1 transition-colors"
                    style={{ color: '#f04e37' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#d9442f'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#f04e37'}
                  >
                    {showFullDescription ? (
                      <>
                        <span>Show Less</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>Read More</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* AR Mode Button - Modern Design */}
            {selectedPin.arEnabled && selectedPin.arLink && (
              <button
                onClick={() => {
                  setShowAR(true);
                  ttsService.speak(t('tts_openingAR'));
                }}
                className="w-full text-center text-white px-5 py-4 text-base font-bold rounded-xl shadow-lg hover:shadow-xl mb-8 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(to right, #f04e37, #d9442f)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #d9442f, #c23d2a)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #f04e37, #d9442f)'}
                aria-label="View in AR Mode"
              >
                <Glasses className="w-5 h-5" />
                <span>Experience in AR Mode</span>
              </button>
            )}

            {/* Manage Your Reviews Section */}
            {!isGuestMode && (
              <div className="mb-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <div className="bg-blue-500 p-1.5 rounded-lg">
                        <Star className="w-4 h-4 text-white fill-white" />
                      </div>
                      <span>Your Review</span>
                    </h4>
                  </div>

                <div className="p-4">
                  {/* User's existing reviews */}
                  {userReviews.length > 0 && (
                    <div className="mb-4 space-y-3">
                      {userReviews.map((review) => (
                        <div key={review._id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-gray-200 text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            {!isGuestMode && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditReview(review)}
                                  className="text-blue-600 hover:text-blue-700 p-1"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(review._id)}
                                  className="text-red-600 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          {review.reviewText && (
                            <p className="text-sm text-gray-700">{review.reviewText}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Write/Edit Review Button */}
                  {!isGuestMode && !showReviewForm && userReviews.length === 0 && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 bg-blue-500 text-white hover:bg-blue-600 transition-all"
                    >
                      <Star className="w-4 h-4" />
                      Write a Review
                    </button>
                  )}

                  {/* Review Form */}
                  {!isGuestMode && showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="space-y-3">
                      {/* Rating */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Rating *
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="transition-transform hover:scale-110 active:scale-95"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= (hoverRating || rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Your Review (Optional)
                        </label>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your experience..."
                          rows={4}
                          className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          {reviewText.length}/500
                        </p>
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Photos (Optional, max 5)
                        </label>
                        
                        {/* Image Previews */}
                        {imagePreviewUrls.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {imagePreviewUrls.map((url, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={url}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-lg border-2 border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload Button */}
                        {reviewImages.length < 5 && (
                          <label className="cursor-pointer flex items-center justify-center w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span>Add Photos ({reviewImages.length}/5)</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowReviewForm(false);
                            setRating(0);
                            setReviewText("");
                            setReviewImages([]);
                            setImagePreviewUrls([]);
                            setEditingReviewId(null);
                          }}
                          className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || rating === 0}
                          className="flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                        >
                          <Send className="w-4 h-4" />
                          {isSubmitting ? "Submitting..." : editingReviewId ? "Update Review" : "Submit Review"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* User Reviews Section - Modern Compact Design */}
            <div className="mb-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Reviews Header */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <div className="bg-yellow-400 p-1.5 rounded-lg">
                        <Star className="w-4 h-4 text-white fill-white" />
                      </div>
                      <span>Reviews</span>
                    </h4>
                    {!reviewsLoading && Array.isArray(siteReviews) && siteReviews.length > 0 && (
                      <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                        {siteReviews.length}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Reviews Content */}
                <div className="p-4">
                  {reviewsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#f04e37' }}></div>
                      <p className="text-sm text-gray-500 ml-3">Loading reviews...</p>
                    </div>
                  ) : !Array.isArray(siteReviews) || siteReviews.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Star className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">No reviews yet</p>
                      <p className="text-xs text-gray-500 mt-1">Be the first to review!</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {siteReviews.slice(0, showAllReviews ? siteReviews.length : 2).map((review, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                            {/* Reviewer Info - Compact */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                  style={{ background: 'linear-gradient(135deg, #f04e37 0%, #ff6b54 100%)' }}
                                >
                                  {(review.userId?.firstName?.[0] || review.userId?.lastName?.[0] || "A").toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <span className="font-semibold text-xs text-gray-900 block leading-tight">
                                    {review.userId?.firstName && review.userId?.lastName
                                      ? `${review.userId.firstName} ${review.userId.lastName}`
                                      : review.userId?.firstName || review.userId?.lastName || "Anonymous"}
                                  </span>
                                  <div className="flex gap-0.5 mt-0.5">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-300 text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {review.createdAt && (
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            
                            {/* Review Text - Compact */}
                            {review.reviewText && (
                              <p className="text-xs text-gray-700 leading-relaxed mb-2">{review.reviewText}</p>
                            )}
                            
                            {/* Review Photos - Compact */}
                            {review.photos && review.photos.length > 0 && (
                              <div className="flex gap-1.5 overflow-x-auto pb-1">
                                {review.photos.map((photo, photoIdx) => (
                                  <img
                                    key={photoIdx}
                                    src={photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${photo}`}
                                    alt={`Review ${photoIdx + 1}`}
                                    className="w-16 h-16 object-cover rounded-md border border-gray-300 hover:border-[#f04e37] transition-colors cursor-pointer flex-shrink-0"
                                    onClick={() => window.open(photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${photo}`, '_blank')}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* View More/Less Button */}
                      {siteReviews.length > 2 && (
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="mt-3 w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-1.5"
                          style={{ 
                            backgroundColor: showAllReviews ? '#f5f5f5' : '#f04e37',
                            color: showAllReviews ? '#f04e37' : 'white'
                          }}
                          onMouseEnter={(e) => {
                            if (!showAllReviews) {
                              e.currentTarget.style.backgroundColor = '#d9442f';
                            } else {
                              e.currentTarget.style.backgroundColor = '#ebebeb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = showAllReviews ? '#f5f5f5' : '#f04e37';
                          }}
                        >
                          {showAllReviews ? (
                            <>
                              <span>Show Less</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>View All {siteReviews.length} Reviews</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Next Stop Button - marks current site as visited and navigates to next */}
            {currentPinIndex < pinsLength - 1 && (
              <button
                onClick={() => {
                  // Mark current site as visited before navigating
                  if (simulateGoToNextSite) {
                    simulateGoToNextSite();
                  } else {
                    goToNextStop();
                  }
                  ttsService.speak(t('tts_navigatingNext'));
                }}
                className="w-full bg-[#f04e37] hover:bg-[#d9442f] text-white px-6 py-4 text-lg font-bold rounded-lg shadow-lg transition-all duration-200 active:scale-95"
                aria-label="Mark as visited and go to next site"
              >
                Next →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
