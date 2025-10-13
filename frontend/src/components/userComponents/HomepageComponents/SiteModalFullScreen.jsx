import React, { useState, Suspense, lazy, useEffect } from "react";
import { X, Volume2, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import ttsService from "../../../utils/textToSpeech";

const ModelPreview = lazy(() => import("../TourMap/SiteCardModelPreview"));

export default function SiteModalFullScreen({
  selectedPin,
  onClose,
  distance,
  currentPinIndex,
  pinsLength,
  goToNextStop,
  siteReviews = [],
  reviewsLoading = false,
  simulateGoToNextSite,
}) {
  const { t } = useTranslation();
  const [showAR, setShowAR] = useState(false);

  // Announce when modal opens
  useEffect(() => {
    if (selectedPin) {
      const siteName = selectedPin.title || selectedPin.siteName;
      ttsService.speak(`${t('tts_viewingDetails')} ${siteName}`);
    }
  }, [selectedPin?._id, t]);

  return (
    <div className="absolute inset-0 z-50 bg-white overflow-y-auto">
      {/* Header with Close Button */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
        <h2 className="text-xl font-bold text-gray-800">Site Information</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {/* AR Mode fullscreen inside modal */}
        {showAR ? (
          <div className="flex flex-col h-[70vh]">
            <iframe
              src={selectedPin.arLink}
              title="AR Mode"
              className="flex-1 w-full rounded-lg border border-gray-200"
              allow="camera; gyroscope; accelerometer; fullscreen"
            />
            <button
              onClick={() => setShowAR(false)}
              className="mt-3 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 text-base font-medium rounded-lg shadow transition-colors"
            >
              Exit AR Mode
            </button>
          </div>
        ) : (
          <>
            {/* 3D Model Preview */}
            {selectedPin.glbUrl && selectedPin.glbUrl.endsWith(".glb") && (
              <div className="mb-4 w-full h-64 md:h-80 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Loading 3D model...</p>
                    </div>
                  }
                >
                  <ModelPreview url={selectedPin.glbUrl} />
                </Suspense>
              </div>
            )}

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {selectedPin.title || selectedPin.siteName}
            </h3>

            {/* Read Description Button */}
            <button
              onClick={() => {
                const siteName = selectedPin.title || selectedPin.siteName;
                const description = selectedPin.description || "No description available";
                ttsService.speak(`${siteName}. ${description}`, { rate: 0.9 });
              }}
              className="mb-3 w-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              aria-label="Read site description aloud"
            >
              <Volume2 className="w-4 h-4" />
              Read Description Aloud
            </button>

            {/* Description */}
            <p className="text-base leading-relaxed text-gray-700 mb-4">
              {selectedPin.description}
            </p>

            {/* Media (Image/Video) */}
            {selectedPin.mediaUrl && (
              <div className="mb-4">
                {selectedPin.mediaType === "video" ? (
                  <video
                    src={selectedPin.mediaUrl}
                    className="w-full h-56 md:h-72 object-cover rounded-lg border border-gray-200"
                    muted
                    controls
                  />
                ) : (
                  <img
                    src={selectedPin.mediaUrl}
                    alt={selectedPin.title || selectedPin.siteName}
                    className="w-full h-56 md:h-72 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}

            {/* AR Mode Button */}
            {selectedPin.arEnabled && selectedPin.arLink && (
              <button
                onClick={() => {
                  setShowAR(true);
                  ttsService.speak(t('tts_openingAR'));
                }}
                className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 text-base font-semibold rounded-lg shadow-md mb-4 transition-colors"
                aria-label="View in AR Mode"
              >
                🔍 View in AR Mode
              </button>
            )}

            {/* Status */}
            <div className="text-sm font-medium px-4 py-3 rounded-lg shadow-sm border border-gray-200 bg-gray-50 mb-4">
              <span className="text-gray-700">Status: </span>
              <span
                className={
                  selectedPin.status === "active"
                    ? "text-green-600 font-semibold"
                    : "text-red-600 font-semibold"
                }
              >
                {selectedPin.status === "active" ? "✓ Active" : "✗ Inactive"}
              </span>
            </div>

            {/* Distance */}
            {distance !== null && (
              <div className="bg-blue-50 text-sm px-4 py-3 rounded-lg shadow-sm border border-blue-200 mb-4">
                <span className="text-gray-700 font-medium">🛣️ Distance: </span>
                <span className="text-blue-700 font-bold">
                  {(distance / 1000).toFixed(2)} km
                </span>
              </div>
            )}

            {/* User Reviews Section */}
            <div className="mb-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
              <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                User Reviews
              </h4>
              
              {reviewsLoading ? (
                <p className="text-sm text-gray-500">Loading reviews...</p>
              ) : siteReviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {siteReviews.map((review, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-800">
                          {review.userId?.firstName && review.userId?.lastName
                            ? `${review.userId.firstName} ${review.userId.lastName}`
                            : review.userId?.firstName || review.userId?.lastName || "Anonymous"}
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.reviewText && (
                        <p className="text-xs text-gray-600">{review.reviewText}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Simulation Button (for testing from home) */}
            {simulateGoToNextSite && (
              <button
                onClick={simulateGoToNextSite}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-base font-bold rounded-lg shadow-lg mb-4 transition-all duration-200 active:scale-95"
                aria-label="Simulate site completion"
              >
                 Mark Site as Done
              </button>
            )}

            {/* Next Stop Button */}
            {currentPinIndex < pinsLength - 1 && (
              <button
                onClick={() => {
                  goToNextStop();
                  ttsService.speak(t('tts_navigatingNext'));
                }}
                className="w-full bg-[#f04e37] hover:bg-[#d9442f] text-white px-6 py-4 text-lg font-bold rounded-lg shadow-lg transition-all duration-200 active:scale-95"
                aria-label="Go to nearest next site"
              >
                Go to Nearest Next Site →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
