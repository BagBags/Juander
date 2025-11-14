import React, { createContext, useContext, useState, useEffect } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";
import CustomTourTooltip from "./CustomTourTooltip";
import { completeTour as apiCompleteTour, getTourStatus } from "../../utils/tourApi";
import "./tour.css";

const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within TourProvider");
  }
  return context;
};

export default function TourProvider({ children, steps = [], userRole = "tourist" }) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // Default to true to prevent flash
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [spotlightRect, setSpotlightRect] = useState(null);

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

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      // Update step index
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour finished or skipped
      setRun(false);
      setStepIndex(0);

      // Mark as completed in database (only if finished, not skipped)
      if (status === STATUS.FINISHED && userRole === "tourist") {
        try {
          await apiCompleteTour();
          setHasCompletedTour(true);
        } catch (error) {
          console.error("Error marking tour as complete:", error);
        }
      }
    }
  };

  const startTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  // Removed GPS consent gating logic

  const stopTour = () => {
    setRun(false);
    setStepIndex(0);
  };

  return (
    <TourContext.Provider value={{ startTour, stopTour, hasCompletedTour }}>
      {children}
      {/* Custom persistent overlay with SVG mask for rounded spotlight */}
      {run && spotlightRect && (
        <>
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
        scrollToFirstStep
        disableScrolling={false}
        disableScrollParentFix
        disableBeacon
        hideBackButton={false}
        spotlightClicks
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
          disableAnimation: false,
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
              enabled: true,
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