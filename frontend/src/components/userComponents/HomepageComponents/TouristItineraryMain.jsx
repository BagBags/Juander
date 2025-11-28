import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  Map,
  X,
  Tag,
  CheckCircle,
} from "lucide-react";

function FortSantiagoModal({
  isOpen,
  onClose,
  feeAmount,
  feeAmountDiscounted,
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-[#f04e37] p-4 flex items-center gap-3">
          <Info className="text-white w-7 h-7" />
          <h2 className="text-lg font-semibold text-white">
            Fort Santiago Access Notice
          </h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4 text-sm">
            Your selected itinerary includes sites located within Fort Santiago.
          </p>

          <div className="bg-orange-50 p-3 rounded-lg flex items-start gap-2 mb-5">
            <div className="w-2 h-2 bg-[#f04e37] rounded-full mt-1.5 flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-gray-700 text-sm">
                Please be advised that an entrance fee is required to access
                Fort Santiago.
              </p>
              {feeAmount && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      Regular Price:
                    </span>
                    <span className="text-[#f04e37] font-bold text-lg">
                      ₱{feeAmount}
                    </span>
                  </div>
                  {feeAmountDiscounted && (
                    <div className="flex items-center justify-between bg-white/70 p-2 rounded-md">
                      <span className="text-xs text-gray-700">
                        Student/PWD/Senior:
                      </span>
                      <span className="text-green-600 font-bold text-base">
                        ₱{feeAmountDiscounted}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-600 mt-2">
                {feeAmount
                  ? "You will need to purchase tickets at the Fort Santiago entrance."
                  : "Please check the current entrance fee at the Fort Santiago entrance."}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#f04e37] hover:bg-[#c53d27] text-white font-medium rounded-lg transition-colors text-sm"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomFeeModal({ isOpen, onClose, sites }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-blue-600 p-4 flex items-center gap-3">
          <DollarSign className="text-white w-7 h-7" />
          <h2 className="text-lg font-semibold text-white">
            Entrance Fee Notice
          </h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4 text-sm">
            Your selected itinerary includes sites that require an entrance fee:
          </p>

          <div className="space-y-2 mb-5">
            {sites.map((site) => (
              <div
                key={site._id}
                className="bg-blue-50 p-3 rounded-lg flex items-start gap-2"
              >
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-gray-800 text-sm font-semibold">
                    {site.siteName}
                  </p>
                  {site.feeAmount ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-700">Regular:</span>
                        <span className="text-blue-700 font-bold text-sm">
                          ₱{site.feeAmount}
                        </span>
                      </div>
                      {site.feeAmountDiscounted && (
                        <div className="flex items-center justify-between bg-white/70 p-1.5 rounded-md">
                          <span className="text-xs text-gray-700">
                            Student/PWD/Senior:
                          </span>
                          <span className="text-green-600 font-bold text-xs">
                            ₱{site.feeAmountDiscounted}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">
                      Entrance fee required - Please check on-site for current
                      rates.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mb-5 bg-gray-50 p-3 rounded-lg">
            Please be prepared to pay the entrance fees when visiting these
            sites.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TouristItineraryMain({ initialItineraries }) {
  const [itineraries, setItineraries] = useState(
    initialItineraries || { admin: [], user: [] }
  );
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showFortModal] = useState(false);
  const [showCustomFeeModal] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItinerary, setDetailsItinerary] = useState(null);
  const [showSiteDetailsModal, setShowSiteDetailsModal] = useState(false);
  const [detailsSelectedSite, setDetailsSelectedSite] = useState(null);
  const siteDetailsModalRef = useRef(null);
  const lastActiveSiteElementRef = useRef(null);
  const [inactiveSites, setInactiveSites] = useState([]);
  const [feeSites] = useState([]);
  const [fortFeeAmount] = useState(null);
  const [fortFeeAmountDiscounted] = useState(null);

  // Carousel states for admin itineraries
  const [adminIndex, setAdminIndex] = useState(0);
  const [adminTouchStart, setAdminTouchStart] = useState({ x: 0, y: 0 });
  const [adminTouchEnd, setAdminTouchEnd] = useState({ x: 0, y: 0 });
  const adminCarouselRef = useRef(null);

  // Carousel states for user itineraries
  const [userIndex, setUserIndex] = useState(0);
  const [userTouchStart, setUserTouchStart] = useState({ x: 0, y: 0 });
  const [userTouchEnd, setUserTouchEnd] = useState({ x: 0, y: 0 });
  const userCarouselRef = useRef(null);

  const navigate = useNavigate();

  const resolveUrl = (url) => {
    if (!url || url.trim() === "") return null;
    if (url.startsWith("http")) return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${
      import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
      "http://localhost:5000"
    }${path}`;
  };

  const getFullImageUrl = (url) => {
    if (!url || url.trim() === "") return null;
    // Handle both absolute URLs and relative paths
    if (url.startsWith("http")) return url;
    // Ensure path starts with /
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${
      import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
      "http://localhost:5000"
    }${path}`;
  };

  const formatMinutesToClock = (min) => {
    if (min === undefined || min === null) return "";
    const h = Math.floor(min / 60);
    const m = min % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = h % 12 || 12;
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm} ${ampm}`;
  };
  const roundToStep = (min, step = 5) => Math.round(min / step) * step;

  useEffect(() => {
    // If preloaded itineraries were provided, use them and skip fetching
    if (
      initialItineraries &&
      (initialItineraries.admin?.length || initialItineraries.user?.length)
    ) {
      setItineraries(initialItineraries);
      return;
    }

    const fetchItineraries = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/itineraries`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const adminItineraries = res.data.filter((i) => i.isAdminCreated);
        const userItineraries = res.data.filter((i) => !i.isAdminCreated);

        const computeStatuses = async (list) => {
          const token = localStorage.getItem("token");
          const headers = { Authorization: `Bearer ${token}` };
          const baseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

          const results = await Promise.all(
            list.map(async (it) => {
              try {
                const progressRes = await axios.get(
                  `${baseUrl}/itinerary-progress/${it._id}`,
                  { headers }
                );
                const visitedCount = (progressRes.data?.visitedSites || [])
                  .length;
                const activeSitesCount = (it.sites || []).filter(
                  (s) => s.status === "active"
                ).length;
                const isCompleted =
                  activeSitesCount > 0 && visitedCount >= activeSitesCount;
                return { ...it, isCompleted };
              } catch {
                return { ...it, isCompleted: false };
              }
            })
          );
          return results;
        };

        const adminWithStatus = await computeStatuses(adminItineraries);
        const userWithStatus = await computeStatuses(userItineraries);

        setItineraries({ admin: adminWithStatus, user: userWithStatus });
      } catch (err) {
        console.error("Failed to fetch itineraries:", err);
      }
    };

    fetchItineraries();
  }, [initialItineraries]);

  useEffect(() => {
    if (showSiteDetailsModal) {
      lastActiveSiteElementRef.current = document.activeElement;
      const el = siteDetailsModalRef.current;
      if (!el) return;
      const onKeyDown = (e) => {
        if (e.key === "Escape") {
          setShowSiteDetailsModal(false);
          setDetailsSelectedSite(null);
        }
        if (e.key === "Tab") {
          const focusable = el.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener("keydown", onKeyDown);
      el.focus();
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        const prev = lastActiveSiteElementRef.current;
        if (prev && prev.focus) prev.focus();
      };
    }
  }, [showSiteDetailsModal]);

  // Admin carousel navigation
  const goToAdminNext = () => {
    setAdminIndex((prev) =>
      prev === itineraries.admin.length - 1 ? 0 : prev + 1
    );
  };

  const goToAdminPrevious = () => {
    setAdminIndex((prev) =>
      prev === 0 ? itineraries.admin.length - 1 : prev - 1
    );
  };

  const goToAdminSlide = (index) => {
    setAdminIndex(index);
  };

  // User carousel navigation
  const goToUserNext = () => {
    setUserIndex((prev) =>
      prev === itineraries.user.length - 1 ? 0 : prev + 1
    );
  };

  const goToUserPrevious = () => {
    setUserIndex((prev) =>
      prev === 0 ? itineraries.user.length - 1 : prev - 1
    );
  };

  const goToUserSlide = (index) => {
    setUserIndex(index);
  };

  // Touch handlers for admin carousel
  const handleAdminTouchStart = (e) => {
    setAdminTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
    setAdminTouchEnd({ x: 0, y: 0 });
  };

  const handleAdminTouchMove = (e) => {
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;

    setAdminTouchEnd({
      x: currentX,
      y: currentY,
    });

    // If horizontal movement is dominant, prevent vertical scroll
    if (adminTouchStart.x && adminTouchStart.y) {
      const diffX = Math.abs(currentX - adminTouchStart.x);
      const diffY = Math.abs(currentY - adminTouchStart.y);

      if (diffX > diffY && diffX > 10) {
        e.preventDefault();
      }
    }
  };

  const handleAdminTouchEnd = () => {
    if (!adminTouchStart.x || !adminTouchEnd.x) return;

    const distanceX = adminTouchStart.x - adminTouchEnd.x;
    const distanceY = adminTouchStart.y - adminTouchEnd.y;

    // Only trigger carousel navigation if it's primarily a horizontal swipe
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > 50) goToAdminNext();
      if (distanceX < -50) goToAdminPrevious();
    }

    setAdminTouchStart({ x: 0, y: 0 });
    setAdminTouchEnd({ x: 0, y: 0 });
  };

  // Touch handlers for user carousel
  const handleUserTouchStart = (e) => {
    setUserTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
    setUserTouchEnd({ x: 0, y: 0 });
  };

  const handleUserTouchMove = (e) => {
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;

    setUserTouchEnd({
      x: currentX,
      y: currentY,
    });

    // If horizontal movement is dominant, prevent vertical scroll
    if (userTouchStart.x && userTouchStart.y) {
      const diffX = Math.abs(currentX - userTouchStart.x);
      const diffY = Math.abs(currentY - userTouchStart.y);

      if (diffX > diffY && diffX > 10) {
        e.preventDefault();
      }
    }
  };

  const handleUserTouchEnd = () => {
    if (!userTouchStart.x || !userTouchEnd.x) return;

    const distanceX = userTouchStart.x - userTouchEnd.x;
    const distanceY = userTouchStart.y - userTouchEnd.y;

    // Only trigger carousel navigation if it's primarily a horizontal swipe
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > 50) goToUserNext();
      if (distanceX < -50) goToUserPrevious();
    }

    setUserTouchStart({ x: 0, y: 0 });
    setUserTouchEnd({ x: 0, y: 0 });
  };

  const handleItineraryClick = (itinerary) => {
    // Store the itinerary first since we might need it for multiple checks
    setSelectedItinerary(itinerary);

    // Check for inactive sites in the itinerary
    const inactive =
      itinerary.sites?.filter((site) => site.status === "inactive") || [];

    if (inactive.length > 0) {
      setInactiveSites(inactive);
      setShowWarningModal(true);
    } else {
      // No inactive sites, proceed directly
      navigate(`/TouristItineraryMap/${itinerary._id}`, {
        state: { itinerary },
      });
    }
  };

  const proceedToTour = () => {
    setShowWarningModal(false);

    // Proceed with navigation
    if (selectedItinerary) {
      navigate(`/TouristItineraryMap/${selectedItinerary._id}`, {
        state: { itinerary: selectedItinerary },
      });
    }
  };

  const openDetails = (itinerary) => {
    setDetailsItinerary(itinerary);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setShowDetailsModal(false);
    setDetailsItinerary(null);
  };

  return (
    <div className="flex flex-col items-center justify-start">
      {/* Modals */}
      <FortSantiagoModal
        isOpen={showFortModal}
        onClose={proceedToTour}
        feeAmount={fortFeeAmount}
        feeAmountDiscounted={fortFeeAmountDiscounted}
      />
      <CustomFeeModal
        isOpen={showCustomFeeModal}
        onClose={proceedToTour}
        sites={feeSites}
      />

      {/* Suggested Itineraries - Horizontal Carousel */}
      <div className="w-full mx-auto flex flex-col gap-4 py-6 px-4 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Suggested Itineraries
        </h2>
        {itineraries.admin.length ? (
          <div className="relative max-w-4xl mx-auto w-full">
            <div
              ref={adminCarouselRef}
              className="relative overflow-hidden rounded-3xl"
              onTouchStart={handleAdminTouchStart}
              onTouchMove={handleAdminTouchMove}
              onTouchEnd={handleAdminTouchEnd}
              style={{ touchAction: "pan-y pinch-zoom" }}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${adminIndex * 100}%)` }}
              >
                {itineraries.admin.map((itinerary) => (
                  <div key={itinerary._id} className="min-w-full px-4 md:px-8">
                    <ItineraryCard
                      itinerary={itinerary}
                      onCardClick={handleItineraryClick}
                      getFullImageUrl={getFullImageUrl}
                      onOpenDetails={openDetails}
                    />
                  </div>
                ))}
              </div>
            </div>

            {itineraries.admin.length > 1 && (
              <>
                <button
                  onClick={goToAdminPrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-10 hidden md:flex items-center justify-center"
                  aria-label="Previous itinerary"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToAdminNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-10 hidden md:flex items-center justify-center"
                  aria-label="Next itinerary"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="flex justify-center gap-2 mt-6">
                  {itineraries.admin.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToAdminSlide(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === adminIndex
                          ? "bg-white w-8"
                          : "bg-white/50 w-2 hover:bg-white/70"
                      }`}
                      aria-label={`Go to itinerary ${index + 1}`}
                    />
                  ))}
                </div>
                <div className="text-center mt-4">
                  <span className="text-white/80 text-sm">
                    {adminIndex + 1} / {itineraries.admin.length}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-white opacity-80 text-center">
            No admin itineraries available
          </p>
        )}
      </div>

      {/* My Itineraries - Horizontal Carousel */}
      <div className="w-full mx-auto flex flex-col gap-4 py-6 px-4 mb-12">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          My Itineraries
        </h2>
        {itineraries.user.length ? (
          <div className="relative max-w-4xl mx-auto w-full">
            <div
              ref={userCarouselRef}
              className="relative overflow-hidden rounded-3xl"
              onTouchStart={handleUserTouchStart}
              onTouchMove={handleUserTouchMove}
              onTouchEnd={handleUserTouchEnd}
              style={{ touchAction: "pan-y pinch-zoom" }}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${userIndex * 100}%)` }}
              >
                {itineraries.user.map((itinerary) => (
                  <div key={itinerary._id} className="min-w-full px-4 md:px-8">
                    <ItineraryCard
                      itinerary={itinerary}
                      onCardClick={handleItineraryClick}
                      getFullImageUrl={getFullImageUrl}
                      onOpenDetails={openDetails}
                    />
                  </div>
                ))}
              </div>
            </div>

            {itineraries.user.length > 1 && (
              <>
                <button
                  onClick={goToUserPrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-10 hidden md:flex items-center justify-center"
                  aria-label="Previous itinerary"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToUserNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-10 hidden md:flex items-center justify-center"
                  aria-label="Next itinerary"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="flex justify-center gap-2 mt-6">
                  {itineraries.user.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToUserSlide(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === userIndex
                          ? "bg-white w-8"
                          : "bg-white/50 w-2 hover:bg-white/70"
                      }`}
                      aria-label={`Go to itinerary ${index + 1}`}
                    />
                  ))}
                </div>
                <div className="text-center mt-4">
                  <span className="text-white/80 text-sm">
                    {userIndex + 1} / {itineraries.user.length}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-white opacity-80 text-center">
            You have not created any itineraries
          </p>
        )}
      </div>

      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-[#f04e37] p-4 flex items-center gap-3">
              <Info className="text-white w-7 h-7" />
              <h2 className="text-lg font-semibold text-white">
                Site Availability Notice
              </h2>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4 text-sm">
                Please note that the following site(s) are currently
                unavailable:
              </p>

              <ul className="space-y-2 mb-5">
                {inactiveSites.map((site) => {
                  // Format the reason for display
                  const formatReason = (reason) => {
                    if (!reason) return "Temporarily unavailable";
                    const reasonMap = {
                      under_construction: "Under Construction",
                      temporarily_closed: "Temporarily Closed",
                      maintenance: "Under Maintenance",
                      no_longer_exists: "No Longer Exists",
                      restricted_access: "Restricted Access",
                      safety_concerns: "Safety Concerns",
                      other: site.inactiveReasonDetails || "Other",
                    };
                    return reasonMap[reason] || "Temporarily unavailable";
                  };

                  return (
                    <li
                      key={site._id}
                      className="flex items-start gap-2 bg-orange-50 p-3 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-[#f04e37] rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {site.siteName}
                        </p>
                        <p className="text-xs text-[#f04e37] font-medium mt-0.5">
                          {formatReason(site.inactiveReason)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Will be skipped during the tour
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="text-xs text-gray-500 mb-5 bg-gray-50 p-3 rounded-lg">
                You can continue with your tour. The unavailable sites will be
                automatically excluded from your route.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                >
                  Go Back
                </button>
                <button
                  onClick={proceedToTour}
                  className="flex-1 px-4 py-2.5 bg-[#f04e37] hover:bg-[#d9442f] text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Continue Tour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && detailsItinerary && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDetails}
          />
          <div className="relative bg-white w-full sm:max-w-3xl md:max-w-4xl mx-0 sm:mx-4 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn max-h-[90vh] sm:max-h-[85vh]">
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-[#f04e37]" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {detailsItinerary.name}
                  </h3>
                  <p className="text-xs text-gray-500">Itinerary overview</p>
                </div>
              </div>
              <button
                onClick={closeDetails}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {resolveUrl(detailsItinerary.imageUrl) && (
              <div className="h-36 sm:h-56 md:h-64 w-full overflow-hidden">
                <img
                  src={resolveUrl(detailsItinerary.imageUrl)}
                  alt={detailsItinerary.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {detailsItinerary.duration
                      ? `${detailsItinerary.duration} ${
                          detailsItinerary.duration === 1 ? "hour" : "hours"
                        }`
                      : "Flexible"}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {(detailsItinerary.sites || []).length} site(s)
                  </span>
                </div>
              </div>

              {detailsItinerary.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">
                    Description
                  </h4>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {detailsItinerary.description}
                  </p>
                  {typeof detailsItinerary.recommendedStartMinutes ===
                    "number" && (
                    <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-200">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        Recommended Start:{" "}
                        {formatMinutesToClock(
                          detailsItinerary.recommendedStartMinutes
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {(() => {
                const start =
                  typeof detailsItinerary.recommendedStartMinutes === "number"
                    ? detailsItinerary.recommendedStartMinutes
                    : 8 * 60;
                let cursor = roundToStep(start, 5);
                const items = (detailsItinerary.sites || []).map((site) => {
                  const v =
                    typeof site?.averageTimeSpent === "number"
                      ? site.averageTimeSpent
                      : Number(site?.averageTimeSpent);
                  const item = { time: roundToStep(cursor, 5), site };
                  cursor = roundToStep(
                    cursor + (isNaN(v) || v <= 0 ? 0 : v),
                    5
                  );
                  return item;
                });
                if (!items.length) return null;
                return (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">
                      Suggested Schedule
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      {items.map(({ time, site }, i) => (
                        <div
                          key={site._id || i}
                          className="flex items-start gap-4 sm:gap-5 py-1.5"
                        >
                          <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="text-sm sm:text-base font-semibold text-gray-900">
                              {formatMinutesToClock(time)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">
                              {site.siteName || site.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Sites */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">
                  Included Sites
                </h4>
                <div className="space-y-3 pr-2">
                  {(detailsItinerary.sites || []).map((site) => {
                    const thumb =
                      site.mediaFiles?.find((m) => m.type === "image")?.url ||
                      site.mediaUrl;
                    const img = resolveUrl(thumb);
                    return (
                      <button
                        key={site._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsSelectedSite(site);
                          setShowSiteDetailsModal(true);
                        }}
                        className="flex text-left gap-3 p-3 border border-gray-200 rounded-xl bg-white hover:border-[#f04e37] hover:bg-orange-50/30"
                      >
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {img ? (
                            <img
                              src={img}
                              alt={site.siteName || site.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <MapPin className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start">
                            <p className="text-base font-semibold text-gray-900 truncate">
                              {site.siteName || site.title}
                            </p>
                          </div>
                          {site.category && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                                <Tag className="w-3 h-3" />
                                {site.category.name || site.category}
                              </span>
                            </div>
                          )}
                          {site.siteDescription && (
                            <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                              {site.siteDescription}
                            </p>
                          )}
                          {site.feeType && site.feeType !== "none" && (
                            <p className="text-xs text-[#f04e37] font-medium mt-1">
                              Entrance fee may apply
                            </p>
                          )}
                          {site.status === "inactive" && (
                            <p className="text-xs text-orange-600 font-medium mt-1">
                              Currently unavailable
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSiteDetailsModal && detailsSelectedSite && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowSiteDetailsModal(false);
              setDetailsSelectedSite(null);
            }}
          />
          <div
            ref={siteDetailsModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tourist-site-details-title"
            aria-describedby="tourist-site-details-content"
            tabIndex={-1}
            className="relative bg-white w-full sm:max-w-2xl mx-0 sm:mx-4 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn max-h-[90vh] sm:max-h-[85vh]"
          >
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#f04e37]" />
                <h3
                  id="tourist-site-details-title"
                  className="text-lg font-bold text-gray-900"
                >
                  {detailsSelectedSite.siteName || detailsSelectedSite.title}
                </h3>
              </div>
              <button
                className="p-2 rounded-lg hover:bg-gray-100"
                onClick={() => {
                  setShowSiteDetailsModal(false);
                  setDetailsSelectedSite(null);
                }}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {(() => {
              const thumb =
                detailsSelectedSite.mediaFiles?.find((m) => m.type === "image")
                  ?.url || detailsSelectedSite.mediaUrl;
              const img = resolveUrl(thumb);
              return img ? (
                <div className="h-36 sm:h-48 w-full overflow-hidden">
                  <img
                    src={img}
                    alt={
                      detailsSelectedSite.siteName || detailsSelectedSite.title
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null;
            })()}

            <div
              id="tourist-site-details-content"
              className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center gap-2 mb-3">
                {detailsSelectedSite.category && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                    <Tag className="w-3 h-3" />
                    {detailsSelectedSite.category?.name ||
                      detailsSelectedSite.category}
                  </span>
                )}
                {detailsSelectedSite.feeType &&
                  detailsSelectedSite.feeType !== "none" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-700">
                      <DollarSign className="w-3 h-3" />
                      Entrance fee may apply
                    </span>
                  )}
              </div>

              {(() => {
                const first =
                  (detailsSelectedSite.siteDescription || "")
                    .split(/\r?\n+/)
                    .find((p) => p.trim()) || "";
                return first ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">
                      Description
                    </h4>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      {first}
                    </p>
                  </div>
                ) : null;
              })()}

              {(() => {
                const raw = detailsSelectedSite.feeAmount;
                const hasFee =
                  raw !== null &&
                  raw !== undefined &&
                  String(raw).trim() !== "" &&
                  String(raw) !== "0";
                if (!hasFee) return null;
                const rawDisc = detailsSelectedSite.feeAmountDiscounted;
                const hasDisc =
                  rawDisc !== null &&
                  rawDisc !== undefined &&
                  String(rawDisc).trim() !== "" &&
                  String(rawDisc) !== "0";
                return (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">
                        Entrance Fee
                      </span>
                      <span className="text-[#f04e37] font-bold">₱{raw}</span>
                    </div>
                    {hasDisc && (
                      <div className="flex items-center justify-between bg-white/50 p-2 rounded-md">
                        <span className="text-xs text-gray-700">
                          Student/PWD/Senior
                        </span>
                        <span className="text-green-600 font-bold">
                          ₱{rawDisc}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItineraryCard({
  itinerary,
  onCardClick,
  getFullImageUrl,
  onOpenDetails,
}) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    React.useState(false);

  const imageSrc = getFullImageUrl(itinerary.imageUrl);

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-300 flex flex-col h-[600px]">
      <div className="cursor-pointer" onClick={() => onCardClick(itinerary)}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={itinerary.name}
            className="w-full h-48 object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}

        {/* Placeholder for missing images */}
        <div
          className="w-full h-48 bg-gradient-to-br from-orange-50 to-red-50 flex flex-col items-center justify-center flex-shrink-0 border-b-2 border-[#f04e37]/10"
          style={{ display: imageSrc ? "none" : "flex" }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#f04e37]/10 rounded-full blur-xl"></div>
            <MapPin
              className="w-20 h-20 text-[#f04e37] relative"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-xl font-semibold text-gray-800">
            {itinerary.name}
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails && onOpenDetails(itinerary);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
            aria-label="View itinerary details"
            title="View full details"
          >
            <Info className="w-4 h-4" />
            Info
          </button>
        </div>
        {itinerary.isCompleted && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              Completed
            </span>
          </div>
        )}

        {itinerary.description && (
          <div className="flex-shrink-0 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-semibold text-gray-500">Description</p>
            </div>
            <p
              className={`text-gray-700 text-sm ${
                isDescriptionExpanded ? "" : "line-clamp-2"
              }`}
            >
              {itinerary.description}
            </p>
            {itinerary.description.length > 100 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDescriptionExpanded(!isDescriptionExpanded);
                }}
                className="text-[#f04e37] text-xs font-semibold mt-1 hover:underline focus:outline-none"
              >
                {isDescriptionExpanded ? "Read Less" : "Read More"}
              </button>
            )}
          </div>
        )}

        {itinerary.duration > 0 && (
          <div className="flex-shrink-0 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-semibold text-gray-500">Duration</p>
            </div>
            <p className="text-gray-700 text-sm font-medium">
              {itinerary.duration} {itinerary.duration === 1 ? "hour" : "hours"}
            </p>
          </div>
        )}

        {itinerary.sites?.length > 0 ? (
          <div className="text-gray-700 text-sm flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-1.5 mb-1 flex-shrink-0">
              <Map className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-semibold text-gray-500">Itinerary</p>
            </div>
            <ul className="list-disc list-inside space-y-0.5 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {itinerary.sites.map((site) => (
                <li key={site._id} className="text-sm text-gray-700">
                  {site.siteName || site.title}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No sites available</p>
        )}
      </div>
    </div>
  );
}
