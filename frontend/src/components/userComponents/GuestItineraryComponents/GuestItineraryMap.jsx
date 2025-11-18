import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Map, { Marker, Source, Layer, GeolocateControl } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./GuestItineraryMap.css";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { guestApi } from "../../../utils/offlineAwareApi";
import { optimizeRoute, getNextSite, calculateDistance } from "../../../utils/routeOptimizer";

import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  directionsClient,
  createInverseMask,
} from "../TourMap/mapConfig";

// Import separated components
import DirectionsPanel from "../HomepageComponents/DirectionsPanel";
import MapControlButtons from "../HomepageComponents/MapControlButtons";
import SitePreviewCard from "../HomepageComponents/SitePreviewCard";
import SiteModalFullScreen from "../HomepageComponents/SiteModalFullScreen";
import GpsConsentModal from "../../shared/GpsConsentModal";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import NotificationModal from "../../shared/NotificationModal";
import ItineraryCompletionModal from "../../shared/ItineraryCompletionModal";
import ConfirmModal from "../../shared/ConfirmModal";
import ResumeItineraryModal from "../../shared/ResumeItineraryModal";
import { useTour } from "../../TourComponents/TourContext";

export default function GuestItineraryMap() {
  const { startTour, isTourRunning } = useTour?.() || { startTour: () => {}, isTourRunning: false };
  const { itineraryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [pins, setPins] = useState([]);
  const [optimizedPins, setOptimizedPins] = useState([]); // Optimized route order
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false); // Track if we've loaded saved progress
  const [notification, setNotification] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [itineraryName, setItineraryName] = useState(location.state?.itinerary?.name || "");
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
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);
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
        setShowGpsModal(false);
        setShowCompletionModal(false);
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);
  const [showFortDrivingModal, setShowFortDrivingModal] = useState(false);
  const [fortModalConfirm, setFortModalConfirm] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  // Use localStorage for guest users (for persistence across tabs)
  const token = localStorage.getItem("token");
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Utility to resolve relative URLs into absolute URLs
  const resolveUrl = (url) => {
    if (!url) return "";
    const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000";
    return url.startsWith("http")
      ? url
      : `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  /** Check GPS permission on mount */
  useEffect(() => {
    const checkGpsPermission = async () => {
      if (!navigator.geolocation) {
        setGpsError("Geolocation is not supported by your browser");
        setShowGpsModal(true);
        return;
      }

      try {
        // Try to get current position to check if GPS is accessible
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // GPS is accessible and working
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setShowGpsModal(false);
          },
          (error) => {
            // GPS is not accessible or denied
            if (error.code === error.PERMISSION_DENIED) {
              setGpsError("Location access denied. Please enable location services.");
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              setGpsError("Location information unavailable.");
            } else if (error.code === error.TIMEOUT) {
              setGpsError("Location request timed out.");
            }
            setShowGpsModal(true);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } catch (err) {
        console.error("Error checking GPS:", err);
        setShowGpsModal(true);
      }
    };

    checkGpsPermission();
  }, []);

  /** Continuous location tracking */
  useEffect(() => {
    let watchId = null;

    const startLocationTracking = () => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          console.log('📍 Location updated:', newLocation);
          setUserLocation(newLocation);
          
          // Update heading if available from GPS
          if (position.coords.heading !== null && position.coords.heading !== undefined) {
            const smoothHeading = normalizeHeading(position.coords.heading);
            setUserHeading(smoothHeading);
            console.log('🧭 Heading updated from GPS:', position.coords.heading);
          }
          
          // Don't auto-center the map on location updates to avoid disrupting user interaction
          // Only update if user hasn't manually moved the map
        },
        (error) => {
          console.error("Location tracking error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setGpsError("Location access denied. Please enable location services.");
            setShowGpsModal(true);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000, // Accept cached position up to 10 seconds old
          timeout: 15000, // Wait up to 15 seconds for position
        }
      );
    };

    // Start tracking after a short delay to allow initial GPS check to complete
    const timeoutId = setTimeout(startLocationTracking, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        console.log('🛑 Location tracking stopped');
      }
    };
  }, []);

  /** Fetch mask */
  useEffect(() => {
    const fetchMask = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/mask`);
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

  /** Fetch itinerary sites */
  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}`}/itineraries/guest/${itineraryId}`
        );

        const sites = (res.data.sites || []).filter(
          (s) => s.latitude && s.longitude && s.status === "active" // Only include active sites
        );

        const normalized = sites.map((s) => ({
          ...s,
          title: s.siteName || s.title || "Site",
          siteName: s.siteName || s.title || "Site",
          description: s.siteDescription || s.description || "",
          siteDescription: s.siteDescription || s.description || "",
          siteDescriptionTagalog: s.siteDescriptionTagalog || "",
          mediaType: s.mediaType || "image",
          mediaUrl: resolveUrl(s.mediaUrl),
          mediaFiles: s.mediaFiles?.map((media) => ({
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
        }));

        setPins(normalized);
      } catch (err) {
        console.error("Error fetching itinerary:", err);
      }
    };

    if (itineraryId) fetchItinerary();
  }, [itineraryId]);

  /** Load saved progress from localStorage */
  useEffect(() => {
    if (!itineraryId || pins.length === 0 || hasLoadedProgress) return;
    
    try {
      // Try to load saved optimized order from localStorage
      if (itineraryId) {
        const orderKey = `guest_optimized_order_${itineraryId}`;
        const savedOrder = localStorage.getItem(orderKey);
      
        if (savedOrder) {
          const optimizedOrder = JSON.parse(savedOrder);
          // Reconstruct optimized pins from saved order
          const restoredPins = optimizedOrder
            .map(siteId => pins.find(p => p._id === siteId))
            .filter(Boolean);
          
          if (restoredPins.length > 0) {
            setOptimizedPins(restoredPins);
            console.log('✅ Restored optimized pin order from localStorage');
            
            // Load visited sites
            const visitedKey = `guest_visited_${itineraryId}`;
            const savedVisited = localStorage.getItem(visitedKey);
            const visitedSet = savedVisited ? new Set(JSON.parse(savedVisited)) : new Set();
            if (savedVisited) {
              setVisitedSites(visitedSet);
              console.log('✅ Restored visited sites:', Array.from(visitedSet));
            }
            
            // Load saved current pin index
            const indexKey = `guest_current_index_${itineraryId}`;
            const savedIndex = localStorage.getItem(indexKey);
            const currentIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
            
            // Restore current pin position
            if (currentIndex >= 0 && currentIndex < restoredPins.length) {
              setCurrentPinIndex(currentIndex);
              const currentPin = restoredPins[currentIndex];
              setSelectedPin(currentPin);
              setActivePin(currentPin);
              console.log('✅ Restored current pin index:', currentIndex);
            } else {
              // Fallback to first unvisited site
              const nextSite = getNextSite(restoredPins, visitedSet);
              if (nextSite) {
                const nextIndex = restoredPins.findIndex(p => p._id === nextSite._id);
                if (nextIndex !== -1) {
                  setCurrentPinIndex(nextIndex);
                  setSelectedPin(nextSite);
                  setActivePin(nextSite);
                }
              }
            }

            // Save progress data for modal actions
            setSavedProgress({
              currentPinIndex: currentIndex,
              visitedSites: Array.from(visitedSet),
              optimizedOrder,
            });

            // Show Resume/Restart modal
            setTimeout(() => setShowResumeModal(true), 100);
            
            setHasLoadedProgress(true);
            return;
          }
        }
      }
      
      // No saved order, will run optimization in next useEffect
      setHasLoadedProgress(true);
    } catch (error) {
      console.error('Error loading saved progress:', error);
      setHasLoadedProgress(true);
    }
  }, [itineraryId, pins.length, hasLoadedProgress]);

  /** Optimize route when user location or pins change - ONLY if no saved order */
  useEffect(() => {
    if (userLocation && pins.length > 0 && optimizedPins.length === 0 && hasLoadedProgress) {
      // Only optimize if we don't have a saved order - optimize ALL sites
      console.log('🔄 First time opening itinerary - running optimization (Guest)');
      console.log('📍 User location:', userLocation);
      console.log('📍 Total pins:', pins.length);
      console.log('📍 Visited sites:', Array.from(visitedSites));
      const optimized = optimizeRoute(userLocation, pins, new Set());
      console.log('📍 Optimized order:', optimized.map((p, i) => `${i+1}. ${p.siteName || p.title}`));
      setOptimizedPins(optimized);
      
      // Save optimized order to localStorage
      const orderKey = `guest_optimized_order_${itineraryId}`;
      const optimizedOrder = optimized.map(pin => pin._id);
      localStorage.setItem(orderKey, JSON.stringify(optimizedOrder));
      console.log('✅ Created and saved new optimized route (Guest)');
      
      // Set first site as current (start from pin 1)
      setCurrentPinIndex(0);
      setSelectedPin(optimized[0]);
      setActivePin(optimized[0]);
      
      // Save initial current index
      const indexKey = `guest_current_index_${itineraryId}`;
      localStorage.setItem(indexKey, '0');
    }
  }, [userLocation, pins.length, optimizedPins.length, hasLoadedProgress]);

  /** Handle GeolocateControl events */
  const handleGeolocate = useCallback((e) => {
    // Update user location when geolocate control gets position
    const newLoc = {
      latitude: e.coords.latitude,
      longitude: e.coords.longitude
    };
    setUserLocation(newLoc);
  }, []);

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

  /** Track device orientation for heading */
  useEffect(() => {
    const handleOrientation = (event) => {
      let heading = null;
      
      // iOS: webkitCompassHeading (most accurate)
      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        heading = event.webkitCompassHeading;
      }
      // Android: Calculate from alpha
      else if (event.alpha !== null && event.alpha !== undefined) {
        // Get screen orientation
        const screenOrientation = window.screen?.orientation?.angle || window.orientation || 0;
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
    window.addEventListener('deviceorientationabsolute', handleOrientation, { passive: true });
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [normalizeHeading]);

  /** Fallback: Request orientation permission when geolocate button is clicked (iOS 13+) */
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current.getMap();
    if (!map) return;

    const requestOrientationPermission = async () => {
      // Only for iOS 13+ that requires permission
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          await DeviceOrientationEvent.requestPermission();
        } catch (error) {
          console.log('Orientation permission request:', error);
        }
      }
    };

    // Attach click listener to geolocate button
    const setupGeolocateListener = () => {
      setTimeout(() => {
        const geolocateButton = document.querySelector('.mapboxgl-ctrl-geolocate');
        if (geolocateButton) {
          geolocateButton.addEventListener('click', requestOrientationPermission);
        }
      }, 500);
    };

    if (map.loaded()) {
      setupGeolocateListener();
    } else {
      map.on('load', setupGeolocateListener);
    }

    return () => {
      const geolocateButton = document.querySelector('.mapboxgl-ctrl-geolocate');
      if (geolocateButton) {
        geolocateButton.removeEventListener('click', requestOrientationPermission);
      }
    };
  }, []);

  /** Create custom user marker with heading cone using Mapbox GL JS */
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const map = mapRef.current.getMap();
    if (!map) return;

    // Remove existing marker if any
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Create marker element (Google Maps style)
    const el = document.createElement('div');
    el.className = 'custom-user-marker';
    el.style.cssText = `
      position: relative;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Create beam container (rotates)
    const beamContainer = document.createElement('div');
    beamContainer.className = 'heading-beam-container';
    beamContainer.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      transform: rotate(${userHeading}deg) translateZ(0);
      transform-origin: center center;
      transition: transform 0.15s ease-out;
      will-change: transform;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      perspective: 1000px;
      -webkit-perspective: 1000px;
      pointer-events: none;
    `;
    
    // Create direction beam (Google Maps style - wider trapezoid)
    const beam = document.createElement('div');
    beam.className = 'heading-cone';
    beam.style.cssText = `
      position: absolute;
      width: 70px;
      height: 90px;
      background: linear-gradient(to top, rgba(59, 130, 246, 0.7), rgba(59, 130, 246, 0));
      top: -50px;
      left: 50%;
      transform: translateX(-50%) translateZ(0);
      -webkit-transform: translateX(-50%) translateZ(0);
      clip-path: polygon(32% 100%, 38% 100%, 5% 0%, 95% 0%, 62% 100%, 68% 100%);
      -webkit-clip-path: polygon(32% 100%, 38% 100%, 5% 0%, 95% 0%, 62% 100%, 68% 100%);
      filter: blur(1px);
      -webkit-filter: blur(1px);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      pointer-events: none;
    `;
    beamContainer.appendChild(beam);
    el.appendChild(beamContainer);
    
    // Create pulse animation
    const pulse = document.createElement('div');
    pulse.style.cssText = `
      position: absolute;
      width: 48px;
      height: 48px;
      background-color: rgba(59, 130, 246, 0.2);
      border-radius: 50%;
      animation: pulse 2s infinite;
      pointer-events: none;
    `;
    el.appendChild(pulse);
    
    // Create accuracy ring
    const accuracyRing = document.createElement('div');
    accuracyRing.style.cssText = `
      position: absolute;
      width: 40px;
      height: 40px;
      background-color: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 50%;
      pointer-events: none;
    `;
    el.appendChild(accuracyRing);
    
    // Create user dot (Google Maps style)
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: relative;
      width: 20px;
      height: 20px;
      background-color: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      z-index: 10;
      pointer-events: none;
    `;
    el.appendChild(dot);

    // Create and add marker to map
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map);

    userMarkerRef.current = marker;

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }
    };
  }, [userLocation]);

  /** Update heading beam rotation (Google Maps style) */
  useEffect(() => {
    if (userMarkerRef.current) {
      const el = userMarkerRef.current.getElement();
      const beamContainer = el.querySelector('.heading-beam-container');
      if (beamContainer) {
        beamContainer.style.transform = `rotate(${userHeading}deg) translateZ(0)`;
      }
    }
  }, [userHeading]);

  /** Trigger geolocate control on mount and enable watch mode */
  useEffect(() => {
    if (geolocateControlRef.current && !showGpsModal) {
      // Trigger the geolocate control to start tracking
      const timer = setTimeout(() => {
        geolocateControlRef.current?.trigger();
      }, 1000); // Small delay to ensure map is loaded
      
      return () => clearTimeout(timer);
    }
  }, [showGpsModal]);

  /** Check if route stays within Intramuros bounds */
  const isRouteWithinBounds = (routeGeometry) => {
    if (!mask?.geometry?.coordinates?.[0]) return true;

    const bounds = mask.geometry.coordinates[0];
    const minLng = Math.min(...bounds.map(c => c[0]));
    const maxLng = Math.max(...bounds.map(c => c[0]));
    const minLat = Math.min(...bounds.map(c => c[1]));
    const maxLat = Math.max(...bounds.map(c => c[1]));

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
    if (!start || !pin) return;

    try {
      const reqId = ++routingReqId.current;
      setIsRouting(true);
      const resp = await directionsClient
        .getDirections({
          profile: transportMode,
          geometries: "geojson",
          overview: "full",
          steps: true,
          waypoints: [
            { coordinates: [start.longitude, start.latitude] },
            { coordinates: [pin.longitude, pin.latitude] },
          ],
        })
        .send();

      const routeData = resp.body.routes[0];
      
      // Check if route stays within Intramuros bounds
      if (!isRouteWithinBounds(routeData.geometry)) {
        console.warn('⚠️ Route goes outside Intramuros, using straight line');
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
        const verb = transportMode === "driving" ? "Drive" : transportMode === "cycling" ? "Bike" : "Walk";
        setSteps([{
          maneuver: { instruction: `${verb} directly to ${pin.siteName}`, location: [start.longitude, start.latitude] }
        }]);
        setCurrentStepIndex(0);
        setIsRouting(false);
        return;
      }

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
      setSteps(routeData.legs.flatMap((leg) => leg.steps));
      setCurrentStepIndex(0);
      setIsRouting(false);
    } catch (err) {
      console.error("Directions error:", err);
      setIsRouting(false);
    }
  };

  // Rebuild route when transport mode changes (if we have a target)
  useEffect(() => {
    if (!showGpsModal && userLocation && selectedPin) {
      // Optimistic ETA update to reflect transportMode change instantly
      if (distance) {
        const speedByMode = { walking: 1.4, cycling: 4.0, driving: 8.33 }; // m/s
        const speed = speedByMode[transportMode] || 1.4;
        const newEta = distance / speed;
        setEta(newEta);
        setArrivalTime(new Date(Date.now() + newEta * 1000));
      }
      buildRoute(userLocation, selectedPin);
    }
  }, [transportMode]);

  /** Build route to current pin */
  useEffect(() => {
    if (userLocation && optimizedPins.length > 0 && optimizedPins[currentPinIndex]) {
      buildRoute(userLocation, optimizedPins[currentPinIndex]);
    }
  }, [userLocation, optimizedPins, currentPinIndex]);

  /** Detect arrival to auto-show preview card */
  useEffect(() => {
    if (!userLocation || optimizedPins.length === 0) return;

    const radius = 10; // meters - show preview when within 10m

    const pin = optimizedPins[currentPinIndex];
    if (!pin) return;

    const distance = calculateDistance(userLocation, {
      latitude: pin.latitude,
      longitude: pin.longitude
    });

    if (distance < radius) {
      setIsNearby(true);
      // Only auto-show if not manually dismissed
      if (!manuallyDismissed) {
        setSelectedPin(pin);
      }
      // Don't auto-mark as visited - let user manually mark sites as done
    } else {
      setIsNearby(false);
    }
  }, [userLocation, currentPinIndex, optimizedPins, manuallyDismissed]);

  /** Update step index as user moves (meters via haversine) */
  useEffect(() => {
    if (!userLocation || steps.length === 0) return;

    const toRad = (v) => (v * Math.PI) / 180;
    const haversineMeters = (lat1, lng1, lat2, lng2) => {
      const R = 6371000;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let closestIdx = 0;
    let minMeters = Infinity;

    for (let idx = 0; idx < steps.length; idx++) {
      const loc = steps[idx]?.maneuver?.location;
      if (!loc || loc.length < 2) continue;
      const [lng, lat] = loc;
      const meters = haversineMeters(userLocation.latitude, userLocation.longitude, lat, lng);
      if (meters < minMeters) {
        minMeters = meters;
        closestIdx = idx;
      }
    }

    setCurrentStepIndex((prevIdx) => (prevIdx === closestIdx ? prevIdx : closestIdx));
  }, [userLocation, steps]);

  /** Mark site as visited - Guest users store in localStorage */
  const markSiteAsVisited = async (pin) => {
    if (!pin || !pin._id || visitedSites.has(pin._id)) return;

    try {
      // For guest users, store visited sites in localStorage
      const visitedKey = `guest_visited_${itineraryId}`;
      const existingVisited = JSON.parse(localStorage.getItem(visitedKey) || "[]");
      
      if (!existingVisited.includes(pin._id)) {
        existingVisited.push(pin._id);
        localStorage.setItem(visitedKey, JSON.stringify(existingVisited));
      }

      setVisitedSites((prev) => new Set(prev).add(pin._id));
      console.log(`✅ Site ${pin.siteName} marked as visited (Guest)`);
    } catch (err) {
      console.error("Error marking site as visited:", err);
    }
  };

  /** Clear saved progress and restart - Guest mode */
  const handleRestartItinerary = () => {
    if (!userLocation || pins.length === 0) return;
    
    // Re-run optimization from current location, preserving visited sites (consistent with tourist)
    const optimized = optimizeRoute(userLocation, pins, visitedSites);
    setOptimizedPins(optimized);
    
    // Save new optimized order
    const orderKey = `guest_optimized_order_${itineraryId}`;
    const optimizedOrder = optimized.map(pin => pin._id);
    localStorage.setItem(orderKey, JSON.stringify(optimizedOrder));
    
    // Go to first site in NEW optimized order (keep visited flags)
    setCurrentPinIndex(0);
    if (optimized.length > 0) {
      const firstPin = optimized[0];
      setSelectedPin(firstPin);
      setActivePin(firstPin);
      if (userLocation) {
        buildRoute(userLocation, firstPin);
      }
    }
    
    // Reset current index to 0
    const indexKey = `guest_current_index_${itineraryId}`;
    localStorage.setItem(indexKey, '0');

    // Note: Guest mode persists to localStorage only; server persistence is for Tourist flows
    
    console.log('✅ Restart: Re-optimized from current location, going to pin #1, kept visited flags (Guest)');
    setShowResumeModal(false);
  };

  // Handle resume - state already restored, just close modal and rebuild route
  const handleResumeProgress = () => {
    if (userLocation && activePin) {
      buildRoute(userLocation, activePin);
    }
    setShowResumeModal(false);
  };

  /** Fetch reviews for current site */
  const fetchSiteReviews = async (siteId) => {
    if (!siteId) return;

    try {
      setReviewsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}`}/reviews/site/${siteId}`
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

    // Mark as visited in localStorage (async, but we don't wait)
    markSiteAsVisited(currentPin);

    // Close the modal first
    setShowFullModal(false);

    // Show confirmation
    setNotification({
      isOpen: true,
      type: 'success',
      title: 'Site Visited!',
      message: `"${currentPin.siteName}" has been marked as visited.`
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
      setSiteReviews([]);
      setShowReviews(false);
    }
  }, [selectedPin]);

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
      if (userLocation) {
        buildRoute(userLocation, nextPin);
      }
      
      // Save current index to localStorage
      const indexKey = `guest_current_index_${itineraryId}`;
      localStorage.setItem(indexKey, nextIndex.toString());
    }
  }, [activePin, currentPinIndex, optimizedPins, skippedSites, userLocation]);

  // Go to previous site
  const handlePrevSite = useCallback(() => {
    const prevIndex = currentPinIndex - 1;
    const prevPin = prevIndex >= 0 ? optimizedPins[prevIndex] : null;

    // Guard: If prev site is Fort Santiago and transport is car, show modal and block
    if (prevPin && prevPin.feeType === "fort_santiago" && transportMode === "driving") {
      setFortModalConfirm(() => () => {
        setTransportMode('walking');
        setShowFortDrivingModal(false);
        setTimeout(() => {
          // Retry prev navigation under Foot mode
          const pi = currentPinIndex - 1;
          if (pi >= 0) {
            setCurrentPinIndex(pi);
            const pp = optimizedPins[pi];
            setActivePin(pp);
            setSelectedPin(pp);
            if (userLocation) {
              buildRoute(userLocation, pp);
            }
            
            // Save current index to localStorage
            const indexKey = `guest_current_index_${itineraryId}`;
            localStorage.setItem(indexKey, pi.toString());
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
      if (userLocation) {
        buildRoute(userLocation, prevPin2);
      }
      
      // Save current index to localStorage
      const indexKey = `guest_current_index_${itineraryId}`;
      localStorage.setItem(indexKey, prevIndex.toString());
    }
  }, [currentPinIndex, optimizedPins, userLocation, itineraryId, transportMode]);

  // Go to next site (marks current as visited)
  const handleNextSite = useCallback(async () => {
    // Compute next site and guard Fort Santiago when in car mode
    const nextIndex = currentPinIndex + 1;
    const nextPin = nextIndex < optimizedPins.length ? optimizedPins[nextIndex] : null;

    if (nextPin && nextPin.feeType === "fort_santiago" && transportMode === "driving") {
      setShowFortDrivingModal(true);
      return;
    }

    // Mark current site as visited before moving to next
    const currentPin = optimizedPins[currentPinIndex];
    const updatedVisited = new Set(visitedSites);
    if (currentPin && !updatedVisited.has(currentPin._id)) {
      updatedVisited.add(currentPin._id);
      setVisitedSites(updatedVisited);
      
      // Save to localStorage
      const visitedKey = `guest_visited_${itineraryId}`;
      localStorage.setItem(visitedKey, JSON.stringify(Array.from(updatedVisited)));
      
      // Save to permanent visited-sites record
      await markSiteAsVisited(currentPin);
    }

    if (nextIndex < optimizedPins.length) {
      setCurrentPinIndex(nextIndex);
      const np = optimizedPins[nextIndex];
      setActivePin(np);
      setSelectedPin(np);
      if (userLocation) {
        buildRoute(userLocation, np);
      }
      
      // Save current index to localStorage
      const indexKey = `guest_current_index_${itineraryId}`;
      localStorage.setItem(indexKey, nextIndex.toString());
    } else {
      // Last site: mark visited and end tour
      setShowCompletionModal(true);
      setSelectedPin(null);
      setRoute(null);
      setSteps([]);
    }
  }, [currentPinIndex, optimizedPins, userLocation, visitedSites, itineraryId, transportMode]);

  /** Go to next stop - follows optimized route order (no re-optimization) */
  const goToNextStop = (justVisitedSiteId = null) => {
    if (!userLocation || optimizedPins.length === 0) return;

    console.log('🔍 goToNextStop called');
    console.log('Current index:', currentPinIndex);
    console.log('Current visitedSites:', Array.from(visitedSites));
    console.log('Just visited site ID:', justVisitedSiteId);

    // Update visited sites
    const updatedVisited = new Set(visitedSites);
    if (justVisitedSiteId) {
      updatedVisited.add(justVisitedSiteId);
      setVisitedSites(updatedVisited);
      
      // Save to localStorage
      const visitedKey = `guest_visited_${itineraryId}`;
      localStorage.setItem(visitedKey, JSON.stringify(Array.from(updatedVisited)));
    }

    // Get next unvisited site from existing optimized route (don't re-optimize)
    const nextPin = getNextSite(optimizedPins, updatedVisited);

    if (!nextPin) {
      // No more sites left
      console.log('🎉 All sites visited!');
      setShowCompletionModal(true);
      setSelectedPin(null);
      setRoute(null);
      setSteps([]);
      return;
    }

    const nextIndex = optimizedPins.findIndex(p => p._id === nextPin._id);
    console.log('✅ Next site:', nextPin.siteName, 'at index', nextIndex);

    // Update current site to next in original optimized order
    setCurrentPinIndex(nextIndex);
    setSelectedPin(nextPin);
    setManuallyDismissed(false); // Reset manual dismissal for new site

    if (userLocation) buildRoute(userLocation, nextPin);
    
    // Save current index to localStorage
    const indexKey = `guest_current_index_${itineraryId}`;
    localStorage.setItem(indexKey, nextIndex.toString());
  };

  // Memoize onMove handler to prevent unnecessary re-renders
  const handleMapMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Resume/Restart Modal */}
      <ResumeItineraryModal
        isOpen={showResumeModal}
        onResume={handleResumeProgress}
        onRestart={handleRestartItinerary}
        onClose={() => setShowResumeModal(false)}
        currentSiteName={
          savedProgress && 
          optimizedPins.length > 0 && 
          savedProgress.currentPinIndex < optimizedPins.length
            ? optimizedPins[savedProgress.currentPinIndex]?.siteName || optimizedPins[savedProgress.currentPinIndex]?.title
            : null
        }
      />
      <GpsConsentModal
        isOpen={showGpsModal}
        errorMessage={gpsError}
        onEnable={async () => {
          if (gpsPermissionDenied) {
            // If permission was denied, show instructions to enable in settings
            setGpsError(
              "GPS permission was denied. Please enable location access in your browser/device settings, then refresh this page."
            );
            return;
          }
          
          // Request device orientation permission first (iOS 13+)
          if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
              const orientationPermission = await DeviceOrientationEvent.requestPermission();
              if (orientationPermission === 'granted') {
                // Add orientation listeners
                const handleOrientation = (event) => {
                  let heading = null;
                  
                  if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
                    heading = event.webkitCompassHeading;
                  } else if (event.alpha !== null && event.alpha !== undefined) {
                    const screenOrientation = window.screen?.orientation?.angle || window.orientation || 0;
                    let adjustedAlpha = event.alpha;
                    
                    if (screenOrientation === 90) {
                      adjustedAlpha = (event.alpha + 90) % 360;
                    } else if (screenOrientation === -90 || screenOrientation === 270) {
                      adjustedAlpha = (event.alpha - 90 + 360) % 360;
                    } else if (screenOrientation === 180) {
                      adjustedAlpha = (event.alpha + 180) % 360;
                    }
                    
                    heading = (360 - adjustedAlpha) % 360;
                  }
                  
                  if (heading !== null) {
                    const smoothHeading = normalizeHeading(heading);
                    setUserHeading(smoothHeading);
                  }
                };

                window.addEventListener('deviceorientationabsolute', handleOrientation, { passive: true });
                window.addEventListener('deviceorientation', handleOrientation, { passive: true });
              }
            } catch (error) {
              console.error('Error requesting device orientation permission:', error);
            }
          }
          
          // Then request GPS location
          if (navigator?.geolocation) {
            navigator.geolocation.getCurrentPosition(
              () => {
                setGpsError("");
                setShowGpsModal(false);
                setGpsPermissionDenied(false);
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
              },
              { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
          } else {
            setGpsError(
              "GPS is unavailable in this browser. Please use Tour Map features from the homepage."
            );
          }
        }}
        onDecline={() => {
          // Navigate back without logging out
          navigate("/guest-homepage", { replace: true });
        }}
      />
      
      {/* Header - Rendered via Portal */}
      {createPortal(
        <div 
          className="fixed top-0 left-0 right-0 z-[9999] bg-white border-b border-gray-200"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 16px)',
            paddingBottom: '8px',
            paddingLeft: '16px',
            paddingRight: '16px',
            pointerEvents: 'auto'
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
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                color: 'inherit'
              }}
            >
              ‹
            </button>
            <h1 
              className="font-bold text-xl truncate"
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                margin: 0,
                padding: 0
              }}
            >
              Guest Itinerary Map
            </h1>
          </div>
        </div>,
        document.body
      )}

      {/* Map Container - Takes remaining height */}
      <div className="flex-1 relative overflow-hidden">
        {!showGpsModal && (
          <Map
            ref={mapRef}
            {...viewState}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            onMove={handleMapMove}
            maxBounds={INTRAMUROS_BOUNDS}
            attributionControl={false}
            style={{ width: '100%', height: '100%' }}
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

        {/* Mapbox Geolocate Control (button only, custom marker used) */}
        <GeolocateControl
          ref={geolocateControlRef}
          position="top-right"
          positionOptions={{
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
          }}
          trackUserLocation={true}
          showUserHeading={false}
          showAccuracyCircle={false}
          showUserLocation={false}
          fitBoundsOptions={{ maxZoom: 18 }}
          onGeolocate={handleGeolocate}
          onError={handleGeolocateError}
        />

        {/* Site markers - numbered by optimized route */}
        {optimizedPins.map((pin, idx) => {
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
                if (userLocation) buildRoute(userLocation, pin);
              }
            }}
          >
            {/* Number Badge - shows optimized order (never changes) */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg cursor-pointer transition-all ${
              idx === currentPinIndex
                ? "bg-blue-600 text-white animate-pulse scale-110"
                : isVisited
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}>
              {idx + 1}
            </div>
          </Marker>
        )})}

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
        )}

        {/* Directions Panel */}
        {!showGpsModal && (
          <DirectionsPanel
        steps={steps}
        currentStepIndex={currentStepIndex}
        setCurrentStepIndex={setCurrentStepIndex}
        eta={eta}
        distance={distance}
        arrivalTime={arrivalTime}
        transportMode={transportMode}
        isRouting={isRouting}
        userLocation={userLocation}
        activePin={activePin}
        onPrevSite={handlePrevSite}
        onSkipSite={handleSkipSite}
        onNextSite={handleNextSite}
        hasPrevSite={currentPinIndex > 0}
        hasNextSite={true}
        isLastSite={currentPinIndex >= optimizedPins.length - 1}
          />
        )}

        {/* Control Buttons */}
        {!showGpsModal && !showFullModal && (
          <MapControlButtons
          userLocation={userLocation}
          selectedPin={selectedPin}
          pins={optimizedPins}
          currentPinIndex={currentPinIndex}
          setViewState={setViewState}
          setSelectedPin={setSelectedPin}
          setManuallyDismissed={setManuallyDismissed}
          enableTransportMode={true}
          showTransportPanel={showTransportPanel}
          setShowTransportPanel={setShowTransportPanel}
          transportMode={transportMode}
          setTransportMode={setTransportMode}
          />
        )}

        {/* Site Preview Card */}
        {(!isTourRunning && !showGpsModal && selectedPin && !showFullModal) && (
          <SitePreviewCard
          selectedPin={selectedPin}
          distance={distance}
          isNearby={isNearby}
          onExpand={() => setShowFullModal(true)}
          onClose={() => {
            setSelectedPin(null);
            setManuallyDismissed(true);
          }}
          />
        )}

        {/* Site Modal - Full Screen */}
        {(!isTourRunning && !showGpsModal && selectedPin && showFullModal) && (
          <SiteModalFullScreen
          selectedPin={selectedPin}
          onClose={() => {
            setShowFullModal(false);
            setSelectedPin(null);
          }}
          distance={distance}
          currentPinIndex={currentPinIndex}
          pinsLength={optimizedPins.length}
          goToNextStop={goToNextStop}
          siteReviews={siteReviews}
          reviewsLoading={reviewsLoading}
          simulateGoToNextSite={simulateGoToNextSite}
          isGuestMode={true}
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
        />)}

      {/* Fort Santiago Driving Restriction Modal */}
      {!isTourRunning && (
      <ConfirmModal
        isOpen={showFortDrivingModal}
        onClose={() => setShowFortDrivingModal(false)}
        onConfirm={fortModalConfirm}
        title="Fort Santiago – Car Restriction"
        message="Cars cannot enter Fort Santiago. Please find parking and continue using Foot mode to proceed."
        confirmText="Walk Mode"
        cancelText="Cancel"
        type="warning"
      />)}

      {/* Completion Modal */}
      {!isTourRunning && (
      <ItineraryCompletionModal
        isOpen={showCompletionModal}
        onRestart={handleRestartItinerary}
        onClose={() => setShowCompletionModal(false)}
        itineraryName={itineraryName}
        totalSites={optimizedPins.length || pins.length}
      />)}
        
        {/* Hidden restart button for testing - can be removed or styled properly */}
        {/* <button 
          onClick={handleRestartItinerary}
          className="absolute bottom-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          Restart Route
        </button> */}
      </div>
    </div>
  );
}
