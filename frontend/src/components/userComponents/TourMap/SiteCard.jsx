import React, { Suspense, lazy, useState, useEffect } from "react";
import { Volume2 } from "lucide-react";
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
    <div
      className="
      absolute top-1/2 left-1/2 z-50 
      w-[320px] sm:w-[400px] md:w-[500px] lg:w-[640px] 
      -translate-x-1/2 -translate-y-1/2
    "
    >
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg p-4 md:p-6 font-sans">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* ✅ AR Mode fullscreen inside card */}
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
              className="mt-3 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm md:text-base font-medium rounded-lg shadow"
            >
              Exit AR Mode
            </button>
          </div>
        ) : (
          <>
            {/* ✅ Lazy load 3D model preview only when not in AR */}
            {pin.glbUrl && (
              <div className="mb-3 w-full h-64 md:h-80 border border-gray-200 rounded-lg">
                <Suspense
                  fallback={
                    <p className="text-center mt-6">Loading 3D model...</p>
                  }
                >
                  <ModelPreview url={pin.glbUrl} />
                </Suspense>
              </div>
            )}

            <h3 className="text-lg md:text-xl font-semibold mb-2">
              {pin.title}
            </h3>

            {/* Read Description Button */}
            <button
              onClick={() => {
                const description = pin.description || "No description available";
                ttsService.speak(`${pin.title}. ${description}`, { rate: 0.9 });
              }}
              className="mb-3 w-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              aria-label="Read site description aloud"
            >
              <Volume2 className="w-4 h-4" />
              Read Description Aloud
            </button>

            <p className="text-sm md:text-base leading-snug text-gray-700 mb-3">
              {pin.description}
            </p>

            {/* Existing image/video preview */}
            {pin.mediaUrl && (
              <div className="mb-3">
                {pin.mediaType === "video" ? (
                  <video
                    src={pin.mediaUrl}
                    className="w-full h-40 md:h-56 object-cover rounded-lg border border-gray-200"
                    muted
                    controls
                  />
                ) : (
                  <img
                    src={pin.mediaUrl}
                    alt={pin.title}
                    className="w-full h-40 md:h-56 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}

            {/* ✅ View in AR Mode button */}
            {pin.arEnabled && pin.arLink && (
              <button
                onClick={() => setShowAR(true)}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm md:text-base font-medium rounded-lg shadow mb-3"
              >
                View in AR Mode
              </button>
            )}

            <div className="text-xs md:text-sm font-medium px-3 py-2 rounded-md shadow-sm border border-gray-200 bg-gray-50">
              Status:{" "}
              <span
                className={
                  pin.status === "active" ? "text-green-600" : "text-red-600"
                }
              >
                {pin.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>

            {distance !== null && (
              <div className="bg-gray-50 text-xs md:text-sm px-3 py-2 mt-3 rounded-md shadow-sm border border-gray-200">
                🛣️ Distance: {(distance / 1000).toFixed(2)} km
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SiteCard;
