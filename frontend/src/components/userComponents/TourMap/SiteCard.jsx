import React, { Suspense, useState, useEffect, lazy } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";
import {
  X,
  MapPin,
  Clock,
  Glasses,
  ChevronDown,
  ChevronUp,
  Tag,
  Info,
  Volume2,
  Star,
  Play,
  Square,
} from "lucide-react";
import ttsService from "../../../utils/textToSpeech";
import { useTranslation } from "react-i18next";
import { FaStar } from "react-icons/fa";
import QRScanner from "../QRScannerSimple";
import axios from "axios";
import MediaCarousel from "../../shared/MediaCarousel";
import PullToRefresh from "../../shared/PullToRefresh";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGroupArrowsRotate } from "@fortawesome/free-solid-svg-icons";

const ModelPreview = lazy(() => import("./SiteCardModelPreview"));

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

const SiteCard = ({ pin, onClose, distance }) => {
  const [showAR, setShowAR] = useState(false);
  const [scannedArUrl, setScannedArUrl] = useState(null);
  const [siteReviews, setSiteReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userLanguage, setUserLanguage] = useState("english");
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const speechCheckIntervalRef = React.useRef(null);
  const audioRef = React.useRef(null);
  const arIframeRef = React.useRef(null);

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

  // Fetch user language preference
  useEffect(() => {
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
          const convertedLang = language === "tl" ? "tagalog" : "english";
          console.log(
            "🌐 [SiteCard] Backend language:",
            language,
            "→ Converted:",
            convertedLang
          );
          setUserLanguage(convertedLang);
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

  // Remove non-itinerary TTS announcements; keep cleanup only
  useEffect(() => {
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
    };
  }, [pin?._id]);

  // Fetch reviews for this site
  useEffect(() => {
    const fetchReviews = async () => {
      if (!pin?._id) {
        setSiteReviews([]);
        setReviewsLoading(false);
        return;
      }

      try {
        setReviewsLoading(true);
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/reviews/site/${pin._id}`
        );
        // Backend returns { reviews, averageRating, totalReviews }
        const reviews = Array.isArray(response.data.reviews)
          ? response.data.reviews
          : [];
        setSiteReviews(reviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setSiteReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [pin?._id]);

  const performRefresh = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/reviews/site/${pin._id}`
      );
      const reviews = Array.isArray(response.data.reviews)
        ? response.data.reviews
        : [];
      setSiteReviews(reviews);
    } catch (e) {
    } finally {
      // no-op
    }
  };

  const handleToggleDescription = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      return;
    }
    let description = "";
    if (userLanguage === "tagalog" && pin.siteDescriptionTagalog) {
      description = pin.siteDescriptionTagalog;
    } else if (userLanguage === "english" && pin.siteDescription) {
      description = pin.siteDescription;
    } else {
      description =
        pin.description ||
        pin.siteDescription ||
        pin.siteDescriptionTagalog ||
        "No description available";
    }
    if (!description) return;
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
            text: `${pin.title}. ${description}`,
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
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.992 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 260, damping: 32, mass: 0.8 },
      }}
      exit={{
        opacity: 0,
        y: 14,
        scale: 0.996,
        transition: { duration: 0.38, ease: "easeOut" },
      }}
      className="absolute inset-0 z-[10000] bg-gradient-to-b from-gray-50 to-white flex flex-col"
      style={{
        willChange: "transform, opacity",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
        touchAction: "pan-y",
      }}
    >
      {/* Modern Header with Close Button */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-5 py-4 flex items-center justify-between shadow-sm z-50">
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
            ttsService.cancel();
            setIsPlaying(false);
            onClose();
          }}
          className="p-2.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Close site information"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <PullToRefresh
        onRefresh={performRefresh}
        activationAreaPx={80}
        textClassName="text-[#f04e37]"
      >
        {/* Content */}
        <div
          className="px-5 py-6 pb-20 max-w-3xl mx-auto"
          style={{
            touchAction: "pinch-zoom pan-y pan-x",
            overscrollBehavior: "contain",
          }}
        >
          {/* AR Mode fullscreen inside modal */}
          {showAR ? (
            <div className="rounded-xl flex flex-col min-h-[80vh]">
              {scannedArUrl ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 w-full max-w-md">
                    <div className="flex items-center gap-3 mb-2">
                      <Glasses className="w-5 h-5 text-[#f04e37]" />
                      <h3 className="text-base font-bold text-gray-900">
                        AR link ready
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 break-all mb-4">
                      {scannedArUrl}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const url = scannedArUrl;
                          let newWin = null;
                          try {
                            newWin = window.open(
                              url,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          } catch {}
                          if (!newWin) {
                            try {
                              const a = document.createElement("a");
                              a.href = url;
                              a.target = "_blank";
                              a.rel = "noopener noreferrer";
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            } catch {
                              try {
                                window.location.assign(url);
                              } catch {}
                            }
                          }
                          setShowAR(false);
                          setScannedArUrl(null);
                        }}
                        className="flex-1 px-4 py-2.5 rounded-lg text-white font-semibold text-sm shadow transition-colors"
                        style={{
                          background:
                            "linear-gradient(to right, #f04e37, #d9442f)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "linear-gradient(to right, #d9442f, #c23d2a)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "linear-gradient(to right, #f04e37, #d9442f)")
                        }
                      >
                        Open in new tab
                      </button>
                      <button
                        onClick={() => {
                          const url = scannedArUrl;
                          try {
                            window.location.assign(url);
                          } catch {}
                          setShowAR(false);
                          setScannedArUrl(null);
                        }}
                        className="px-4 py-2.5 rounded-lg text-gray-800 font-semibold text-sm bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        Open here
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <QRScanner
                  onScanSuccess={(url) => {
                    let newWin = null;
                    try {
                      newWin = window.open(
                        url,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    } catch {}
                    if (newWin && typeof newWin.focus === "function") {
                      try {
                        newWin.focus();
                      } catch {}
                    }
                    if (!newWin) {
                      try {
                        setScannedArUrl(url);
                      } catch {}
                    } else {
                      setShowAR(false);
                      setScannedArUrl(null);
                    }
                  }}
                  onClose={() => {
                    setShowAR(false);
                    setScannedArUrl(null);
                  }}
                />
              )}
            </div>
          ) : (
            <>
              {/* 3D Model Preview */}
              {pin.glbUrl && pin.glbUrl.endsWith(".glb") && (
                <div
                  className="mb-8 w-full h-64 md:h-80 border border-gray-200 rounded-lg overflow-hidden"
                  style={{
                    backgroundImage: "url(/3DBG.webp)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <ErrorBoundaryLocal>
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
                            <p className="text-sm text-gray-500">
                              Please wait...
                            </p>
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
                      <ModelPreview url={pin.glbUrl} />
                    </Suspense>
                  </ErrorBoundaryLocal>
                </div>
              )}

              {/* Title */}
              <div className="mb-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-3xl font-bold text-gray-900 leading-tight flex-1">
                    {pin.title}
                  </h3>
                </div>

                {/* Badges Container */}
                <div className="flex flex-wrap gap-2">
                  {/* Category Badge */}
                  {pin.category && (
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                      style={{
                        backgroundColor: "#fef2f0",
                        color: "#f04e37",
                      }}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>{pin.category.name || pin.category}</span>
                    </div>
                  )}

                  {/* Entrance Fee Badge */}
                  {pin.feeType && pin.feeType !== "none" && (
                    <button
                      onClick={() => setShowFeeModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                      style={{
                        backgroundColor:
                          pin.feeType === "fort_santiago"
                            ? "#FEF3C7"
                            : "#DBEAFE",
                        color:
                          pin.feeType === "fort_santiago"
                            ? "#92400E"
                            : "#1E40AF",
                      }}
                    >
                      <span className="font-bold">₱</span>
                      <span>
                        {pin.feeType === "fort_santiago"
                          ? "Fort Santiago Fee"
                          : "Entrance Fee"}
                      </span>
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {(pin.openingTime || pin.closingTime) && (
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
                          return `Open ${fmt(pin.openingTime)} • Close ${fmt(
                            pin.closingTime
                          )}`;
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
                          pin.feeType === "fort_santiago"
                            ? "#f04e37"
                            : "#2563EB",
                      }}
                    >
                      <span className="text-white text-2xl font-bold">₱</span>
                      <h3 className="text-lg font-bold text-white">
                        {pin.feeType === "fort_santiago"
                          ? "Fort Santiago Entrance"
                          : "Entrance Fee Required"}
                      </h3>
                    </div>

                    <div className="p-5">
                      {pin.feeType === "fort_santiago" ? (
                        <>
                          <p className="text-gray-700 text-sm mb-3">
                            This site is located within Fort Santiago and
                            requires an entrance fee.
                          </p>
                          {pin.feeAmount ? (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-800">
                                  Fort Santiago Entrance Fee:
                                </p>
                                <span className="text-[#f04e37] font-bold text-lg">
                                  ₱{pin.feeAmount}
                                </span>
                              </div>
                              {pin.feeAmountDiscounted && (
                                <div className="flex items-center justify-between bg-white/50 p-2 rounded-md mb-2">
                                  <p className="text-xs font-medium text-gray-700">
                                    Student/PWD/Senior Citizen:
                                  </p>
                                  <span className="text-green-600 font-bold text-base">
                                    ₱{pin.feeAmountDiscounted}
                                  </span>
                                </div>
                              )}
                              <div className="bg-white/60 p-2 rounded-md mt-2">
                                <p className="text-xs text-gray-700 font-medium">
                                  Payment will be upon entrance at the gate.
                                  This will give you access to all sites within
                                  Fort Santiago.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-3">
                              <p className="text-sm text-gray-700 mb-2">
                                Please check the current entrance fee at the
                                Fort Santiago entrance.
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
                            <span className="font-semibold">{pin.title}</span>.
                          </p>
                          {pin.feeAmount ? (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-800">
                                  Entrance Fee:
                                </p>
                                <span className="text-blue-700 font-bold text-lg">
                                  ₱{pin.feeAmount}
                                </span>
                              </div>
                              {pin.feeAmountDiscounted && (
                                <div className="flex items-center justify-between bg-white/50 p-2 rounded-md mb-2">
                                  <p className="text-xs font-medium text-gray-700">
                                    Student/PWD/Senior Citizen:
                                  </p>
                                  <span className="text-green-600 font-bold text-base">
                                    ₱{pin.feeAmountDiscounted}
                                  </span>
                                </div>
                              )}
                              <p className="text-xs text-gray-600 mt-1">
                                Please have the fee ready when visiting this
                                site.
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
                            pin.feeType === "fort_santiago"
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
              {pin.mediaFiles && pin.mediaFiles.length > 0 && (
                <div className="mb-10">
                  <div className="rounded-xl overflow-hidden shadow-lg">
                    <MediaCarousel mediaFiles={pin.mediaFiles} />
                  </div>
                </div>
              )}

              {/* Fallback to old mediaUrl if mediaFiles not available */}
              {(!pin.mediaFiles || pin.mediaFiles.length === 0) &&
                pin.mediaUrl && (
                  <div className="mb-10">
                    {pin.mediaType === "video" ? (
                      <video
                        src={pin.mediaUrl}
                        className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
                        muted
                        controls
                        crossOrigin="anonymous"
                      >
                        <track kind="captions" />
                      </video>
                    ) : (
                      <img
                        src={pin.mediaUrl}
                        alt={pin.title}
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
                  isPlaying
                    ? "Stop reading description"
                    : "Listen to description"
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
                <div className="prose prose-sm max-w-none">
                  <div className="text-base leading-relaxed text-gray-700 space-y-4">
                    {(() => {
                      let description = "";
                      console.log("📝 [SiteCard] Rendering description:", {
                        userLanguage,
                        hasTagalog: !!pin.siteDescriptionTagalog,
                        hasEnglish: !!pin.siteDescription,
                        tagalogPreview: pin.siteDescriptionTagalog?.substring(
                          0,
                          50
                        ),
                        englishPreview: pin.siteDescription?.substring(0, 50),
                      });
                      if (
                        userLanguage === "tagalog" &&
                        pin.siteDescriptionTagalog
                      ) {
                        description = pin.siteDescriptionTagalog;
                      } else if (
                        userLanguage === "english" &&
                        pin.siteDescription
                      ) {
                        description = pin.siteDescription;
                      } else {
                        description =
                          pin.description ||
                          pin.siteDescription ||
                          pin.siteDescriptionTagalog ||
                          "No description available";
                      }

                      return description
                        .split("\n\n")
                        .map((paragraph, index) => {
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
                      pin.siteDescriptionTagalog
                    ) {
                      description = pin.siteDescriptionTagalog;
                    } else if (
                      userLanguage === "english" &&
                      pin.siteDescription
                    ) {
                      description = pin.siteDescription;
                    } else {
                      description =
                        pin.description ||
                        pin.siteDescription ||
                        pin.siteDescriptionTagalog ||
                        "";
                    }
                    return description.split("\n\n").length > 1;
                  })() && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
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
              {pin.arEnabled && (
                <button
                  onClick={() => {
                    setShowAR(true);
                    ttsService.speak("Opening AR Scanner");
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
                                e.currentTarget.style.backgroundColor =
                                  "#d9442f";
                              } else {
                                e.currentTarget.style.backgroundColor =
                                  "#ebebeb";
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
                                <span>
                                  View All {siteReviews.length} Reviews
                                </span>
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
      </PullToRefresh>
    </motion.div>
  );
};

export default SiteCard;
