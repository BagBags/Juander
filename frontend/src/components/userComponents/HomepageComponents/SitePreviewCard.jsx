import React, { useEffect } from "react";
import { X, MapPin, ChevronUp, Navigation, CheckCircle, Star } from "lucide-react";
import { announceSiteInfo, announceArrival } from "../../../utils/textToSpeech";

export default function SitePreviewCard({
  selectedPin,
  distance,
  isNearby,
  onExpand,
  onClose,
  onMarkAsDone,
  isVisited,
}) {
  // Announce when site info appears or proximity changes
  useEffect(() => {
    if (selectedPin && distance !== null) {
      const siteName = selectedPin.title || selectedPin.siteName;
      const distanceKm = (distance / 1000).toFixed(2);
      
      if (isNearby) {
        announceArrival(siteName);
      } else {
        announceSiteInfo(siteName, distanceKm, isNearby);
      }
    }
  }, [selectedPin?._id, isNearby]);

  return (
    <div 
      className="absolute left-4 right-4 z-40 animate-slide-down"
      style={{
        top: "calc(env(safe-area-inset-top) + 16px)",
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden">
        {/* Header with status indicator */}
        <div
          className={`px-4 py-2 flex items-center justify-between ${
            isNearby
              ? "bg-green-50 border-b-2 border-green-200"
              : "bg-blue-50 border-b-2 border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <MapPin
              className={`w-5 h-5 ${
                isNearby
                  ? "text-green-600 animate-pulse"
                  : "text-blue-600"
              }`}
            />
            <span
              className={`text-sm font-semibold ${
                isNearby ? "text-green-700" : "text-blue-700"
              }`}
            >
              {isNearby ? "📍 You are nearby!" : "🧭 Heading to"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Clickable to expand */}
        <div
          onClick={onExpand}
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100"
        >
          <div className="flex gap-3">
            {/* Thumbnail */}
            {selectedPin.mediaUrl && (
              <div className="flex-shrink-0">
                {selectedPin.mediaType === "video" ? (
                  <video
                    src={selectedPin.mediaUrl}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    muted
                  />
                ) : (
                  <img
                    src={selectedPin.mediaUrl}
                    alt={selectedPin.title || selectedPin.siteName}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-800 truncate mb-1">
                {selectedPin.title || selectedPin.siteName}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {selectedPin.description}
              </p>

              {/* Distance badge */}
              {distance !== null && (
                <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                  <Navigation className="w-3 h-3" />
                  <span>{(distance / 1000).toFixed(2)} km away</span>
                </div>
              )}

              {/* Done marker badge */}
              {isVisited && (
                <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold ml-2">
                  <CheckCircle className="w-3 h-3" />
                  <span>Done</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* Mark as Done Button */}
            {onMarkAsDone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsDone(selectedPin._id);
                }}
                className={`py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  isVisited
                    ? "bg-green-500 text-white"
                    : "bg-[#f04e37] text-white hover:bg-[#e03d2d] active:scale-95"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isVisited ? "Done" : "Mark Done"}
              </button>
            )}
            
            {/* Write Review Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all"
            >
              <Star className="w-3.5 h-3.5" />
              Write Review
            </button>
          </div>

          {/* Tap to expand hint */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Tap to view full details</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
