import React, { useState, useEffect, useRef } from "react";
import MainLayout from "../MainLayout";
import { FaStar } from "react-icons/fa";
import BackHeader from "../BackButton";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Camera,
  X,
  MapPin,
  Calendar,
  Star as StarIcon,
  Filter,
  BookOpen,
  Search as SearchIcon,
} from "lucide-react";
import NotificationModal from "../../shared/NotificationModal";
import PullToRefresh from "../../shared/PullToRefresh";
import { useTour } from "../../TourComponents/TourContext";

// Reusable Site Card Component
const SiteCard = ({ site, resolveUrl, children, className = "" }) => {
  return (
    <div
      className={`bg-white/95 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group hover:scale-[1.02] w-full ${className}`}
      style={{ minWidth: 0, maxWidth: "100%", touchAction: "pan-y pinch-zoom" }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            site.siteId?.mediaFiles?.find((m) => m.type === "image")?.url
              ? resolveUrl(
                  site.siteId.mediaFiles.find((m) => m.type === "image").url
                )
              : site.siteId?.mediaUrl
              ? resolveUrl(site.siteId.mediaUrl)
              : "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=400&q=80"
          }
          alt={site.siteId?.siteName || "Site"}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=400&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white drop-shadow-lg">
            {site.siteId?.siteName || "Unknown Site"}
          </h3>
        </div>
      </div>
      <div
        className="p-5"
        style={{ overflow: "hidden", width: "100%", boxSizing: "border-box" }}
      >
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
  const [selectedReviewItineraryFilter, setSelectedReviewItineraryFilter] =
    useState("all");
  const [placesSearchQuery, setPlacesSearchQuery] = useState("");
  const [reviewsSearchQuery, setReviewsSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("places"); // "places" or "reviews"
  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const [expandedItineraries, setExpandedItineraries] = useState({}); // Track which itinerary names are expanded
  const [expandedDescriptions, setExpandedDescriptions] = useState({}); // Track which descriptions are expanded
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    reviewId: null,
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { t } = useTranslation();
  const { startTour, isTourRunning, hasCompletedTour } = useTour();

  const handleRefresh = async () => {
    setRefreshKey((prev) => prev + 1);
    setLoading(true);
    await fetchVisitedSites();
    await fetchReviews();
  };

  useEffect(() => {
    const openReviewsTab = () => setActiveTab("reviews");
    const openPlacesTab = () => setActiveTab("places");
    const openWriteReview = () => {
      const filtered = visitedSites
        .filter(
          (s) =>
            selectedReviewItineraryFilter === "all" ||
            s.itineraryId?._id === selectedReviewItineraryFilter
        );
      const site = filtered[0] || visitedSites[0];
      if (site) handleOpenReviewModal(site);
    };
    const closeReviewModal = () => {
      setShowReviewModal(false);
      setSelectedSite(null);
    };
    const openReviewModalAgain = () => {
      const site = selectedSite || visitedSites[0];
      if (site) handleOpenReviewModal(site);
    };
    window.addEventListener("tour:tripArchiveOpenReviewsTab", openReviewsTab);
    window.addEventListener("tour:tripArchiveOpenPlacesTab", openPlacesTab);
    window.addEventListener("tour:tripArchiveOpenWriteReview", openWriteReview);
    window.addEventListener("tour:tripArchiveCloseReviewModal", closeReviewModal);
    window.addEventListener("tour:tripArchiveOpenReviewModalAgain", openReviewModalAgain);
    return () => {
      window.removeEventListener("tour:tripArchiveOpenReviewsTab", openReviewsTab);
      window.removeEventListener("tour:tripArchiveOpenPlacesTab", openPlacesTab);
      window.removeEventListener("tour:tripArchiveOpenWriteReview", openWriteReview);
      window.removeEventListener("tour:tripArchiveCloseReviewModal", closeReviewModal);
      window.removeEventListener("tour:tripArchiveOpenReviewModalAgain", openReviewModalAgain);
    };
  }, [visitedSites, selectedReviewItineraryFilter, selectedSite]);

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
        const [visitedRes, reviewsRes, pinsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/visited-sites`, config),
          axios.get(`${BACKEND_URL}/api/reviews`, config),
          axios.get(`${BACKEND_URL}/api/pins`), // Fetch all pins to get media URLs
        ]);

        // Enrich visited sites with pin media data
        const pins = pinsRes.data;
        const enrichedSites = visitedRes.data.map((site) => {
          const pin = pins.find((p) => p._id === site.siteId?._id);
          return {
            ...site,
            siteId: {
              ...site.siteId,
              mediaUrl: pin?.mediaUrl || site.siteId?.mediaUrl,
              mediaFiles: pin?.mediaFiles || site.siteId?.mediaFiles,
            },
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
        title: "Rating Required",
        message: "Please select a rating",
        type: "warning",
      });
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

          setNotification({
            isOpen: true,
            title: "Content Warning",
            message: warningMessage,
            type: "warning",
          });
          console.log("Flagged categories:", result.categories);
          return;
        }
      } catch (err) {
        console.error("Error checking content moderation:", err);

        // Always apply basic profanity check as fallback when moderation API fails
        const basicProfanityList = [
          "fuck",
          "shit",
          "ass",
          "bitch",
          "sex",
          "porn",
          "dick",
          "pussy",
          "cock",
          "damn",
          "hell",
        ];
        const containsProfanity = basicProfanityList.some((word) =>
          reviewText.toLowerCase().includes(word.toLowerCase())
        );

        if (containsProfanity) {
          setNotification({
            isOpen: true,
            title: "Inappropriate Content",
            message:
              "Your review contains inappropriate content. Please revise it.",
            type: "warning",
          });
          return;
        }

        // Check if it's a rate limit error
        if (
          err.response &&
          err.response.status === 500 &&
          err.response.data &&
          err.response.data.details === "Too Many Requests"
        ) {
          setNotification({
            isOpen: true,
            title: "High Traffic",
            message:
              "We're experiencing high traffic. Your review will be submitted, but please ensure it follows community guidelines.",
            type: "info",
          });
          console.log(
            "OpenAI rate limit reached, proceeding with submission after profanity check"
          );
        } else {
          // For other errors, warn user but allow submission after profanity check
          console.warn(
            "Moderation API unavailable, used fallback profanity filter"
          );
        }
      }
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
        title: "Success",
        message: response.data.message,
        type: "success",
      });
    } catch (err) {
      console.error("Error submitting review:", err);
      setNotification({
        isOpen: true,
        title: "Error",
        message: "Failed to submit review",
        type: "error",
      });
    }
  };

  const handleDeleteReview = (reviewId) => {
    // Show confirmation modal
    setDeleteConfirmation({
      isOpen: true,
      reviewId: reviewId,
    });
  };

  const confirmDeleteReview = async () => {
    const reviewId = deleteConfirmation.reviewId;

    try {
      await axios.delete(`${BACKEND_URL}/api/reviews/${reviewId}`, config);

      // Remove review from state
      setReviews(reviews.filter((r) => r._id !== reviewId));

      setNotification({
        isOpen: true,
        title: "Success",
        message: "Review deleted successfully",
        type: "success",
      });
    } catch (err) {
      console.error("Error deleting review:", err);
      setNotification({
        isOpen: true,
        title: "Error",
        message: "Failed to delete review",
        type: "error",
      });
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
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col text-sm relative" style={{ height: '100dvh', overflow: 'hidden', overscrollBehavior: 'none' }}>
        <TripArchiveTourAutostart running={isTourRunning} completed={hasCompletedTour} onStart={startTour} />
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#f04e37]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
        </div>

        <BackHeader title="Trip Archives" />

        <MainLayout includeSideButtons={false}>
          <PullToRefresh onRefresh={handleRefresh}>
          <div className="w-full relative z-10" key={refreshKey} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {/* Page content */}
            <div className="px-4 pt-6">
              {/* Icon Tab Navigation */}
              <div className="flex justify-center items-center gap-8 mb-8">
                {/* Places Tab */}
                <button
                  onClick={() => setActiveTab("places")}
                  className="group relative transition-all duration-300 trip-tab-places-btn"
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
                      activeTab === "places"
                        ? "text-[#f04e37]"
                        : "text-gray-500"
                    }`}
                  >
                    Places
                  </p>
                </button>

                {/* Reviews Tab */}
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="group relative transition-all duration-300 trip-tab-reviews-btn"
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
                      activeTab === "reviews"
                        ? "text-yellow-600"
                        : "text-gray-500"
                    }`}
                  >
                    Reviews
                  </p>
                </button>
              </div>

              {/* Page Title */}
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                  {activeTab === "places"
                    ? "Places you visited"
                    : "Your Reviews"}
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
                      animation: "fadeIn 0.3s ease-out",
                    }}
                  >
                    {/* Section Header with Filter */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="text"
                            value={placesSearchQuery}
                            onChange={(e) =>
                              setPlacesSearchQuery(e.target.value)
                            }
                            placeholder="Search places by name or description"
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 border-2 border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 transition-all outline-none"
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <ItineraryFilterButton
                            value={selectedItineraryFilter}
                            onChange={setSelectedItineraryFilter}
                            options={Array.from(
                              new Set(
                                visitedSites.map((s) => s.itineraryId?._id)
                              )
                            )
                              .map((id) => ({
                                id,
                                label:
                                  visitedSites.find(
                                    (s) => s.itineraryId?._id === id
                                  )?.itineraryId?.name || "Unknown Itinerary",
                              }))
                              .filter((opt) => opt.id)}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-1 gap-6 w-full trip-places-list"
                      style={{ touchAction: "pan-y pinch-zoom" }}
                    >
                      {(() => {
                        const filtered = visitedSites
                          .filter(
                            (s) =>
                              selectedItineraryFilter === "all" ||
                              s.itineraryId?._id === selectedItineraryFilter
                          )
                          .filter((s) => {
                            const q = placesSearchQuery.trim().toLowerCase();
                            if (!q) return true;
                            const name = (
                              s.siteId?.siteName || ""
                            ).toLowerCase();
                            const desc = (
                              s.siteId?.siteDescription || ""
                            ).toLowerCase();
                            const itinName = (
                              s.itineraryId?.name || ""
                            ).toLowerCase();
                            return (
                              name.includes(q) ||
                              desc.includes(q) ||
                              itinName.includes(q)
                            );
                          });
                        const list = showAllArchives
                          ? filtered
                          : filtered.slice(0, 4);
                        if (!list.length) {
                          // Placeholder card shown during tour when no data
                          return [
                            {
                              _id: "placeholder",
                              siteId: {
                                siteName: "No visited places yet",
                                mediaUrl: "",
                                siteDescription:
                                  "When you visit sites, they appear here.",
                              },
                              itineraryId: { name: "Your itinerary" },
                            },
                          ];
                        }
                        return list;
                      })().map((site, index) => (
                        <SiteCard
                          className={index === 0 ? "trip-place-card" : ""}
                          key={
                            site?._id ||
                            `${site.siteId?._id || "site"}-${index}`
                          }
                          site={site}
                          resolveUrl={resolveUrl}
                        >
                          <div
                            className="mb-2"
                            style={{ overflow: "hidden", width: "100%" }}
                          >
                            <div
                              className="flex items-center gap-2 text-sm text-gray-600"
                              style={{ minWidth: 0, width: "100%" }}
                            >
                              <BookOpen className="w-4 h-4 text-[#f04e37] flex-shrink-0" />
                              <span
                                className={
                                  expandedItineraries[
                                    `place-${
                                      site?._id || site.siteId?._id || index
                                    }`
                                  ]
                                    ? "break-words"
                                    : "truncate"
                                }
                                style={{
                                  overflow: expandedItineraries[
                                    `place-${
                                      site?._id || site.siteId?._id || index
                                    }`
                                  ]
                                    ? "visible"
                                    : "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: expandedItineraries[
                                    `place-${
                                      site?._id || site.siteId?._id || index
                                    }`
                                  ]
                                    ? "normal"
                                    : "nowrap",
                                  wordBreak: expandedItineraries[
                                    `place-${
                                      site?._id || site.siteId?._id || index
                                    }`
                                  ]
                                    ? "break-word"
                                    : "normal",
                                  minWidth: 0,
                                  maxWidth: "100%",
                                }}
                              >
                                {site.itineraryId?.name || "Unknown Itinerary"}
                              </span>
                            </div>
                            {site.itineraryId?.name?.length > 30 && (
                              <button
                                onClick={() =>
                                  setExpandedItineraries((prev) => ({
                                    ...prev,
                                    [`place-${
                                      site?._id || site.siteId?._id || index
                                    }`]:
                                      !prev[
                                        `place-${
                                          site?._id || site.siteId?._id || index
                                        }`
                                      ],
                                  }))
                                }
                                className="text-xs text-[#f04e37] hover:text-orange-600 ml-6 mt-1 font-medium"
                              >
                                {expandedItineraries[
                                  `place-${
                                    site?._id || site.siteId?._id || index
                                  }`
                                ]
                                  ? "See less"
                                  : "See more"}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>
                              Visited:{" "}
                              {new Date(site.visitedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            {expandedDescriptions[
                              `place-desc-${
                                site?._id || site.siteId?._id || index
                              }`
                            ] ? (
                              <div
                                className="text-sm text-gray-600 space-y-2"
                                style={{
                                  width: "100%",
                                  wordBreak: "break-word",
                                }}
                              >
                                {(
                                  site.siteId?.siteDescription ||
                                  "No description available"
                                )
                                  .split("\n\n")
                                  .map((paragraph, idx) => (
                                    <p key={idx}>{paragraph.trim()}</p>
                                  ))}
                              </div>
                            ) : (
                              <p
                                className="text-sm text-gray-600"
                                style={{
                                  overflow: "hidden",
                                  width: "100%",
                                  wordBreak: "break-word",
                                }}
                              >
                                {(site.siteId?.siteDescription?.length || 0) >
                                200
                                  ? `${site.siteId.siteDescription.slice(
                                      0,
                                      200
                                    )}...`
                                  : site.siteId?.siteDescription ||
                                    "No description available"}
                              </p>
                            )}
                            {(site.siteId?.siteDescription?.length || 0) >
                              200 && (
                              <button
                                onClick={() =>
                                  setExpandedDescriptions((prev) => ({
                                    ...prev,
                                    [`place-desc-${
                                      site?._id || site.siteId?._id || index
                                    }`]:
                                      !prev[
                                        `place-desc-${
                                          site?._id || site.siteId?._id || index
                                        }`
                                      ],
                                  }))
                                }
                                className="text-xs text-[#f04e37] hover:text-orange-600 mt-2 font-medium"
                              >
                                {expandedDescriptions[
                                  `place-desc-${
                                    site?._id || site.siteId?._id || index
                                  }`
                                ]
                                  ? "See less"
                                  : "See more"}
                              </button>
                            )}
                          </div>
                        </SiteCard>
                      ))}
                    </div>

                    {/* Show More/Less Button */}
                    {(() => {
                      const count = visitedSites
                        .filter(
                          (s) =>
                            selectedItineraryFilter === "all" ||
                            s.itineraryId?._id === selectedItineraryFilter
                        )
                        .filter((s) => {
                          const q = placesSearchQuery.trim().toLowerCase();
                          if (!q) return true;
                          const name = (s.siteId?.siteName || "").toLowerCase();
                          const desc = (
                            s.siteId?.siteDescription || ""
                          ).toLowerCase();
                          const itinName = (
                            s.itineraryId?.name || ""
                          ).toLowerCase();
                          return (
                            name.includes(q) ||
                            desc.includes(q) ||
                            itinName.includes(q)
                          );
                        }).length;
                      return count > 4;
                    })() && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setShowAllArchives(!showAllArchives)}
                          className="px-8 py-3 bg-[#f04e37] hover:bg-[#d63b2a] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                          {showAllArchives ? (
                            <>
                              <span>Show Less</span>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>
                                {(() => {
                                  const count = visitedSites
                                    .filter(
                                      (s) =>
                                        selectedItineraryFilter === "all" ||
                                        s.itineraryId?._id ===
                                          selectedItineraryFilter
                                    )
                                    .filter((s) => {
                                      const q = placesSearchQuery
                                        .trim()
                                        .toLowerCase();
                                      if (!q) return true;
                                      const name = (
                                        s.siteId?.siteName || ""
                                      ).toLowerCase();
                                      const desc = (
                                        s.siteId?.siteDescription || ""
                                      ).toLowerCase();
                                      const itinName = (
                                        s.itineraryId?.name || ""
                                      ).toLowerCase();
                                      return (
                                        name.includes(q) ||
                                        desc.includes(q) ||
                                        itinName.includes(q)
                                      );
                                    }).length;
                                  const more = Math.max(0, count - 4);
                                  return `Show More (${more} more)`;
                                })()}
                              </span>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
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
                    className="px-7"
                    style={{
                      animation: "fadeIn 0.3s ease-out",
                    }}
                  >
                    {/* Toolbar: search + icon-only itinerary filter */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="text"
                            value={reviewsSearchQuery}
                            onChange={(e) =>
                              setReviewsSearchQuery(e.target.value)
                            }
                            placeholder="Search reviews by site or text"
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 border-2 border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 transition-all outline-none"
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <ItineraryFilterButton
                            value={selectedReviewItineraryFilter}
                            onChange={setSelectedReviewItineraryFilter}
                            options={Array.from(
                              new Set(
                                visitedSites.map((s) => s.itineraryId?._id)
                              )
                            )
                              .map((id) => ({
                                id,
                                label:
                                  visitedSites.find(
                                    (s) => s.itineraryId?._id === id
                                  )?.itineraryId?.name || "Unknown Itinerary",
                              }))
                              .filter((opt) => opt.id)}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-1 gap-6 w-full"
                      style={{ touchAction: "pan-y pinch-zoom" }}
                    >
                      {(() => {
                        const filtered = visitedSites
                          .filter(
                            (s) =>
                              selectedReviewItineraryFilter === "all" ||
                              s.itineraryId?._id ===
                                selectedReviewItineraryFilter
                          )
                          .filter((s) => {
                            const q = reviewsSearchQuery.trim().toLowerCase();
                            if (!q) return true;
                            const name = (
                              s.siteId?.siteName || ""
                            ).toLowerCase();
                            const reviewText = (
                              reviews.find(
                                (r) =>
                                  r.siteId?._id === (s.siteId?._id || s.siteId)
                              )?.reviewText || ""
                            ).toLowerCase();
                            return name.includes(q) || reviewText.includes(q);
                          });
                        const list = showAllReviews
                          ? filtered
                          : filtered.slice(0, 4);
                        return list;
                      })().map((site, index) => {
                        const existingReview = reviews.find(
                          (r) =>
                            r.siteId?._id === site.siteId?._id &&
                            r.itineraryId?._id === site.itineraryId?._id
                        );

                        return (
                          <SiteCard
                            key={
                              site?._id ||
                              `${site.siteId?._id || "site"}-${index}`
                            }
                            site={site}
                            resolveUrl={resolveUrl}
                          >
                            <div
                              className="mb-2"
                              style={{ overflow: "hidden", width: "100%" }}
                            >
                              <div
                                className="flex items-center gap-2 text-sm text-gray-600"
                                style={{ minWidth: 0, width: "100%" }}
                              >
                                <BookOpen className="w-4 h-4 text-[#f04e37] flex-shrink-0" />
                                <span
                                  className={
                                    expandedItineraries[
                                      `review-${
                                        site?._id || site.siteId?._id || index
                                      }`
                                    ]
                                      ? "break-words"
                                      : "truncate"
                                  }
                                  style={{
                                    overflow: expandedItineraries[
                                      `review-${
                                        site?._id || site.siteId?._id || index
                                      }`
                                    ]
                                      ? "visible"
                                      : "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: expandedItineraries[
                                      `review-${
                                        site?._id || site.siteId?._id || index
                                      }`
                                    ]
                                      ? "normal"
                                      : "nowrap",
                                    wordBreak: expandedItineraries[
                                      `review-${
                                        site?._id || site.siteId?._id || index
                                      }`
                                    ]
                                      ? "break-word"
                                      : "normal",
                                    minWidth: 0,
                                    maxWidth: "100%",
                                  }}
                                >
                                  {site.itineraryId?.name ||
                                    "Unknown Itinerary"}
                                </span>
                              </div>
                              {site.itineraryId?.name?.length > 30 && (
                                <button
                                  onClick={() =>
                                    setExpandedItineraries((prev) => ({
                                      ...prev,
                                      [`review-${
                                        site?._id || site.siteId?._id || index
                                      }`]:
                                        !prev[
                                          `review-${
                                            site?._id ||
                                            site.siteId?._id ||
                                            index
                                          }`
                                        ],
                                    }))
                                  }
                                  className="text-xs text-[#f04e37] hover:text-orange-600 ml-6 mt-1 font-medium"
                                >
                                  {expandedItineraries[
                                    `review-${
                                      site?._id || site.siteId?._id || index
                                    }`
                                  ]
                                    ? "See less"
                                    : "See more"}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>
                                Visited:{" "}
                                {new Date(site.visitedAt).toLocaleDateString()}
                              </span>
                            </div>
                            {existingReview ? (
                              <>
                                <div className="flex items-center gap-1 mb-2">
                                  {renderStars(existingReview.rating)}
                                </div>
                                <div className="mb-3">
                                  <p
                                    className={`text-sm text-gray-600 ${
                                      expandedDescriptions[
                                        `review-desc-${index}`
                                      ]
                                        ? ""
                                        : "line-clamp-3"
                                    }`}
                                    style={{
                                      overflow: "hidden",
                                      width: "100%",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {existingReview.reviewText ||
                                      "No review text"}
                                  </p>
                                  {existingReview.reviewText &&
                                    existingReview.reviewText.length > 150 && (
                                      <button
                                        onClick={() =>
                                          setExpandedDescriptions((prev) => ({
                                            ...prev,
                                            [`review-desc-${index}`]:
                                              !prev[`review-desc-${index}`],
                                          }))
                                        }
                                        className="text-xs text-[#f04e37] hover:text-orange-600 mt-1 font-medium"
                                      >
                                        {expandedDescriptions[
                                          `review-desc-${index}`
                                        ]
                                          ? "See less"
                                          : "See more"}
                                      </button>
                                    )}
                                </div>
                                {existingReview.photos &&
                                  existingReview.photos.length > 0 && (
                                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                                      {existingReview.photos.map(
                                        (photo, idx) => (
                                          <img
                                            key={idx}
                                            src={resolveUrl(photo)}
                                            alt={`Review photo ${idx + 1}`}
                                            className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 shadow-sm hover:scale-110 transition-transform"
                                          />
                                        )
                                      )}
                                    </div>
                                  )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleOpenReviewModal(site)}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all trip-edit-review-btn"
                                  >
                                    Edit Review
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteReview(existingReview._id)
                                    }
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all trip-delete-review-btn"
                                  >
                                    Delete Review
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenReviewModal(site)}
                                  className="w-full bg-gradient-to-r from-[#f04e37] to-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all trip-write-review-btn"
                                >
                                  Write Review
                                </button>
                                <div className="mt-3 flex gap-2" aria-hidden>
                                  <button
                                    type="button"
                                    disabled
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-500 text-xs font-semibold rounded-xl shadow-sm cursor-default trip-edit-review-btn"
                                  >
                                    Edit Review
                                  </button>
                                  <button
                                    type="button"
                                    disabled
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-500 text-xs font-semibold rounded-xl shadow-sm cursor-default trip-delete-review-btn"
                                  >
                                    Delete Review
                                  </button>
                                </div>
                              </>
                            )}
                          </SiteCard>
                        );
                      })}
                    </div>

                    {/* Show More/Less Button for Reviews */}
                    {(() => {
                      const count = visitedSites
                        .filter(
                          (s) =>
                            selectedReviewItineraryFilter === "all" ||
                            s.itineraryId?._id === selectedReviewItineraryFilter
                        )
                        .filter((s) => {
                          const q = reviewsSearchQuery.trim().toLowerCase();
                          if (!q) return true;
                          const name = (s.siteId?.siteName || "").toLowerCase();
                          const reviewText = (
                            reviews.find(
                              (r) =>
                                r.siteId?._id === (s.siteId?._id || s.siteId)
                            )?.reviewText || ""
                          ).toLowerCase();
                          return name.includes(q) || reviewText.includes(q);
                        }).length;
                      return count > 4;
                    })() && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="px-8 py-3 bg-[#f04e37] hover:bg-[#d63b2a] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                          {showAllReviews ? (
                            <>
                              <span>Show Less</span>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>
                                {(() => {
                                  const count = visitedSites
                                    .filter(
                                      (s) =>
                                        selectedReviewItineraryFilter ===
                                          "all" ||
                                        s.itineraryId?._id ===
                                          selectedReviewItineraryFilter
                                    )
                                    .filter((s) => {
                                      const q = reviewsSearchQuery
                                        .trim()
                                        .toLowerCase();
                                      if (!q) return true;
                                      const name = (
                                        s.siteId?.siteName || ""
                                      ).toLowerCase();
                                      const reviewText = (
                                        reviews.find(
                                          (r) =>
                                            r.siteId?._id ===
                                            (s.siteId?._id || s.siteId)
                                        )?.reviewText || ""
                                      ).toLowerCase();
                                      return (
                                        name.includes(q) ||
                                        reviewText.includes(q)
                                      );
                                    }).length;
                                  const more = Math.max(0, count - 4);
                                  return `Show More (${more} more)`;
                                })()}
                              </span>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
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
        {/* Footer inside white content container */}
        <div className="px-6 pt-6 pb-16 text-center">
          <p className="text-xs text-center text-gray-400">
            © {new Date().getFullYear()} {t("intramurosAdmin")}. Developed by UST
            College of Information and Computing Sciences.
          </p>
          </div>
          </PullToRefresh>
        </MainLayout>

        {/* Review Modal */}
        {showReviewModal && selectedSite && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 trip-review-modal">
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
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Rating:
                </p>
                <div className="flex gap-2">
                  {renderStars(rating, true, setHoverRating, setRating)}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Review (optional):
                </p>
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
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Add Photos (optional, max 5):
                </p>

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

        {/* Delete Confirmation Modal */}
        <NotificationModal
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, reviewId: null })}
          title="Delete Review"
          message="Are you sure you want to delete this review? This action cannot be undone."
          type="warning"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteReview}
        />
      </div>
    </>
  );
}

function TripArchiveTourAutostart({ running, completed, onStart }) {
  const didStartRef = React.useRef(false);
  useEffect(() => {
    if (didStartRef.current) return;
    if (!completed && !running) {
      didStartRef.current = true;
      setTimeout(() => {
        onStart?.();
      }, 600);
    }
  }, [completed, running, onStart]);
  return null;
}
// Accessible, icon-only dropdown for filtering by itinerary
function ItineraryFilterButton({ value, onChange, options }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const currentLabel =
    value === "all"
      ? "All"
      : options.find((o) => o.id === value)?.label || "All";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filter itineraries"
        onClick={() => setOpen(!open)}
        className="w-10 h-10 sm:w-12 sm:h-10 rounded-xl bg-white border-2 border-gray-200 hover:border-[#f04e37] focus:outline-none focus:ring-2 focus:ring-[#f04e37]/20 flex items-center justify-center shadow-sm"
      >
        <Filter className="w-5 h-5 text-gray-700" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-48 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
        >
          <button
            role="option"
            aria-selected={value === "all"}
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
          >
            All Itineraries
          </button>
          {options.map((opt) => (
            <button
              key={opt.id}
              role="option"
              aria-selected={value === opt.id}
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <span className="sr-only">Current filter: {currentLabel}</span>
    </div>
  );
}
