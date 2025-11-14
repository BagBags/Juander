import React, { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { announceDirectionStep } from "../../../utils/textToSpeech";

export default function DirectionsPanel({
  steps,
  currentStepIndex,
  setCurrentStepIndex,
  eta,
  distance,
  arrivalTime,
  transportMode,
}) {
  const lastAnnouncedStep = useRef(-1);
  const announceTimeout = useRef(null);

  // Announce direction changes with debouncing
  useEffect(() => {
    if (steps.length > 0 && steps[currentStepIndex]) {
      // Only announce if step actually changed
      if (currentStepIndex === lastAnnouncedStep.current) {
        return;
      }

      // Clear any pending announcement
      if (announceTimeout.current) {
        clearTimeout(announceTimeout.current);
      }

      // Debounce announcements - wait 2 seconds before announcing
      // This prevents rapid-fire announcements when location updates frequently
      announceTimeout.current = setTimeout(() => {
        const instruction = steps[currentStepIndex]?.maneuver?.instruction || "Follow route";
        announceDirectionStep(instruction, currentStepIndex + 1, steps.length);
        lastAnnouncedStep.current = currentStepIndex;
      }, 2000);
    }

    return () => {
      if (announceTimeout.current) {
        clearTimeout(announceTimeout.current);
      }
    };
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

      {/* Navigation Controls */}
      <div className="flex justify-between w-full">
        <button
          onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentStepIndex === 0}
          className={`px-3 py-1 rounded-md text-sm font-medium shadow flex items-center gap-1 ${
            currentStepIndex === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#f04e37] text-white hover:bg-[#d9442f]"
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Prev
        </button>

        <button
          onClick={() =>
            setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
          }
          disabled={currentStepIndex === steps.length - 1}
          className={`px-3 py-1 rounded-md text-sm font-medium shadow flex items-center gap-1 ${
            currentStepIndex === steps.length - 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#f04e37] text-white hover:bg-[#d9442f]"
          }`}
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
