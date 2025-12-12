import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import Map, { Marker, Source, Layer, GeolocateControl } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./TouristItinerariesMap.css";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useGLTF } from "@react-three/drei";
import {
  Navigation,
  MapPin,
  Car,
  Bike,
  Footprints,
  User,
  ListOrdered,
} from "lucide-react";
import {
  optimizeRoute,
  getNextSite,
  calculateDistance,
} from "../../../utils/routeOptimizer";

import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  directionsClient,
  geocodingClient,
  createInverseMask,
} from "../TourMap/mapConfig";

// Import separated components
import DirectionsPanel from "./DirectionsPanel";
import MapControlButtons from "./MapControlButtons";
import SitePreviewCard from "./SitePreviewCard";
import SiteModalFullScreen from "./SiteModalFullScreen";
import GpsConsentModal from "../../shared/GpsConsentModal";
import ResumeItineraryModal from "../../shared/ResumeItineraryModal";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import NotificationModal from "../../shared/NotificationModal";
import ItineraryCompletionModal from "../../shared/ItineraryCompletionModal";
import ConfirmModal from "../../shared/ConfirmModal";
import { useTour } from "../../TourComponents/TourContext";
import ttsService from "../../../utils/textToSpeech";
import { isUserWithinIntramuros } from "../../../utils/geolocationCheck";

export default function TouristItineraryMap() {
  const { startTour, isTourRunning } = useTour?.() || {
    startTour: () => {},
    isTourRunning: false,
  };
  const { itineraryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [pins, setPins] = useState([]);
  const [optimizedPins, setOptimizedPins] = useState([]); // Optimized route order
  const [viewState, setViewState] = useState({
    latitude: 14.5896,
    longitude: 120.9747,
    zoom: 16,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(0);
  const lastHeadingRef = useRef(0); // Track last normalized heading
  const accumulatedRotationRef = useRef(0); // Track accumulated rotation (can go beyond 360)
  const geolocateControlRef = useRef(null); // Ref for Mapbox GeolocateControl
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null); // Custom user marker with heading
  const beamRotationRef = useRef(0); // Continuous rotation to avoid wrap-around spins
  const isMapRotatingRef = useRef(false);
  const lastCameraUpdateRef = useRef(0);
  const followEnabledRef = useRef(true);
  const lastUserInteractRef = useRef(0);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [detailsItinerary, setDetailsItinerary] = useState(
    (location.state && location.state.itinerary) || null
  );
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const [itineraryName, setItineraryName] = useState("");
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const smoothedLocRef = useRef(null);
  const lastRawLocRef = useRef(null);
  const stepSwitchCandidateRef = useRef({
    index: null,
    startedAt: 0,
    count: 0,
  });
  const lastUpdateTimeRef = useRef(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [transportMode, setTransportMode] = useState("walking"); // walking | cycling | driving

  // Start tour if forced via Settings (must be inside component)
  useEffect(() => {
    try {
      const force = localStorage.getItem("mapTourForceStart");
      if (force === "true") {
        if (typeof startTour === "function") startTour();
      }
    } catch {}
  }, [startTour]);

  // Hide/dismiss modals while the tour runs to avoid interruptions
  useEffect(() => {
    if (isTourRunning) {
      try {
        setShowFullModal(false);
        setShowResumeModal(false);
        setShowGpsModal(false);
        setShowCompletionModal(false);
        if (typeof setShowFortDrivingModal === "function")
          setShowFortDrivingModal(false);
        setNotification((n) => ({ ...n, isOpen: false }));
      } catch {}
    }
  }, [isTourRunning]);
  const [showTransportPanel, setShowTransportPanel] = useState(false);

  // Routing
  const [route, setRoute] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null); // seconds
  const [arrivalTime, setArrivalTime] = useState(null); // clock time
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRouting, setIsRouting] = useState(false);
  const routingReqId = useRef(0);

  // Map bounds
  const [mask, setMask] = useState(null);
  const [inverseMask, setInverseMask] = useState(null);

  // Site modals
  const [selectedPin, setSelectedPin] = useState(null);
  const [currentPinIndex, setCurrentPinIndex] = useState(0);
  const [showFullModal, setShowFullModal] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [manuallyDismissed, setManuallyDismissed] = useState(false);
  const [visitedSites, setVisitedSites] = useState(new Set());
  const [skippedSites, setSkippedSites] = useState(new Set());
  const [activePin, setActivePin] = useState(null); // Pin with active directions
  const [siteReviews, setSiteReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isSimulatingHome, setIsSimulatingHome] = useState(false);
  const [showFortDrivingModal, setShowFortDrivingModal] = useState(false);
  const [fortModalConfirm, setFortModalConfirm] = useState(null);
  const [isOutsideBounds, setIsOutsideBounds] = useState(false);
  const [showLocationBlockModal, setShowLocationBlockModal] = useState(false);
  const [suppressPreviewCard, setSuppressPreviewCard] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [isBackdropActive, setIsBackdropActive] = useState(false);
  const [gpsApproved, setGpsApproved] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [isGuidanceRunning, setIsGuidanceRunning] = useState(false);
  const [tourMode, setTourMode] = useState(null);
  const hasLoadedProgressRef = useRef(false);

  // Get fresh config for each API call to avoid stale token
  const getConfig = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }, []);

  // Debug: Component mount
  useEffect(() => {
    console.log("🚀 TouristItineraryMap mounted - itineraryId:", itineraryId);
    return () => {
      console.log("💀 TouristItineraryMap unmounting");
      hasLoadedProgressRef.current = false; // Reset on unmount
    };
  }, [itineraryId]);

  useEffect(() => {
    const url = selectedPin?.glbUrl;
    if (url && typeof url === "string" && url.endsWith(".glb")) {
      try {
        useGLTF.preload(url);
      } catch {}
    }
  }, [selectedPin]);

  useEffect(() => {
    const url = activePin?.glbUrl;
    if (url && typeof url === "string" && url.endsWith(".glb")) {
      try {
        useGLTF.preload(url);
      } catch {}
    }
  }, [activePin]);

  useEffect(() => {
    const list =
      optimizedPins && optimizedPins.length > 0 ? optimizedPins : pins;
    const candidates = [];
    if (list && list.length > 0) {
      candidates.push(list[0]);
      if (list[1]) candidates.push(list[1]);
      if (currentPinIndex != null && list[currentPinIndex]) {
        candidates.push(list[currentPinIndex]);
        if (list[currentPinIndex + 1])
          candidates.push(list[currentPinIndex + 1]);
      }
    }
    const urls = candidates
      .map((p) => p?.glbUrl)
      .filter((u) => u && typeof u === "string" && u.endsWith(".glb"));
    urls.forEach((u) => {
      try {
        useGLTF.preload(u);
      } catch {}
    });
  }, [pins, optimizedPins, currentPinIndex]);

  // Handler to mark site as done (permanent)
  const handleMarkAsDone = async (siteId) => {
    const pin = optimizedPins.find((p) => p._id === siteId);
    if (!pin) return;

    setVisitedSites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) {
        newSet.delete(siteId); // Toggle off if already visited
      } else {
        newSet.add(siteId); // Mark as visited
        // Save to permanent visited-sites record (for Trip Archives)
        markSiteAsVisited(pin);
      }
      saveProgress(
        currentPinIndex,
        newSet,
        skippedSites,
        userLocation,
        optimizedPins
      );
      return newSet;
    });
  };

  // Track last save to prevent duplicate rapid calls
  const lastSaveRef = useRef({ pinIndex: -1, timestamp: 0 });
  const hasLoadedProgressOnceRef = useRef(false);

  // Save progress to database - optionally pass optimizedPinsArray to avoid state timing issues
  const saveProgress = async (
    pinIndex,
    visited,
    skipped,
    userPos = null,
    optimizedPinsArray = null
  ) => {
    console.log(
      "💾 saveProgress called - pinIndex:",
      pinIndex,
      "visited:",
      visited.size,
      "skipped:",
      skipped?.size || 0
    );

    // CRITICAL: Don't save empty initial state before loading progress from database
    if (
      !hasLoadedProgressOnceRef.current &&
      visited.size === 0 &&
      (!skipped || skipped.size === 0)
    ) {
      console.log(
        "⏭️ Skipping save - waiting for progress to load from database first"
      );
      return;
    }

    // Prevent duplicate saves within 500ms
    const now = Date.now();
    if (
      lastSaveRef.current.pinIndex === pinIndex &&
      now - lastSaveRef.current.timestamp < 500
    ) {
      console.log("⏭️ Skipping duplicate save (too soon)");
      return;
    }
    lastSaveRef.current = { pinIndex, timestamp: now };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("❌ No token, skipping save (guest user)");
        return; // Guest users don't save progress
      }

      // Save optimized pin order (site IDs) to preserve numbering
      // Use passed array if provided (avoids state timing issues), otherwise use state
      const pinsToSave = optimizedPinsArray || optimizedPins;
      const optimizedOrder = pinsToSave.map((pin) => pin._id);

      if (optimizedOrder.length === 0) {
        console.warn("⚠️ WARNING: optimizedPins is empty! Cannot save order.");
      }

      console.log("💾 Saving to database:", {
        itineraryId,
        currentPinIndex: pinIndex,
        visitedCount: Array.from(visited).length,
        skippedCount: Array.from(skipped || new Set()).length,
        optimizedOrderCount: optimizedOrder.length,
        optimizedPinsAvailable: optimizedPins.length,
      });

      // Log the actual arrays being sent
      console.log("📦 Full data being sent:", {
        visitedSites: Array.from(visited),
        skippedSites: Array.from(skipped || new Set()),
        optimizedOrder: optimizedOrder, // This is the actual array of IDs
      });

      const response = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/itinerary-progress/${itineraryId}`,
        {
          currentPinIndex: pinIndex,
          visitedSites: Array.from(visited),
          skippedSites: Array.from(skipped || new Set()),
          lastPosition: userPos || userLocation,
          optimizedOrder: optimizedOrder, // Save the pin order - FULL ARRAY
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(
        "✅ Progress saved successfully to database!",
        response.status
      );
    } catch (error) {
      console.error("❌ Error saving progress to database:", error);
      console.error("❌ Error status:", error.response?.status);
      console.error(
        "❌ Error message:",
        error.response?.data?.message || error.message
      );
      console.error("❌ Full error data:", error.response?.data);

      // Show user-friendly notification
      setNotification({
        isOpen: true,
        type: "error",
        title: "Failed to Save Progress",
        message:
          "Your progress could not be saved to the server. Please check your connection and try again.",
      });
    }
  };

  // Skip current site and move to next
  const handleSkipSite = useCallback(() => {
    if (!activePin) return;

    const newSkipped = new Set(skippedSites);
    newSkipped.add(activePin._id);
    setSkippedSites(newSkipped);

    // Move to next site
    const nextIndex = currentPinIndex + 1;
    if (nextIndex < optimizedPins.length) {
      setCurrentPinIndex(nextIndex);
      const nextPin = optimizedPins[nextIndex];
      setActivePin(nextPin);
      setSelectedPin(nextPin);
      buildRoute(userLocation, nextPin);
      saveProgress(
        nextIndex,
        visitedSites,
        newSkipped,
        userLocation,
        optimizedPins
      );
    }
  }, [
    activePin,
    currentPinIndex,
    optimizedPins,
    skippedSites,
    userLocation,
    visitedSites,
  ]);

  // Go to previous site
  const handlePrevSite = useCallback(() => {
    const prevIndex = currentPinIndex - 1;
    const prevPin = prevIndex >= 0 ? optimizedPins[prevIndex] : null;

    // Guard: If prev site is Fort Santiago and transport is car, show modal and block
    if (
      prevPin &&
      prevPin.feeType === "fort_santiago" &&
      transportMode === "driving"
    ) {
      setFortModalConfirm(() => () => {
        setTransportMode("walking");
        setShowFortDrivingModal(false);
        setTimeout(() => {
          // Retry prev navigation under Foot mode
          const pi = currentPinIndex - 1;
          if (pi >= 0) {
            setCurrentPinIndex(pi);
            const pp = optimizedPins[pi];
            setActivePin(pp);
            setSelectedPin(pp);
            buildRoute(userLocation, pp);
            saveProgress(
              pi,
              visitedSites,
              skippedSites,
              userLocation,
              optimizedPins
            );
          }
        }, 0);
      });
      setShowFortDrivingModal(true);
      return;
    }

    if (prevIndex >= 0) {
      setCurrentPinIndex(prevIndex);
      const prevPin2 = optimizedPins[prevIndex];
      setActivePin(prevPin2);
      setSelectedPin(prevPin2);
      buildRoute(userLocation, prevPin2);
      saveProgress(
        prevIndex,
        visitedSites,
        skippedSites,
        userLocation,
        optimizedPins
      );
    }
  }, [
    currentPinIndex,
    optimizedPins,
    userLocation,
    visitedSites,
    skippedSites,
    transportMode,
  ]);

  // Go to next site (marks current as visited)
  const handleNextSite = useCallback(async () => {
    // Compute next site and guard Fort Santiago when in car mode
    const nextIndex = currentPinIndex + 1;
    const nextPin =
      nextIndex < optimizedPins.length ? optimizedPins[nextIndex] : null;

    if (
      nextPin &&
      nextPin.feeType === "fort_santiago" &&
      transportMode === "driving"
    ) {
      setFortModalConfirm(() => () => {
        setTransportMode("walking");
        setShowFortDrivingModal(false);
        // Modal closed - user can now click Next again with walking mode
      });
      setShowFortDrivingModal(true);
      return;
    }

    // Mark current site as visited before moving to next
    const currentPin = optimizedPins[currentPinIndex];
    const updatedVisited = new Set(visitedSites);
    if (currentPin && !updatedVisited.has(currentPin._id)) {
      updatedVisited.add(currentPin._id);
      setVisitedSites(updatedVisited);

      // Save to permanent visited-sites record (for Trip Archives)
      await markSiteAsVisited(currentPin);
    }

    if (nextIndex < optimizedPins.length) {
      setCurrentPinIndex(nextIndex);
      const np = optimizedPins[nextIndex];
      setActivePin(np);
      setSelectedPin(np);
      buildRoute(userLocation, np);
      saveProgress(
        nextIndex,
        updatedVisited,
        skippedSites,
        userLocation,
        optimizedPins
      );
    } else {
      // Last site: mark as visited and end tour
      // Persist final progress including the just-visited site
      try {
        saveProgress(
          currentPinIndex,
          updatedVisited,
          skippedSites,
          userLocation,
          optimizedPins
        );
      } catch (e) {
        console.error("Failed to save final progress on end tour:", e);
      }
      setShowCompletionModal(true);
      setSelectedPin(null);
      setRoute(null);
      setSteps([]);
    }
  }, [
    currentPinIndex,
    optimizedPins,
    userLocation,
    visitedSites,
    skippedSites,
    transportMode,
  ]);

  // Utility to resolve relative URLs into absolute URLs
  const resolveUrl = (url) => {
    if (!url) return "";
    const BACKEND_URL =
      import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
      "http://192.168.100.10:5000";
    return url.startsWith("http")
      ? url
      : `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // GPS permission is requested only after user clicks Start Tour

  /** Continuous location tracking - gated by GPS approval and active tour */
  useEffect(() => {
    if (!(gpsApproved && isGuidanceRunning)) return;
    let watchId = null;

    const startLocationTracking = () => {
      if (!navigator.geolocation) return;
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const prevRaw = lastRawLocRef.current;
          const toRad = (v) => (v * Math.PI) / 180;
          const haversineMeters = (lat1, lng1, lat2, lng2) => {
            const R = 6371000;
            const dLat = toRad(lat2 - lat1);
            const dLng = toRad(lng2 - lng1);
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLng / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          };
          const acc = position.coords.accuracy || 10;
          const dynamicThreshold = Math.min(5, Math.max(0.5, acc * 0.05));
          const now = Date.now();
          if (prevRaw) {
            const jitter = haversineMeters(
              prevRaw.latitude,
              prevRaw.longitude,
              newLocation.latitude,
              newLocation.longitude
            );
            const recentlyUpdated =
              now - (lastUpdateTimeRef.current || 0) < 1500;
            if (jitter < dynamicThreshold && recentlyUpdated) {
              lastRawLocRef.current = newLocation;
              return;
            }
          }
          const prevSmooth = smoothedLocRef.current;
          const alpha = 0.35;
          const smoothLocation = prevSmooth
            ? {
                latitude:
                  prevSmooth.latitude +
                  alpha * (newLocation.latitude - prevSmooth.latitude),
                longitude:
                  prevSmooth.longitude +
                  alpha * (newLocation.longitude - prevSmooth.longitude),
              }
            : newLocation;
          smoothedLocRef.current = smoothLocation;
          lastRawLocRef.current = newLocation;
          lastUpdateTimeRef.current = now;
          setUserLocation(smoothLocation);
          if (
            position.coords.heading !== null &&
            position.coords.heading !== undefined
          ) {
            const smoothHeading = normalizeHeading(position.coords.heading);
            setUserHeading(smoothHeading);
          }
        },
        (error) => {
          console.error("Location tracking error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setGpsError(
              "Location access denied. Please enable location services."
            );
            setShowGpsModal(true);
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    };

    const timeoutId = setTimeout(startLocationTracking, 500);
    return () => {
      clearTimeout(timeoutId);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [gpsApproved, isGuidanceRunning]);

  /** Fetch mask */
  useEffect(() => {
    const fetchMask = async () => {
      try {
        const { data } = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/mask`
        );
        if (!data?.geometry) return;

        const feature = {
          type: "Feature",
          properties: {},
          geometry: data.geometry,
        };

        setMask(feature);
        setInverseMask(createInverseMask(feature));
      } catch (err) {
        console.error("❌ Error fetching mask:", err);
      }
    };
    fetchMask();
  }, []);

  // Check if user is within Intramuros boundaries
  useEffect(() => {
    if (!userLocation || !mask?.geometry) return;

    const withinBounds = isUserWithinIntramuros(userLocation, mask.geometry);

    if (!withinBounds) {
      console.warn("⚠️ User is outside Intramuros boundaries");
      setIsOutsideBounds(true);
      setShowLocationBlockModal(true);
    } else {
      setIsOutsideBounds(false);
      setShowLocationBlockModal(false);
    }
  }, [userLocation, mask]);

  /** Fetch itinerary sites */
  useEffect(() => {
    const fetchItinerary = async () => {
      console.log("🔄 Fetching itinerary sites for ID:", itineraryId);
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL ||
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }`
          }/itineraries/${itineraryId}`,
          getConfig()
        );

        console.log(
          "✅ Fetched itinerary data:",
          res.data.name,
          "- sites count:",
          res.data.sites?.length
        );
        const normalized = res.data.sites
          .filter((s) => s.status === "active") // Only include active sites
          .map((s) => ({
            _id: s._id,
            latitude: s.latitude,
            longitude: s.longitude,
            title: s.siteName || s.title || "Site",
            siteName: s.siteName || s.title || "Site",
            description: s.siteDescription || s.description || "",
            siteDescription: s.siteDescription || s.description || "",
            siteDescriptionTagalog: s.siteDescriptionTagalog || "",
            mediaType: s.mediaType || "image",
            mediaUrl: resolveUrl(s.mediaUrl),
            mediaFiles:
              s.mediaFiles?.map((media) => ({
                url: resolveUrl(media.url),
                type: media.type,
              })) || [],
            glbUrl: resolveUrl(s.glbUrl),
            arEnabled: s.arEnabled === true,
            arLink: s.arLink || "",
            status: s.status || "active",
            category: s.category || null,
            feeType: s.feeType || "none",
            feeAmount: s.feeAmount || null,
            feeAmountDiscounted: s.feeAmountDiscounted || null,
            openingTime: s.openingTime || null,
            closingTime: s.closingTime || null,
          }));

        console.log("✅ Setting pins - count:", normalized.length);
        setPins(normalized);
        setItineraryName(res.data.name || "Itinerary");
      } catch (err) {
        console.error("Error fetching itinerary:", err);
      }
    };

    if (itineraryId) fetchItinerary();
  }, [itineraryId]);

  /** Debug: Log visitedSites changes */
  useEffect(() => {
    if (visitedSites.size > 0) {
      console.log("🔍 Current visitedSites state:", Array.from(visitedSites));
    }
  }, [visitedSites]);

  /** Load saved progress from database */
  useEffect(() => {
    const loadProgress = async () => {
      console.log(
        "🔍 loadProgress called - itineraryId:",
        itineraryId,
        "pins.length:",
        pins.length,
        "optimizedPins.length:",
        optimizedPins.length
      );

      if (!itineraryId) {
        console.log("❌ No itineraryId, skipping progress load");
        return;
      }

      if (pins.length === 0) {
        console.log("❌ No pins loaded yet, skipping progress load");
        return;
      }

      // Prevent loading progress multiple times
      if (hasLoadedProgressRef.current) {
        console.log("✅ Progress already loaded from DB, skipping");
        return;
      }

      // Mark as loading
      hasLoadedProgressRef.current = true;
      console.log("🔄 Starting progress load...");

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("❌ No token, guest user - running optimization");
          // Mark as loaded for guest users (no database to load from)
          hasLoadedProgressOnceRef.current = true;
          // No saved progress for guest users, run optimization
          if (userLocation && optimizedPins.length === 0) {
            const optimized = optimizeRoute(userLocation, pins, new Set());
            setOptimizedPins(optimized);
            if (optimized.length > 0) {
              setCurrentPinIndex(0);
              setSelectedPin(optimized[0]);
              setActivePin(optimized[0]);
            }
          }
          return;
        }

        console.log(
          "🔄 Loading progress from database for itinerary:",
          itineraryId
        );

        const response = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/itinerary-progress/${itineraryId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("📊 Loaded progress from API:", response.data);
        console.log(
          "📊 API Response details - currentPinIndex:",
          response.data.currentPinIndex,
          "visitedSites:",
          response.data.visitedSites?.length,
          "optimizedOrder:",
          response.data.optimizedOrder?.length
        );
        const { currentPinIndex, visitedSites, skippedSites, optimizedOrder } =
          response.data;

        // Mark that we've loaded progress from database
        hasLoadedProgressOnceRef.current = true;
        console.log(
          "✅ Progress loaded from database - saveProgress now enabled"
        );

        // Check if there's meaningful progress FIRST (before checking optimizedOrder)
        const hasProgress =
          currentPinIndex > 0 ||
          (visitedSites && visitedSites.length > 0) ||
          (skippedSites && skippedSites.length > 0);

        // ALWAYS set visited/skipped sites (even if empty) to ensure state is initialized
        const visitedSet =
          visitedSites && visitedSites.length > 0
            ? new Set(visitedSites)
            : new Set();
        const skippedSet =
          skippedSites && skippedSites.length > 0
            ? new Set(skippedSites)
            : new Set();

        setVisitedSites(visitedSet);
        setSkippedSites(skippedSet);
        console.log("✅ Restored visited sites:", Array.from(visitedSet));
        console.log("✅ Restored skipped sites:", Array.from(skippedSet));

        // Restore optimized pin order if available
        if (optimizedOrder && optimizedOrder.length > 0) {
          // Reconstruct optimized pins from saved order
          const restoredPins = optimizedOrder
            .map((siteId) => pins.find((p) => p._id === siteId))
            .filter(Boolean); // Remove any null values

          setOptimizedPins(restoredPins);
          console.log("✅ Restored optimized pin order from saved progress");

          // Check if all sites are completed, and if we are actually at the last pin
          const allCompleted =
            visitedSites && visitedSites.length === restoredPins.length;
          const isAtLastPin =
            typeof currentPinIndex === "number" &&
            currentPinIndex >= restoredPins.length - 1;

          if (allCompleted && isAtLastPin) {
            // All sites visited AND currently at last pin - show completion modal
            console.log("🎉 All sites completed (at last pin)!");
            setShowCompletionModal(true);

            const lastIndex = restoredPins.length - 1;
            setCurrentPinIndex(lastIndex);
            setSelectedPin(restoredPins[lastIndex]);
            setActivePin(restoredPins[lastIndex]);
          } else {
            // Check if there's meaningful progress
            const hasProgress =
              currentPinIndex > 0 || visitedSet.size > 0 || skippedSet.size > 0;

            if (hasProgress) {
              // IMMEDIATELY restore state - don't wait for modal
              console.log(
                "✅ Restoring progress immediately: pin",
                currentPinIndex,
                "visited:",
                visitedSet.size
              );

              // Restore current position
              if (
                currentPinIndex !== undefined &&
                currentPinIndex < restoredPins.length
              ) {
                setCurrentPinIndex(currentPinIndex);
                const currentPin = restoredPins[currentPinIndex];
                setSelectedPin(currentPin);
                setActivePin(currentPin);
                console.log("✅ State restored to pin", currentPinIndex);
              } else {
                // Fallback to first pin
                setCurrentPinIndex(0);
                setSelectedPin(restoredPins[0]);
                setActivePin(restoredPins[0]);
              }

              // Save progress data for modal actions
              setSavedProgress(response.data);

              // Show modal as informational (optional) - state already restored
              if (isGuidanceRunning) {
                setTimeout(() => {
                  setShowResumeModal(true);
                  console.log("✅ Resume modal shown (state already restored)");
                }, 100);
              }
            } else {
              // No progress, start fresh
              if (restoredPins.length > 0) {
                const firstPin = restoredPins[0];
                setSelectedPin(firstPin);
                setActivePin(firstPin);
                setCurrentPinIndex(0);
              }
            }
          }
        } else if (hasProgress) {
          // Has progress but no saved order - need to optimize
          console.log(
            "✅ Has progress but no saved order - will optimize with visited sites preserved"
          );

          // ALWAYS save progress data to trigger restoration later
          setSavedProgress(response.data);

          // If userLocation is available, optimize immediately
          if (userLocation && pins.length > 0) {
            const optimized = optimizeRoute(userLocation, pins, visitedSet);
            setOptimizedPins(optimized);
            console.log(
              "✅ Optimized pins created with visited sites:",
              Array.from(visitedSet)
            );

            // Restore to current index
            const resumeIndex = currentPinIndex || 0;
            if (resumeIndex < optimized.length) {
              setCurrentPinIndex(resumeIndex);
              const resumePin = optimized[resumeIndex];
              setSelectedPin(resumePin);
              setActivePin(resumePin);
              if (userLocation) {
                buildRoute(userLocation, resumePin);
              }
              console.log("✅ State restored to pin", resumeIndex);
            }

            // IMPORTANT: Save the newly created optimizedOrder to database
            saveProgress(
              resumeIndex,
              visitedSet,
              skippedSet,
              userLocation,
              optimized
            );
            console.log("✅ Saved newly created optimizedOrder to database");

            // Show modal
            if (isGuidanceRunning) {
              setTimeout(() => {
                setShowResumeModal(true);
                console.log("✅ Resume modal shown");
              }, 100);
            }
          } else {
            // UserLocation not ready yet - will optimize when it becomes available
            console.log(
              "⏳ Waiting for userLocation to optimize route (visited sites preserved)"
            );
          }
        } else {
          // No progress at all, start fresh
          console.log(
            "⏳ No progress, will optimize when userLocation is available"
          );
        }
      } catch (error) {
        console.error("Error loading progress:", error);
        // Mark as loaded even on error so saves can happen
        hasLoadedProgressOnceRef.current = true;
        // If error, run optimization from scratch
        if (userLocation && optimizedPins.length === 0) {
          const optimized = optimizeRoute(userLocation, pins, new Set());
          setOptimizedPins(optimized);
          if (optimized.length > 0 && !selectedPin) {
            const firstPin = optimized[0];
            setSelectedPin(firstPin);
            setActivePin(firstPin);
            setCurrentPinIndex(0);
          }
        }
      }
    };

    loadProgress();
  }, [itineraryId, pins.length]);

  // Run optimization when userLocation becomes available WITH saved progress (on refresh)
  useEffect(() => {
    if (
      isGuidanceRunning &&
      userLocation &&
      pins.length > 0 &&
      optimizedPins.length === 0 &&
      savedProgress
    ) {
      console.log(
        "🔄 UserLocation now available - restoring progress with optimization"
      );
      console.log("📍 User location:", userLocation);
      console.log("📍 Visited sites to preserve:", Array.from(visitedSites));

      // Optimize with visited sites preserved
      const optimized = optimizeRoute(userLocation, pins, visitedSites);
      setOptimizedPins(optimized);
      console.log("✅ Optimized pins created with preserved visited sites");

      // Restore to saved index
      const resumeIndex = savedProgress.currentPinIndex || 0;
      if (resumeIndex < optimized.length) {
        setCurrentPinIndex(resumeIndex);
        const resumePin = optimized[resumeIndex];
        setSelectedPin(resumePin);
        setActivePin(resumePin);
        buildRoute(userLocation, resumePin);
        console.log("✅ State restored to pin", resumeIndex);
      }

      // IMPORTANT: Save the optimizedOrder to database now that we have it
      // Pass optimized array directly to avoid state timing issues
      saveProgress(
        resumeIndex,
        visitedSites,
        skippedSites,
        userLocation,
        optimized
      );
      console.log("✅ Saved optimizedOrder to database for future refreshes");

      // Show modal
      if (isGuidanceRunning) {
        setTimeout(() => {
          setShowResumeModal(true);
          console.log("✅ Resume modal shown after userLocation ready");
        }, 100);
      }
    }
  }, [userLocation, pins.length, optimizedPins.length, savedProgress]);

  // Run optimization when userLocation becomes available (ONLY for first time, no saved progress)
  useEffect(() => {
    if (
      isGuidanceRunning &&
      userLocation &&
      pins.length > 0 &&
      optimizedPins.length === 0 &&
      !savedProgress
    ) {
      console.log("🔄 First time opening itinerary - running optimization");
      console.log("📍 User location:", userLocation);
      console.log("📍 Total pins:", pins.length);
      console.log("📍 Visited sites:", Array.from(visitedSites));
      const optimized = optimizeRoute(userLocation, pins, new Set());
      console.log(
        "📍 Optimized order:",
        optimized.map((p, i) => `${i + 1}. ${p.siteName || p.title}`)
      );
      setOptimizedPins(optimized);

      if (optimized.length > 0) {
        setCurrentPinIndex(0);
        setSelectedPin(optimized[0]);
        setActivePin(optimized[0]);
        // Save the initial optimized order to database - pass optimized array directly
        saveProgress(0, new Set(), new Set(), userLocation, optimized);
        console.log("✅ Saved initial optimized order to database");
      }
    }
  }, [userLocation, pins.length, optimizedPins.length, savedProgress]);

  // Handle resume - state already restored, just close modal and rebuild route
  const handleResumeProgress = () => {
    if (!savedProgress) return;

    // State is already restored, just rebuild route if needed
    if (userLocation && activePin) {
      buildRoute(userLocation, activePin);
    }

    setShowResumeModal(false);
    console.log("✅ Resume confirmed - state already restored");
  };

  const handleRestartProgress = async () => {
    if (userLocation && pins.length > 0) {
      const optimized = optimizeRoute(userLocation, pins, visitedSites);
      setOptimizedPins(optimized);
      setCurrentPinIndex(0);
      if (optimized.length > 0) {
        const firstPin = optimized[0];
        setSelectedPin(firstPin);
        setActivePin(firstPin);
        buildRoute(userLocation, firstPin);
        await saveProgress(
          0,
          visitedSites,
          skippedSites,
          userLocation,
          optimized
        );
      }
    }
    setShowResumeModal(false);
    setShowCompletionModal(false);
  };

  // Check if all sites are visited (completion) - removed modal display

  /** Auto-select first pin when pins are loaded (show preview card by default) - only if no saved progress */
  useEffect(() => {
    if (
      pins.length > 0 &&
      !selectedPin &&
      !manuallyDismissed &&
      currentPinIndex === 0
    ) {
      setSelectedPin(pins[0]);
    }
  }, [pins, selectedPin, manuallyDismissed, currentPinIndex]);

  /** Handle GeolocateControl events */
  const handleGeolocate = useCallback(
    (e) => {
      const newLoc = {
        latitude: e.coords.latitude,
        longitude: e.coords.longitude,
      };
      setUserLocation(newLoc);
      try {
        const map = mapRef.current?.getMap?.();
        if (map) {
          const currentZoom =
            typeof map.getZoom === "function"
              ? map.getZoom()
              : viewState?.zoom || 16;
          map.easeTo({
            center: [newLoc.longitude, newLoc.latitude],
            zoom: Math.max(currentZoom, 16.5),
            duration: 300,
            essential: true,
          });
        }
      } catch {}
    },
    [viewState]
  );

  const handleGeolocateError = useCallback((e) => {
    console.error("Geolocate error:", e);
    setGpsError("Unable to retrieve your location");
    setShowGpsModal(true);
  }, []);

  /** Normalize heading to prevent 360° jumps - uses accumulated rotation */
  const normalizeHeading = useCallback((newHeading) => {
    // Normalize incoming heading to 0-360
    let normalized = newHeading % 360;
    if (normalized < 0) normalized += 360;

    const lastNormalized = lastHeadingRef.current;

    // Calculate shortest angular difference
    let diff = normalized - lastNormalized;

    // Adjust diff to be in range [-180, 180]
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }

    // Add to accumulated rotation (can be any value, not limited to 0-360)
    accumulatedRotationRef.current += diff;

    // Update last normalized heading
    lastHeadingRef.current = normalized;

    // Return accumulated rotation (this prevents CSS from wrapping)
    return accumulatedRotationRef.current;
  }, []);

  /** Calculate nearest point on route for GPS snapping */
  const nearestPointOnRoute = useCallback(
    (lng, lat) => {
      try {
        const coords = route?.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;
        const R = 6371000;
        const toRad = (v) => (v * Math.PI) / 180;
        const lat0 = lat;
        const toXY = (lngX, latY) => ({
          x: R * toRad(lngX) * Math.cos(toRad(lat0)),
          y: R * toRad(latY),
        });
        const p = toXY(lng, lat);
        let best = { dist2: Infinity, lng: null, lat: null };
        for (let i = 0; i < coords.length - 1; i++) {
          const [lng1, lat1] = coords[i];
          const [lng2, lat2] = coords[i + 1];
          const a = toXY(lng1, lat1);
          const b = toXY(lng2, lat2);
          const abx = b.x - a.x;
          const aby = b.y - a.y;
          const dot = abx * abx + aby * aby;
          if (dot === 0) continue;
          const t = Math.max(
            0,
            Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / dot)
          );
          const projX = a.x + t * abx;
          const projY = a.y + t * aby;
          const dist2 =
            (p.x - projX) * (p.x - projX) + (p.y - projY) * (p.y - projY);
          if (dist2 < best.dist2) {
            const projLng = lng1 + (lng2 - lng1) * t;
            const projLat = lat1 + (lat2 - lat1) * t;
            best = { dist2, lng: projLng, lat: projLat };
          }
        }
        return best.dist2 !== Infinity
          ? { lng: best.lng, lat: best.lat, meters: Math.sqrt(best.dist2) }
          : null;
      } catch {
        return null;
      }
    },
    [route]
  );

  /** Track device orientation for heading */
  useEffect(() => {
    const handleOrientation = (event) => {
      let heading = null;

      // iOS: webkitCompassHeading (most accurate)
      if (
        event.webkitCompassHeading !== undefined &&
        event.webkitCompassHeading !== null
      ) {
        heading = event.webkitCompassHeading;
      }
      // Android: Calculate from alpha
      else if (event.alpha !== null && event.alpha !== undefined) {
        // Get screen orientation
        const screenOrientation =
          window.screen?.orientation?.angle || window.orientation || 0;
        let adjustedAlpha = event.alpha;

        // Adjust for screen rotation
        if (screenOrientation === 90) {
          adjustedAlpha = (event.alpha + 90) % 360;
        } else if (screenOrientation === -90 || screenOrientation === 270) {
          adjustedAlpha = (event.alpha - 90 + 360) % 360;
        } else if (screenOrientation === 180) {
          adjustedAlpha = (event.alpha + 180) % 360;
        }

        // Convert to compass bearing (0° = North)
        heading = (360 - adjustedAlpha) % 360;
      }

      if (heading !== null) {
        // Normalize to prevent 360° jumps
        const smoothHeading = normalizeHeading(heading);
        setUserHeading(smoothHeading);
      }
    };

    // Auto-add listeners for non-iOS devices
    window.addEventListener("deviceorientationabsolute", handleOrientation, {
      passive: true,
    });
    window.addEventListener("deviceorientation", handleOrientation, {
      passive: true,
    });

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation
      );
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [normalizeHeading]);

  /** Fallback: Request orientation permission when geolocate button is clicked (iOS 13+) */
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    if (!map) return;

    const requestOrientationPermission = async () => {
      // Only for iOS 13+ that requires permission
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        try {
          await DeviceOrientationEvent.requestPermission();
        } catch (error) {
          console.log("Orientation permission request:", error);
        }
      }
    };

    // Attach click listener to geolocate button
    const setupGeolocateListener = () => {
      setTimeout(() => {
        const geolocateButton = document.querySelector(
          ".mapboxgl-ctrl-geolocate"
        );
        if (geolocateButton) {
          geolocateButton.addEventListener(
            "click",
            requestOrientationPermission
          );
        }
      }, 500);
    };

    if (map.loaded()) {
      setupGeolocateListener();
    } else {
      map.on("load", setupGeolocateListener);
    }

    return () => {
      const geolocateButton = document.querySelector(
        ".mapboxgl-ctrl-geolocate"
      );
      if (geolocateButton) {
        geolocateButton.removeEventListener(
          "click",
          requestOrientationPermission
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const map = mapRef.current.getMap();
    if (!map) return;
    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "custom-user-marker";
      el.style.cssText = `position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;`;
      const beamContainer = document.createElement("div");
      beamContainer.className = "heading-beam-container";
      beamRotationRef.current = userHeading - (viewState?.bearing || 0);
      beamContainer.style.cssText = `position: absolute; width: 100%; height: 100%; transform: rotate(${beamRotationRef.current}deg) translateZ(0); transform-origin: center center; transition: transform 0.15s ease-out; will-change: transform; backface-visibility: hidden; -webkit-backface-visibility: hidden; perspective: 1000px; -webkit-perspective: 1000px; pointer-events: none;`;
      const beam = document.createElement("div");
      beam.className = "heading-cone";
      beam.style.cssText = `position: absolute; width: 70px; height: 90px; background: linear-gradient(to top, rgba(59, 130, 246, 0.7), rgba(59, 130, 246, 0)); top: -50px; left: 50%; transform: translateX(-50%) translateZ(0); -webkit-transform: translateX(-50%) translateZ(0); clip-path: polygon(32% 100%, 38% 100%, 5% 0%, 95% 0%, 62% 100%, 68% 100%); -webkit-clip-path: polygon(32% 100%, 38% 100%, 5% 0%, 95% 0%, 62% 100%, 68% 100%); filter: blur(1px); -webkit-filter: blur(1px); backface-visibility: hidden; -webkit-backface-visibility: hidden; pointer-events: none;`;
      beamContainer.appendChild(beam);
      el.appendChild(beamContainer);
      const pulse = document.createElement("div");
      pulse.style.cssText = `position: absolute; width: 48px; height: 48px; background-color: rgba(59, 130, 246, 0.2); border-radius: 50%; animation: pulse 2s infinite; pointer-events: none;`;
      el.appendChild(pulse);
      const accuracyRing = document.createElement("div");
      accuracyRing.style.cssText = `position: absolute; width: 40px; height: 40px; background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 50%; pointer-events: none;`;
      el.appendChild(accuracyRing);
      const dot = document.createElement("div");
      dot.style.cssText = `position: relative; width: 20px; height: 20px; background-color: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); z-index: 10; pointer-events: none;`;
      el.appendChild(dot);
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
      userMarkerRef.current = marker;
    } else {
      const snap = nearestPointOnRoute(
        userLocation.longitude,
        userLocation.latitude
      );
      const useSnap = snap && snap.meters <= 15; // snap within 15m to route centerline
      const lng = useSnap ? snap.lng : userLocation.longitude;
      const lat = useSnap ? snap.lat : userLocation.latitude;
      userMarkerRef.current.setLngLat([lng, lat]);
    }
  }, [userLocation]);

  /** Update heading beam rotation accounting for map bearing with continuous angle */
  useEffect(() => {
    if (userMarkerRef.current) {
      const el = userMarkerRef.current.getElement();
      const beamContainer = el.querySelector(".heading-beam-container");
      if (beamContainer) {
        const desired = userHeading - (viewState?.bearing || 0);
        const current = beamRotationRef.current;
        const diff = ((desired - current + 540) % 360) - 180; // shortest angular delta
        const next = current + diff;
        beamRotationRef.current = next;
        beamContainer.style.transition = isMapRotatingRef.current
          ? "none"
          : "transform 0.15s ease-out";
        beamContainer.style.transform = `rotate(${next}deg) translateZ(0)`;
      }
    }
  }, [userHeading, viewState?.bearing]);

  /** Detect map rotation gestures to temporarily disable beam transition */
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;
    const onRotateStart = () => {
      isMapRotatingRef.current = true;
      followEnabledRef.current = false;
      lastUserInteractRef.current = Date.now();
    };
    const onRotateEnd = () => {
      isMapRotatingRef.current = false;
      lastUserInteractRef.current = Date.now();
    };
    const onDragStart = () => {
      followEnabledRef.current = false;
      lastUserInteractRef.current = Date.now();
    };
    const onDragEnd = () => {
      lastUserInteractRef.current = Date.now();
    };
    const onPitchStart = () => {
      followEnabledRef.current = false;
      lastUserInteractRef.current = Date.now();
    };
    const onPitchEnd = () => {
      lastUserInteractRef.current = Date.now();
    };
    map.on("rotatestart", onRotateStart);
    map.on("rotateend", onRotateEnd);
    map.on("dragstart", onDragStart);
    map.on("dragend", onDragEnd);
    map.on("pitchstart", onPitchStart);
    map.on("pitchend", onPitchEnd);
    return () => {
      map.off("rotatestart", onRotateStart);
      map.off("rotateend", onRotateEnd);
      map.off("dragstart", onDragStart);
      map.off("dragend", onDragEnd);
      map.off("pitchstart", onPitchStart);
      map.off("pitchend", onPitchEnd);
    };
  }, []);

  /** DISABLED: Automatic map centering and rotating
   * Users can now freely pan and rotate the map without it auto-centering on their location
   */
  // useEffect(() => {
  //   if (!mapRef.current || !userLocation) return;
  //   const map = mapRef.current.getMap();
  //   if (!map) return;
  //   const now = Date.now();
  //   if (!followEnabledRef.current) {
  //     if (now - (lastUserInteractRef.current || 0) > 5000) {
  //       followEnabledRef.current = true;
  //     } else {
  //       return;
  //     }
  //   }
  //   if (now - (lastCameraUpdateRef.current || 0) < 400) return;
  //   lastCameraUpdateRef.current = now;
  //   const currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : (viewState?.zoom || 16);
  //   const toRad = (v) => (v * Math.PI) / 180;
  //   const haversineMeters = (lat1, lng1, lat2, lng2) => {
  //     const R = 6371000;
  //     const dLat = toRad(lat2 - lat1);
  //     const dLng = toRad(lng2 - lng1);
  //     const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  //     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  //     return R * c;
  //   };
  //   const calcBearing = (lat1, lng1, lat2, lng2) => {
  //     const dLng = toRad(lng2 - lng1);
  //     const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  //     const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  //     let brng = Math.atan2(y, x) * 180 / Math.PI;
  //     if (brng < 0) brng += 360;
  //     return brng;
  //   };
  //   let targetBearing = typeof map.getBearing === 'function' ? map.getBearing() : 0;
  //   if (steps && steps.length > 0) {
  //     const step = steps[currentStepIndex];
  //     const loc = step?.maneuver?.location;
  //     if (loc && loc.length >= 2) {
  //       const [lng, lat] = loc;
  //       const dist = haversineMeters(userLocation.latitude, userLocation.longitude, lat, lng);
  //       if (dist <= 60) {
  //         targetBearing = calcBearing(userLocation.latitude, userLocation.longitude, lat, lng);
  //       }
  //     }
  //   }
  //   const snap = nearestPointOnRoute(userLocation.longitude, userLocation.latitude);
  //   const useSnap = snap && snap.meters <= 15;
  //   const centerLng = useSnap ? snap.lng : userLocation.longitude;
  //   const centerLat = useSnap ? snap.lat : userLocation.latitude;
  //   map.easeTo({
  //     center: [centerLng, centerLat],
  //     bearing: targetBearing,
  //     zoom: currentZoom,
  //     duration: 300,
  //     essential: true
  //   });
  // }, [userLocation, userHeading]);

  /** Trigger geolocate control on mount and enable watch mode */
  useEffect(() => {
    if (
      geolocateControlRef.current &&
      !showGpsModal &&
      gpsApproved &&
      isGuidanceRunning
    ) {
      const timer = setTimeout(() => {
        geolocateControlRef.current?.trigger();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showGpsModal, gpsApproved, isGuidanceRunning]);

  /** Check if route stays within Intramuros bounds */
  const isRouteWithinBounds = (routeGeometry) => {
    if (!mask?.geometry?.coordinates?.[0]) return true;

    const bounds = mask.geometry.coordinates[0];
    const minLng = Math.min(...bounds.map((c) => c[0]));
    const maxLng = Math.max(...bounds.map((c) => c[0]));
    const minLat = Math.min(...bounds.map((c) => c[1]));
    const maxLat = Math.max(...bounds.map((c) => c[1]));

    // Check if all route coordinates are within bounds
    for (const coord of routeGeometry.coordinates) {
      const [lng, lat] = coord;
      if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) {
        return false;
      }
    }
    return true;
  };

  /** Build route from user → current pin */
  const buildRoute = async (start, pin) => {
    if (!pin) return;
    if (!start) {
      start = {
        latitude: viewState?.latitude ?? 14.5896,
        longitude: viewState?.longitude ?? 120.9747,
      };
    }

    try {
      const reqId = ++routingReqId.current;
      setIsRouting(true);
      const lang =
        (typeof localStorage !== "undefined" &&
          localStorage.getItem("i18nextLng")) ||
        "en";
      const url =
        `https://api.mapbox.com/directions/v5/mapbox/${transportMode}/${start.longitude},${start.latitude};${pin.longitude},${pin.latitude}` +
        `?steps=true&geometries=geojson&overview=full&voice_instructions=true&banner_instructions=true` +
        `&alternatives=false&annotations=distance,duration&language=${encodeURIComponent(
          lang
        )}&voice_units=metric&continue_straight=true` +
        `&access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
      const resp = await fetch(url);
      const json = await resp.json();
      const routeData = json.routes?.[0];

      // Check if route stays within Intramuros bounds
      if (!isRouteWithinBounds(routeData.geometry)) {
        console.warn("⚠️ Route goes outside Intramuros, using straight line");
        // Use straight line instead
        const straightLine = {
          type: "LineString",
          coordinates: [
            [start.longitude, start.latitude],
            [pin.longitude, pin.latitude],
          ],
        };

        // Calculate straight-line distance
        const dx = pin.latitude - start.latitude;
        const dy = pin.longitude - start.longitude;
        const distance = Math.sqrt(dx * dx + dy * dy) * 111000; // rough meters

        // Ignore stale responses
        if (reqId !== routingReqId.current) return;
        setDistance(distance);
        const speedByMode = { walking: 1.4, cycling: 4.0, driving: 8.33 }; // m/s
        const speed = speedByMode[transportMode] || 1.4;
        setEta(distance / speed);
        setArrivalTime(new Date(Date.now() + (distance / speed) * 1000));
        setRoute({
          type: "Feature",
          geometry: straightLine,
          properties: {},
        });
        const verb =
          transportMode === "driving"
            ? "Drive"
            : transportMode === "cycling"
            ? "Bike"
            : "Walk";
        setSteps([
          {
            // simple instruction for straight line fallback
            maneuver: {
              instruction: `${verb} directly to ${pin.siteName}`,
              location: [start.longitude, start.latitude],
            },
          },
        ]);
        setCurrentStepIndex(0);
        setIsRouting(false);
        return;
      }

      // Ignore stale responses
      if (reqId !== routingReqId.current) return;
      setDistance(routeData.distance);
      setEta(routeData.duration);

      // ETA as clock time
      const arrival = new Date(Date.now() + routeData.duration * 1000);
      setArrivalTime(arrival);

      setRoute({
        type: "Feature",
        geometry: routeData.geometry,
        properties: {},
      });
      const rawSteps = routeData.legs.flatMap((leg) => leg.steps);
      const map = mapRef.current?.getMap?.();
      const stepsWithNames = await Promise.all(
        rawSteps.map(async (s) => {
          let roadName = (s.name || "").trim();
          const generic =
            !roadName || /^(unnamed|walkway|foot|path|trail)$/i.test(roadName);
          if (generic) {
            try {
              if (map && typeof map.project === "function") {
                const [lng, lat] = s?.maneuver?.location || [];
                const pt = map.project({ lng, lat });
                const bbox = [
                  { x: pt.x - 24, y: pt.y - 24 },
                  { x: pt.x + 24, y: pt.y + 24 },
                ];
                const feats = map.queryRenderedFeatures([
                  [bbox[0].x, bbox[0].y],
                  [bbox[1].x, bbox[1].y],
                ]);
                const named = feats.find((f) => {
                  const n = (f?.properties?.name || "").trim();
                  return n && !/^(unnamed|walkway|foot|path|trail)$/i.test(n);
                });
                if (named) roadName = named.properties.name;
              }
              if (!roadName) {
                const r = await geocodingClient
                  .reverseGeocode({ query: s?.maneuver?.location, limit: 1 })
                  .send();
                roadName = r?.body?.features?.[0]?.text || roadName;
              }
            } catch {}
          }
          return { ...s, roadName };
        })
      );
      setSteps(stepsWithNames);
      setCurrentStepIndex(0);
      setIsRouting(false);
    } catch (err) {
      console.error("Directions error:", err);
      setIsRouting(false);
    }
  };

  // Rebuild route when transport mode changes (if we have a target)
  useEffect(() => {
    if (!showGpsModal && userLocation) {
      // Determine which pin to route to (activePin takes priority)
      const targetPin = activePin || selectedPin;

      if (targetPin) {
        // Optimistic ETA update to make mode change feel instant
        if (distance) {
          const speedByMode = { walking: 1.4, cycling: 4.0, driving: 8.33 }; // m/s
          const speed = speedByMode[transportMode] || 1.4;
          const newEta = distance / speed;
          setEta(newEta);
          setArrivalTime(new Date(Date.now() + newEta * 1000));
        }
        // Rebuild route with new transport mode
        buildRoute(userLocation, targetPin);
      }
    }
  }, [transportMode]);

  /** Optimize route when user location or pins change - ONLY if no saved order */
  // This effect is now handled in loadProgress useEffect to prevent re-optimization

  /** Build route to current pin */
  useEffect(() => {
    if (
      isGuidanceRunning &&
      userLocation &&
      optimizedPins.length > 0 &&
      optimizedPins[currentPinIndex]
    ) {
      buildRoute(userLocation, optimizedPins[currentPinIndex]);
    }
  }, [userLocation, optimizedPins, currentPinIndex]);

  /** Detect arrival to auto-show preview card and auto-mark last site */
  useEffect(() => {
    if (!isGuidanceRunning || !userLocation || optimizedPins.length === 0)
      return;

    const radius = 15; // meters - show preview when within 15m (required for Next Site button)

    const pin = optimizedPins[currentPinIndex];
    if (!pin) return;

    const distance = calculateDistance(userLocation, {
      latitude: pin.latitude,
      longitude: pin.longitude,
    });

    if (distance < radius) {
      setIsNearby(true);
      // Only auto-show if not manually dismissed
      if (!manuallyDismissed) {
        setSelectedPin(pin);
      }

      // Auto-mark as visited if this is the last site
      const isLastSite = currentPinIndex === optimizedPins.length - 1;
      if (isLastSite && !visitedSites.has(pin._id)) {
        const updatedVisited = new Set(visitedSites);
        updatedVisited.add(pin._id);
        setVisitedSites(updatedVisited);
        saveProgress(
          currentPinIndex,
          updatedVisited,
          skippedSites,
          userLocation,
          optimizedPins
        );
        console.log("✅ Last site auto-marked as visited:", pin.siteName);
      }
    } else {
      setIsNearby(false);
    }
  }, [
    userLocation,
    currentPinIndex,
    optimizedPins,
    manuallyDismissed,
    visitedSites,
    skippedSites,
  ]);

  // Step advancement logic - SENSITIVE: auto-advance immediately when user turns to another street
  useEffect(() => {
    if (!isGuidanceRunning || !userLocation || steps.length === 0) return;
    const toRad = (v) => (v * Math.PI) / 180;
    const haversineMeters = (lat1, lng1, lat2, lng2) => {
      const R = 6371000;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Find closest step to user's current position
    let closestIdx = 0;
    let minMeters = Infinity;
    for (let idx = 0; idx < steps.length; idx++) {
      const loc = steps[idx]?.maneuver?.location;
      if (!loc || loc.length < 2) continue;
      const [lng, lat] = loc;
      const meters = haversineMeters(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lng
      );
      if (meters < minMeters) {
        minMeters = meters;
        closestIdx = idx;
      }
    }

    // Calculate distance to current step
    const currentLoc = steps[currentStepIndex]?.maneuver?.location;
    const currentDist =
      currentLoc && currentLoc.length >= 2
        ? haversineMeters(
            userLocation.latitude,
            userLocation.longitude,
            currentLoc[1],
            currentLoc[0]
          )
        : Infinity;

    if (closestIdx !== currentStepIndex) {
      const now = Date.now();
      const forward = closestIdx > currentStepIndex;

      // SENSITIVE thresholds for immediate turn detection:
      // Forward: advance if user is 10m+ away from current step (reduced from 15m)
      // OR if closer to next step and moved 12m+ from current (for tight turns)
      const isForwardReady =
        forward &&
        (currentDist > 10 || // Passed maneuver point by 10m
          (minMeters < currentDist && currentDist > 12)); // Closer to next and moved away from current
      const isBackwardReady = !forward && currentDist - minMeters > 30; // Only go back if much closer
      const shouldAdvance = isForwardReady || isBackwardReady;

      const candidate = stepSwitchCandidateRef.current;
      if (candidate.index !== closestIdx) {
        stepSwitchCandidateRef.current = {
          index: closestIdx,
          startedAt: now,
          count: 1,
        };
      } else {
        candidate.count += 1;
      }

      // Fast response: advance after 500ms OR 2 confirmations (reduced from 800ms/3 times)
      const timePassed = now - stepSwitchCandidateRef.current.startedAt > 500;
      const countMet = stepSwitchCandidateRef.current.count >= 2;
      const ready = shouldAdvance && (timePassed || countMet);

      if (ready) {
        console.log(
          `📍 Step advancement: ${currentStepIndex} → ${closestIdx} (distance from current: ${currentDist.toFixed(
            1
          )}m, distance to new: ${minMeters.toFixed(1)}m)`
        );
        setCurrentStepIndex(closestIdx);
        stepSwitchCandidateRef.current = {
          index: null,
          startedAt: 0,
          count: 0,
        };
      }
    } else {
      // Reset candidate when staying at same step
      stepSwitchCandidateRef.current = { index: null, startedAt: 0, count: 0 };
    }
  }, [userLocation, steps, currentStepIndex]);

  /** Mark site as visited */
  const markSiteAsVisited = async (pin) => {
    if (!pin || !pin._id || visitedSites.has(pin._id)) return;

    try {
      await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/visited-sites`,
        {
          itineraryId,
          siteId: pin._id,
        },
        getConfig()
      );
      setVisitedSites((prev) => new Set(prev).add(pin._id));
      console.log(`✅ Site ${pin.siteName} marked as visited`);
    } catch (err) {
      console.error("Error marking site as visited:", err);
    }
  };

  /** Fetch reviews for current site */
  const fetchSiteReviews = async (siteId) => {
    if (!siteId) return;

    try {
      setReviewsLoading(true);
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL ||
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}`
        }/reviews/site/${siteId}`,
        getConfig()
      );
      setSiteReviews(response.data.reviews || []);
      setShowReviews(true);
    } catch (err) {
      console.error("Error fetching site reviews:", err);
      setSiteReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  /** Simulate being at home - mark current site as done */
  const simulateGoToNextSite = async () => {
    const currentPin = pins[currentPinIndex];
    if (!currentPin) return;

    // Immediately add to visited sites Set
    setVisitedSites((prev) => new Set(prev).add(currentPin._id));

    // Mark as visited in backend (async, but we don't wait)
    markSiteAsVisited(currentPin);

    // Close the modal first
    setShowFullModal(false);

    // Show confirmation
    setNotification({
      isOpen: true,
      type: "success",
      title: "Site Visited!",
      message: "Marked as visited. Moving to next stop.",
    });

    // Go to next site, passing the site we just marked as done
    goToNextStop(currentPin._id);
  };

  /** Handle location state trigger from Trip Archives */
  useEffect(() => {
    if (location.state?.triggerNextSite && pins.length > 0) {
      // Trigger next site navigation
      goToNextStop();
    }
  }, [location.state, pins]);

  /** Fetch reviews when a pin is selected */
  useEffect(() => {
    if (selectedPin && selectedPin._id) {
      fetchSiteReviews(selectedPin._id);
    } else {
      setShowReviews(false);
      setRoute(null);
      setSteps([]);
    }
  }, [selectedPin]);

  const goToNextStop = (justVisitedSiteId = null) => {
    try {
      if (!optimizedPins || optimizedPins.length === 0) return;

      const updatedVisited = new Set(visitedSites);
      if (justVisitedSiteId) {
        updatedVisited.add(justVisitedSiteId);
        setVisitedSites(updatedVisited);
      }

      const nextPin = getNextSite(optimizedPins, updatedVisited);
      if (!nextPin) {
        setShowCompletionModal(true);
        setSelectedPin(null);
        setRoute(null);
        setSteps([]);
        return;
      }

      const nextIndex = optimizedPins.findIndex((p) => p._id === nextPin._id);
      setCurrentPinIndex(nextIndex);
      setActivePin(nextPin);
      setSelectedPin(nextPin);
      setManuallyDismissed(false);
      buildRoute(userLocation, nextPin);

      saveProgress(
        nextIndex,
        updatedVisited,
        skippedSites,
        userLocation,
        optimizedPins
      );
    } catch (err) {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Navigation Error",
        message:
          err?.message || "Failed to advance to the next site. Please retry.",
      });
    }
  };

  // Memoize onMove handler to prevent unnecessary re-renders
  const handleMapMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  // Initialize TTS service - OFF by default, user controls via toggle button
  useEffect(() => {
    // Don't auto-enable - let user control via toggle button
    // TTS service is OFF by default (isEnabled = false)
    return () => {
      try {
        ttsService.cancel();
      } catch {}
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        if (
          isGuidanceRunning &&
          !notification.isOpen &&
          !showFullModal &&
          !showGpsModal &&
          !showResumeModal &&
          !showCompletionModal &&
          !showFortDrivingModal
        ) {
          setNotification({
            isOpen: true,
            type: "warning",
            title: "Stay Alert",
            message:
              "Be mindful of your surroundings. Keep valuables secure, beware of pickpockets, and avoid overpriced services by using trusted vendors.",
          });
          setTimeout(() => {
            setNotification((n) =>
              n.title === "Stay Alert" ? { ...n, isOpen: false } : n
            );
          }, 7000);
        }
      } catch {}
    }, 120000);
    return () => clearInterval(interval);
  }, [
    isGuidanceRunning,
    notification.isOpen,
    showFullModal,
    showGpsModal,
    showResumeModal,
    showCompletionModal,
    showFortDrivingModal,
  ]);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Resume/Restart Modal */}
      <ResumeItineraryModal
        isOpen={showResumeModal}
        onResume={handleResumeProgress}
        onRestart={handleRestartProgress}
        onClose={() => setShowResumeModal(false)}
        showRestart={currentPinIndex > 0}
        currentSiteName={
          savedProgress &&
          optimizedPins.length > 0 &&
          savedProgress.currentPinIndex < optimizedPins.length
            ? optimizedPins[savedProgress.currentPinIndex]?.siteName ||
              optimizedPins[savedProgress.currentPinIndex]?.title
            : null
        }
      />

      {/* Completion Modal */}
      <ItineraryCompletionModal
        isOpen={showCompletionModal}
        onRestart={handleRestartProgress}
        onClose={() => setShowCompletionModal(false)}
        itineraryName={itineraryName}
        totalSites={optimizedPins.length || pins.length}
      />

      <GpsConsentModal
        isOpen={showGpsModal}
        errorMessage={gpsError}
        onEnable={() => {
          if (gpsPermissionDenied) {
            setGpsError(
              "GPS permission was denied. Please enable location access in your browser/device settings, then refresh this page."
            );
            return;
          }

          if (navigator?.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const loc = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                };
                setUserLocation(loc);

                let within = true;
                try {
                  if (mask?.geometry)
                    within = isUserWithinIntramuros(loc, mask.geometry);
                } catch {}

                setShowGpsModal(false);
                setGpsPermissionDenied(false);
                setGpsError("");
                // if (!within) {
                //   setShowLocationBlockModal(true);
                //   setIsBackdropActive(false);
                //   return;
                // }
                setGpsApproved(true);
                setIsBackdropActive(false);
                (async () => {
                  try {
                    setTourMode("original");
                    const original = [...pins];
                    setOptimizedPins(original);
                    if (original.length > 0) {
                      setCurrentPinIndex(0);
                      setSelectedPin(original[0]);
                      setActivePin(original[0]);
                      await saveProgress(
                        0,
                        visitedSites,
                        skippedSites,
                        loc,
                        original
                      );
                      buildRoute(loc, original[0]);
                    }
                    setIsPreviewMode(false);
                    setIsGuidanceRunning(true);
                  } catch {}
                })();
              },
              (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                  setGpsPermissionDenied(true);
                  setGpsError(
                    "Location access denied. To use this feature, please enable location in your browser settings, then refresh the page."
                  );
                } else {
                  setGpsError(
                    "We couldn't access your location. Please enable GPS in device settings or use Tour Map features from the homepage."
                  );
                }
                setShowGpsModal(false);
                setIsBackdropActive(false);
              },
              { enableHighAccuracy: true, maximumAge: 0, timeout: 6000 }
            );
          } else {
            setGpsError(
              "GPS is unavailable in this browser. Please use Tour Map features from the homepage."
            );
            setShowGpsModal(false);
            setIsBackdropActive(false);
          }
        }}
        onDecline={() => {
          setShowGpsModal(false);
          setIsBackdropActive(false);
        }}
      />

      {/* Header - Rendered via Portal */}
      {createPortal(
        <div
          className="fixed top-0 left-0 right-0 z-[9999] bg-white border-b border-gray-200"
          style={{
            paddingTop: "max(env(safe-area-inset-top), 16px)",
            paddingBottom: "8px",
            paddingLeft: "16px",
            paddingRight: "16px",
            pointerEvents: "auto",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              className="text-2xl font-bold cursor-pointer transition-all active:scale-90 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/10"
              onClick={() => {
                if (location.key !== "default") {
                  navigate(-1);
                } else {
                  navigate("/");
                }
              }}
              aria-label="Go back"
              style={{
                textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                color: "inherit",
              }}
            >
              ‹
            </button>
            <h1
              className="font-bold text-xl truncate"
              style={{
                textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                margin: 0,
                padding: 0,
              }}
            >
              Tourist Itinerary Map
            </h1>
          </div>
        </div>,
        document.body
      )}

      {/* Map Container - Takes remaining height */}
      <div className="flex-1 relative overflow-hidden">
        <Map
          ref={mapRef}
          {...viewState}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          onMove={handleMapMove}
          maxBounds={INTRAMUROS_BOUNDS}
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          {/* Greyed out area */}
          {inverseMask && (
            <Source id="inverse-mask" type="geojson" data={inverseMask}>
              <Layer
                id="inverse-fill"
                type="fill"
                paint={{ "fill-color": "#000", "fill-opacity": 0.5 }}
              />
            </Source>
          )}

          {/* Border */}
          {mask && (
            <Source id="mask" type="geojson" data={mask}>
              <Layer
                id="mask-border"
                type="line"
                paint={{ "line-color": "#FF0000", "line-width": 2 }}
              />
            </Source>
          )}

          {/* GeolocateControl appears after GPS approval */}
          <GeolocateControl
            ref={geolocateControlRef}
            position="top-right"
            positionOptions={{
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 10000,
            }}
            trackUserLocation={true}
            showUserHeading={false}
            showAccuracyCircle={true}
            showUserLocation={true}
            fitBoundsOptions={{ maxZoom: 18 }}
            onGeolocate={handleGeolocate}
            onError={handleGeolocateError}
          />

          {/* Site markers - preview uses raw pins, tour uses optimized */}
          {(isGuidanceRunning ? optimizedPins : pins).map((pin, idx) => {
            const isVisited = visitedSites.has(pin._id);
            return (
              <Marker
                key={pin._id}
                latitude={pin.latitude}
                longitude={pin.longitude}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedPin(pin);
                  setShowFullModal(false); // Show preview card first
                  // Only build route if this is the active pin or no active pin set
                  if (!activePin || activePin._id === pin._id) {
                    setCurrentPinIndex(idx);
                    setActivePin(pin);
                    if (isGuidanceRunning) buildRoute(userLocation, pin);
                  }
                }}
              >
                {/* Number Badge - shows optimized order (never changes) */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg cursor-pointer transition-all ${
                    idx === currentPinIndex
                      ? "bg-blue-600 text-white animate-pulse scale-110"
                      : isVisited
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {idx + 1}
                </div>
              </Marker>
            );
          })}

          {/* Route */}
          {route && (
            <Source id="route" type="geojson" data={route}>
              <Layer
                id="route-line"
                type="line"
                paint={{ "line-color": "#1d4ed8", "line-width": 4 }}
              />
            </Source>
          )}
        </Map>

        {/* Directions Panel - only during active tour */}
        {isGuidanceRunning && (
          <DirectionsPanel
            steps={steps}
            currentStepIndex={currentStepIndex}
            setCurrentStepIndex={setCurrentStepIndex}
            eta={eta}
            distance={distance}
            arrivalTime={arrivalTime}
            isRouting={isRouting}
            transportMode={transportMode}
            userLocation={userLocation}
            activePin={activePin}
            onPrevSite={handlePrevSite}
            onSkipSite={handleSkipSite}
            onNextSite={handleNextSite}
            hasPrevSite={currentPinIndex > 0}
            hasNextSite={true}
            isLastSite={currentPinIndex >= optimizedPins.length - 1}
            isNearby={isNearby}
            onArriveAtDestination={() => {
              if (!isTourRunning && activePin) {
                setSelectedPin(activePin);
                setShowFullModal(true);
              }
            }}
          />
        )}

        {/* Control Buttons */}
        {!showFullModal && (
          <MapControlButtons
            userLocation={userLocation}
            selectedPin={selectedPin}
            pins={isGuidanceRunning ? optimizedPins : pins}
            currentPinIndex={currentPinIndex}
            setViewState={setViewState}
            setSelectedPin={setSelectedPin}
            setManuallyDismissed={setManuallyDismissed}
            enableTransportMode={true}
            showTransportPanel={showTransportPanel}
            setShowTransportPanel={setShowTransportPanel}
            transportMode={transportMode}
            setTransportMode={setTransportMode}
            onActivateGps={() => {
              try {
                geolocateControlRef.current?.trigger();
              } catch {}
            }}
            onOpenItineraryInfo={() => setShowInfoModal(true)}
          />
        )}

        {/* Site Preview Card */}
        {selectedPin &&
          !showFullModal &&
          !suppressPreviewCard &&
          !isTourRunning && (
            <SitePreviewCard
              selectedPin={selectedPin}
              distance={distance}
              isNearby={isNearby}
              onExpand={() => setShowFullModal(true)}
              onClose={() => {
                setSelectedPin(null);
                setManuallyDismissed(true);
              }}
              onMarkAsDone={handleMarkAsDone}
              isVisited={visitedSites.has(selectedPin._id)}
            />
          )}

        {/* Site Modal - Full Screen */}
        {selectedPin && showFullModal && !isTourRunning && (
          <SiteModalFullScreen
            selectedPin={selectedPin}
            onClose={() => {
              setSuppressPreviewCard(true);
              setShowFullModal(false);
              try {
                const map = mapRef.current?.getMap?.();
                if (map && selectedPin) {
                  const currentZoom =
                    typeof map.getZoom === "function"
                      ? map.getZoom()
                      : viewState?.zoom || 16;
                  const currentBearing =
                    typeof map.getBearing === "function"
                      ? map.getBearing()
                      : viewState?.bearing || 0;
                  const currentPitch =
                    typeof map.getPitch === "function"
                      ? map.getPitch()
                      : viewState?.pitch || 0;
                  map.easeTo({
                    center: [selectedPin.longitude, selectedPin.latitude],
                    zoom: currentZoom,
                    bearing: currentBearing,
                    pitch: currentPitch,
                    duration: 0,
                    essential: true,
                  });
                  setViewState((vs) => ({
                    ...vs,
                    latitude: selectedPin.latitude,
                    longitude: selectedPin.longitude,
                    zoom: currentZoom,
                    bearing: currentBearing,
                    pitch: currentPitch,
                  }));
                }
              } catch {}
              setTimeout(() => setSuppressPreviewCard(false), 250);
            }}
            distance={distance}
            currentPinIndex={currentPinIndex}
            pinsLength={optimizedPins.length}
            goToNextStop={goToNextStop}
            siteReviews={siteReviews}
            reviewsLoading={reviewsLoading}
            simulateGoToNextSite={simulateGoToNextSite}
            onReviewSubmitted={() => fetchSiteReviews(selectedPin._id)}
          />
        )}

        {/* Floating Chatbot */}
        {!isTourRunning && <FloatingChatbot />}

        {/* Notification Modal */}
        {!isTourRunning && (
          <NotificationModal
            isOpen={notification.isOpen}
            onClose={() => setNotification({ ...notification, isOpen: false })}
            type={notification.type}
            title={notification.title}
            message={notification.message}
          />
        )}

        {/* Fort Santiago Driving Restriction Modal */}
        <ConfirmModal
          isOpen={showFortDrivingModal}
          onClose={() => setShowFortDrivingModal(false)}
          onConfirm={fortModalConfirm}
          title="Fort Santiago – Car Restriction"
          message="Cars cannot enter Fort Santiago. Please find parking and continue using Foot mode to proceed."
          confirmText="Walk Mode"
          cancelText="Cancel"
          type="warning"
        />

        <ConfirmModal
          isOpen={showLocationBlockModal}
          onClose={() => {
            setShowLocationBlockModal(false);
          }}
          onConfirm={() => {
            setShowLocationBlockModal(false);
          }}
          title="Location Required"
          message="Please ensure you are within Intramuros to access this tour. Move to the area and try again."
          confirmText="Okay"
          cancelText=""
          type="error"
        />

        {/* Backdrop to prevent bypass during GPS validation */}
        {isBackdropActive && (
          <div className="fixed inset-0 z-[9998] bg-black/40" />
        )}

        {/* Preview bottom action */}
        {isPreviewMode && !isGuidanceRunning && (
          <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
            <div className="mx-4 mb-6 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  try {
                    if (navigator?.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const loc = {
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                          };
                          setUserLocation(loc);
                          setGpsApproved(true);
                          const withinNow = mask?.geometry
                            ? isUserWithinIntramuros(loc, mask.geometry)
                            : true;
                          if (!withinNow) {
                            setShowLocationBlockModal(true);
                            setIsBackdropActive(false);
                            return;
                          }
                          (async () => {
                            try {
                              setTourMode("original");
                              const original = [...pins];
                              setOptimizedPins(original);
                              if (original.length > 0) {
                                setCurrentPinIndex(0);
                                setSelectedPin(original[0]);
                                setActivePin(original[0]);
                                await saveProgress(
                                  0,
                                  visitedSites,
                                  skippedSites,
                                  loc,
                                  original
                                );
                                buildRoute(loc, original[0]);
                              }
                              setIsPreviewMode(false);
                              setIsGuidanceRunning(true);
                            } catch {}
                          })();
                        },
                        (err) => {
                          setGpsPermissionDenied(
                            err?.code === err.PERMISSION_DENIED
                          );
                          setGpsError(
                            err?.code === err.PERMISSION_DENIED
                              ? "Location access denied. Enable location in browser settings, then refresh."
                              : "We couldn't access your location. Please enable GPS to start the tour."
                          );
                          setShowLocationBlockModal(true);
                          setIsBackdropActive(false);
                        },
                        {
                          enableHighAccuracy: true,
                          maximumAge: 0,
                          timeout: 5000,
                        }
                      );
                    } else {
                      setGpsError(
                        "GPS is unavailable in this browser. Please enable location services to start the tour."
                      );
                      setShowLocationBlockModal(true);
                      setIsBackdropActive(false);
                    }
                  } catch {
                    setShowLocationBlockModal(true);
                    setIsBackdropActive(false);
                  }
                }}
                className="itinerary-start-tour-btn w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#f04e37] text-white font-semibold shadow-lg hover:bg-[#d63b2a] transition"
              >
                <Navigation className="w-5 h-5" /> Start Tour
              </button>
              <p className="text-center text-xs text-gray-600 mt-2">
                Preview mode — pins are visible; GPS starts after you begin
              </p>
            </div>
          </div>
        )}

        {/* Tour mode choice removed; start uses original order automatically */}

        {/* Itinerary Overview Modal */}
        {showInfoModal && detailsItinerary && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowInfoModal(false)}
            />
            <div className="relative bg-white w-full sm:max-w-3xl md:max-w-4xl mx-0 sm:mx-4 mt-4 rounded-3xl shadow-2xl animate-fadeIn h-[90vh] sm:h-[85vh] overflow-y-auto overflow-x-hidden modern-scrollbar">
              <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center rounded-full bg-[#f04e37] w-8 h-8">
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="white"
                    >
                      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.75 6.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM11 10h2v8h-2v-8z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {detailsItinerary.name}
                    </h3>
                    <p className="text-xs text-gray-500">Itinerary overview</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {resolveUrl(detailsItinerary.imageUrl) && (
                <div className="h-36 sm:h-56 md:h-64 w-full overflow-hidden">
                  <img
                    src={resolveUrl(detailsItinerary.imageUrl)}
                    alt={detailsItinerary.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="px-6 py-5 sm:px-8 sm:py-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                      {(() => {
                        const totalMinutes = (
                          detailsItinerary.sites || []
                        ).reduce((sum, s) => {
                          const v =
                            typeof s?.averageTimeSpent === "number"
                              ? s.averageTimeSpent
                              : Number(s?.averageTimeSpent);
                          return sum + (isNaN(v) || v <= 0 ? 0 : v);
                        }, 0);
                        const computedHours =
                          Math.round((totalMinutes / 60) * 2) / 2;
                        const value =
                          detailsItinerary.duration &&
                          detailsItinerary.duration > 0
                            ? detailsItinerary.duration
                            : computedHours;
                        return value && value > 0
                          ? `Duration: ${value} ${
                              value === 1 ? "hour" : "hours"
                            }`
                          : "Duration: Flexible";
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">{`Sites: ${
                      (detailsItinerary.sites || []).length
                    } site(s)`}</span>
                  </div>
                </div>

                {detailsItinerary.description && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">
                      Description
                    </h4>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      {detailsItinerary.description}
                    </p>
                    {typeof detailsItinerary.recommendedStartMinutes ===
                      "number" && (
                      <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md bg-gray-50 border border-gray-200">
                        <svg
                          className="w-4 h-4 text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span className="text-sm text-gray-700 whitespace-nowrap">
                          Recommended Start:{" "}
                          {(() => {
                            const m =
                              detailsItinerary.recommendedStartMinutes || 0;
                            const h = Math.floor(m / 60);
                            const mm = String(m % 60).padStart(2, "0");
                            const ampm = h >= 12 ? "PM" : "AM";
                            const hh = h % 12 || 12;
                            return `${hh}:${mm} ${ampm}`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {(() => {
                  const roundToStep = (min, step = 5) =>
                    Math.round(min / step) * step;
                  const start =
                    typeof detailsItinerary.recommendedStartMinutes === "number"
                      ? detailsItinerary.recommendedStartMinutes
                      : 7 * 60;
                  const sequence = [];
                  const breaksArr = Array.isArray(detailsItinerary.breaks)
                    ? detailsItinerary.breaks
                    : [];
                  breaksArr
                    .filter((b) => Number(b.position) === 0)
                    .forEach((b) => sequence.push({ type: "break", data: b }));
                  (detailsItinerary.sites || []).forEach((site, idx) => {
                    sequence.push({ type: "site", data: site });
                    breaksArr
                      .filter((b) => Number(b.position) === idx + 1)
                      .forEach((b) =>
                        sequence.push({ type: "break", data: b })
                      );
                  });
                  let cursor = roundToStep(start, 5);
                  const items = sequence.map((it) => {
                    if (it.type === "break") {
                      const pseudoSite = {
                        _id: `break-${it.data.id || Math.random()}`,
                        siteName: it.data.label || "Break/Lunch",
                        title: it.data.label || "Break/Lunch",
                        averageTimeSpent: it.data.minutes || 0,
                        isBreak: true,
                      };
                      const item = {
                        time: roundToStep(cursor, 5),
                        site: pseudoSite,
                      };
                      cursor = roundToStep(
                        cursor + (Number(it.data.minutes) || 0),
                        5
                      );
                      return item;
                    }
                    const site = it.data;
                    const v =
                      typeof site?.averageTimeSpent === "number"
                        ? site.averageTimeSpent
                        : Number(site?.averageTimeSpent);
                    const item = { time: roundToStep(cursor, 5), site };
                    cursor = roundToStep(
                      cursor + (isNaN(v) || v <= 0 ? 0 : v),
                      5
                    );
                    return item;
                  });
                  if (!items.length) return null;
                  const isSuggested = !!detailsItinerary?.isAdminCreated;
                  return (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-500 mb-1">
                        {isSuggested ? "Suggested Schedule" : "Schedule"}
                      </h4>
                      {!isSuggested && (
                        <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>
                            Start Time:{" "}
                            {(() => {
                              const m = start;
                              const h = Math.floor(m / 60);
                              const mm = String(m % 60).padStart(2, "0");
                              const ampm = h >= 12 ? "PM" : "AM";
                              const hh = h % 12 || 12;
                              return `${hh}:${mm} ${ampm}`;
                            })()}
                          </span>
                        </div>
                      )}
                      {(() => {
                        const segments = items.map((it) => {
                          const site = it.site;
                          const minutes = site.isBreak
                            ? site.averageTimeSpent || 0
                            : (typeof site?.averageTimeSpent === "number"
                                ? site.averageTimeSpent
                                : Number(site?.averageTimeSpent)) || 0;
                          const end = roundToStep(it.time + minutes, 5);
                          return { start: it.time, end, site };
                        });
                        const fmt = (m) => {
                          const h = Math.floor(m / 60);
                          const mm = String(m % 60).padStart(2, "0");
                          const ampm = h >= 12 ? "PM" : "AM";
                          const hh = h % 12 || 12;
                          return `${hh}:${mm} ${ampm}`;
                        };
                        return (
                          <div className="space-y-3 sm:space-y-4">
                            {segments.map(({ start, end, site }, i) => (
                              <div
                                key={site._id || i}
                                className="flex items-center gap-4 sm:gap-5 py-1.5"
                              >
                                <div className="w-[160px] sm:w-[220px] flex-shrink-0 flex items-center justify-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-2 py-1 sm:px-3 sm:py-1.5">
                                  <svg
                                    className="w-4 h-4 text-gray-600"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  <span className="text-sm sm:hidden font-semibold text-gray-900 whitespace-nowrap">{`${fmt(
                                    start
                                  )} – ${fmt(end)}`}</span>
                                  <span className="hidden sm:inline text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">{`${fmt(
                                    start
                                  )} to ${fmt(end)}`}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 line-clamp-2 sm:line-clamp-1">
                                    {site.siteName || site.title}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">
                    Included Sites
                  </h4>
                  <div className="space-y-3 pr-2">
                    {(detailsItinerary.sites || []).map((site, i) => {
                      const thumb =
                        site.mediaFiles?.find((m) => m.type === "image")?.url ||
                        site.mediaUrl;
                      const img = resolveUrl(thumb);
                      return (
                        <div
                          key={site._id || i}
                          className="flex w-full text-left gap-3 p-3 border border-gray-200 rounded-xl bg-white"
                        >
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {img ? (
                              <img
                                src={img}
                                alt={site.siteName || site.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg
                                  className="w-6 h-6"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z"></path>
                                  <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-gray-900 truncate">
                              {site.siteName || site.title}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
