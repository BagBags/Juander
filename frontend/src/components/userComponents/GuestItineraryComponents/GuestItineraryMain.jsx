// GuestItineraryMain.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Clock, FileText, Map } from "lucide-react";
import { guestApi } from "../../../utils/offlineAwareApi";

export default function GuestItineraryMain() {
  const [adminItineraries, setAdminItineraries] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const carouselRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const result = await guestApi.getAdminItineraries();
        setAdminItineraries(result.data || []);
        setIsOffline(result.offline);
        setFromCache(result.fromCache);
      } catch (err) {
        // Try to load from cache even on error
        const cached = localStorage.getItem('guest_admin_itineraries');
        if (cached) {
          const { data } = JSON.parse(cached);
          setAdminItineraries(data || []);
          setFromCache(true);
          setIsOffline(true);
        }
      }
    };

    fetchItineraries();
  }, []);

  // Carousel navigation functions
  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === adminItineraries.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? adminItineraries.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
    setTouchEnd({ x: 0, y: 0 });
  };

  const handleTouchMove = (e) => {
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    
    setTouchEnd({
      x: currentX,
      y: currentY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart.x || !touchEnd.x) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    
    // Calculate if the swipe is more horizontal than vertical
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    
    // Only trigger carousel navigation if it's primarily a horizontal swipe
    if (isHorizontalSwipe) {
      const isLeftSwipe = distanceX > 50;
      const isRightSwipe = distanceX < -50;

      if (isLeftSwipe) {
        goToNext();
      }
      if (isRightSwipe) {
        goToPrevious();
      }
    }

    setTouchStart({ x: 0, y: 0 });
    setTouchEnd({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col items-center justify-start">
      {/* Suggested itineraries - Horizontal Carousel */}
      <div className="w-full mx-auto flex flex-col gap-4 py-6 px-4 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Suggested Itineraries
        </h2>
        {adminItineraries.length ? (
          <div className="relative max-w-4xl mx-auto w-full">
            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="relative overflow-hidden rounded-3xl"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'pan-x' }}
            >
              {/* Slides */}
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {adminItineraries.map((itinerary) => (
                  <div
                    key={itinerary._id}
                    className="min-w-full px-4 md:px-8"
                  >
                    <ItineraryCard
                      itinerary={itinerary}
                      navigate={navigate}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows - Desktop */}
            {adminItineraries.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-10 hidden md:flex items-center justify-center"
                  aria-label="Previous itinerary"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-10 hidden md:flex items-center justify-center"
                  aria-label="Next itinerary"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {adminItineraries.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {adminItineraries.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "bg-white w-8"
                        : "bg-white/50 w-2 hover:bg-white/70"
                    }`}
                    aria-label={`Go to itinerary ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Slide Counter */}
            {adminItineraries.length > 1 && (
              <div className="text-center mt-4">
                <span className="text-white/80 text-sm">
                  {currentIndex + 1} / {adminItineraries.length}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-white opacity-80 text-center">
            No suggested itineraries available
          </p>
        )}
      </div>
    </div>
  );
}

function ItineraryCard({ itinerary, navigate }) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  
  // Resolve image URL (prepend localhost if needed)
  const getImageUrl = (url) => {
    if (!url || url.trim() === "") return null;
    if (url.startsWith("http")) return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000"}${path}`;
  };
  
  const imageSrc = getImageUrl(itinerary.imageUrl);

  // Determine completion for Guest mode based on localStorage progress
  const isCompleted = (() => {
    try {
      const visitedKey = `guest_visited_${itinerary._id}`;
      const stored = localStorage.getItem(visitedKey);
      if (!stored) return false;
      const visitedIds = JSON.parse(stored) || [];
      const activeSiteIds = (itinerary.sites || [])
        .filter((s) => s?.status !== "inactive")
        .map((s) => s?._id)
        .filter(Boolean);
      if (activeSiteIds.length === 0) return false;
      // Completed when all active sites are included in visitedIds
      return activeSiteIds.every((id) => visitedIds.includes(id));
    } catch (_) {
      return false;
    }
  })();

  return (
    <div
      className="bg-white rounded-3xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-300 flex flex-col h-[600px]"
    >
      <div
        className="cursor-pointer"
        onClick={() =>
          navigate(`/GuestItineraryMap/${itinerary._id}`, {
            state: { itinerary },
          })
        }
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={itinerary.name}
            className="w-full h-48 object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Placeholder for missing images */}
        <div 
          className="w-full h-48 bg-gradient-to-br from-orange-50 to-red-50 flex flex-col items-center justify-center flex-shrink-0 border-b-2 border-[#f04e37]/10"
          style={{ display: imageSrc ? 'none' : 'flex' }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#f04e37]/10 rounded-full blur-xl"></div>
            <MapPin className="w-20 h-20 text-[#f04e37] relative" strokeWidth={1.5} />
          </div>
          <p className="text-[#f04e37]/60 text-sm font-medium mt-3">Itinerary Image</p>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 flex-shrink-0 flex items-center gap-2">
          {itinerary.name}
          {isCompleted && (
            // Filled check-circle icon
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-green-600 drop-shadow-sm"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M12,2A10,10 0,1,0 22,12A10,10 0,0,0 12,2M10,17L5,12L6.41,10.59L10,14.17L17.59,6.58L19,8L10,17Z"
              />
            </svg>
          )}
        </h2>
        
        {itinerary.description && (
          <div className="flex-shrink-0 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-semibold text-gray-500">Description</p>
            </div>
            <p className={`text-gray-700 text-sm ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
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
                {isDescriptionExpanded ? 'Read Less' : 'Read More'}
              </button>
            )}
          </div>
        )}
        
        {itinerary.duration && (
          <div className="flex-shrink-0 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-semibold text-gray-500">Duration</p>
            </div>
            <p className="text-gray-700 text-sm font-medium">
              {itinerary.duration} {itinerary.duration === 1 ? 'hour' : 'hours'}
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
                <li key={site._id} className="text-sm text-gray-700">{site.siteName || site.title}</li>
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
