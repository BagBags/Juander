import React, { useState, useEffect } from "react";
import MainLayout from "../MainLayout";
import { FaStar } from "react-icons/fa";
import BackHeader from "../BackButton";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Camera, X, MapPin, Calendar, Star as StarIcon, Filter, BookOpen } from "lucide-react";
import NotificationModal from "../../shared/NotificationModal";
import PullToRefresh from "../../shared/PullToRefresh";

// Reusable Site Card Component
const SiteCard = ({ site, resolveUrl, children }) => {
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group hover:scale-[1.02] w-full" style={{ minWidth: 0, maxWidth: '100%', touchAction: 'pan-y pinch-zoom' }}>
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
      <div className="p-5" style={{ overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        {children}
      </div>
    </div>
  );
};

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
  const [selectedItineraryFilter, setSelectedItineraryFilter] = useState("all");
  const [selectedReviewItineraryFilter, setSelectedReviewItineraryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("places"); // "places" or "reviews"
  const [notification, setNotification] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [expandedItineraries, setExpandedItineraries] = useState({}); // Track which itinerary names are expanded
  const [expandedDescriptions, setExpandedDescriptions] = useState({}); // Track which descriptions are expanded
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const handleRefresh = async () => {
    setRefreshKey(prev => prev + 1);
    setLoading(true);
    await fetchVisitedSites();
    await fetchReviews();
  };

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000";

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
      setNotification({ isOpen: true, title: "Rating Required", message: "Please select a rating", type: "warning" });
      return;
    }

    // Check for inappropriate content using OpenAI Moderation API
    if (reviewText) {
      try {
        const moderationResponse = await axios.post(
          `${BACKEND_URL}/api/openai/moderate`,
          { input: reviewText },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        
        // OpenAI returns results in results[0]
        const result = moderationResponse.data.results?.[0];
        console.log("Moderation API Response:", moderationResponse.data);
        console.log("Moderation Result:", result);
        
        if (result && result.flagged) {
          const categories = Object.entries(result.categories)
            .filter(([_, value]) => value)
            .map(([key]) => key);
            
          let warningMessage = "⚠️ Your review contains inappropriate content";
          if (categories.length > 0) {
            warningMessage += ` (${categories.join(", ")})`;
          }
          warningMessage += ". Please revise your review.";
          
          setNotification({ isOpen: true, title: "Content Warning", message: warningMessage, type: "warning" });
          console.log("Flagged categories:", result.categories);
          return;
        }
      } catch (err) {
        console.error("Error checking content moderation:", err);
        
        // Always apply basic profanity check as fallback when moderation API fails
        const basicProfanityList = ["fuck", "shit", "ass", "bitch", "sex", "porn", "dick", "pussy", "cock", "damn", "hell"];
        const containsProfanity = basicProfanityList.some(word => 
          reviewText.toLowerCase().includes(word.toLowerCase())
        );
        
        if (containsProfanity) {
          setNotification({ isOpen: true, title: "Inappropriate Content", message: "Your review contains inappropriate content. Please revise it.", type: "warning" });
          return;
        }
        
        // Check if it's a rate limit error
        if (err.response && 
            err.response.status === 500 && 
            err.response.data && 
            err.response.data.details === "Too Many Requests") {
          
          setNotification({ isOpen: true, title: "High Traffic", message: "We're experiencing high traffic. Your review will be submitted, but please ensure it follows community guidelines.", type: "info" });
          console.log("OpenAI rate limit reached, proceeding with submission after profanity check");
        } else {
          // For other errors, warn user but allow submission after profanity check
          console.warn("Moderation API unavailable, used fallback profanity filter");
        }
      }
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
      
      setNotification({ isOpen: true, title: "Success", message: response.data.message, type: "success" });
    } catch (err) {
      console.error("Error submitting review:", err);
      setNotification({ isOpen: true, title: "Error", message: "Failed to submit review", type: "error" });
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
      
      setNotification({ isOpen: true, title: "Success", message: "Review deleted successfully", type: "success" });
    } catch (err) {
      console.error("Error deleting review:", err);
      setNotification({ isOpen: true, title: "Error", message: "Failed to delete review", type: "error" });
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center text-sm relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f04e37]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      <MainLayout includeSideButtons={false}>
      {/* ✅ Sticky back header (matching profile layout) - Full width */}
      <div 
        className="sticky top-0 z-20 bg-white border-b border-gray-200 -mx-4 md:-mx-0"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 16px)",
          paddingBottom: "8px",
          paddingLeft: "16px",
          paddingRight: "16px"
        }}
        key={refreshKey}
      >
        <BackHeader title="Trip Archives" />
      </div>
        <div className="w-full relative z-10">
          {/* Page content */}
          <div className="px-4 pt-6">
            {/* Icon Tab Navigation */}
            <div className="flex justify-center items-center gap-8 mb-8">
              {/* Places Tab */}
              <button
                onClick={() => setActiveTab("places")}
                className="group relative transition-all duration-300"
              >
                <div
                  className={`relative w-20 h-20 rounded-full shadow-md transition-all duration-300 ${
                    activeTab === "places"
                      ? "bg-gradient-to-br from-[#f04e37] to-orange-600 shadow-lg"
                      : "bg-gray-200 hover:bg-gray-300 opacity-60 hover:opacity-80"
                  }`}
                >
                  <MapPin
                    className={`absolute inset-0 m-auto w-10 h-10 transition-all duration-300 ${
                      activeTab === "places" ? "text-white" : "text-gray-600"
                    }`}
                    strokeWidth={2.5}
                  />
                </div>
                <p
                  className={`mt-2 text-sm font-semibold transition-all duration-300 ${
                    activeTab === "places" ? "text-[#f04e37]" : "text-gray-500"
                  }`}
                >
                  Places
                </p>
              </button>

              {/* Reviews Tab */}
              <button
                onClick={() => setActiveTab("reviews")}
                className="group relative transition-all duration-300"
              >
                <div
                  className={`relative w-20 h-20 rounded-full shadow-md transition-all duration-300 ${
                    activeTab === "reviews"
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg"
                      : "bg-gray-200 hover:bg-gray-300 opacity-60 hover:opacity-80"
                  }`}
                >
                  <StarIcon
                    className={`absolute inset-0 m-auto w-10 h-10 transition-all duration-300 ${
                      activeTab === "reviews" ? "text-white" : "text-gray-600"
                    }`}
                    strokeWidth={2.5}
                  />
                </div>
                <p
                  className={`mt-2 text-sm font-semibold transition-all duration-300 ${
                    activeTab === "reviews" ? "text-yellow-600" : "text-gray-500"
                  }`}
                >
                  Reviews
                </p>
              </button>
            </div>

            {/* Page Title */}
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                {activeTab === "places" ? "Places you visited" : "Your Reviews"}
              </h2>
              <p className="text-gray-600 text-sm">
                {activeTab === "places" 
                  ? "Your journey through Intramuros" 
                  : "Share your experiences with others"}
              </p>
            </div>
            
            <>
            {/* Places Tab Content */}
            {activeTab === "places" && (
                <div 
                  className="px-7"
                  style={{
                    animation: "fadeIn 0.3s ease-out"
                  }}
                >
                  {/* Section Header with Filter */}
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-800">Filter by itinerary</h3>
                      <div className="relative w-full sm:w-auto">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <select
                      value={selectedItineraryFilter}
                      onChange={(e) => setSelectedItineraryFilter(e.target.value)}
                      className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-medium text-sm text-gray-700 shadow-sm hover:border-[#f04e37] focus:outline-none focus:ring-2 focus:ring-[#f04e37] transition-all appearance-none cursor-pointer"
                    >
                      <option value="all">All Itineraries</option>
                      {[...new Set(visitedSites.map(s => s.itineraryId?._id))].map(itinId => {
                        const itin = visitedSites.find(s => s.itineraryId?._id === itinId)?.itineraryId;
                        return (
                          <option key={itinId} value={itinId}>
                            {itin?.name || "Unknown Itinerary"}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 w-full" style={{ touchAction: "pan-y pinch-zoom" }}>
                {(showAllArchives 
                  ? visitedSites.filter(s => selectedItineraryFilter === "all" || s.itineraryId?._id === selectedItineraryFilter)
                  : visitedSites.filter(s => selectedItineraryFilter === "all" || s.itineraryId?._id === selectedItineraryFilter).slice(0, 4)
                ).map((site, index) => (
                  <SiteCard key={site?._id || `${site.siteId?._id || 'site'}-${index}`} site={site} resolveUrl={resolveUrl}>
                    <div className="mb-2" style={{ overflow: 'hidden', width: '100%' }}>
                      <div className="flex items-center gap-2 text-sm text-gray-600" style={{ minWidth: 0, width: '100%' }}>
                        <BookOpen className="w-4 h-4 text-[#f04e37] flex-shrink-0" />
                        <span 
                          className={expandedItineraries[`place-${site?._id || site.siteId?._id || index}`] ? "break-words" : "truncate"}
                          style={{ 
                            overflow: expandedItineraries[`place-${site?._id || site.siteId?._id || index}`] ? 'visible' : 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: expandedItineraries[`place-${site?._id || site.siteId?._id || index}`] ? 'normal' : 'nowrap',
                            wordBreak: expandedItineraries[`place-${site?._id || site.siteId?._id || index}`] ? 'break-word' : 'normal',
                            minWidth: 0,
                            maxWidth: '100%'
                          }}
                        >
                          {site.itineraryId?.name || "Unknown Itinerary"}
                        </span>
                      </div>
                      {(site.itineraryId?.name?.length > 30) && (
                        <button
                          onClick={() => setExpandedItineraries(prev => ({
                            ...prev,
                            [`place-${site?._id || site.siteId?._id || index}`]: !prev[`place-${site?._id || site.siteId?._id || index}`]
                          }))}
                          className="text-xs text-[#f04e37] hover:text-orange-600 ml-6 mt-1 font-medium"
                        >
                          {expandedItineraries[`place-${site?._id || site.siteId?._id || index}`] ? "See less" : "See more"}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Visited: {new Date(site.visitedAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      {expandedDescriptions[`place-desc-${site?._id || site.siteId?._id || index}`] ? (
                        <div 
                          className="text-sm text-gray-600 space-y-2"
                          style={{ width: '100%', wordBreak: 'break-word' }}
                        >
                          {(site.siteId?.siteDescription || 'No description available')
                            .split('\n\n')
                            .map((paragraph, idx) => (
                              <p key={idx}>{paragraph.trim()}</p>
                            ))}
                        </div>
                      ) : (
                        <p 
                          className="text-sm text-gray-600"
                          style={{ overflow: 'hidden', width: '100%', wordBreak: 'break-word' }}
                        >
                          {((site.siteId?.siteDescription?.length || 0) > 200)
                            ? `${site.siteId.siteDescription.slice(0, 200)}...`
                            : (site.siteId?.siteDescription || 'No description available')}
                        </p>
                      )}
                      {(site.siteId?.siteDescription?.length || 0) > 200 && (
                        <button
                          onClick={() => setExpandedDescriptions(prev => ({
                            ...prev,
                            [`place-desc-${site?._id || site.siteId?._id || index}`]: !prev[`place-desc-${site?._id || site.siteId?._id || index}`]
                          }))}
                          className="text-xs text-[#f04e37] hover:text-orange-600 mt-2 font-medium"
                        >
                          {expandedDescriptions[`place-desc-${site?._id || site.siteId?._id || index}`] ? "See less" : "See more"}
                        </button>
                      )}
                    </div>
                  </SiteCard>
                ))}
              </div>
              
              {/* Show More/Less Button */}
              {visitedSites.filter(s => selectedItineraryFilter === "all" || s.itineraryId?._id === selectedItineraryFilter).length > 4 && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setShowAllArchives(!showAllArchives)}
                    className="px-8 py-3 bg-[#f04e37] hover:bg-[#d63b2a] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
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
                        <span>Show More ({Math.max(0, visitedSites.filter(s => selectedItineraryFilter === "all" || s.itineraryId?._id === selectedItineraryFilter).length - 4)} more)</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
              </div>
            )}

              {/* Reviews Tab Content */}
              {activeTab === "reviews" && (
                <div 
                  className="px-4"
                  style={{
                    animation: "fadeIn 0.3s ease-out"
                  }}
                >
                  {/* Section Header with Filter */}
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-800">Filter by itinerary</h3>
                      <div className="relative w-full sm:w-auto">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <select
                          value={selectedReviewItineraryFilter}
                          onChange={(e) => setSelectedReviewItineraryFilter(e.target.value)}
                          className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-medium text-sm text-gray-700 shadow-sm hover:border-[#f04e37] focus:outline-none focus:ring-2 focus:ring-[#f04e37] transition-all appearance-none cursor-pointer"
                        >
                          <option value="all">All Itineraries</option>
                          {[...new Set(visitedSites.map(s => s.itineraryId?._id))].map(itinId => {
                            const itin = visitedSites.find(s => s.itineraryId?._id === itinId)?.itineraryId;
                            return (
                              <option key={itinId} value={itinId}>
                                {itin?.name || "Unknown Itinerary"}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 w-full" style={{ touchAction: "pan-y pinch-zoom" }}>
                    {(showAllReviews 
                      ? visitedSites.filter(s => selectedReviewItineraryFilter === "all" || s.itineraryId?._id === selectedReviewItineraryFilter)
                      : visitedSites.filter(s => selectedReviewItineraryFilter === "all" || s.itineraryId?._id === selectedReviewItineraryFilter).slice(0, 4)
                    ).map((site, index) => {
                      const existingReview = reviews.find(
                        (r) =>
                          r.siteId?._id === site.siteId?._id &&
                          r.itineraryId?._id === site.itineraryId?._id
                      );

                      return (
                        <SiteCard key={site?._id || `${site.siteId?._id || 'site'}-${index}`} site={site} resolveUrl={resolveUrl}>
                          <div className="mb-2" style={{ overflow: 'hidden', width: '100%' }}>
                            <div className="flex items-center gap-2 text-sm text-gray-600" style={{ minWidth: 0, width: '100%' }}>
                              <BookOpen className="w-4 h-4 text-[#f04e37] flex-shrink-0" />
                              <span 
                                className={expandedItineraries[`review-${site?._id || site.siteId?._id || index}`] ? "break-words" : "truncate"}
                                style={{ 
                                  overflow: expandedItineraries[`review-${site?._id || site.siteId?._id || index}`] ? 'visible' : 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: expandedItineraries[`review-${site?._id || site.siteId?._id || index}`] ? 'normal' : 'nowrap',
                                  wordBreak: expandedItineraries[`review-${site?._id || site.siteId?._id || index}`] ? 'break-word' : 'normal',
                                  minWidth: 0,
                                  maxWidth: '100%'
                                }}
                              >
                                {site.itineraryId?.name || "Unknown Itinerary"}
                              </span>
                            </div>
                            {(site.itineraryId?.name?.length > 30) && (
                              <button
                                onClick={() => setExpandedItineraries(prev => ({
                                  ...prev,
                                  [`review-${site?._id || site.siteId?._id || index}`]: !prev[`review-${site?._id || site.siteId?._id || index}`]
                                }))}
                                className="text-xs text-[#f04e37] hover:text-orange-600 ml-6 mt-1 font-medium"
                              >
                                {expandedItineraries[`review-${site?._id || site.siteId?._id || index}`] ? "See less" : "See more"}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>Visited: {new Date(site.visitedAt).toLocaleDateString()}</span>
                          </div>
                          {existingReview ? (
                            <>
                              <div className="flex items-center gap-1 mb-2">
                                {renderStars(existingReview.rating)}
                              </div>
                              <div className="mb-3">
                                <p 
                                  className={`text-sm text-gray-600 ${expandedDescriptions[`review-desc-${index}`] ? '' : 'line-clamp-3'}`}
                                  style={{ overflow: 'hidden', width: '100%', wordBreak: 'break-word' }}
                                >
                                  {existingReview.reviewText || "No review text"}
                                </p>
                                {existingReview.reviewText && existingReview.reviewText.length > 150 && (
                                  <button
                                    onClick={() => setExpandedDescriptions(prev => ({
                                      ...prev,
                                      [`review-desc-${index}`]: !prev[`review-desc-${index}`]
                                    }))}
                                    className="text-xs text-[#f04e37] hover:text-orange-600 mt-1 font-medium"
                                  >
                                    {expandedDescriptions[`review-desc-${index}`] ? "See less" : "See more"}
                                  </button>
                                )}
                              </div>
                              {existingReview.photos && existingReview.photos.length > 0 && (
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
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
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenReviewModal(site)}
                                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                  Edit Review
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(existingReview._id)}
                                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                  Delete Review
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenReviewModal(site)}
                              className="w-full bg-gradient-to-r from-[#f04e37] to-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                              Write Review
                            </button>
                          )}
                        </SiteCard>
                      );
                    })}
                    </div>
                    
                    {/* Show More/Less Button for Reviews */}
                    {visitedSites.filter(s => selectedReviewItineraryFilter === "all" || s.itineraryId?._id === selectedReviewItineraryFilter).length > 4 && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="px-8 py-3 bg-[#f04e37] hover:bg-[#d63b2a] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
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
                              <span>Show More ({Math.max(0, visitedSites.filter(s => selectedReviewItineraryFilter === "all" || s.itineraryId?._id === selectedReviewItineraryFilter).length - 4)} more)</span>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                </div>
              )}
            </>
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

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
    </>
  );
}
