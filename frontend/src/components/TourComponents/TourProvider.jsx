import React, { useState, useEffect, useRef } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";
import CustomTourTooltip from "./CustomTourTooltip";
import { useTranslation } from "react-i18next";
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
  const { i18n } = useTranslation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(null); // Default to true to prevent flash
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
  const currentTargetRef = useRef(null);
  const autoAdvanceUntilRef = useRef(0);
  const lastSpotlightRectRef = useRef(null);

  const langRaw = (
    localStorage.getItem("i18nextLng") ||
    i18n.language ||
    "en"
  ).toLowerCase();
  const isTagalog =
    langRaw.startsWith("tl") ||
    langRaw.startsWith("fil") ||
    langRaw.startsWith("tagalog");
  const localizeStep = (s) => {
    if (!s) return s;
    const title = isTagalog && s.titleTl ? s.titleTl : s.title;
    const content = isTagalog && s.contentTl ? s.contentTl : s.content;
    return { ...s, title, content };
  };

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
    outer.scrollTo({
      top: Math.max(0, top),
      behavior: "auto",
    });
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
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        outer.scrollTo({
          top: Math.max(0, center),
          behavior: "auto",
        });
        if (!preferInstant) {
          setTimeout(() => {
            try {
              const offsetWithin2 = getOffsetTopWithinAncestor(addBtn, outer);
              const center2 =
                offsetWithin2 -
                Math.max(0, (outer.clientHeight - addBtn.offsetHeight) / 2) -
                Math.max(0, headerOffset);
              outer.scrollTo({
                top: Math.max(0, center2),
                behavior: "auto",
              });
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
    try {
      const outer = findOuterScrollContainer();
      if (outer && outer.contains(el)) {
        scrollOuterToElement(outer, el, headerOffset);
        return;
      }
    } catch {}
    try {
      const rect = el.getBoundingClientRect();
      const margin = 8;
      const inView =
        rect.top >= margin && rect.bottom <= window.innerHeight - margin;
      if (inView) return;
    } catch {}
    if (
      scroller === document.scrollingElement ||
      scroller === document.documentElement ||
      scroller === document.body
    ) {
      try {
        el.scrollIntoView({
          behavior: "auto",
          block: "center",
        });
      } catch {}
      try {
        const rect = el.getBoundingClientRect();
        window.scrollTo({
          top: window.scrollY + rect.top - Math.max(0, headerOffset),
          behavior: "auto",
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
        behavior: "auto",
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
      scroller.scrollTo({
        top: targetTop,
        behavior: "auto",
      });
    } catch {}
  };

  const isSelectorVisible = (selector) => {
    try {
      const el = document.querySelector(selector);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (!style || style.display === "none" || style.visibility === "hidden") {
        return false;
      }
      const rect = el.getBoundingClientRect();
      const hasSize = rect.width > 0 && rect.height > 0;
      const intersectsViewport =
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth;
      return hasSize && intersectsViewport;
    } catch {
      return false;
    }
  };

  const isElementVisible = (el) => {
    try {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (!style || style.display === "none" || style.visibility === "hidden")
        return false;
      const rect = el.getBoundingClientRect();
      const hasSize = rect.width > 0 && rect.height > 0;
      const intersectsViewport =
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth;
      return hasSize && intersectsViewport;
    } catch {
      return false;
    }
  };

  const findNextAvailableIndex = (fromIndex, direction = 1) => {
    let i = fromIndex + direction;
    while (i >= 0 && i < steps.length) {
      const tgt = steps[i]?.target;
      if (tgt && typeof tgt === "string" && isSelectorVisible(tgt)) {
        return i;
      }
      i += direction;
    }
    if (i < 0) return 0;
    if (i >= steps.length) return steps.length - 1;
    return null;
  };

  const findNextVisibleIndex = (fromIndex, direction = 1) => {
    let i = fromIndex + direction;
    while (i >= 0 && i < steps.length) {
      const tgt = steps[i]?.target;
      if (tgt && typeof tgt === "string") {
        const el = resolveTarget(tgt);
        if (isElementVisible(el)) {
          return i;
        }
      }
      i += direction;
    }
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

  const setSpotlightRectStable = (target) => {
    if (!target) return;
    const measure = (tries) => {
      if (tries <= 0) return;
      let r1;
      const step1 = () => {
        try {
          r1 = target.getBoundingClientRect();
        } catch {}
        requestAnimationFrame(step2);
      };
      const step2 = () => {
        let r2;
        try {
          r2 = target.getBoundingClientRect();
        } catch {}
        if (r1 && r2) {
          const dx = Math.abs((r2.left || 0) - (r1.left || 0));
          const dy = Math.abs((r2.top || 0) - (r1.top || 0));
          const dw = Math.abs((r2.width || 0) - (r1.width || 0));
          const dh = Math.abs((r2.height || 0) - (r1.height || 0));
          const stable = dx < 1 && dy < 1 && dw < 1 && dh < 1;
          if (stable) {
            setSpotlightRect({
              top: r2.top - 6,
              left: r2.left - 6,
              width: r2.width + 12,
              height: r2.height + 12,
            });
            return;
          }
        }
        setTimeout(() => measure(tries - 1), 60);
      };
      requestAnimationFrame(step1);
    };
    measure(8);
  };

  useEffect(() => {
    const docEl = document.documentElement;
    if (run) {
      const sbw = Math.max(0, window.innerWidth - docEl.clientWidth);
      const px = sbw ? `${sbw}px` : "0px";
      docEl.style.setProperty("--scrollbar-comp", px);
      document.body.style.setProperty("--scrollbar-comp", px);
      docEl.classList.add("tour-active");
      document.body.classList.add("tour-active");
    } else {
      docEl.classList.remove("tour-active");
      document.body.classList.remove("tour-active");
      docEl.style.removeProperty("--scrollbar-comp");
      document.body.style.removeProperty("--scrollbar-comp");
    }
    return () => {
      docEl.classList.remove("tour-active");
      document.body.classList.remove("tour-active");
      docEl.style.removeProperty("--scrollbar-comp");
      document.body.style.removeProperty("--scrollbar-comp");
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
        window.dispatchEvent(
          new CustomEvent("tour:tripArchiveOpenReviewModalAgain")
        );
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
      currentTargetRef.current = target;
      try {
        if (target) {
          scrollTargetIntoView(target);
        }
      } catch {}
      if (isElementVisible(target)) {
        setSpotlightRectStable(target);
      } else {
        const now = Date.now();
        if (autoAdvanceUntilRef.current > now) return;
        const nextIdx = findNextVisibleIndex(stepIndex, 1);
        if (typeof nextIdx === "number" && nextIdx !== stepIndex) {
          autoAdvanceUntilRef.current = now + 600;
          setStepIndex(nextIdx);
        }
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
        setTimeout(updateSpotlight, 120);
      }
    } catch {}

    pollCountRef.current = 0;
    const maxPoll =
      steps[stepIndex].target === ".create-itinerary-add-btn" ? 1 : 2;
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

  useEffect(() => {
    if (spotlightRect) {
      lastSpotlightRectRef.current = spotlightRect;
    }
  }, [spotlightRect]);

  useEffect(() => {
    if (!run) return;
    const handleScrollOrResize = () => {
      const el = currentTargetRef.current;
      if (!el) return;
      try {
        setSpotlightRectStable(el);
      } catch {}
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [run]);

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
            const disabled =
              localStorage.getItem("guestTutorialsDisabled") === "true";
            const replay =
              localStorage.getItem("guestReplayTutorial") === "true";
            setHasCompletedTour(disabled || !replay);
            return;
          }
          if (tourType === "map") {
            setHasCompletedTour(
              !(localStorage.getItem("mapTourForceStart") === "true")
            );
            return;
          }
          if (tourType === "tourMap") {
            const disabled =
              localStorage.getItem("guestTutorialsDisabled") === "true";
            const completed =
              localStorage.getItem("guestTourMapTourCompleted") === "true";
            setHasCompletedTour(disabled || completed);
            return;
          }
          if (tourType === "guestProfile") {
            setHasCompletedTour(
              !(localStorage.getItem("guestProfileTourForceStart") === "true")
            );
            return;
          }
          if (tourType === "photobooth") {
            setHasCompletedTour(
              !(
                localStorage.getItem("guestPhotoboothTourForceStart") === "true"
              )
            );
            return;
          }
          if (tourType === "emergency") {
            const disabled =
              localStorage.getItem("guestTutorialsDisabled") === "true";
            const forceStart =
              localStorage.getItem("guestEmergencyTourForceStart") === "true";
            setHasCompletedTour(disabled || !forceStart);
            return;
          }
        } catch {}
        setHasCompletedTour(true);
        return;
      }

      try {
        const tutorialsDisabled =
          localStorage.getItem("tutorialsDisabled") === "true";
        if (tutorialsDisabled) {
          setHasCompletedTour(true);
          return;
        }
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
          if (userRole === "guest") {
            const disabled =
              localStorage.getItem("guestTutorialsDisabled") === "true";
            const completed =
              localStorage.getItem("guestTourMapTourCompleted") === "true";
            setHasCompletedTour(disabled || completed);
          } else {
            const status = await getTourMapTourStatus();
            const forceReplay =
              localStorage.getItem("tourMapReplayTutorial") === "true";
            setHasCompletedTour(
              forceReplay ? false : status.hasCompletedTourMapTour
            );
          }
        } else if (tourType === "emergency") {
          const status = await getEmergencyTourStatus();
          setHasCompletedTour(status.hasCompletedEmergencyTour);
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
            const disabled =
              localStorage.getItem("guestTutorialsDisabled") === "true";
            if (disabled) {
              setHasCompletedTour(true);
            } else {
              setHasCompletedTour(
                !(localStorage.getItem("guestReplayTutorial") === "true")
              );
            }
          } else if (tourType === "map") {
            setHasCompletedTour(
              !(localStorage.getItem("mapTourForceStart") === "true")
            );
          } else if (tourType === "guestProfile") {
            setHasCompletedTour(
              !(localStorage.getItem("guestProfileTourForceStart") === "true")
            );
          } else if (tourType === "photobooth") {
            setHasCompletedTour(
              !(
                localStorage.getItem("guestPhotoboothTourForceStart") === "true"
              )
            );
          } else if (tourType === "emergency") {
            setHasCompletedTour(
              !(localStorage.getItem("guestEmergencyTourForceStart") === "true")
            );
          } else {
            setHasCompletedTour(true);
          }
        } else {
          const tutorialsDisabled =
            localStorage.getItem("tutorialsDisabled") === "true";
          if (tutorialsDisabled) {
            setHasCompletedTour(true);
          } else {
            setHasCompletedTour(true);
          }
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
        } else if (tourType === "tourMap") {
          localStorage.removeItem("tourMapReplayTutorial");
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
          } else if (tourType === "tourMap") {
            await apiCompleteTourMapTour();
          } else if (tourType === "photobooth") {
            await apiCompletePhotoboothTour();
          } else if (tourType === "tripArchive") {
            await apiCompleteTripArchiveTour();
          } else {
            await apiCompleteTour();
          }
        } catch {}
        setHasCompletedTour(true);
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
          localStorage.removeItem("tourMapReplayTutorial");
          localStorage.setItem("guestTourMapTourCompleted", "true");
        } else if (tourType === "guestProfile") {
          localStorage.removeItem("guestProfileTourForceStart");
        } else if (tourType === "photobooth") {
          localStorage.removeItem("guestPhotoboothTourForceStart");
        } else if (tourType === "emergency") {
          localStorage.removeItem("guestEmergencyTourForceStart");
        }
      } catch (e) {}

      setHasCompletedTour(true);

      if (
        (status === STATUS.FINISHED || status === STATUS.SKIPPED) &&
        userRole === "tourist" &&
        localStorage.getItem("token")
      ) {
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
        } catch (error) {}
        setHasCompletedTour(true);
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
          } else if (tourType === "tourMap") {
            localStorage.removeItem("tourMapReplayTutorial");
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
            } else if (tourType === "tourMap") {
              await apiCompleteTourMapTour();
            } else if (tourType === "photobooth") {
              await apiCompletePhotoboothTour();
            } else if (tourType === "tripArchive") {
              await apiCompleteTripArchiveTour();
            } else {
              await apiCompleteTour();
            }
          } catch {}
          setHasCompletedTour(true);
        }
        return;
      }
      if (action === ACTIONS.PREV) {
        if (index <= 0) {
          return;
        }
        const prevVisible = findNextVisibleIndex(index, -1);
        if (typeof prevVisible === "number") {
          setStepIndex(prevVisible);
        } else {
          const prev = index - 1;
          setStepIndex(prev);
        }
        suppressFinishRef.current = true;
        return;
      }
      suppressFinishRef.current = false;
      const nextIdx = findNextVisibleIndex(index, 1);
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
      setSpotlightRect(null);
      currentTargetRef.current = null;
      const now = Date.now();
      if (autoAdvanceUntilRef.current > now) return;
      const nextIdx = findNextVisibleIndex(index, 1);
      if (typeof nextIdx === "number" && nextIdx !== index) {
        autoAdvanceUntilRef.current = now + 600;
        setStepIndex(nextIdx);
      } else {
        const targetIndex = index + 1;
        const clamped = Math.max(0, Math.min(targetIndex, steps.length - 1));
        autoAdvanceUntilRef.current = now + 600;
        setStepIndex(clamped);
      }
    }
  };

  const startTour = () => {
    if (run) return;
    if (startLockRef.current) return;
    startLockRef.current = true;
    const firstIdx = findNextVisibleIndex(-1, 1);
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
      {run && steps[stepIndex]?.target !== ".trip-tour-ender" && (
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
            onWheel={(e) => {
              try {
                e.preventDefault();
              } catch {}
            }}
            onTouchMove={(e) => {
              try {
                e.preventDefault();
              } catch {}
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              e.preventDefault();
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
              <mask
                id="spotlight-mask"
                maskUnits="userSpaceOnUse"
                maskContentUnits="userSpaceOnUse"
              >
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={
                    (spotlightRect || lastSpotlightRectRef.current)?.left || -1
                  }
                  y={(spotlightRect || lastSpotlightRectRef.current)?.top || -1}
                  width={
                    (spotlightRect || lastSpotlightRectRef.current)?.width || 0
                  }
                  height={
                    (spotlightRect || lastSpotlightRectRef.current)?.height || 0
                  }
                  rx="20"
                  ry="20"
                  fill="black"
                  style={{ transition: "none" }}
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
              top:
                ((spotlightRect || lastSpotlightRectRef.current)?.top || 0) - 4,
              left:
                ((spotlightRect || lastSpotlightRectRef.current)?.left || 0) -
                4,
              width:
                ((spotlightRect || lastSpotlightRectRef.current)?.width || 0) +
                8,
              height:
                ((spotlightRect || lastSpotlightRectRef.current)?.height || 0) +
                8,
              borderRadius: "20px",
              boxShadow: "inset 0 0 0 4px rgba(0, 0, 0, 0.75)",
              zIndex: 9998,
              pointerEvents: "none",
              transition: "none",
            }}
          />

          {/* Persistent tooltip positioned near spotlight (only when current target is measured/visible) */}
          {spotlightRect &&
            steps[stepIndex] &&
            (() => {
              const rect = spotlightRect;
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
              const centerX = rect.left + rect.width / 2;
              let left = Math.max(
                margin,
                Math.min(
                  centerX - width / 2,
                  window.innerWidth - margin - width
                )
              );
              let placeBelowTop = rect.top + rect.height + offset;
              let top;
              if (
                preferAbove &&
                rect.top - offset - height - margin >= margin
              ) {
                top = Math.max(margin, rect.top - offset - height);
              } else if (
                placeBelowTop + height + margin <=
                window.innerHeight
              ) {
                top = placeBelowTop;
              } else {
                top = Math.max(margin, rect.top - offset - height);
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
                    external
                    continuous
                    index={stepIndex}
                    step={localizeStep(steps[stepIndex])}
                    isLastStep={stepIndex >= steps.length - 1}
                    size={steps.length}
                    onBack={() => {
                      if (stepIndex <= 0) return;
                      const prevVisible = findNextVisibleIndex(stepIndex, -1);
                      const prev =
                        typeof prevVisible === "number"
                          ? prevVisible
                          : stepIndex - 1;
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
                          window.dispatchEvent(
                            new CustomEvent("tour:tripArchiveOpenReviewsTab")
                          );
                        } catch {}
                      }
                      if (prevTarget === ".trip-places-list") {
                        try {
                          window.dispatchEvent(
                            new CustomEvent("tour:tripArchiveOpenPlacesTab")
                          );
                        } catch {}
                      }
                      if (prevTarget === ".trip-tab-places-btn") {
                        try {
                          window.dispatchEvent(
                            new CustomEvent("tour:tripArchiveOpenPlacesTab")
                          );
                        } catch {}
                      }
                      if (prevTarget === ".trip-write-review-btn") {
                        try {
                          window.dispatchEvent(
                            new CustomEvent("tour:tripArchiveCloseReviewModal")
                          );
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
                          localStorage.setItem(
                            "guestTourMapTourCompleted",
                            "true"
                          );
                        } else if (tourType === "guestProfile") {
                          localStorage.removeItem("guestProfileTourForceStart");
                        } else if (tourType === "photobooth") {
                          localStorage.removeItem(
                            "guestPhotoboothTourForceStart"
                          );
                        } else if (tourType === "emergency") {
                          localStorage.removeItem(
                            "guestEmergencyTourForceStart"
                          );
                        }
                      } catch {}
                      setHasCompletedTour(true);
                      if (
                        userRole === "tourist" &&
                        localStorage.getItem("token")
                      ) {
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
                            localStorage.setItem(
                              "guestTourMapTourCompleted",
                              "true"
                            );
                          } else if (tourType === "guestProfile") {
                            localStorage.removeItem(
                              "guestProfileTourForceStart"
                            );
                          } else if (tourType === "photobooth") {
                            localStorage.removeItem(
                              "guestPhotoboothTourForceStart"
                            );
                          } else if (tourType === "emergency") {
                            localStorage.removeItem(
                              "guestEmergencyTourForceStart"
                            );
                          }
                        } catch {}
                        setHasCompletedTour(true);
                        if (
                          userRole === "tourist" &&
                          localStorage.getItem("token")
                        ) {
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
                      const nextIdx = findNextVisibleIndex(stepIndex, 1);
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
                      applyNext();
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
                          localStorage.setItem(
                            "guestTourMapTourCompleted",
                            "true"
                          );
                        } else if (tourType === "guestProfile") {
                          localStorage.removeItem("guestProfileTourForceStart");
                        } else if (tourType === "photobooth") {
                          localStorage.removeItem(
                            "guestPhotoboothTourForceStart"
                          );
                        } else if (tourType === "emergency") {
                          localStorage.removeItem(
                            "guestEmergencyTourForceStart"
                          );
                        }
                      } catch {}
                      setHasCompletedTour(true);
                      if (
                        userRole === "tourist" &&
                        localStorage.getItem("token")
                      ) {
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
                  />
                </div>
              );
            })()}
        </>
      )}
      {run &&
        steps[stepIndex]?.target === ".trip-tour-ender" &&
        (() => {
          const margin = isMobile ? 12 : 16;
          const width = Math.min(360, window.innerWidth - margin * 2);
          const height = Math.min(
            tooltipSize.height || 220,
            window.innerHeight - margin * 2
          );
          const left = Math.max(
            margin,
            Math.min(
              (window.innerWidth - width) / 2,
              window.innerWidth - margin - width
            )
          );
          const top = Math.max(
            margin,
            Math.min(
              (window.innerHeight - height) / 2,
              window.innerHeight - margin - height
            )
          );
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
                onWheel={(e) => {
                  try {
                    e.preventDefault();
                  } catch {}
                }}
                onTouchMove={(e) => {
                  try {
                    e.preventDefault();
                  } catch {}
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
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
                  external
                  continuous
                  index={stepIndex}
                  step={localizeStep(steps[stepIndex])}
                  isLastStep={stepIndex >= steps.length - 1}
                  size={steps.length}
                  onBack={() => {
                    if (stepIndex <= 0) return;
                    const prevVisible = findNextVisibleIndex(stepIndex, -1);
                    const prev =
                      typeof prevVisible === "number"
                        ? prevVisible
                        : stepIndex - 1;
                    const prevTarget = steps[prev]?.target;
                    setStepIndex(prev);
                    if (prevTarget === ".trip-tab-reviews-btn") {
                      try {
                        window.dispatchEvent(
                          new CustomEvent("tour:tripArchiveOpenReviewsTab")
                        );
                      } catch {}
                    }
                    if (
                      prevTarget === ".trip-places-list" ||
                      prevTarget === ".trip-tab-places-btn"
                    ) {
                      try {
                        window.dispatchEvent(
                          new CustomEvent("tour:tripArchiveOpenPlacesTab")
                        );
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
                        localStorage.setItem(
                          "guestTourMapTourCompleted",
                          "true"
                        );
                        localStorage.removeItem("mapTourForceStart");
                      } else if (tourType === "guestProfile") {
                        localStorage.removeItem("guestProfileTourForceStart");
                      } else if (tourType === "photobooth") {
                        localStorage.removeItem(
                          "guestPhotoboothTourForceStart"
                        );
                      } else if (tourType === "emergency") {
                        localStorage.removeItem("guestEmergencyTourForceStart");
                      }
                    } catch {}
                    setHasCompletedTour(true);
                  }}
                  onNext={async () => {
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
                        localStorage.setItem(
                          "guestTourMapTourCompleted",
                          "true"
                        );
                        localStorage.removeItem("mapTourForceStart");
                      } else if (tourType === "guestProfile") {
                        localStorage.removeItem("guestProfileTourForceStart");
                      } else if (tourType === "photobooth") {
                        localStorage.removeItem(
                          "guestPhotoboothTourForceStart"
                        );
                      } else if (tourType === "emergency") {
                        localStorage.removeItem("guestEmergencyTourForceStart");
                      }
                    } catch {}
                    setHasCompletedTour(true);
                    if (
                      userRole === "tourist" &&
                      localStorage.getItem("token")
                    ) {
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
                        localStorage.setItem(
                          "guestTourMapTourCompleted",
                          "true"
                        );
                        localStorage.removeItem("mapTourForceStart");
                      } else if (tourType === "guestProfile") {
                        localStorage.removeItem("guestProfileTourForceStart");
                      } else if (tourType === "photobooth") {
                        localStorage.removeItem(
                          "guestPhotoboothTourForceStart"
                        );
                      } else if (tourType === "emergency") {
                        localStorage.removeItem("guestEmergencyTourForceStart");
                      }
                    } catch {}
                    setHasCompletedTour(true);
                    if (
                      userRole === "tourist" &&
                      localStorage.getItem("token")
                    ) {
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
                  }}
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
        scrollToFirstStep={false}
        disableScrolling={true}
        disableScrollParentFix
        disableBeacon
        hideBackButton={false}
        spotlightClicks={false}
        disableOverlay={true}
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
