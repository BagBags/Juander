import React, { useEffect, useRef, useState, memo } from "react";
import { ChevronLeft, ChevronRight, SkipForward, Clock } from "lucide-react";
import ttsService, { announceDirectionStep } from "../../../utils/textToSpeech";
import { useLocation } from "react-router-dom";

const DirectionsPanel = memo(function DirectionsPanel({
  steps,
  currentStepIndex,
  setCurrentStepIndex,
  eta,
  distance,
  arrivalTime,
  transportMode,
  isRouting,
  // New: user geolocation and active pin for arrival message
  userLocation,
  activePin,
  onPrevSite,
  onSkipSite,
  onNextSite,
  hasPrevSite,
  hasNextSite,
  isLastSite = false,
}) {
  // Track the last spoken displayed instruction to avoid repeats
  const lastSpokenInstructionRef = useRef("");
  const lastSpokenTimeRef = useRef(0); // Track last TTS time for 3-second cooldown
  const location = useLocation();
  const isAllowedRoute = location.pathname.startsWith("/TouristItineraryMap/") || location.pathname.startsWith("/GuestItineraryMap/");

  // Displayed instruction is locked near waypoints to avoid flicker
  const [displayInstruction, setDisplayInstruction] = useState("");
  const isLockedRef = useRef(false);
  const lockedStepIndexRef = useRef(null);

  // Per-step one-time prompt flags
  const promptFlagsRef = useRef({ stepIndex: -1, spoken100: false, spoken50: false, spokenFinal: false, arrivalSpoken: false });

  const speakWithCooldown = (text) => {
    if (!text || !ttsService.isEnabled || !isAllowedRoute) return;
    const now = Date.now();
    const cooldownPassed = now - lastSpokenTimeRef.current >= 3000;
    if (!cooldownPassed) return;
    ttsService.speak(text);
    lastSpokenTimeRef.current = Date.now();
  };

  // Helper: distance in meters between user and target [lng, lat]
  const distanceToTarget = (userLoc, waypoint) => {
    if (!userLoc || !waypoint || waypoint.length < 2) return Infinity;
    const R = 6371000; // Earth radius in meters
    const toRad = (v) => (v * Math.PI) / 180;
    const [lng2, lat2] = waypoint;
    const lat1 = userLoc.latitude;
    const lng1 = userLoc.longitude;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper: build turn phrase based on step
  const buildTurnPhrase = (step, prefix = "") => {
    const instruction = step?.maneuver?.instruction || "";
    if (!instruction) return "";
    return `${prefix}${instruction}`.trim();
  };

  // Initialize display instruction and manage lock across step changes
  useEffect(() => {
    if (!steps || steps.length === 0) return;
    const currentStep = steps[currentStepIndex];
    const instruction = currentStep?.maneuver?.instruction || "Follow route";

    // Reset prompt flags for new step
    if (promptFlagsRef.current.stepIndex !== currentStepIndex) {
      promptFlagsRef.current = { stepIndex: currentStepIndex, spoken100: false, spoken50: false, spokenFinal: false, arrivalSpoken: false };
    }

    // Unlock when moving to a new step
    if (lockedStepIndexRef.current !== null && lockedStepIndexRef.current !== currentStepIndex) {
      isLockedRef.current = false;
      lockedStepIndexRef.current = null;
    }

    // Only update displayed instruction if not locked
    if (!isLockedRef.current) {
      setDisplayInstruction(instruction);
    }

    return () => {
      // No-op: unmount cancellation handled in dedicated effects below
    };
  }, [currentStepIndex, steps, isAllowedRoute]);

  // Speak only when the displayed instruction changes (Waze-style behavior) with 3-second cooldown
  const displayedText = displayInstruction || steps[currentStepIndex]?.maneuver?.instruction || "Follow route";
  useEffect(() => {
    if (!isAllowedRoute || !ttsService.isEnabled) return;
    if (!displayedText) return;

    // Check if instruction changed AND 3-second cooldown passed
    const now = Date.now();
    const cooldownPassed = now - lastSpokenTimeRef.current >= 3000; // 3-second cooldown
    const instructionChanged = displayedText !== lastSpokenInstructionRef.current;

    if (instructionChanged && cooldownPassed) {
      console.log(`🔊 TTS: "${displayedText}" (Step ${currentStepIndex + 1}/${steps.length})`);
      announceDirectionStep(displayedText);
      lastSpokenInstructionRef.current = displayedText;
      lastSpokenTimeRef.current = now; // Update last spoken time
    }
  }, [displayedText, isAllowedRoute, currentStepIndex, steps.length]);

  useEffect(() => {
    const onActivated = () => {
      setTimeout(() => {
        const text = displayInstruction || steps[currentStepIndex]?.maneuver?.instruction || "Follow route";
        if (isAllowedRoute && ttsService.isEnabled && text) {
          ttsService.speak(text, { queue: true });
          lastSpokenInstructionRef.current = text;
          lastSpokenTimeRef.current = Date.now();
        }
      }, 2000);
    };
    window.addEventListener('tts-activated', onActivated);
    return () => window.removeEventListener('tts-activated', onActivated);
  }, [displayInstruction, currentStepIndex, steps, isAllowedRoute]);

  // Cancel speech when leaving itinerary pages
  useEffect(() => {
    if (!isAllowedRoute) {
      ttsService.cancel();
    }
  }, [isAllowedRoute]);

  // Always cancel on unmount
  useEffect(() => {
    return () => {
      ttsService.cancel();
    };
  }, []);

  // Distance-based prompts and 10m lock near waypoint
  useEffect(() => {
    if (!isAllowedRoute || !ttsService.isEnabled) return;
    if (!userLocation || !steps || steps.length === 0) return;

    const step = steps[currentStepIndex];
    const wp = step?.maneuver?.location;
    const dist = distanceToTarget(userLocation, wp);
    const isArriveStep = (step?.maneuver?.type || "").toLowerCase() === "arrive";
    const flags = promptFlagsRef.current;

    // 10-meter lock: prevent rapid-fire when very close to waypoint
    if (dist <= 10) {
      if (!isLockedRef.current) {
        isLockedRef.current = true;
        lockedStepIndexRef.current = currentStepIndex;
      }

      // Arrival announcement (only on arrival step) or destination proximity
      if (!flags.arrivalSpoken && isArriveStep) {
        const name = activePin?.siteName || "your destination";
        speakWithCooldown(`You have arrived at ${name}.`);
        flags.arrivalSpoken = true;
      }
      // Do not speak other prompts while locked
      return;
    }

    // If outside lock radius, normal behavior resumes; emit distance prompts once per step
    if (dist <= 100 && !flags.spoken100 && !isArriveStep) {
      const phrase = buildTurnPhrase(step, "In 100 meters, ");
      speakWithCooldown(phrase);
      flags.spoken100 = true;
    }
    if (dist <= 50 && !flags.spoken50 && !isArriveStep) {
      const phrase = buildTurnPhrase(step, "In 50 meters, ");
      speakWithCooldown(phrase);
      flags.spoken50 = true;
    }
    // Final turn instruction very near the waypoint (but outside the lock threshold)
    if (dist <= 12 && !flags.spokenFinal && !isArriveStep) {
      const finalPhrase = buildTurnPhrase(step);
      speakWithCooldown(finalPhrase);
      flags.spokenFinal = true;
    }
  }, [userLocation, steps, currentStepIndex, isAllowedRoute, activePin]);

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
    <div 
      className="absolute left-3 right-3 md:left-6 md:right-6 w-auto max-w-[720px] mx-auto bg-white/90 backdrop-blur-lg shadow-2xl text-sm flex flex-col z-40 border border-gray-200 rounded-2xl overflow-hidden"
      style={{
        bottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        maxWidth: 'min(720px, 96vw)',
        maxHeight: 'clamp(220px, 38svh, 330px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="flex items-center gap-2 px-3 pt-3">
        <h4 className="font-semibold text-gray-800">Directions</h4>
        {modeLabel && (
          <span className="px-2 py-0.5 text-xs rounded-full border border-gray-300 text-gray-600 bg-white/80">
            {modeLabel}
          </span>
        )}
      </div>


{/*Step by step instructions*/}
      <div className="text-center px-3" aria-live="polite">
        <p className="text-sm sm:text-base md:text-lg font-medium text-[#f04e37] truncate">
          {displayInstruction || steps[currentStepIndex]?.maneuver?.instruction || "Follow route"}
        </p>
      </div>

      {/* ETA + Distance + Arrival */}
      {eta && distance && (
        <div className="flex flex-col items-center text-xs md:text-sm text-gray-700 px-3">
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
      <div className="flex gap-2 w-full px-3 pb-3 pt-2 mt-1">
        {/* Previous Site Button */}
        <button
          onClick={onPrevSite}
          disabled={!hasPrevSite}
          className={`direction-prev-btn flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
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
          className={`direction-skip-btn flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            hasNextSite
              ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>

        {/* Next/End Tour Button */}
        <button
          onClick={onNextSite}
          disabled={!hasNextSite}
          className={`direction-next-btn flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            hasNextSite
              ? "bg-[#f04e37] text-white hover:bg-[#d9442f] active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isLastSite ? "End Tour" : "Next Site"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default DirectionsPanel;
