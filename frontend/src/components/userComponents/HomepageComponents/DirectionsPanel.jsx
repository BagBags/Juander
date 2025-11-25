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
  onArriveAtDestination,
  isNearby = false, // New: proximity check for Next Site button
}) {
  // Track the last spoken displayed instruction to avoid repeats
  const lastSpokenInstructionRef = useRef("");
  const lastSpokenTimeRef = useRef(0); // Track last TTS time for 3-second cooldown
  const location = useLocation();
  const isAllowedRoute = location.pathname.startsWith("/TouristItineraryMap/") || location.pathname.startsWith("/GuestItineraryMap/");
  const strictMatchTTS = true;
  const isGenericText = (txt) => /\b(walkway|footpath|foot\b|path|trail|unnamed)\b/i.test(String(txt || ""));
  const includesName = (txt, rn) => rn && String(txt || "").toLowerCase().includes(String(rn).toLowerCase());
  const hasVerb = (txt) => /\b(turn|continue|walk|head|merge|exit|arrive|proceed|keep|take|enter)\b/i.test(String(txt || ""));
  const computeInstructionForStep = (step) => {
    const type = String(step?.maneuver?.type || "").toLowerCase();
    const mod = String(step?.maneuver?.modifier || "").toLowerCase();
    const rnRaw = (step?.roadName || step?.name || "").trim();
    const rnCandidate = rnRaw.split(/[;|,\\/]+/)[0]?.trim() || "";
    const rn = rnCandidate && !isGenericText(rnCandidate) ? rnCandidate : "";
    const banner = String(step?.bannerInstructions?.[0]?.primary?.text || "").trim();

    const dir = mod === "left" ? "left"
      : mod === "right" ? "right"
      : /slight\s*left/.test(mod) ? "slight left"
      : /slight\s*right/.test(mod) ? "slight right"
      : /sharp\s*left/.test(mod) ? "sharp left"
      : /sharp\s*right/.test(mod) ? "sharp right"
      : /uturn/.test(mod) ? "u-turn"
      : "straight";

    if (banner && hasVerb(banner) && !isGenericText(banner)) {
      return banner;
    }

    if (type === "turn" || type === "merge" || type === "exit" || type === "roundabout") {
      if (dir === "straight") {
        const base = "Continue straight";
        return rn && !includesName(base, rn) ? `${base} to ${rn}` : base;
      }
      const base = `Turn ${dir}`;
      return rn && !includesName(base, rn) ? `${base} onto ${rn}` : base;
    }

    if (type === "depart" || type === "head") {
      if (currentStepIndex === 0) {
        const base = dir === "straight" ? "Head straight" : `Head ${dir}`;
        return rn && !includesName(base, rn) ? `${base} to ${rn}` : base;
      }
      const base = rn ? `Continue along ${rn}` : "Continue straight";
      return base;
    }

    if (type === "arrive") {
      const name = activePin?.siteName || activePin?.title;
      return name ? `You have arrived at ${name}.` : "Arrive at destination";
    }

    const base = rn ? `Continue along ${rn}` : (dir === "straight" ? "Continue straight" : `Continue ${dir}`);
    return base;
  };

  const isActionableTurn = (step) => {
    const t = String(step?.maneuver?.type || "").toLowerCase();
    const m = String(step?.maneuver?.modifier || "").toLowerCase();
    if (t === "turn" || t === "merge" || t === "exit" || t === "roundabout") return true;
    if (t === "arrive") return true;
    if (t === "continue" && m && m !== "straight") return true;
    return false;
  };

  const getNextActionStepIndex = (fromIdx) => {
    for (let i = fromIdx; i < steps.length; i++) {
      if (isActionableTurn(steps[i])) return i;
    }
    return null;
  };

  const getCurrentActionStepIndex = (idx) => {
    const s = steps[idx];
    const t = String(s?.maneuver?.type || "").toLowerCase();
    if (t === "depart" || t === "head" || t === "continue") {
      const nextIdx = getNextActionStepIndex(idx + 1);
      return nextIdx !== null ? nextIdx : idx;
    }
    return idx;
  };

  // Displayed instruction is locked near waypoints to avoid flicker
  const [displayInstruction, setDisplayInstruction] = useState("");
  const isLockedRef = useRef(false);
  const lockedStepIndexRef = useRef(null);

  const promptFlagsRef = useRef({ stepIndex: -1, spoken100: false, spoken50: false, spoken40: false, spoken30: false, spoken20: false, spoken10: false, spokenNear: false, spokenFinal: false, arrivalSpoken: false });
  const arrivalTriggeredRef = useRef(false);

  const speakWithCooldown = (text) => {
    if (!text || !ttsService.isEnabled || !isAllowedRoute) return;
    const lockActive = typeof window !== 'undefined' && window.__ttsArrivalLockUntil && Date.now() < window.__ttsArrivalLockUntil;
    const isArrival = /^you have arrived/i.test(String(text));
    if (lockActive && !isArrival) return;
    if (isArrival) {
      try { window.__ttsArrivalLockUntil = Date.now() + 5000; } catch {}
      ttsService.speak(text);
      lastSpokenTimeRef.current = Date.now();
      return;
    }
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

  // Helper: build Waze/Google-like distance prompt (only actionable turns)
  const buildDistancePrompt = (step, prefix = "") => {
    const type = (step?.maneuver?.type || "").toLowerCase();
    const mod = (step?.maneuver?.modifier || "").toLowerCase();
    const isTurnType = type === "turn" || type === "merge" || type === "exit" || type === "roundabout";
    if (!isTurnType) return null; // Don't announce straight/continue/depart

    let dir = "straight";
    if (/^left$/i.test(mod)) dir = "left";
    else if (/^right$/i.test(mod)) dir = "right";
    else if (/u[-\s]?turn/i.test(mod)) dir = "u-turn";
    else if (/slight\s*left/i.test(mod)) dir = "slight left";
    else if (/slight\s*right/i.test(mod)) dir = "slight right";
    else if (/sharp\s*left/i.test(mod)) dir = "sharp left";
    else if (/sharp\s*right/i.test(mod)) dir = "sharp right";

    if (dir === "straight") return null; // No prompt for straight
    return `${prefix}Turn ${dir}`.trim();
  };

  // Initialize display instruction and manage lock across step changes
  useEffect(() => {
    if (!steps || steps.length === 0) return;
    const idx = getCurrentActionStepIndex(currentStepIndex);
    const instruction = computeInstructionForStep(steps[idx]);

    // Reset prompt flags for new step
    if (promptFlagsRef.current.stepIndex !== currentStepIndex) {
      promptFlagsRef.current = { stepIndex: currentStepIndex, spoken100: false, spoken50: false, spoken20: false, spoken10: false, spokenFinal: false, arrivalSpoken: false };
    }

    // Unlock when moving to a new step
    if (lockedStepIndexRef.current !== null && lockedStepIndexRef.current !== currentStepIndex) {
      isLockedRef.current = false;
      lockedStepIndexRef.current = null;
    }

    // Always reflect the current step in the displayed instruction
    setDisplayInstruction(instruction);

    return () => {
      // No-op: unmount cancellation handled in dedicated effects below
    };
  }, [currentStepIndex, steps, isAllowedRoute]);

  // Speak only when the displayed instruction changes (Waze-style behavior) with 3-second cooldown
  const displayedText = displayInstruction || (() => {
    const idx = getCurrentActionStepIndex(currentStepIndex);
    return computeInstructionForStep(steps[idx]);
  })();
  useEffect(() => {
    if (!isAllowedRoute || !ttsService.isEnabled) return;
    if (!displayedText) return;
    const lockActive = typeof window !== 'undefined' && window.__ttsArrivalLockUntil && Date.now() < window.__ttsArrivalLockUntil;
    const isArrivalText = /^you have arrived/i.test(String(displayedText));
    if (lockActive && !isArrivalText) return;

    // Check if instruction changed AND 3-second cooldown passed
    const now = Date.now();
    const cooldownPassed = now - lastSpokenTimeRef.current >= 3000; // 3-second cooldown
    const instructionChanged = displayedText !== lastSpokenInstructionRef.current;

    if (instructionChanged && cooldownPassed) {
      console.log(`🔊 TTS: "${displayedText}" (Step ${currentStepIndex + 1}/${steps.length})`);
      if (isArrivalText) {
        speakWithCooldown(displayedText);
      } else {
        announceDirectionStep(displayedText);
      }
      lastSpokenInstructionRef.current = displayedText;
      lastSpokenTimeRef.current = now; // Update last spoken time
    }
  }, [displayedText, isAllowedRoute, currentStepIndex, steps.length]);

  useEffect(() => {
    const onActivated = () => {
      setTimeout(() => {
        const text = displayedText || computeInstructionForStep(steps[currentStepIndex]);
        const lockActive = typeof window !== 'undefined' && window.__ttsArrivalLockUntil && Date.now() < window.__ttsArrivalLockUntil;
        const isArrivalText = /^you have arrived/i.test(String(text));
        if (isAllowedRoute && ttsService.isEnabled && text && (!lockActive || isArrivalText)) {
          if (isArrivalText) {
            speakWithCooldown(text);
          } else {
            ttsService.speak(text);
          }
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
    const wpDist = distanceToTarget(userLocation, wp);
    const isArriveStep = (step?.maneuver?.type || "").toLowerCase() === "arrive";
    const pinDist = activePin ? distanceToTarget(userLocation, [activePin.longitude, activePin.latitude]) : Infinity;
    const dist = isArriveStep ? pinDist : wpDist;
    const flags = promptFlagsRef.current;

    // 10-meter lock: prevent rapid-fire when very close to waypoint
    if (dist <= 10) {
      if (!flags.spoken10 && !isArriveStep) {
        const type = (step?.maneuver?.type || "").toLowerCase();
        const mod = (step?.maneuver?.modifier || "").toLowerCase();
        const isTurnType = type === "turn" || type === "merge" || type === "exit" || type === "roundabout";
        if (isTurnType) {
          let dir = "straight";
          if (/^left$/i.test(mod)) dir = "left";
          else if (/^right$/i.test(mod)) dir = "right";
          else if (/u[-\s]?turn/i.test(mod)) dir = "u-turn";
          else if (/slight\s*left/i.test(mod)) dir = "slight left";
          else if (/slight\s*right/i.test(mod)) dir = "slight right";
          else if (/sharp\s*left/i.test(mod)) dir = "sharp left";
          else if (/sharp\s*right/i.test(mod)) dir = "sharp right";
          if (dir !== "straight") {
            const d = Math.max(3, Math.round(dist));
            speakWithCooldown(`In ${d} meters, Turn ${dir}`);
          }
        }
        flags.spoken10 = true;
      }
      if (!isLockedRef.current) {
        isLockedRef.current = true;
        lockedStepIndexRef.current = currentStepIndex;
      }

      // Arrival announcement (only on arrival step) or destination proximity
      if (!flags.arrivalSpoken && isArriveStep) {
        const name = activePin?.siteName || activePin?.title || "your destination";
        setDisplayInstruction(`You have arrived at ${name}.`);
        try { window.__ttsArrivalLockUntil = Date.now() + 5000; } catch {}
        speakWithCooldown(`You have arrived at ${name}.`);
        if (!arrivalTriggeredRef.current && typeof onArriveAtDestination === "function") {
          try { onArriveAtDestination(activePin); } catch {}
          arrivalTriggeredRef.current = true;
        }
        flags.arrivalSpoken = true;
      }
      // Do not speak other prompts while locked
      return;
    }

    if (isLockedRef.current && lockedStepIndexRef.current === currentStepIndex && dist > 10) {
      isLockedRef.current = false;
      lockedStepIndexRef.current = null;
    }

    // If outside lock radius, normal behavior resumes; emit distance prompts once per step
    if (dist <= 100 && !flags.spoken100 && !isArriveStep) {
      const phrase = buildDistancePrompt(step, "In 100 meters, ");
      if (phrase) speakWithCooldown(phrase);
      flags.spoken100 = true;
    }
    if (dist <= 50 && !flags.spoken50 && !isArriveStep) {
      const phrase = buildDistancePrompt(step, "In 50 meters, ");
      if (phrase) speakWithCooldown(phrase);
      flags.spoken50 = true;
    }
    if (dist <= 40 && !flags.spoken40 && !isArriveStep) {
      const phrase = buildDistancePrompt(step, "In 40 meters, ");
      if (phrase) speakWithCooldown(phrase);
      flags.spoken40 = true;
    }
    if (dist <= 30 && !flags.spoken30 && !isArriveStep) {
      const phrase = buildDistancePrompt(step, "In 30 meters, ");
      if (phrase) speakWithCooldown(phrase);
      flags.spoken30 = true;
    }
    if (dist <= 20 && !flags.spoken20 && !isArriveStep) {
      const phrase = buildDistancePrompt(step, "In 20 meters, ");
      if (phrase) speakWithCooldown(phrase);
      flags.spoken20 = true;
    }
    // Final turn instruction very near the waypoint (but outside the lock threshold)
    if (dist <= 12 && !flags.spokenFinal && !isArriveStep) {
      const type = (step?.maneuver?.type || "").toLowerCase();
      const mod = (step?.maneuver?.modifier || "").toLowerCase();
      const isTurnType = type === "turn" || type === "merge" || type === "exit" || type === "roundabout";
      if (isTurnType) {
        let dir = "straight";
        if (/^left$/i.test(mod)) dir = "left";
        else if (/^right$/i.test(mod)) dir = "right";
        else if (/u[-\s]?turn/i.test(mod)) dir = "u-turn";
        else if (/slight\s*left/i.test(mod)) dir = "slight left";
        else if (/slight\s*right/i.test(mod)) dir = "slight right";
        else if (/sharp\s*left/i.test(mod)) dir = "sharp left";
        else if (/sharp\s*right/i.test(mod)) dir = "sharp right";
        if (dir !== "straight") {
          const d = Math.max(3, Math.round(dist));
          speakWithCooldown(`In ${d} meters, Turn ${dir}`);
        }
      }
      flags.spokenFinal = true;
    }
  }, [userLocation, steps, currentStepIndex, isAllowedRoute, activePin]);

  useEffect(() => {
    if (!userLocation || !activePin) return;
    const d = distanceToTarget(userLocation, [activePin.longitude, activePin.latitude]);
    if (d <= 10) {
      if (!arrivalTriggeredRef.current) {
        const name = activePin?.siteName || activePin?.title || "your destination";
        setDisplayInstruction(`You have arrived at ${name}.`);
        try { window.__ttsArrivalLockUntil = Date.now() + 5000; } catch {}
        speakWithCooldown(`You have arrived at ${name}.`);
        if (typeof onArriveAtDestination === "function") {
          try { onArriveAtDestination(activePin); } catch {}
        }
        arrivalTriggeredRef.current = true;
      }
    } else if (d > 12) {
      arrivalTriggeredRef.current = false;
    }
  }, [userLocation, activePin]);

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

  const currentActionIndex = getCurrentActionStepIndex(currentStepIndex);
  const nextActionIndex = getNextActionStepIndex(currentActionIndex + 1);
  const nextHintText = nextActionIndex !== null ? computeInstructionForStep(steps[nextActionIndex]) : null;

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
        {nextHintText && (
          <p className="mt-0.5 text-[11px] sm:text-xs text-gray-600 truncate">
            Next: {nextHintText}
          </p>
        )}
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
          disabled={!hasNextSite || !isNearby}
          className={`direction-next-btn flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            hasNextSite && isNearby
              ? "bg-[#f04e37] text-white hover:bg-[#d9442f] active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          title={!isNearby && hasNextSite ? "Move within 15m of the site to continue" : ""}
        >
          {isLastSite ? "End Tour" : "Next Site"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default DirectionsPanel;
