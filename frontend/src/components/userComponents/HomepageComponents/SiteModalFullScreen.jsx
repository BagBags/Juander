import React, { useState, Suspense, lazy, useEffect } from "react";
import {
  X,
  Volume2,
  Star,
  Info,
  Tag,
  Glasses,
  Send,
  Edit2,
  Trash2,
  Play,
  Square,
  Clock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ttsService from "../../../utils/textToSpeech";
import MediaCarousel from "../../shared/MediaCarousel";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import NotificationModal from "../../shared/NotificationModal";
import ConfirmModal from "../../shared/ConfirmModal";
import QRScanner from "../QRScannerSimple";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGroupArrowsRotate } from "@fortawesome/free-solid-svg-icons";

const ModelPreview = lazy(() => import("../TourMap/SiteCardModelPreview"));

class ErrorBoundaryLocal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 md:h-80 bg-gray-50">
          <p className="text-sm text-gray-600">3D model preview unavailable</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SiteModalFullScreen({
  selectedPin,
  canReview = false,
  onClose,
  distance,
  currentPinIndex,
  pinsLength,
  goToNextStop = () => {},
  siteReviews = [],
  reviewsLoading = false,
  simulateGoToNextSite = () => {},
  isGuestMode = false,
  onReviewSubmitted,
}) {
  const { t } = useTranslation();
  const { itineraryId } = useParams();
  const navigate = useNavigate();
  const [showAR, setShowAR] = useState(false);
  const [scannedArUrl, setScannedArUrl] = useState(null);
  const [askedSensors, setAskedSensors] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userLanguage, setUserLanguage] = useState("english");
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: null,
    loading: false,
  });
  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const [userReviews, setUserReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewImages, setReviewImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const speechCheckIntervalRef = React.useRef(null);
  const audioRef = React.useRef(null);
  const arIframeRef = React.useRef(null);
  const modalRootRef = React.useRef(null);
  const descZoomRef = React.useRef(null);
  const descPinchRef = React.useRef(null);
  // 🔍 Review pinch-zoom support
  const reviewRefs = React.useRef({});
  const reviewPinchRef = React.useRef({});
  const onReviewTouchStart = (key, e) => {
    const el = reviewRefs.current[key];
    if (!el) return;
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy) || 1;
      reviewPinchRef.current[key] = { d };
      el.style.transition = "none";
      el.style.willChange = "transform";
      const rect = el.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const ox = ((cx - rect.left) / rect.width) * 100;
      const oy = ((cy - rect.top) / rect.height) * 100;
      el.style.transformOrigin = `${ox}% ${oy}%`;
    }
  };
  const onReviewTouchMove = (key, e) => {
    const el = reviewRefs.current[key];
    if (!el) return;
    const st = reviewPinchRef.current[key];
    if (!st) return;
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy) || st.d;
      let s = d / st.d;
      if (s < 1) s = 1;
      if (s > 2.5) s = 2.5;
      el.style.transform = `scale(${s})`;
      e.preventDefault();
    }
  };
  const onReviewTouchEnd = (key) => {
    const el = reviewRefs.current[key];
    if (!el) return;
    reviewPinchRef.current[key] = null;
    el.style.transition = "transform 200ms ease-out";
    el.style.transform = "scale(1)";
  };
  const onDescTouchStart = (e) => {
    const el = descZoomRef.current;
    if (!el) return;
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy) || 1;
      descPinchRef.current = { d };
      el.style.transition = "none";
      el.style.willChange = "transform";
      const rect = el.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const ox = ((cx - rect.left) / rect.width) * 100;
      const oy = ((cy - rect.top) / rect.height) * 100;
      el.style.transformOrigin = `${ox}% ${oy}%`;
    }
  };
  const onDescTouchMove = (e) => {
    const el = descZoomRef.current;
    if (!el) return;
    const st = descPinchRef.current;
    if (!st) return;
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy) || st.d;
      let s = d / st.d;
      if (s < 1) s = 1;
      if (s > 2.5) s = 2.5;
      el.style.transform = `scale(${s})`;
      e.preventDefault();
    }
  };
  const onDescTouchEnd = () => {
    const el = descZoomRef.current;
    if (!el) return;
    descPinchRef.current = null;
    el.style.transition = "transform 200ms ease-out";
    el.style.transform = "scale(1)";
  };

  useEffect(() => {}, [showAR, scannedArUrl]);

  const requestSensorPermissions = async () => {
    try {
      const reqs = [];
      if (typeof window !== "undefined") {
        const DME = window.DeviceMotionEvent;
        const DOE = window.DeviceOrientationEvent;
        if (DME && typeof DME.requestPermission === "function") {
          reqs.push(DME.requestPermission());
        }
        if (DOE && typeof DOE.requestPermission === "function") {
          reqs.push(DOE.requestPermission());
        }
      }
      if (!reqs.length) {
        const isIOS =
          typeof navigator !== "undefined" &&
          /iPad|iPhone|iPod/.test(navigator.userAgent);
        return !isIOS;
      }
      const results = await Promise.allSettled(reqs);
      return results.every(
        (r) => r.status === "fulfilled" && r.value === "granted"
      );
    } catch {
      return false;
    }
  };

  const requestSensorPermissionsDetailed = async () => {
    const result = { motion: false, orientation: false };
    try {
      if (
        typeof window !== "undefined" &&
        typeof window.DeviceMotionEvent !== "undefined" &&
        typeof window.DeviceMotionEvent.requestPermission === "function"
      ) {
        result.motion =
          (await window.DeviceMotionEvent.requestPermission()) === "granted";
      } else {
        result.motion = true;
      }
    } catch {}

    try {
      if (
        typeof window !== "undefined" &&
        typeof window.DeviceOrientationEvent !== "undefined" &&
        typeof window.DeviceOrientationEvent.requestPermission === "function"
      ) {
        result.orientation =
          (await window.DeviceOrientationEvent.requestPermission()) ===
          "granted";
      } else {
        result.orientation = true;
      }
    } catch {}

    return result;
  };

  const handleEnableSensors = async () => {
    const permission = await requestSensorPermissionsDetailed();
    const iframeWindow = arIframeRef.current?.contentWindow;
    const targetOrigin = (() => {
      try {
        return scannedArUrl ? new URL(scannedArUrl).origin : "*";
      } catch {
        return "*";
      }
    })();

    if (!iframeWindow) {
      setNotification({
        isOpen: true,
        title: "Permission",
        message: "Unable to reach AR frame. Please open in browser.",
        type: "warning",
      });
      return;
    }

    if (permission.motion && permission.orientation) {
      iframeWindow.postMessage(
        { type: "sensor-permission", status: "granted" },
        targetOrigin
      );
    } else {
      iframeWindow.postMessage(
        { type: "sensor-permission", status: "denied" },
        targetOrigin
      );
      setNotification({
        isOpen: true,
        title: "Permission Required",
        message:
          "Motion & Orientation permissions were not granted. If no prompt appeared, open the AR in the browser for full sensor access.",
        type: "warning",
      });
    }
  };

  // Helper: safely retrieve logged-in user ID from localStorage
  const getLocalUserId = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      return stored?._id || stored?.id || stored?.userId || null;
    } catch {
      return null;
    }
  };

  // iOS 26+ detection helper
  const isiOS26Plus = () => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const match = ua.match(/OS (\d+)_/);
    if (iOS && match) {
      const version = parseInt(match[1]);
      return version >= 26; // iOS 26+
    }
    return false;
  };

  // PWA detection helper
  const isPWA = () => {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  };

  // Cancel any ongoing TTS when modal opens
  useEffect(() => {
    if (selectedPin) {
      const allow =
        typeof window !== "undefined" &&
        window.__ttsArrivalLockUntil &&
        Date.now() < window.__ttsArrivalLockUntil;
      if (!allow) {
        ttsService.cancel();
      }
    }

    // Fetch user language preference
    const fetchUserLanguage = async () => {
      try {
        const token = localStorage.getItem("token");
        const isGuest = localStorage.getItem("guest") === "true";

        // Check for guest language first
        if (isGuest) {
          const guestLang = localStorage.getItem("guestLanguage") || "en";
          setUserLanguage(guestLang === "tl" ? "tagalog" : "english");
          return;
        }

        // For logged-in users, fetch from backend
        if (token) {
          const response = await axios.get(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/auth/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const language = response.data.language || "en";
          // Convert 'en' or 'tl' to 'english' or 'tagalog'
          setUserLanguage(language === "tl" ? "tagalog" : "english");
        } else {
          setUserLanguage("english");
        }
      } catch (error) {
        console.error("Failed to fetch user language:", error);
        setUserLanguage("english");
      }
    };
    fetchUserLanguage();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (showAR && scannedArUrl && !askedSensors) {
        const granted = await requestSensorPermissions();
        if (!granted) {
          setNotification({
            isOpen: true,
            title: "Permission Required",
            message:
              "Please allow Motion & Orientation access to use AR. If no prompt appears, open the AR in the browser for full sensor access.",
            type: "warning",
          });
        }
        setAskedSensors(true);
      }
    };
    run();
  }, [showAR, scannedArUrl, askedSensors]);

  // Cleanup: stop TTS when component unmounts (modal closes)
  useEffect(() => {
    const cleanupScope = modalRootRef.current || document.body;
    return () => {
      if (speechCheckIntervalRef.current) {
        clearInterval(speechCheckIntervalRef.current);
        speechCheckIntervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      ttsService.cancel();
      setIsPlaying(false);

      try {
        const scope = cleanupScope;
        const canvases = scope.querySelectorAll("canvas");
        canvases.forEach((canvas) => {
          try {
            const isMap =
              (canvas.classList &&
                canvas.classList.contains("mapboxgl-canvas")) ||
              !!canvas.closest(
                ".mapboxgl-map,.mapboxgl-canvas-container,.mapboxgl-control-container"
              );
            if (isMap) return;
            const gl =
              canvas.getContext("webgl2") ||
              canvas.getContext("webgl") ||
              canvas.getContext("experimental-webgl");
            if (gl && typeof gl.getExtension === "function") {
              const ext = gl.getExtension("WEBGL_lose_context");
              if (ext && typeof ext.loseContext === "function") {
                ext.loseContext();
              }
            }
          } catch {
            null;
          }
        });
        const videos = scope.querySelectorAll("video");
        videos.forEach((v) => {
          try {
            const s = v.srcObject;
            if (s && typeof s.getTracks === "function") {
              s.getTracks().forEach((t) => {
                try {
                  t.stop();
                } catch {}
              });
            }
            v.pause();
            v.srcObject = null;
            v.removeAttribute("src");
            v.load();
          } catch {}
        });
        const mvs = scope.querySelectorAll("model-viewer");
        mvs.forEach((el) => {
          try {
            el.removeAttribute("src");
          } catch {}
        });
      } catch {
        null;
      }
    };
  }, []);

  // Handler to manually play/stop description using backend Google TTS
  const handleToggleDescription = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    } else {
      if (selectedPin) {
        let description = "";
        if (userLanguage === "tagalog" && selectedPin.siteDescriptionTagalog) {
          description = selectedPin.siteDescriptionTagalog;
        } else if (userLanguage === "english" && selectedPin.siteDescription) {
          description = selectedPin.siteDescription;
        } else {
          description =
            selectedPin.description ||
            selectedPin.siteDescription ||
            selectedPin.siteDescriptionTagalog ||
            "";
        }

        if (description) {
          try {
            setIsPlaying(true);
            const res = await fetch(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/tts/speak`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: description,
                  lang: userLanguage === "english" ? "english" : "filipino",
                }),
              }
            );
            if (!res.ok) throw new Error("TTS request failed");
            const audioBlob = await res.blob();
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => {
              setIsPlaying(false);
              URL.revokeObjectURL(url);
              audioRef.current = null;
            };
            audio.play();
          } catch (err) {
            console.error("Error playing TTS:", err);
            setIsPlaying(false);
          }
        }
      }
    }
  };

  // Fetch user's reviews for this site
  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = getLocalUserId();
        if (token && userId && selectedPin) {
          const response = await axios.get(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/reviews/site/${selectedPin._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const reviewsData = response.data.reviews || response.data;
          const myReviews = reviewsData.filter((r) => {
            // 1️⃣ Match user
            let userMatch = false;
            if (r.userId) {
              if (typeof r.userId === "string") userMatch = r.userId === userId;
              else userMatch = r.userId._id === userId;
            }
            if (!userMatch) return false;

            // 2️⃣ Match itinerary
            if (!itineraryId) return false;
            if (r.itineraryId) {
              if (typeof r.itineraryId === "string")
                return r.itineraryId === itineraryId;
              return r.itineraryId._id === itineraryId;
            }
            return false;
          });
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
    const totalExisting = existingPhotos.length;
    if (files.length + reviewImages.length + totalExisting > 5) {
      setNotification({
        isOpen: true,
        title: "Upload Limit",
        message: "You can upload maximum 5 images",
        type: "warning",
      });
      return;
    }

    setReviewImages([...reviewImages, ...files]);

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
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

  const handleRemoveExistingPhoto = (index) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (rating === 0) {
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
        const token = localStorage.getItem("token");
        const BACKEND_URL =
          import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
          "http://localhost:5000";

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

    // Show confirmation modal to avoid duplicate submissions
    setConfirmModal({
      isOpen: true,
      type: "success",
      title: editingReviewId ? "Update Review?" : "Submit Review?",
      message: editingReviewId
        ? "Are you sure you want to update your review?"
        : "Are you sure you want to submit your review?",
      confirmText: editingReviewId ? "Update Review" : "Submit Review",
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        setIsSubmitting(true);
        try {
          const token = localStorage.getItem("token");

          if (editingReviewId) {
            const formData = new FormData();
            formData.append("rating", rating);
            formData.append("reviewText", reviewText.trim());
            formData.append("existingPhotos", JSON.stringify(existingPhotos));
            reviewImages.forEach((img) => formData.append("photos", img));

            await axios.put(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/reviews/${editingReviewId}`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            setNotification({
              isOpen: true,
              title: "Success",
              message: "Review updated successfully!",
              type: "success",
            });
          } else {
            // For creating, send as FormData with photos
            const formData = new FormData();
            formData.append("siteId", selectedPin._id);
            formData.append("itineraryId", itineraryId);
            formData.append("rating", rating);
            formData.append("reviewText", reviewText.trim());

            // Append photos if any
            reviewImages.forEach((image) => {
              formData.append("photos", image);
            });

            await axios.post(
              `${
                import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
              }/reviews`,
              formData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            setNotification({
              isOpen: true,
              title: "Success",
              message: "Review submitted successfully!",
              type: "success",
            });
          }

          // Reset form
          setRating(0);
          setReviewText("");
          setReviewImages([]);
          setImagePreviewUrls([]);
          setExistingPhotos([]);
          setShowReviewForm(false);
          setEditingReviewId(null);

          // Refresh user reviews
          const response = await axios.get(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/reviews/site/${selectedPin._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const userId = getLocalUserId();
          const reviewsData = response.data.reviews || response.data;
          const myReviews = reviewsData.filter((r) => {
            // 1️⃣ Match user
            let userMatch = false;
            if (r.userId) {
              if (typeof r.userId === "string") userMatch = r.userId === userId;
              else userMatch = r.userId._id === userId;
            }
            if (!userMatch) return false;

            // 2️⃣ Match itinerary
            if (!itineraryId) return false;
            if (r.itineraryId) {
              if (typeof r.itineraryId === "string")
                return r.itineraryId === itineraryId;
              return r.itineraryId._id === itineraryId;
            }
            return false;
          });
          setUserReviews(myReviews);

          // Refresh parent component's reviews
          if (onReviewSubmitted) {
            onReviewSubmitted();
          }
        } catch (err) {
          console.error("Error submitting review:", err);
          setNotification({
            isOpen: true,
            title: "Error",
            message: err.response?.data?.error || "Failed to submit review",
            type: "error",
          });
        } finally {
          setIsSubmitting(false);
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
            loading: false,
          }));
        }
      },
    }); // Added missing closing brace here
    // Prevent immediate submission until user confirms
    return;
  };

  const handleEditReview = (review) => {
    setRating(review.rating);
    setReviewText(review.reviewText || "");
    setEditingReviewId(review._id);
    // Note: Existing images from review.photos would need to be handled separately
    // For now, editing will allow adding new images only
    setExistingPhotos(review.photos || []);
    setReviewImages([]);
    setImagePreviewUrls([]);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotification({
        isOpen: true,
        title: "Success",
        message: "Review deleted successfully!",
        type: "success",
      });

      // Refresh user reviews
      setUserReviews(userReviews.filter((r) => r._id !== reviewId));
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
    <div
      ref={modalRootRef}
      className="fixed inset-0 z-[10000] bg-white bg-gradient-to-b from-gray-50 to-white flex flex-col"
      style={{
        height: "100svh",
        overflow: "hidden",
        overscrollBehavior: "none",
      }}
    >
      <div
        className="fixed inset-x-0"
        style={{
          top: 0,
          height: "env(safe-area-inset-top)",
          backgroundColor: "white",
          zIndex: 10001,
        }}
      />
      {/* Bottom safe-area overlay */}
      <div
        className="fixed inset-x-0"
        style={{
          bottom: 0,
          height: "calc(env(safe-area-inset-bottom, 0px) + 32px)",
          backgroundColor: "white",
          zIndex: 10001,
        }}
      />
      {/* Modern Header with Close Button */}
      <div
        className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-5 flex items-center justify-between shadow-sm z-50"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 16px), 16px)",
          paddingBottom: "16px",
        }}
      >
        <div>
          <h2 className="text-lg font-bold text-gray-900">Site Information</h2>
          <p className="text-xs text-gray-500 mt-0.5">Explore the details</p>
        </div>
        <button
          onClick={() => {
            if (speechCheckIntervalRef.current) {
              clearInterval(speechCheckIntervalRef.current);
              speechCheckIntervalRef.current = null;
            }
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
            }
            ttsService.cancel(); // Stop any ongoing speech
            setIsPlaying(false);
            onClose();
          }}
          className="p-2.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Close site information"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div
        className={
          showAR
            ? "flex-1 overflow-hidden w-full grid place-items-center"
            : "flex-1 overflow-y-auto px-5 py-6 max-w-3xl mx-auto w-full"
        }
        style={{
          paddingBottom: showAR ? "0px" : "80px",
          touchAction: "pinch-zoom pan-y pan-x",
          overscrollBehavior: "contain",
        }}
      >
        {/* AR Mode fullscreen inside modal */}
        {showAR ? (
          <div className="w-full h-full max-w-3xl">
            <QRScanner
              onScanSuccess={(url) => {
                try {
                  const ctx = {
                    pinId: selectedPin?._id,
                    itineraryId,
                    mode: isGuestMode ? "guest" : "tourist",
                    path: window.location.pathname,
                  };
                  sessionStorage.setItem("AR_RETURN", JSON.stringify(ctx));
                } catch {}
                try {
                  navigate(`/ARExperience?url=${encodeURIComponent(url)}`);
                } catch {}
                setShowAR(false);
                setScannedArUrl(null);
                setAskedSensors(false);
              }}
              onClose={() => {
                setShowAR(false);
                setScannedArUrl(null);
                setAskedSensors(false);
              }}
            />
          </div>
        ) : (
          <>
            {/* 3D Model Preview */}
            {selectedPin.glbUrl && selectedPin.glbUrl.endsWith(".glb") && (
              <div
                className="mb-8 w-full h-64 md:h-80 border border-gray-200 rounded-lg overflow-hidden"
                style={{
                  backgroundImage: "url(/3DBG.webp)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <Suspense
                  fallback={
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      {/* Animated 3D Cube Loader */}
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-[#f04e37] border-t-transparent rounded-lg animate-spin"></div>
                        <div
                          className="absolute inset-2 border-4 border-orange-300 border-b-transparent rounded-lg animate-spin"
                          style={{
                            animationDirection: "reverse",
                            animationDuration: "1s",
                          }}
                        ></div>
                      </div>
                      {/* Loading Text */}
                      <div className="text-center">
                        <p className="text-base font-semibold text-gray-700 mb-1">
                          Loading 3D Model
                        </p>
                        <p className="text-sm text-gray-500">Please wait...</p>
                      </div>
                      {/* Progress Dots */}
                      <div className="flex gap-2">
                        <div
                          className="w-2 h-2 bg-[#f04e37] rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-[#f04e37] rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-[#f04e37] rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  }
                >
                  <ErrorBoundaryLocal>
                    <ModelPreview
                      key={selectedPin.glbUrl}
                      url={selectedPin.glbUrl}
                    />
                  </ErrorBoundaryLocal>
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
                      backgroundColor: "#fef2f0",
                      color: "#f04e37",
                    }}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {selectedPin.category.name || selectedPin.category}
                    </span>
                  </div>
                )}

                {/* Entrance Fee Badge */}
                {selectedPin.feeType && selectedPin.feeType !== "none" && (
                  <button
                    onClick={() => setShowFeeModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                    style={{
                      backgroundColor:
                        selectedPin.feeType === "fort_santiago"
                          ? "#FEF3C7"
                          : "#DBEAFE",
                      color:
                        selectedPin.feeType === "fort_santiago"
                          ? "#92400E"
                          : "#1E40AF",
                    }}
                  >
                    <span className="font-bold">₱</span>
                    <span>
                      {selectedPin.feeType === "fort_santiago"
                        ? "Fort Santiago Fee"
                        : "Entrance Fee"}
                    </span>
                    <Info className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Opening/Closing Badge */}
                {(selectedPin.openingTime || selectedPin.closingTime) && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm bg-gray-100 text-gray-700">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {(() => {
                        const fmt = (s) => {
                          if (!s) return "—";
                          const m = String(s)
                            .trim()
                            .match(/^([0-2]?\d):(\d{2})(?:\s*([AP]M))?$/i);
                          if (m) {
                            let h = parseInt(m[1], 10);
                            const min = m[2];
                            const p = m[3]
                              ? m[3].toUpperCase()
                              : h >= 12
                              ? "PM"
                              : "AM";
                            h = h % 12 || 12;
                            return `${h}:${min} ${p}`;
                          }
                          return String(s);
                        };
                        return `Open ${fmt(
                          selectedPin.openingTime
                        )} • Close ${fmt(selectedPin.closingTime)}`;
                      })()}
                    </span>
                  </div>
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
                    style={{
                      backgroundColor:
                        selectedPin.feeType === "fort_santiago"
                          ? "#f04e37"
                          : "#2563EB",
                    }}
                  >
                    <span className="text-white text-2xl font-bold">₱</span>
                    <h3 className="text-lg font-bold text-white">
                      {selectedPin.feeType === "fort_santiago"
                        ? "Fort Santiago Entrance"
                        : "Entrance Fee Required"}
                    </h3>
                  </div>

                  <div className="p-5">
                    {selectedPin.feeType === "fort_santiago" ? (
                      <>
                        <p className="text-gray-700 text-sm mb-3">
                          This site is located within Fort Santiago and requires
                          an entrance fee.
                        </p>
                        {selectedPin.feeAmount ? (
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-gray-800">
                                Fort Santiago Entrance Fee:
                              </p>
                              <span className="text-[#f04e37] font-bold text-lg">
                                ₱{selectedPin.feeAmount}
                              </span>
                            </div>
                            {selectedPin.feeAmountDiscounted && (
                              <div className="flex items-center justify-between bg-white/50 p-2 rounded-md mb-2">
                                <p className="text-xs font-medium text-gray-700">
                                  Student/PWD/Senior Citizen:
                                </p>
                                <span className="text-green-600 font-bold text-base">
                                  ₱{selectedPin.feeAmountDiscounted}
                                </span>
                              </div>
                            )}
                            <div className="bg-white/60 p-2 rounded-md mt-2">
                              <p className="text-xs text-gray-700 font-medium">
                                Payment will be upon entrance at the gate. This
                                will give you access to all sites within Fort
                                Santiago.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-3">
                            <p className="text-sm text-gray-700 mb-2">
                              Please check the current entrance fee at the Fort
                              Santiago entrance.
                            </p>
                            <p className="text-xs text-gray-600">
                              Payment at the gate will give you access to all
                              sites within Fort Santiago.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-gray-700 text-sm mb-3">
                          An entrance fee is required to visit{" "}
                          <span className="font-semibold">
                            {selectedPin.title || selectedPin.siteName}
                          </span>
                          .
                        </p>
                        {selectedPin.feeAmount ? (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-gray-800">
                                Entrance Fee:
                              </p>
                              <span className="text-blue-700 font-bold text-lg">
                                ₱{selectedPin.feeAmount}
                              </span>
                            </div>
                            {selectedPin.feeAmountDiscounted && (
                              <div className="flex items-center justify-between bg-white/50 p-2 rounded-md mb-2">
                                <p className="text-xs font-medium text-gray-700">
                                  Student/PWD/Senior Citizen:
                                </p>
                                <span className="text-green-600 font-bold text-base">
                                  ₱{selectedPin.feeAmountDiscounted}
                                </span>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 mt-1">
                              Please have the fee ready when visiting this site.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                            <p className="text-sm text-gray-700">
                              Please check on-site for current entrance fee
                              rates.
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => setShowFeeModal(false)}
                      className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors"
                      style={{
                        backgroundColor:
                          selectedPin.feeType === "fort_santiago"
                            ? "#f04e37"
                            : "#2563EB",
                        color: "white",
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
            {(!selectedPin.mediaFiles || selectedPin.mediaFiles.length === 0) &&
              selectedPin.mediaUrl && (
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

            {/* Play/Stop Description Button - Modern Design */}
            <button
              onClick={handleToggleDescription}
              className="mb-6 w-full text-white px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-98"
              style={{
                background: isPlaying
                  ? "linear-gradient(to right, #dc2626, #ef4444)"
                  : "linear-gradient(to right, #f04e37, #ff6b54)",
              }}
              aria-label={
                isPlaying ? "Stop reading description" : "Listen to description"
              }
            >
              {isPlaying ? (
                <>
                  <Square className="w-5 h-5" />
                  <span>Stop Reading</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Listen to Description</span>
                </>
              )}
            </button>

            {/* Description - Enhanced Typography with Language Support */}
            <div className="bg-white rounded-xl p-5 mb-8 border border-gray-200 shadow-sm">
              <div
                className="prose prose-sm max-w-none"
                ref={descZoomRef}
                onTouchStart={onDescTouchStart}
                onTouchMove={onDescTouchMove}
                onTouchEnd={onDescTouchEnd}
              >
                <div className="text-base leading-relaxed text-gray-700 space-y-4">
                  {(() => {
                    let description = "";
                    if (
                      userLanguage === "tagalog" &&
                      selectedPin.siteDescriptionTagalog
                    ) {
                      description = selectedPin.siteDescriptionTagalog;
                    } else if (
                      userLanguage === "english" &&
                      selectedPin.siteDescription
                    ) {
                      description = selectedPin.siteDescription;
                    } else {
                      description =
                        selectedPin.description ||
                        selectedPin.siteDescription ||
                        selectedPin.siteDescriptionTagalog ||
                        "No description available";
                    }

                    return description.split("\n\n").map((paragraph, index) => {
                      if (index === 0 || showFullDescription) {
                        return (
                          <p key={index} className="text-gray-800">
                            {paragraph.trim()}
                          </p>
                        );
                      }
                      return null;
                    });
                  })()}
                </div>

                {/* Read More/Less Button */}
                {(() => {
                  let description = "";
                  if (
                    userLanguage === "tagalog" &&
                    selectedPin.siteDescriptionTagalog
                  ) {
                    description = selectedPin.siteDescriptionTagalog;
                  } else if (
                    userLanguage === "english" &&
                    selectedPin.siteDescription
                  ) {
                    description = selectedPin.siteDescription;
                  } else {
                    description =
                      selectedPin.description ||
                      selectedPin.siteDescription ||
                      selectedPin.siteDescriptionTagalog ||
                      "";
                  }
                  return description.split("\n\n").length > 1;
                })() && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-4 font-semibold text-sm flex items-center gap-1 transition-colors"
                    style={{ color: "#f04e37" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#d9442f")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#f04e37")
                    }
                  >
                    {showFullDescription ? (
                      <>
                        <span>Show Less</span>
                        <svg
                          className="w-4 h-4"
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
                        <span>Read More</span>
                        <svg
                          className="w-4 h-4"
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
                )}
              </div>
            </div>

            {/* AR Mode Button - Mobile & Tablet */}
            {selectedPin.arEnabled && (
              <button
                onClick={() => {
                  try {
                    const ctx = {
                      pinId: selectedPin?._id,
                      mode: "homepage",
                      path: window.location.pathname,
                    };
                    sessionStorage.setItem("AR_RETURN", JSON.stringify(ctx));
                  } catch {}
                  try {
                    ttsService.speak("Opening AR Scanner");
                  } catch {}
                  try {
                    if (typeof onClose === "function") onClose();
                  } catch {}
                  try {
                    navigate("/ARScanner");
                  } catch {}
                }}
                className="xl:hidden w-full text-center text-white px-5 py-4 text-base font-bold rounded-xl shadow-lg hover:shadow-xl mb-8 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(to right, #f04e37, #d9442f)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "linear-gradient(to right, #d9442f, #c23d2a)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "linear-gradient(to right, #f04e37, #d9442f)")
                }
                aria-label="Scan QR Code for AR"
              >
                <Glasses className="w-5 h-5" />
                <span>Scan QR Code for AR</span>
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
                        {userReviews.map((review, idx) => (
                          <div
                            key={review._id}
                            ref={(el) => (reviewRefs.current[`user-${idx}`] = el)}
                            onTouchStart={(e) => onReviewTouchStart(`user-${idx}`, e)}
                            onTouchMove={(e) => onReviewTouchMove(`user-${idx}`, e)}
                            onTouchEnd={() => onReviewTouchEnd(`user-${idx}`)}
                            className="bg-blue-50 p-3 rounded-lg border border-blue-200"
                          >
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
                                    onClick={() =>
                                      handleDeleteReview(review._id)
                                    }
                                    className="text-red-600 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {review.reviewText && (
                              <p className="text-sm text-gray-700">
                                {review.reviewText}
                              </p>
                            )}

                            {review.photos && review.photos.length > 0 && (
                              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                                {review.photos.map((photo, idx) => (
                                  <img
                                    key={idx}
                                    src={
                                      photo.startsWith("http")
                                        ? photo
                                        : `${
                                            import.meta.env.VITE_API_BASE_URL?.replace(
                                              "/api",
                                              ""
                                            ) || "http://localhost:5000"
                                          }${photo}`
                                    }
                                    alt={`Photo ${idx + 1}`}
                                    className="w-16 h-16 object-cover rounded-md border border-gray-300 flex-shrink-0 cursor-pointer hover:border-[#f04e37]"
                                    onClick={() =>
                                      window.open(
                                        photo.startsWith("http")
                                          ? photo
                                          : `${
                                              import.meta.env.VITE_API_BASE_URL?.replace(
                                                "/api",
                                                ""
                                              ) || "http://localhost:5000"
                                            }${photo}`,
                                        "_blank"
                                      )
                                    }
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Write/Edit Review Button */}
                    {!isGuestMode &&
                      !showReviewForm &&
                      (userReviews.length === 0 ? (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 bg-blue-500 text-white hover:bg-blue-600 transition-all"
                        >
                          <Star className="w-4 h-4" />
                          Write a Review
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditReview(userReviews[0])}
                          className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 bg-blue-500 text-white hover:bg-blue-600 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit your Review
                        </button>
                      ))}

                    {/* Review Form */}
                    {!isGuestMode && canReview && showReviewForm && (
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
                            className="w-full px-3 py-2 text-base rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                            style={{ fontSize: "16px" }}
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

                          {/* Existing Photos (from saved review) */}
                          {existingPhotos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {existingPhotos.map((photo, index) => (
                                <div
                                  key={`existing-${index}`}
                                  className="relative w-20 h-20"
                                >
                                  <img
                                    src={photo}
                                    alt={`Existing photo ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveExistingPhoto(index)
                                    }
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* New Image Previews */}
                          {imagePreviewUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              {imagePreviewUrls.map((url, index) => (
                                <div key={`new-${index}`} className="relative">
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
                          {existingPhotos.length + reviewImages.length < 5 && (
                            <label className="cursor-pointer flex items-center justify-center w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
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
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                <span>
                                  Add Photos (
                                  {existingPhotos.length + reviewImages.length}
                                  /5)
                                </span>
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
                              setExistingPhotos([]);
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
                            {isSubmitting
                              ? "Submitting..."
                              : editingReviewId
                              ? "Update Review"
                              : "Submit Review"}
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
                    {!reviewsLoading &&
                      Array.isArray(siteReviews) &&
                      siteReviews.length > 0 && (
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
                      <div
                        className="animate-spin rounded-full h-6 w-6 border-b-2"
                        style={{ borderColor: "#f04e37" }}
                      ></div>
                      <p className="text-sm text-gray-500 ml-3">
                        Loading reviews...
                      </p>
                    </div>
                  ) : !Array.isArray(siteReviews) ||
                    siteReviews.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Star className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        No reviews yet
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Be the first to review!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {siteReviews
                          .slice(0, showAllReviews ? siteReviews.length : 2)
                          .map((review, idx) => (
                            <div
                              key={idx}
                              ref={(el) => (reviewRefs.current[`site-${idx}`] = el)}
                              onTouchStart={(e) => onReviewTouchStart(`site-${idx}`, e)}
                              onTouchMove={(e) => onReviewTouchMove(`site-${idx}`, e)}
                              onTouchEnd={() => onReviewTouchEnd(`site-${idx}`)}
                              className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200"
                            >
                              {/* Reviewer Info - Compact */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                    style={{
                                      background:
                                        "linear-gradient(135deg, #f04e37 0%, #ff6b54 100%)",
                                    }}
                                  >
                                    {(
                                      review.userId?.firstName?.[0] ||
                                      review.userId?.lastName?.[0] ||
                                      "A"
                                    ).toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                    <span className="font-semibold text-xs text-gray-900 block leading-tight">
                                      {review.userId?.firstName &&
                                      review.userId?.lastName
                                        ? `${review.userId.firstName} ${review.userId.lastName}`
                                        : review.userId?.firstName ||
                                          review.userId?.lastName ||
                                          "Anonymous"}
                                    </span>
                                    <div className="flex gap-0.5 mt-0.5">
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${
                                            i < review.rating
                                              ? "fill-yellow-400 text-yellow-400"
                                              : "fill-gray-300 text-gray-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                {review.createdAt && (
                                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                    {new Date(
                                      review.createdAt
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                )}
                              </div>

                              {/* Review Text - Compact */}
                              {review.reviewText && (
                                <p className="text-xs text-gray-700 leading-relaxed mb-2">
                                  {review.reviewText}
                                </p>
                              )}

                              {/* Review Photos - Compact */}
                              {review.photos && review.photos.length > 0 && (
                                <div className="flex gap-1.5 overflow-x-auto pb-1">
                                  {review.photos.map((photo, photoIdx) => (
                                    <img
                                      key={photoIdx}
                                      src={
                                        photo.startsWith("http")
                                          ? photo
                                          : `${
                                              import.meta.env.VITE_API_BASE_URL?.replace(
                                                "/api",
                                                ""
                                              ) || "http://localhost:5000"
                                            }${photo}`
                                      }
                                      alt={`Review ${photoIdx + 1}`}
                                      className="w-16 h-16 object-cover rounded-md border border-gray-300 hover:border-[#f04e37] transition-colors cursor-pointer flex-shrink-0"
                                      onClick={() =>
                                        window.open(
                                          photo.startsWith("http")
                                            ? photo
                                            : `${
                                                import.meta.env.VITE_API_BASE_URL?.replace(
                                                  "/api",
                                                  ""
                                                ) || "http://localhost:5000"
                                              }${photo}`,
                                          "_blank"
                                        )
                                      }
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
                            backgroundColor: showAllReviews
                              ? "#f5f5f5"
                              : "#f04e37",
                            color: showAllReviews ? "#f04e37" : "white",
                          }}
                          onMouseEnter={(e) => {
                            if (!showAllReviews) {
                              e.currentTarget.style.backgroundColor = "#d9442f";
                            } else {
                              e.currentTarget.style.backgroundColor = "#ebebeb";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              showAllReviews ? "#f5f5f5" : "#f04e37";
                          }}
                        >
                          {showAllReviews ? (
                            <>
                              <span>Show Less</span>
                              <svg
                                className="w-4 h-4"
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
                              <span>View All {siteReviews.length} Reviews</span>
                              <svg
                                className="w-4 h-4"
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
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ ...confirmModal, isOpen: false, loading: false })
        }
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
      />
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
}
