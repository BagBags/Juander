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
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress={false}
        showSkipButton
        scrollToFirstStep
        disableScrolling={false}
        callback={handleJoyrideCallback}
        tooltipComponent={CustomTourTooltip}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: "#fff",
            backgroundColor: "#fff",
            overlayColor: "rgba(0, 0, 0, 0.7)",
            primaryColor: "#f04e37",
            textColor: "#333",
          },
          spotlight: {
            borderRadius: "16px",
          },
        }}
        floaterProps={{
          disableAnimation: false,
          styles: {
            arrow: {
              length: 8,
              spread: 16,
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