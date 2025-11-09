import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, Info, MapPin, DollarSign } from "lucide-react";

function FortSantiagoModal({ isOpen, onClose, feeAmount, feeAmountDiscounted }) {
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
                Please be advised that an entrance fee is required to access Fort Santiago.
              </p>
              {feeAmount && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Regular Price:</span>
                    <span className="text-[#f04e37] font-bold text-lg">₱{feeAmount}</span>
                  </div>
                  {feeAmountDiscounted && (
                    <div className="flex items-center justify-between bg-white/70 p-2 rounded-md">
                      <span className="text-xs text-gray-700">Student/PWD/Senior:</span>
                      <span className="text-green-600 font-bold text-base">₱{feeAmountDiscounted}</span>
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
              <div key={site._id} className="bg-blue-50 p-3 rounded-lg flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-gray-800 text-sm font-semibold">
                    {site.siteName}
                  </p>
                  {site.feeAmount ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-700">Regular:</span>
                        <span className="text-blue-700 font-bold text-sm">₱{site.feeAmount}</span>
                      </div>
                      {site.feeAmountDiscounted && (
                        <div className="flex items-center justify-between bg-white/70 p-1.5 rounded-md">
                          <span className="text-xs text-gray-700">Student/PWD/Senior:</span>
                          <span className="text-green-600 font-bold text-xs">₱{site.feeAmountDiscounted}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">
                      Entrance fee required - Please check on-site for current rates.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mb-5 bg-gray-50 p-3 rounded-lg">
            Please be prepared to pay the entrance fees when visiting these sites.
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

export default function TouristItineraryMain() {
  const [itineraries, setItineraries] = useState({ admin: [], user: [] });
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showFortModal, setShowFortModal] = useState(false);
  const [showCustomFeeModal, setShowCustomFeeModal] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [inactiveSites, setInactiveSites] = useState([]);
  const [feeSites, setFeeSites] = useState([]);
  const [fortFeeAmount, setFortFeeAmount] = useState(null);
  const [fortFeeAmountDiscounted, setFortFeeAmountDiscounted] = useState(null);

  // Carousel states for admin itineraries
  const [adminIndex, setAdminIndex] = useState(0);
  const [adminTouchStart, setAdminTouchStart] = useState(0);
  const [adminTouchEnd, setAdminTouchEnd] = useState(0);
  const adminCarouselRef = useRef(null);

  // Carousel states for user itineraries
  const [userIndex, setUserIndex] = useState(0);
  const [userTouchStart, setUserTouchStart] = useState(0);
  const [userTouchEnd, setUserTouchEnd] = useState(0);
  const userCarouselRef = useRef(null);

  const navigate = useNavigate();

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

  useEffect(() => {
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

        setItineraries({ admin: adminItineraries, user: userItineraries });
      } catch (err) {
        console.error("Failed to fetch itineraries:", err);
      }
    };

    fetchItineraries();
  }, []);

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
    setAdminTouchStart(e.targetTouches[0].clientX);
    setAdminTouchEnd(0);
  };

  const handleAdminTouchMove = (e) => {
    setAdminTouchEnd(e.targetTouches[0].clientX);
  };

  const handleAdminTouchEnd = () => {
    if (!adminTouchStart || !adminTouchEnd) return;
    const distance = adminTouchStart - adminTouchEnd;
    if (distance > 50) goToAdminNext();
    if (distance < -50) goToAdminPrevious();
    setAdminTouchStart(0);
    setAdminTouchEnd(0);
  };

  // Touch handlers for user carousel
  const handleUserTouchStart = (e) => {
    setUserTouchStart(e.targetTouches[0].clientX);
    setUserTouchEnd(0);
  };

  const handleUserTouchMove = (e) => {
    setUserTouchEnd(e.targetTouches[0].clientX);
  };

  const handleUserTouchEnd = () => {
    if (!userTouchStart || !userTouchEnd) return;
    const distance = userTouchStart - userTouchEnd;
    if (distance > 50) goToUserNext();
    if (distance < -50) goToUserPrevious();
    setUserTouchStart(0);
    setUserTouchEnd(0);
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

      {/* Info Modal */}
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
    </div>
  );
}

function ItineraryCard({ itinerary, onCardClick, getFullImageUrl }) {
  const imageSrc = getFullImageUrl(itinerary.imageUrl);

  return (
    <div
      className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 flex flex-col h-[600px]"
      onClick={() => onCardClick(itinerary)}
    >
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
            className="w-20 h-20 text-[#f04e37] relative animate-pulse"
            strokeWidth={1.5}
          />
        </div>
        <p className="text-[#f04e37]/60 text-sm font-medium mt-3">
          Itinerary Image
        </p>
      </div>

      <div className="p-5 flex flex-col flex-1 overflow-hidden">
        <h2 className="text-xl font-semibold text-red-600 mb-2 flex-shrink-0">
          {itinerary.name}
        </h2>
        {itinerary.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-shrink-0">
            {itinerary.description}
          </p>
        )}
        {itinerary.sites?.length > 0 ? (
          <div className="text-gray-700 text-sm flex-1 overflow-hidden flex flex-col">
            <span className="font-semibold flex-shrink-0">Sites:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {itinerary.sites.map((site) => (
                <li key={site._id}>{site.siteName || site.title}</li>
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
