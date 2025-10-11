import React, { useEffect } from "react";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { announceDirectionStep } from "../../../utils/textToSpeech";

export default function DirectionsPanel({
  steps,
  currentStepIndex,
  setCurrentStepIndex,
  eta,
  distance,
  arrivalTime,
}) {
  // Announce direction changes
  useEffect(() => {
    if (steps.length > 0 && steps[currentStepIndex]) {
      const instruction = steps[currentStepIndex]?.maneuver?.instruction || "Follow route";
      announceDirectionStep(instruction, currentStepIndex + 1, steps.length);
    }
  }, [currentStepIndex, steps]);

  if (steps.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 w-full bg-white shadow-lg p-4 text-sm flex flex-col items-center z-40">
      <h4 className="font-semibold text-gray-800 mb-2">Directions</h4>

      <div className="text-center mb-3">
        <p className="text-base font-medium text-blue-700">
          {steps[currentStepIndex]?.maneuver?.instruction || "Follow route"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      </div>

      {/* ETA + Distance + Arrival */}
      {eta && distance && (
        <div className="flex flex-col items-center text-sm text-gray-700 mb-3">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {Math.round(eta / 60)} min • {(distance / 1000).toFixed(2)} km
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
              : "bg-blue-600 text-white hover:bg-blue-700"
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
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
