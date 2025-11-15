import React, { useState, useEffect, useRef } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";
import CustomTourTooltip from "./CustomTourTooltip";
import { completeTour as apiCompleteTour, getTourStatus } from "../../utils/tourApi";
import "./tour.css";
import { TourContext } from "./TourContext";

// TourContext and useTour moved to separate module to keep provider export compatible with Fast Refresh

export default function TourProvider({ children, steps = [], userRole = "tourist", scrollToFirstStep = true, disableScrolling = false }) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // Default to true to prevent flash
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const startLockRef = useRef(false);
  const suppressFinishRef = useRef(false);

  // Helper: find the next available step whose target exists in the DOM
  const findNextAvailableIndex = (fromIndex, direction = 1) => {
    let i = fromIndex + direction;
    while (i >= 0 && i < steps.length) {
      const tgt = steps[i]?.target;
      if (tgt && typeof tgt === 'string' && document.querySelector(tgt)) {
        return i;
      }
      i += direction;
    }
    // If none found in the given direction, return boundary index or null
    if (i < 0) return 0;
    if (i >= steps.length) return steps.length - 1;
    return null;
  };

  // Track screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update spotlight position when step changes
  useEffect(() => {
    if (!run || !steps[stepIndex]) return;
    
    const updateSpotlight = () => {
      const target = document.querySelector(steps[stepIndex].target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setSpotlightRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        });
      }
    };
    
    updateSpotlight();
    const timer = setTimeout(updateSpotlight, 100);
    return () => clearTimeout(timer);
  }, [run, stepIndex, steps]);

  // Check tour status on mount (only for tourists)
  useEffect(() => {
    console.log(" TourProvider mounted, userRole:", userRole);
    if (userRole !== "tourist") {
      console.log(" Not a tourist, skipping tour");
      return;
    }

    const checkTourStatus = async () => {
      try {
        console.log(" Fetching tour status...");
        const status = await getTourStatus();
        console.log(" Tour status:", status);
        setHasCompletedTour(status.hasCompletedTour);
        
        // Auto-start tour for new users
        if (!status.hasCompletedTour) {
          console.log(" Starting tour in 1 second...");
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            console.log(" Tour starting NOW!");
            startTour();
          }, 1000);
        } else {
          console.log(" User has already completed tour");
        }
      } catch (error) {
        console.error(" Error checking tour status:", error);
        // On error, don't show tour
        setHasCompletedTour(true);
      }
    };

    checkTourStatus();
  }, [userRole]);

  

  const handleJoyrideCallback = async (data) => {
    const { action, index, status, type } = data;
    try {
      console.log('[Tour] event', { action, index, status, type });
    } catch {}

    if (action === ACTIONS.CLOSE) {
      setRun(false);
      setStepIndex(0);
      try {
        localStorage.removeItem("guestReplayTutorial");
        localStorage.removeItem("touristReplayTutorial");
        localStorage.removeItem("mapTourForceStart");
      } catch {}
      if (userRole === "tourist") {
        try { await apiCompleteTour(); setHasCompletedTour(true); } catch {}
      }
      return;
    }

    // Do not process PREV here to avoid double-handling; handle only on STEP_AFTER

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      setStepIndex(0);

      try {
        localStorage.removeItem("guestReplayTutorial");
        localStorage.removeItem("touristReplayTutorial");
        localStorage.removeItem("mapTourForceStart");
      } catch (e) {}

      if (status === STATUS.FINISHED && userRole === "tourist") {
        try {
          await apiCompleteTour();
          setHasCompletedTour(true);
        } catch (error) {
          console.error("Error marking tour as complete:", error);
        }
      }
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT && index >= steps.length - 1 && !suppressFinishRef.current) {
        setRun(false);
        setStepIndex(0);
        try {
          localStorage.removeItem("guestReplayTutorial");
          localStorage.removeItem("touristReplayTutorial");
          localStorage.removeItem("mapTourForceStart");
        } catch {}
        if (userRole === "tourist") {
          try { await apiCompleteTour(); setHasCompletedTour(true); } catch {}
        }
        return;
      }
      if (action === ACTIONS.PREV) {
        if (index <= 0) {
          return;
        }
        const prev = index - 1;
        setStepIndex(prev);
        suppressFinishRef.current = true;
        return;
      }
      suppressFinishRef.current = false;
      const nextIdx = findNextAvailableIndex(index, 1);
      if (typeof nextIdx === 'number' && nextIdx !== index) {
        setStepIndex(nextIdx);
      } else {
        const targetIndex = index + 1;
        const clamped = Math.max(0, Math.min(targetIndex, steps.length - 1));
        setStepIndex(clamped);
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.PREV) {
        return;
      }
      setTimeout(() => {
        const nextIdx = findNextAvailableIndex(index, 1);
        if (typeof nextIdx === 'number' && nextIdx !== index) {
          setStepIndex(nextIdx);
        } else {
          const targetIndex = index + 1;
          const clamped = Math.max(0, Math.min(targetIndex, steps.length - 1));
          setStepIndex(clamped);
        }
      }, 100);
    }
  };

  const startTour = () => {
    if (run) return;
    if (startLockRef.current) return;
    startLockRef.current = true;
    try {
      localStorage.removeItem("guestReplayTutorial");
      localStorage.removeItem("touristReplayTutorial");
      localStorage.removeItem("mapTourForceStart");
    } catch {}
    const firstIdx = findNextAvailableIndex(-1, 1);
    setStepIndex(typeof firstIdx === 'number' ? firstIdx : 0);
    setRun(true);
    setTimeout(() => { startLockRef.current = false; }, 2000);
  };

  // Removed GPS consent gating logic

  const stopTour = () => {
    setRun(false);
    setStepIndex(0);
  };

  return (
    <TourContext.Provider value={{ startTour, stopTour, hasCompletedTour, isTourRunning: run }}>
      {children}
      {/* Custom persistent overlay with SVG mask for rounded spotlight */}
      {run && spotlightRect && (
        <>
          {/* Interaction shield to prevent background handlers during tour */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 9996,
              background: 'transparent',
              pointerEvents: 'auto',
            }}
          />
          <svg
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 9997,
              pointerEvents: 'none',
            }}
          >
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotlightRect.left}
                  y={spotlightRect.top}
                  width={spotlightRect.width}
                  height={spotlightRect.height}
                  rx="20"
                  ry="20"
                  fill="black"
                  style={{ transition: 'all 0.3s ease-in-out' }}
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.75)"
              mask="url(#spotlight-mask)"
            />
          </svg>
          
          {/* Rounded corner overlays to hide sharp edges */}
          <div style={{
            position: 'fixed',
            top: spotlightRect.top - 4,
            left: spotlightRect.left - 4,
            width: spotlightRect.width + 8,
            height: spotlightRect.height + 8,
            borderRadius: '20px',
            boxShadow: 'inset 0 0 0 4px rgba(0, 0, 0, 0.75)',
            zIndex: 9998,
            pointerEvents: 'none',
            transition: 'all 0.3s ease-in-out',
          }} />
        </>
      )}
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress={false}
        showSkipButton
        scrollToFirstStep={scrollToFirstStep}
        disableScrolling={disableScrolling}
        disableScrollParentFix
        disableBeacon
        hideBackButton={false}
        spotlightClicks={false}
        disableOverlay={false}
        callback={handleJoyrideCallback}
        tooltipComponent={CustomTourTooltip}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: "#fff",
            backgroundColor: "#fff",
            overlayColor: "transparent",
            primaryColor: "#f04e37",
            textColor: "#333",
            spotlightPadding: 0,
          },
          overlay: {
            display: 'none',
          },
          spotlight: {
            display: 'none',
          },
        }}
        floaterProps={{
          disableAnimation: true,
          disableFlip: false,
          hideArrow: true,
          offset: isMobile ? 15 : 20,
          styles: {
            arrow: {
              display: 'none',
            },
            floater: {
              filter: 'none',
            },
          },
          options: {
            preventOverflow: {
              boundariesElement: 'viewport',
              padding: isMobile ? 16 : 24,
            },
            flip: {
              enabled: false,
              behavior: ['left', 'right', 'top', 'bottom'],
            },
          },
        }}
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip Tour",
        }}
      />
    </TourContext.Provider>
  );
}