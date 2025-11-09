import React, { useEffect } from "react";
import { X, MapPin, Navigation, CheckCircle, Clock } from "lucide-react";
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
      className="absolute left-3 right-3 md:left-6 md:right-6 w-auto max-w-[720px] mx-auto z-40 animate-slide-down"
      style={{
        top: "calc(env(safe-area-inset-top) + 72px)",
      }}
    >
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header with status indicator */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            {isNearby ? (
              <div className="bg-green-100 p-1.5 rounded-lg">
                <MapPin className="w-4 h-4 text-green-600 animate-pulse" />
              </div>
            ) : (
              <div className="bg-blue-100 p-1.5 rounded-lg">
                <Navigation className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <span className="text-sm font-semibold text-gray-800">
              {isNearby ? "Nearby" : "Heading to"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Clickable to expand */}
        <div
          onClick={onExpand}
          className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors active:bg-gray-100/50"
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

            {/* Site Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-base font-bold text-gray-900">
                  {selectedPin.title || selectedPin.siteName}
                </h3>
                {isVisited && (
                  <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    <span>Done</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                {selectedPin.description || selectedPin.siteDescription}
              </p>

              {/* Distance Info */}
              {distance !== null && (
                <div className="flex items-center gap-1.5 text-xs text-gray-700">
                  <div className="bg-blue-50 p-1 rounded">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="font-medium">{(distance / 1000).toFixed(2)} km away</span>
                </div>
              )}
            </div>
          </div>

          {/* Tap to expand hint */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-medium">
              Tap to view full details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
