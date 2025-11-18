import React, { useEffect } from "react";
import { X, MapPin, Navigation, CheckCircle, Clock } from "lucide-react";
import { announceSiteInfo, announceArrival } from "../../../utils/textToSpeech";
import { useLocation } from "react-router-dom";

export default function SitePreviewCard({
  selectedPin,
  distance,
  isNearby,
  onExpand,
  onClose,
  onMarkAsDone,
  isVisited,
}) {
  const location = useLocation();
  const isItineraryMap = location.pathname.startsWith("/TouristItineraryMap/") || location.pathname.startsWith("/GuestItineraryMap/");
  // Get first media file from mediaFiles array
  const firstMedia = selectedPin?.mediaFiles?.[0];
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL 
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
    : "http://localhost:5000";
  
  const thumbnailUrl = firstMedia?.url?.startsWith('http') 
    ? firstMedia.url 
    : firstMedia?.url 
      ? `${BACKEND_URL}${firstMedia.url}` 
      : null;

  // No automatic TTS here; voice guidance only on itinerary maps via DirectionsPanel
  useEffect(() => {
    // Intentionally left blank to avoid speaking outside itinerary maps
  }, [selectedPin?._id, isNearby]);

  return (
    <div
      className="absolute left-3 right-3 md:left-6 md:right-6 w-auto max-w-[720px] mx-auto z-40 animate-slide-down"
      style={{ top: "calc(max(env(safe-area-inset-top), 16px) + 64px)", maxWidth: "min(720px, 96vw)" }}
    >
      <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: "clamp(200px, 34svh, 320px)" }}>
        <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            {isNearby ? (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                Nearby
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">
                <Navigation className="w-3.5 h-3.5" />
                Heading to
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          onClick={onExpand}
          className="p-3 cursor-pointer hover:bg-gray-50/50 transition-colors active:bg-gray-100/50 flex-1 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-3 items-start">
            {thumbnailUrl && (
              <div className="flex-shrink-0">
                {firstMedia?.type === "video" ? (
                  <video
                    src={thumbnailUrl}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    muted
                    crossOrigin="anonymous"
                  />
                ) : (
                  <img
                    src={thumbnailUrl}
                    alt={selectedPin.title || selectedPin.siteName}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  {selectedPin.title || selectedPin.siteName}
                </h3>
                {isVisited && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-semibold shrink-0">
                    <CheckCircle className="w-3 h-3" /> Done
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-600 line-clamp-2 mt-1">
                {selectedPin.description || selectedPin.siteDescription}
              </p>
              {distance !== null && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-700">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-medium">{(distance / 1000).toFixed(2)} km away</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-200 text-center">
            <p className="text-[11px] text-gray-500 font-medium">Tap to view full details</p>
          </div>
        </div>
      </div>
    </div>
  );
}
