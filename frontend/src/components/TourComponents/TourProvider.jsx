import React, { useState, useEffect, useRef } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";
import CustomTourTooltip from "./CustomTourTooltip";
import {
  completeTour as apiCompleteTour,
  getTourStatus,
  completeCreateItineraryTour as apiCompleteCreateItineraryTour,
  getEmergencyTourStatus,
  completeEmergencyTour as apiCompleteEmergencyTour,
  getProfileTourStatus,
  completeProfileTour as apiCompleteProfileTour,
  getGuestProfileTourStatus,
  completeGuestProfileTour as apiCompleteGuestProfileTour,
  getTourMapTourStatus,
  completeTourMapTour as apiCompleteTourMapTour,
  getPhotoboothTourStatus,
  completePhotoboothTour as apiCompletePhotoboothTour,
  getTripArchiveTourStatus,
  completeTripArchiveTour as apiCompleteTripArchiveTour,
} from "../../utils/tourApi";
import "./tour.css";
import { TourContext } from "./TourContext";

// TourContext and useTour moved to separate module to keep provider export compatible with Fast Refresh

export default function TourProvider({
  children,
  steps = [],
  userRole = "tourist",
  scrollToFirstStep = true,
  disableScrolling = false,
  tourType = "homepage",
}) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // Default to true to prevent flash
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const startLockRef = useRef(false);
  const suppressFinishRef = useRef(false);
  const EmptyTooltip = () => null;
  const tooltipWrapRef = useRef(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });
  const pollCountRef = useRef(0);
  const centeredStepRef = useRef(null);
  const lockedAddBtnRef = useRef(null);

  const getScrollableAncestor = (el) => {
    let p = el?.parentElement;
    while (p) {
      const s = window.getComputedStyle(p);
      const oy = s.overflowY;
      if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight)
        return p;
      p = p.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  };

  const resolveTarget = (selector) => {
    const list = Array.from(document.querySelectorAll(selector));
    if (!list.length) return null;
    let best = list[0];
    let bestVisible = -Infinity;
    const viewTop = 0;
    const viewBottom = window.innerHeight;
    for (const el of list) {
      const r = el.getBoundingClientRect();
      const visible = Math.min(r.bottom, viewBottom) - Math.max(r.top, viewTop);
      if (visible > bestVisible) {
        bestVisible = visible;
        best = el;
      }
    }
    return best;
  };

  const getFirstInSection = (sectionSelector, targetSelector) => {
    const section = document.querySelector(sectionSelector);
    if (!section) return null;
    return section.querySelector(targetSelector);
  };

  const scrollOuterToElement = (outer, el, headerOffset) => {
    if (!outer || !el) return;
    const oRect = outer.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const top =
      eRect.top -
      oRect.top +
      outer.scrollTop -
      Math.max(0, headerOffset) -
      Math.max(0, outer.clientHeight * 0.25);
    outer.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  const getOffsetTopWithinAncestor = (el, ancestor) => {
    let y = 0;
    let n = el;
    while (n && n !== ancestor) {
      y += n.offsetTop || 0;
      n = n.offsetParent;
    }
    return y;
  };

  const findOuterScrollContainer = () => {
    return (
      document.querySelector(".relative.flex-1.overflow-y-auto") ||
      document.querySelector(".tour-page-scroll") ||
      document.querySelector(".overflow-y-auto") ||
      null
    );
  };

  const ensureAddButtonVisible = (preferInstant = false, addBtnEl = null) => {
    try {
      const outer = findOuterScrollContainer();
      const addBtn =
        addBtnEl ||
        getFirstInSection(
          ".available-sites-section",
          ".create-itinerary-add-btn"
        ) ||
        resolveTarget(".create-itinerary-add-btn");
      const headerOffset = isMobile ? 60 : 80;
      if (outer && addBtn) {
        const offsetWithin = getOffsetTopWithinAncestor(addBtn, outer);
        const center =
          offsetWithin -
          Math.max(0, (outer.clientHeight - addBtn.offsetHeight) / 2) -
          Math.max(0, headerOffset);
        outer.scrollTo({
          top: Math.max(0, center),
          behavior: preferInstant ? "auto" : "smooth",
        });
        if (!preferInstant) {
          setTimeout(() => {
            try {
              const offsetWithin2 = getOffsetTopWithinAncestor(addBtn, outer);
              const center2 =
                offsetWithin2 -
                Math.max(0, (outer.clientHeight - addBtn.offsetHeight) / 2) -
                Math.max(0, headerOffset);
              outer.scrollTo({ top: Math.max(0, center2), behavior: "smooth" });
            } catch {}
          }, 180);
        }
      }
    } catch {}
  };

  const scrollTargetIntoView = (el) => {
    if (!el) return;
    const scroller = getScrollableAncestor(el);
    if (!scroller) return;
    const headerOffset = isMobile ? 60 : 80;
    if (
      scroller === document.scrollingElement ||
      scroller === document.documentElement ||
      scroller === document.body
    ) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {}
      try {
        const rect = el.getBoundingClientRect();
        window.scrollTo({
          top: window.scrollY + rect.top - Math.max(0, headerOffset),
          behavior: "smooth",
        });
      } catch {}
      return;
    }
    try {
      const scRectPage = scroller.getBoundingClientRect();
      const pageTop = (document.scrollingElement || document.documentElement)
        .scrollTop;
      (document.scrollingElement || document.documentElement).scrollTo({
        top: pageTop + scRectPage.top - headerOffset - 30,
        behavior: "smooth",
      });
    } catch {}
    try {
      const scRect = scroller.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const topWithin = elRect.top - scRect.top + scroller.scrollTop;
      const targetTop =
        topWithin -
        Math.max(0, (scroller.clientHeight - elRect.height) / 2) -
        Math.max(0, headerOffset);
      scroller.scrollTo({ top: targetTop, behavior: "smooth" });
    } catch {}
  };

  // Helper: find the next available step whose target exists in the DOM
  const findNextAvailableIndex = (fromIndex, direction = 1) => {
    let i = fromIndex + direction;
    while (i >= 0 && i < steps.length) {
      const tgt = steps[i]?.target;
      if (tgt && typeof tgt === "string" && document.querySelector(tgt)) {
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent page scroll while tour runs
  useEffect(() => {
    if (run) {
      try {
        document.body.classList.add("tour-active");
      } catch {}
    } else {
      try {
        document.body.classList.remove("tour-active");
      } catch {}
    }
    return () => {
      try {
        document.body.classList.remove("tour-active");
      } catch {}
    };
  }, [run]);

  // Update spotlight position when step changes
  useEffect(() => {
    if (!run || !steps[stepIndex]) return;

    // Auto open My Itineraries tab and expand first card when reaching those steps
    try {
      const tgt = steps[stepIndex]?.target || "";
      if (tgt === ".my-itineraries-tab-btn") {
        window.dispatchEvent(new CustomEvent("tour:openMyItineraries"));
      } else if (
        tgt === ".my-itinerary-edit-btn" ||
        tgt === ".my-itinerary-delete-btn" ||
        tgt === ".my-itinerary-view-sites-btn"
      ) {
        window.dispatchEvent(new CustomEvent("tour:expandFirstItinerary"));
      } else if (tgt === ".trip-tab-reviews-btn") {
        window.dispatchEvent(new CustomEvent("tour:tripArchiveOpenReviewsTab"));
      } else if (tgt === ".trip-places-list") {
        window.dispatchEvent(new CustomEvent("tour:tripArchiveOpenPlacesTab"));
      } else if (tgt === ".trip-tab-places-btn") {
        window.dispatchEvent(new CustomEvent("tour:tripArchiveOpenPlacesTab"));
      } else if (tgt === ".trip-review-modal") {
        window.dispatchEvent(new CustomEvent("tour:tripArchiveOpenReviewModalAgain"));
      }
    } catch {}

    const updateSpotlight = () => {
      const selector = steps[stepIndex].target;
      if (selector === ".trip-tour-ender") {
        setSpotlightRect(null);
        return;
      }
      const target =
        selector === ".create-itinerary-add-btn"
          ? lockedAddBtnRef.current
          : resolveTarget(selector);
      if (selector !== ".create-itinerary-add-btn") {
        scrollTargetIntoView(target);
      }
      if (target) {
        const rect = target.getBoundingClientRect();
        setSpotlightRect({
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
        });
      }
    };

    try {
      const selector = steps[stepIndex].target;
      if (
        selector === ".create-itinerary-add-btn" &&
        centeredStepRef.current !== stepIndex
      ) {
        centeredStepRef.current = stepIndex;
        lockedAddBtnRef.current =
          getFirstInSection(
            ".available-sites-section",
            ".create-itinerary-add-btn"
          ) || resolveTarget(".create-itinerary-add-btn");
        ensureAddButtonVisible(true, lockedAddBtnRef.current);
        setTimeout(updateSpotlight, 180);
      }
    } catch {}

    pollCountRef.current = 0;
    const maxPoll =
      steps[stepIndex].target === ".create-itinerary-add-btn" ? 1 : 6;
    const poll = () => {
      pollCountRef.current += 1;
      updateSpotlight();
      if (pollCountRef.current < maxPoll) {
        setTimeout(poll, 120);
      }
    };
    poll();
    return () => {
      pollCountRef.current = 0;
    };
  }, [run, stepIndex, steps]);

  // Measure tooltip size after render for accurate placement
  useEffect(() => {
    if (!run) return;
    const measure = () => {
      const el = tooltipWrapRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setTooltipSize({ width: rect.width, height: rect.height });
      }
    };
    const id = setTimeout(measure, 0);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, [run, stepIndex, isMobile]);

  // Check tour status on mount (only for tourists)
  useEffect(() => {
    console.log(" TourProvider mounted, userRole:", userRole);

    const checkTourStatus = async () => {
      // Guests or unauthenticated: do not call backend; use localStorage flags only
      if (userRole === "guest" || !localStorage.getItem("token")) {
        try {
          if (tourType === "homepage") {
            const disabled = localStorage.getItem("guestTutorialsDisabled") === "true";
            const replay = localStorage.getItem("guestReplayTutorial") === "true";
            setHasCompletedTour(disabled || !replay);
            return;
          }
          if (tourType === "map") {
            setHasCompletedTour(!(localStorage.getItem("mapTourForceStart") === "true"));
            return;
          }
          if (tourType === "tourMap") {
            const disabled = localStorage.getItem("guestTutorialsDisabled") === "true";
            const completed = localStorage.getItem("guestTourMapTourCompleted") === "true";
            setHasCompletedTour(disabled || completed);
            return;
          }
          if (tourType === "guestProfile") {
            setHasCompletedTour(!(localStorage.getItem("guestProfileTourForceStart") === "true"));
            return;
          }
          if (tourType === "photobooth") {
            setHasCompletedTour(!(localStorage.getItem("guestPhotoboothTourForceStart") === "true"));
            return;
          }
          if (tourType === "emergency") {
            setHasCompletedTour(!(localStorage.getItem("guestEmergencyTourForceStart") === "true"));
            return;
          }
        } catch {}
        setHasCompletedTour(true);
        return;
      }

      try {
        if (tourType === "emergency") {
          const status = await getEmergencyTourStatus();
          setHasCompletedTour(status.hasCompletedEmergencyTour);
        } else if (tourType === "profile") {
          const status = await getProfileTourStatus();
          setHasCompletedTour(status.hasCompletedProfileTour);
        } else if (tourType === "guestProfile") {
          const status = await getGuestProfileTourStatus();
          setHasCompletedTour(status.hasCompletedGuestProfileTour);
      } else if (tourType === "tourMap") {
        const status = await getTourMapTourStatus();
        setHasCompletedTour(status.hasCompletedTourMapTour);
      } else if (tourType === "photobooth") {
        const status = await getPhotoboothTourStatus();
        setHasCompletedTour(status.hasCompletedPhotoboothTour);
      } else if (tourType === "tripArchive") {
        const status = await getTripArchiveTourStatus();
        setHasCompletedTour(status.hasCompletedTripArchiveTour);
      } else {
        const status = await getTourStatus();
        setHasCompletedTour(status.hasCompletedTour);
      }
      } catch (error) {
        if (userRole === "guest") {
          if (tourType === "homepage") {
            const disabled = localStorage.getItem("guestTutorialsDisabled") === "true";
            if (disabled) {
              setHasCompletedTour(true);
            } else {
              setHasCompletedTour(!(localStorage.getItem("guestReplayTutorial") === "true"));
            }
          } else if (tourType === "map") {
            setHasCompletedTour(!(localStorage.getItem("mapTourForceStart") === "true"));
          } else if (tourType === "guestProfile") {
            setHasCompletedTour(!(localStorage.getItem("guestProfileTourForceStart") === "true"));
          } else if (tourType === "photobooth") {
            setHasCompletedTour(!(localStorage.getItem("guestPhotoboothTourForceStart") === "true"));
          } else if (tourType === "emergency") {
            setHasCompletedTour(!(localStorage.getItem("guestEmergencyTourForceStart") === "true"));
          } else {
            setHasCompletedTour(true);
          }
        } else {
          setHasCompletedTour(true);
        }
      }
    };

    checkTourStatus();
  }, [userRole]);

  const handleJoyrideCallback = async (data) => {
    const { action, index, status, type } = data;
    try {
      console.log("[Tour] event", { action, index, status, type });
    } catch {}

    if (action === ACTIONS.CLOSE) {
      setRun(false);
      setStepIndex(0);
      try {
        if (tourType === "homepage") {
          if (userRole === "guest")
            localStorage.removeItem("guestReplayTutorial");
          if (userRole === "tourist")
            localStorage.removeItem("touristReplayTutorial");
        } else if (tourType === "map") {
          localStorage.removeItem("mapTourForceStart");
        } else if (tourType === "guestProfile") {
          localStorage.removeItem("guestProfileTourForceStart");
        } else if (tourType === "photobooth") {
          localStorage.removeItem("guestPhotoboothTourForceStart");
        } else if (tourType === "emergency") {
          localStorage.removeItem("guestEmergencyTourForceStart");
        }
      } catch {}
      if (userRole === "tourist" && localStorage.getItem("token")) {
        try {
          if (tourType === "createItinerary") {
            await apiCompleteCreateItineraryTour();
          } else if (tourType === "emergency") {
            await apiCompleteEmergencyTour();
          } else if (tourType === "profile") {
            await apiCompleteProfileTour();
          } else if (tourType === "guestProfile") {
            await apiCompleteGuestProfileTour();
          } else if (tourType === "tourMap") {
            await apiCompleteTourMapTour();
          } else if (tourType === "photobooth") {
            await apiCompletePhotoboothTour();
          } else if (tourType === "tripArchive") {
            await apiCompleteTripArchiveTour();
          } else {
            await apiCompleteTour();
          }
          setHasCompletedTour(true);
        } catch {}
      }
      return;
    }

    // Do not process PREV here to avoid double-handling; handle only on STEP_AFTER

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      setStepIndex(0);

      try {
        if (tourType === "homepage") {
          if (userRole === "guest")
            localStorage.removeItem("guestReplayTutorial");
          if (userRole === "tourist")
            localStorage.removeItem("touristReplayTutorial");
        } else if (tourType === "map") {
          localStorage.removeItem("mapTourForceStart");
        } else if (tourType === "tourMap") {
          localStorage.setItem("guestTourMapTourCompleted", "true");
        } else if (tourType === "guestProfile") {
          localStorage.removeItem("guestProfileTourForceStart");
        } else if (tourType === "photobooth") {
          localStorage.removeItem("guestPhotoboothTourForceStart");
        } else if (tourType === "emergency") {
          localStorage.removeItem("guestEmergencyTourForceStart");
        }
      } catch (e) {}

      if (status === STATUS.FINISHED && userRole === "tourist" && localStorage.getItem("token")) {
        try {
          if (tourType === "createItinerary") {
            await apiCompleteCreateItineraryTour();
          } else if (tourType === "emergency") {
            await apiCompleteEmergencyTour();
          } else if (tourType === "profile") {
            await apiCompleteProfileTour();
          } else if (tourType === "guestProfile") {
            await apiCompleteGuestProfileTour();
          } else {
            await apiCompleteTour();
          }
          setHasCompletedTour(true);
        } catch (error) {}
      }
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      if (
        action === ACTIONS.NEXT &&
        index >= steps.length - 1 &&
        !suppressFinishRef.current
      ) {
        setRun(false);
        setStepIndex(0);
        try {
          if (tourType === "homepage") {
            if (userRole === "guest")
              localStorage.removeItem("guestReplayTutorial");
            if (userRole === "tourist")
              localStorage.removeItem("touristReplayTutorial");
          } else if (tourType === "map") {
            localStorage.removeItem("mapTourForceStart");
          } else if (tourType === "guestProfile") {
            localStorage.removeItem("guestProfileTourForceStart");
          } else if (tourType === "photobooth") {
            localStorage.removeItem("guestPhotoboothTourForceStart");
          } else if (tourType === "emergency") {
            localStorage.removeItem("guestEmergencyTourForceStart");
          }
        } catch {}
        if (userRole === "tourist" && localStorage.getItem("token")) {
          try {
            if (tourType === "createItinerary") {
              await apiCompleteCreateItineraryTour();
            } else if (tourType === "emergency") {
              await apiCompleteEmergencyTour();
            } else if (tourType === "tourMap") {
              await apiCompleteTourMapTour();
            } else if (tourType === "photobooth") {
              await apiCompletePhotoboothTour();
            } else if (tourType === "tripArchive") {
              await apiCompleteTripArchiveTour();
            } else {
              await apiCompleteTour();
            }
            setHasCompletedTour(true);
          } catch {}
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
      if (typeof nextIdx === "number" && nextIdx !== index) {
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
        if (typeof nextIdx === "number" && nextIdx !== index) {
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
    const firstIdx = findNextAvailableIndex(-1, 1);
    setStepIndex(typeof firstIdx === "number" ? firstIdx : 0);
    setRun(true);
    setTimeout(() => {
      startLockRef.current = false;
    }, 2000);
  };

  // Removed GPS consent gating logic

  const stopTour = () => {
    setRun(false);
    setStepIndex(0);
  };

  return (
    <TourContext.Provider
      value={{ startTour, stopTour, hasCompletedTour, isTourRunning: run }}
    >
      {children}
      {/* Custom persistent overlay with SVG mask for rounded spotlight */}
      {run && spotlightRect && steps[stepIndex]?.target !== ".trip-tour-ender" && (
        <>
          {/* Interaction shield to prevent background handlers during tour */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 9996,
              background: "transparent",
              pointerEvents: "auto",
            }}
          />
          <svg
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 9997,
              pointerEvents: "none",
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
                  style={{ transition: "all 0.3s ease-in-out" }}
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
          <div
            style={{
              position: "fixed",
              top: spotlightRect.top - 4,
              left: spotlightRect.left - 4,
              width: spotlightRect.width + 8,
              height: spotlightRect.height + 8,
              borderRadius: "20px",
              boxShadow: "inset 0 0 0 4px rgba(0, 0, 0, 0.75)",
              zIndex: 9998,
              pointerEvents: "none",
              transition: "all 0.3s ease-in-out",
            }}
          />

          {/* Persistent tooltip positioned near spotlight */}
          {steps[stepIndex] &&
            (() => {
              const margin = isMobile ? 10 : 14;
              const offset = isMobile ? 6 : 8;
              const preferAboveTargets = [
                ".create-itinerary-save-btn",
                ".create-itinerary-search",
                ".create-itinerary-add-btn",
                ".my-itineraries-tab-btn",
                ".my-itinerary-edit-btn",
                ".my-itinerary-delete-btn",
                ".my-itinerary-view-sites-btn",
                ".emergency-first-contact",
                ".trip-write-review-btn",
                ".trip-edit-review-btn",
                ".trip-delete-review-btn",
                ".trip-place-card",
              ];
              const preferAbove = preferAboveTargets.includes(
                steps[stepIndex].target
              );
              const width = Math.min(360, window.innerWidth - margin * 2);
              const height = Math.min(
                tooltipSize.height || 220,
                window.innerHeight - margin * 2
              );
              const centerX = spotlightRect.left + spotlightRect.width / 2;
              let left = Math.max(
                margin,
                Math.min(
                  centerX - width / 2,
                  window.innerWidth - margin - width
                )
              );
              let placeBelowTop =
                spotlightRect.top + spotlightRect.height + offset;
              let top;
              if (
                preferAbove &&
                spotlightRect.top - offset - height - margin >= margin
              ) {
                top = Math.max(margin, spotlightRect.top - offset - height);
              } else if (
                placeBelowTop + height + margin <=
                window.innerHeight
              ) {
                top = placeBelowTop;
              } else {
                top = Math.max(margin, spotlightRect.top - offset - height);
              }
              top = Math.min(top, window.innerHeight - margin - height);
              return (
                <div
                  ref={tooltipWrapRef}
                  style={{
                    position: "fixed",
                    top,
                    left,
                    zIndex: 100010,
                    width,
                    maxWidth: `calc(100vw - ${margin * 2}px)`,
                    maxHeight: height,
                    overflow: "visible",
                  }}
                >
                  <CustomTourTooltip
                    continuous
                    index={stepIndex}
                    step={steps[stepIndex]}
                    isLastStep={stepIndex >= steps.length - 1}
                    size={steps.length}
                    onBack={() => {
                      if (stepIndex <= 0) return;
                      const prev = stepIndex - 1;
                      const prevTarget = steps[prev]?.target;
                      setStepIndex(prev);
                      if (
                        prevTarget === ".create-itinerary-save-btn" ||
                        prevTarget === ".create-itinerary-add-btn" ||
                        prevTarget === ".create-itinerary-search"
                      ) {
                        try {
                          window.dispatchEvent(
                            new CustomEvent("tour:returnToCreateItinerary")
                          );
                        } catch {}
                      }
                      if (prevTarget === ".trip-tab-reviews-btn") {
                        try {
                          window.dispatchEvent(new CustomEvent("tour:tripArchiveOpenReviewsTab"));
                        } catch {}
                      }
                      if (prevTarget === ".trip-places-list") {
                        try {
                          window.dispatchEvent(new CustomEvent("tour:tripArchiveOpenPlacesTab"));
                        } catch {}
                      }
                      if (prevTarget === ".trip-tab-places-btn") {
                        try {
                          window.dispatchEvent(new CustomEvent("tour:tripArchiveOpenPlacesTab"));
                        } catch {}
                      }
                      if (prevTarget === ".trip-write-review-btn") {
                        try {
                          window.dispatchEvent(new CustomEvent("tour:tripArchiveCloseReviewModal"));
                        } catch {}
                      }
                      if (prevTarget === ".create-itinerary-add-btn") {
                        try {
                          const firstAdd =
                            getFirstInSection(
                              ".available-sites-section",
                              ".create-itinerary-add-btn"
                            ) || resolveTarget(".create-itinerary-add-btn");
                          lockedAddBtnRef.current = firstAdd;
                          centeredStepRef.current = null;
                          ensureAddButtonVisible(true, firstAdd);
                          setTimeout(() => {
                            const outer = findOuterScrollContainer();
                            if (outer && firstAdd) {
                              const offsetWithin = getOffsetTopWithinAncestor(
                                firstAdd,
                                outer
                              );
                              const headerOffset = isMobile ? 60 : 80;
                              const center =
                                offsetWithin -
                                Math.max(
                                  0,
                                  (outer.clientHeight - firstAdd.offsetHeight) /
                                    2
                                ) -
                                Math.max(0, headerOffset);
                              outer.scrollTo({
                                top: Math.max(0, center),
                                behavior: "auto",
                              });
                            }
                          }, 140);
                        } catch {}
                      }
                    }}
                     onSkip={() => {
                      setRun(false);
                      setStepIndex(0);
                      try {
                        if (tourType === "homepage") {
                          if (userRole === "guest")
                            localStorage.removeItem("guestReplayTutorial");
                          if (userRole === "tourist")
                            localStorage.removeItem("touristReplayTutorial");
                        } else if (tourType === "map") {
                          localStorage.removeItem("mapTourForceStart");
                        } else if (tourType === "tourMap") {
                          localStorage.setItem("guestTourMapTourCompleted", "true");
                        } else if (tourType === "guestProfile") {
                          localStorage.removeItem("guestProfileTourForceStart");
                        } else if (tourType === "photobooth") {
                          localStorage.removeItem("guestPhotoboothTourForceStart");
                        } else if (tourType === "emergency") {
                          localStorage.removeItem("guestEmergencyTourForceStart");
                        }
                      } catch {}
                      setHasCompletedTour(true);
                      if (userRole === "tourist" && localStorage.getItem("token")) {
                        (async () => {
                          try {
                            if (tourType === "createItinerary") {
                              await apiCompleteCreateItineraryTour();
                            } else if (tourType === "emergency") {
                              await apiCompleteEmergencyTour();
                            } else if (tourType === "profile") {
                              await apiCompleteProfileTour();
                            } else if (tourType === "guestProfile") {
                              await apiCompleteGuestProfileTour();
                            } else if (tourType === "tourMap") {
                              await apiCompleteTourMapTour();
                            } else if (tourType === "photobooth") {
                              await apiCompletePhotoboothTour();
                            } else if (tourType === "tripArchive") {
                              await apiCompleteTripArchiveTour();
                            } else {
                              await apiCompleteTour();
                            }
                            setHasCompletedTour(true);
                          } catch {}
                        })();
                      }
                    }}
                    onNext={async () => {
                      if (stepIndex >= steps.length - 1) {
                        setRun(false);
                        setStepIndex(0);
                        try {
                          if (tourType === "homepage") {
                            if (userRole === "guest")
                              localStorage.removeItem("guestReplayTutorial");
                            if (userRole === "tourist")
                              localStorage.removeItem("touristReplayTutorial");
                          } else if (tourType === "map") {
                            localStorage.removeItem("mapTourForceStart");
                          } else if (tourType === "tourMap") {
                            localStorage.setItem("guestTourMapTourCompleted", "true");
                          } else if (tourType === "guestProfile") {
                            localStorage.removeItem("guestProfileTourForceStart");
                          } else if (tourType === "photobooth") {
                            localStorage.removeItem("guestPhotoboothTourForceStart");
                          } else if (tourType === "emergency") {
                            localStorage.removeItem("guestEmergencyTourForceStart");
                          }
                        } catch {}
                        setHasCompletedTour(true);
                        if (userRole === "tourist" && localStorage.getItem("token")) {
                          try {
                            if (tourType === "createItinerary") {
                              await apiCompleteCreateItineraryTour();
                            } else if (tourType === "emergency") {
                              await apiCompleteEmergencyTour();
                            } else if (tourType === "profile") {
                              await apiCompleteProfileTour();
                            } else if (tourType === "guestProfile") {
                              await apiCompleteGuestProfileTour();
                            } else {
                              await apiCompleteTour();
                            }
                            setHasCompletedTour(true);
                          } catch {}
                        }
                        return;
                      }
                      const nextIdx = findNextAvailableIndex(stepIndex, 1);
                      const currentTarget = steps[stepIndex]?.target;
                      const nextTarget =
                        steps[Math.min(stepIndex + 1, steps.length - 1)]
                          ?.target;
                      const doPreScroll =
                        currentTarget === ".create-itinerary-search" &&
                        nextTarget === ".create-itinerary-add-btn";
                      if (doPreScroll) {
                        const firstAdd =
                          getFirstInSection(
                            ".available-sites-section",
                            ".create-itinerary-add-btn"
                          ) || resolveTarget(".create-itinerary-add-btn");
                        lockedAddBtnRef.current = firstAdd;
                        ensureAddButtonVisible(true, firstAdd);
                      }
                      const applyNext = () => {
                        if (
                          typeof nextIdx === "number" &&
                          nextIdx !== stepIndex
                        ) {
                          setStepIndex(nextIdx);
                        } else {
                          const targetIndex = stepIndex + 1;
                          const clamped = Math.max(
                            0,
                            Math.min(targetIndex, steps.length - 1)
                          );
                          setStepIndex(clamped);
                        }
                      };
                      if (doPreScroll) {
                        setTimeout(applyNext, 220);
                      } else {
                        applyNext();
                      }
                    }}
                     onClose={async () => {
                      setRun(false);
                      setStepIndex(0);
                      try {
                        if (tourType === "homepage") {
                          if (userRole === "guest")
                            localStorage.removeItem("guestReplayTutorial");
                          if (userRole === "tourist")
                            localStorage.removeItem("touristReplayTutorial");
                        } else if (tourType === "map") {
                          localStorage.removeItem("mapTourForceStart");
                        } else if (tourType === "tourMap") {
                          localStorage.setItem("guestTourMapTourCompleted", "true");
                        } else if (tourType === "guestProfile") {
                          localStorage.removeItem("guestProfileTourForceStart");
                        } else if (tourType === "photobooth") {
                          localStorage.removeItem("guestPhotoboothTourForceStart");
                        } else if (tourType === "emergency") {
                          localStorage.removeItem("guestEmergencyTourForceStart");
                        }
                      } catch {}
                      setHasCompletedTour(true);
                      if (userRole === "tourist") {
                        try {
                          if (tourType === "createItinerary") {
                            await apiCompleteCreateItineraryTour();
                          } else if (tourType === "emergency") {
                            await apiCompleteEmergencyTour();
                          } else if (tourType === "profile") {
                            await apiCompleteProfileTour();
                          } else if (tourType === "guestProfile") {
                            await apiCompleteGuestProfileTour();
                          } else if (tourType === "tourMap") {
                            await apiCompleteTourMapTour();
                          } else if (tourType === "photobooth") {
                            await apiCompletePhotoboothTour();
                          } else {
                            await apiCompleteTour();
                          }
                          setHasCompletedTour(true);
                        } catch {}
                      }
                    }}
                    external
                  />
                </div>
              );
            })()}
        </>
      )}
      {run && steps[stepIndex]?.target === ".trip-tour-ender" && (() => {
        const margin = isMobile ? 12 : 16;
        const width = Math.min(360, window.innerWidth - margin * 2);
        const height = Math.min(tooltipSize.height || 220, window.innerHeight - margin * 2);
        const left = Math.max(margin, Math.min((window.innerWidth - width) / 2, window.innerWidth - margin - width));
        const top = Math.max(margin, Math.min((window.innerHeight - height) / 2, window.innerHeight - margin - height));
        return (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 9996,
                background: "transparent",
                pointerEvents: "auto",
              }}
            />
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 9997,
                background: "rgba(0, 0, 0, 0.75)",
                pointerEvents: "none",
              }}
            />
            <div
              ref={tooltipWrapRef}
              style={{
                position: "fixed",
                top,
                left,
                zIndex: 100010,
                width,
                maxWidth: `calc(100vw - ${margin * 2}px)`,
                maxHeight: height,
                overflow: "visible",
              }}
            >
              <CustomTourTooltip
                continuous
                index={stepIndex}
                step={steps[stepIndex]}
                isLastStep={stepIndex >= steps.length - 1}
                size={steps.length}
                onBack={() => {
                  if (stepIndex <= 0) return;
                  const prev = stepIndex - 1;
                  const prevTarget = steps[prev]?.target;
                  setStepIndex(prev);
                  if (prevTarget === ".trip-tab-reviews-btn") {
                    try {
                      window.dispatchEvent(new CustomEvent("tour:tripArchiveOpenReviewsTab"));
                    } catch {}
                  }
                  if (prevTarget === ".trip-places-list" || prevTarget === ".trip-tab-places-btn") {
                    try {
                      window.dispatchEvent(new CustomEvent("tour:tripArchiveOpenPlacesTab"));
                    } catch {}
                  }
                }}
                onSkip={() => {
                  setRun(false);
                  setStepIndex(0);
                }}
                onNext={async () => {
                  setRun(false);
                  setStepIndex(0);
                  if (userRole === "tourist" && localStorage.getItem("token")) {
                    try {
                      await apiCompleteTripArchiveTour();
                      setHasCompletedTour(true);
                    } catch {}
                  }
                }}
                onClose={async () => {
                  setRun(false);
                  setStepIndex(0);
                  if (userRole === "tourist" && localStorage.getItem("token")) {
                    try {
                      await apiCompleteTripArchiveTour();
                      setHasCompletedTour(true);
                    } catch {}
                  }
                }}
                external
              />
            </div>
          </>
        );
      })()}
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress={false}
        showSkipButton
        scrollToFirstStep={scrollToFirstStep}
        disableScrolling={
          disableScrolling ||
          steps[stepIndex]?.target === ".create-itinerary-add-btn"
        }
        disableScrollParentFix
        disableBeacon
        hideBackButton={false}
        spotlightClicks={false}
        disableOverlay={false}
        callback={handleJoyrideCallback}
        tooltipComponent={EmptyTooltip}
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
            display: "none",
          },
          spotlight: {
            display: "none",
          },
        }}
        floaterProps={{
          disableAnimation: true,
          disableFlip: false,
          hideArrow: true,
          offset: isMobile ? 15 : 20,
          styles: {
            arrow: {
              display: "none",
            },
            floater: {
              filter: "none",
              zIndex: 100000,
            },
          },
          options: {
            preventOverflow: {
              boundariesElement: "viewport",
              padding: isMobile ? 16 : 24,
            },
            flip: {
              enabled: false,
              behavior: ["left", "right", "top", "bottom"],
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