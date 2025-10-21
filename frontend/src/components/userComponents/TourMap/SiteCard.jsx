import React, { Suspense, lazy, useState, useEffect } from "react";
import { Volume2, X } from "lucide-react";
import ttsService from "../../../utils/textToSpeech";

const ModelPreview = lazy(() => import("./SiteCardModelPreview"));

const SiteCard = ({ pin, onClose, distance }) => {
  const [showAR, setShowAR] = useState(false);

  // Announce site when card opens
  useEffect(() => {
    if (pin) {
      const siteName = pin.title || "site";
      const distanceText = distance ? `. Distance: ${(distance / 1000).toFixed(2)} kilometers` : "";
      ttsService.speak(`Viewing ${siteName}${distanceText}`);
    }
  }, [pin?._id]);

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
              src={pin.arLink}
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
            {pin.glbUrl && pin.glbUrl.endsWith(".glb") && (
              <div className="mb-4 w-full h-64 md:h-80 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Loading 3D model...</p>
                    </div>
                  }
                >
                  <ModelPreview url={pin.glbUrl} />
                </Suspense>
              </div>
            )}

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {pin.title}
            </h3>

            {/* Read Description Button */}
            <button
              onClick={() => {
                const description = pin.description || "No description available";
                ttsService.speak(`${pin.title}. ${description}`, { rate: 0.9 });
              }}
              className="mb-3 w-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              aria-label="Read site description aloud"
            >
              <Volume2 className="w-4 h-4" />
              Read Description Aloud
            </button>

            {/* Description */}
            <p className="text-base leading-relaxed text-gray-700 mb-4">
              {pin.description}
            </p>

            {/* Media (Image/Video) */}
            {pin.mediaUrl && (
              <div className="mb-4">
                {pin.mediaType === "video" ? (
                  <video
                    src={pin.mediaUrl}
                    className="w-full h-56 md:h-72 object-cover rounded-lg border border-gray-200"
                    muted
                    controls
                  />
                ) : (
                  <img
                    src={pin.mediaUrl}
                    alt={pin.title}
                    className="w-full h-56 md:h-72 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}

            {/* AR Mode Button */}
            {pin.arEnabled && pin.arLink && (
              <button
                onClick={() => {
                  setShowAR(true);
                  ttsService.speak("Opening AR Mode");
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
                  pin.status === "active"
                    ? "text-green-600 font-semibold"
                    : "text-red-600 font-semibold"
                }
              >
                {pin.status === "active" ? "✓ Active" : "✗ Inactive"}
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
          </>
        )}
      </div>
    </div>
  );
};

export default SiteCard;
