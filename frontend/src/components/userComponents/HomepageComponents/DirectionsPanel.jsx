import React, { useEffect, useRef, memo } from "react";
import { ChevronLeft, ChevronRight, SkipForward, Clock } from "lucide-react";
import { announceDirectionStep } from "../../../utils/textToSpeech";

const DirectionsPanel = memo(function DirectionsPanel({
  steps,
  currentStepIndex,
  setCurrentStepIndex,
  eta,
  distance,
  arrivalTime,
  transportMode,
  isRouting,
  onPrevSite,
  onSkipSite,
  onNextSite,
  hasPrevSite,
  hasNextSite,
}) {
  const lastAnnouncedStep = useRef(-1);

  // Announce direction changes immediately when step updates
  useEffect(() => {
    if (steps.length > 0 && steps[currentStepIndex]) {
      // Only announce if step actually changed
      if (currentStepIndex === lastAnnouncedStep.current) {
        return;
      }

      // Announce immediately when step changes
      const instruction = steps[currentStepIndex]?.maneuver?.instruction || "Follow route";
      announceDirectionStep(instruction, currentStepIndex + 1, steps.length);
      lastAnnouncedStep.current = currentStepIndex;
    }
  }, [currentStepIndex, steps]);

  if (steps.length === 0) return null;

  // Helper to format ETA more granularly so mode differences are visible
  const formatEta = (seconds) => {
    if (!seconds && seconds !== 0) return null;
    if (seconds < 60) return `< 1 min`;
    if (seconds < 10 * 60) return `${(seconds / 60).toFixed(1)} min`;
    return `${Math.round(seconds / 60)} min`;
  };

  const modeLabel = transportMode === 'driving'
    ? 'Car'
    : transportMode === 'cycling'
    ? 'Bike'
    : transportMode === 'walking'
    ? 'Foot'
    : undefined;

  return (
    <div className="absolute bottom-3 left-3 right-3 md:left-6 md:right-6 w-auto max-w-[720px] mx-auto bg-white/90 backdrop-blur-lg shadow-2xl p-4 text-sm flex flex-col items-center z-40 border border-gray-200 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-semibold text-gray-800">Directions</h4>
        {modeLabel && (
          <span className="px-2 py-0.5 text-xs rounded-full border border-gray-300 text-gray-600 bg-white/80">
            {modeLabel}
          </span>
        )}
      </div>

      <div className="text-center mb-3" aria-live="polite">
        <p className="text-base font-medium text-[#f04e37]">
          {steps[currentStepIndex]?.maneuver?.instruction || "Follow route"}
        </p>
      </div>

      {/* ETA + Distance + Arrival */}
      {eta && distance && (
        <div className="flex flex-col items-center text-sm text-gray-700 mb-3">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {formatEta(eta)} • {(distance / 1000).toFixed(2)} km
          </div>
          {arrivalTime && (
            <p className="text-xs text-gray-500 mt-1">
              Arrival:{" "}
              {arrivalTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      )}

      {/* Site Navigation Controls */}
      <div className="flex gap-2 w-full">
        {/* Previous Site Button */}
        <button
          onClick={onPrevSite}
          disabled={!hasPrevSite}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold shadow flex items-center justify-center gap-1.5 transition-all ${
            hasPrevSite
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Prev Site
        </button>

        {/* Skip Site Button */}
        <button
          onClick={onSkipSite}
          disabled={!hasNextSite}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold shadow flex items-center justify-center gap-1.5 transition-all ${
            hasNextSite
              ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>

        {/* Next Site Button */}
        <button
          onClick={onNextSite}
          disabled={!hasNextSite}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold shadow flex items-center justify-center gap-1.5 transition-all ${
            hasNextSite
              ? "bg-[#f04e37] text-white hover:bg-[#d9442f] active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Next Site
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default DirectionsPanel;
