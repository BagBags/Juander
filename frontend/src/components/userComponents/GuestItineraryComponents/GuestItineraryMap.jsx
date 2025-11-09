import React, { useState, useEffect, useRef, useCallback } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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
import ModernUserMarker from "../TourMap/ModernUserMarker";
import BackHeader from "../BackButton";
import DirectionsPanel from "../HomepageComponents/DirectionsPanel";
import MapControlButtons from "../HomepageComponents/MapControlButtons";
import SitePreviewCard from "../HomepageComponents/SitePreviewCard";
import SiteModalFullScreen from "../HomepageComponents/SiteModalFullScreen";
import GpsConsentModal from "../../shared/GpsConsentModal";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";

export default function GuestItineraryMap() {
  const { itineraryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [pins, setPins] = useState([]);
  const [optimizedPins, setOptimizedPins] = useState([]); // Optimized route order
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false); // Track if we've loaded saved progress
  const [viewState, setViewState] = useState({
    latitude: 14.5896,
    longitude: 120.9747,
    zoom: 16,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(0);
  const lastLocationRef = useRef(null);
  const locationUpdateThrottle = useRef(null);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);
  const [transportMode, setTransportMode] = useState("walking"); // walking | cycling | driving
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
  const [siteReviews, setSiteReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isSimulatingHome, setIsSimulatingHome] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [fromCache, setFromCache] = useState(false);

  // Use sessionStorage for guest users
  const token = sessionStorage.getItem("token");
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
          (s) => s.latitude && s.longitude
        );

        const normalized = sites.map((s) => ({
          ...s,
          title: s.siteName || s.title || "Site",
          siteName: s.siteName || s.title || "Site",
          description: s.siteDescription || s.description || "",
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

  /** Load saved progress from sessionStorage */
  useEffect(() => {
    if (!itineraryId || pins.length === 0 || hasLoadedProgress) return;
    
    try {
      // Load saved optimized order
      const orderKey = `guest_optimized_order_${itineraryId}`;
      const savedOrder = sessionStorage.getItem(orderKey);
      
      if (savedOrder) {
        const optimizedOrder = JSON.parse(savedOrder);
        // Reconstruct optimized pins from saved order
        const restoredPins = optimizedOrder
          .map(siteId => pins.find(p => p._id === siteId))
          .filter(Boolean);
        
        if (restoredPins.length > 0) {
          setOptimizedPins(restoredPins);
          console.log('✅ Restored optimized pin order from sessionStorage');
          
          // Load visited sites
          const visitedKey = `guest_visited_${itineraryId}`;
          const savedVisited = sessionStorage.getItem(visitedKey);
          if (savedVisited) {
            const visitedIds = JSON.parse(savedVisited);
            setVisitedSites(new Set(visitedIds));
          }
          
          // Set first unvisited site as current
          const nextSite = getNextSite(restoredPins, visitedSites);
          if (nextSite) {
            const nextIndex = restoredPins.findIndex(p => p._id === nextSite._id);
            if (nextIndex !== -1) {
              setCurrentPinIndex(nextIndex);
              setSelectedPin(nextSite);
            }
          }
          
          setHasLoadedProgress(true);
          return;
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
      // Only optimize if we don't have a saved order
      const optimized = optimizeRoute(userLocation, pins, visitedSites);
      setOptimizedPins(optimized);
      
      // Save optimized order to sessionStorage
      const orderKey = `guest_optimized_order_${itineraryId}`;
      const optimizedOrder = optimized.map(pin => pin._id);
      sessionStorage.setItem(orderKey, JSON.stringify(optimizedOrder));
      console.log('✅ Created and saved new optimized route');
      
      // Set first unvisited site as current
      const nextSite = getNextSite(optimized, visitedSites);
      if (nextSite) {
        const nextIndex = optimized.findIndex(p => p._id === nextSite._id);
        if (nextIndex !== -1) {
          setCurrentPinIndex(nextIndex);
          setSelectedPin(nextSite);
        }
      }
    }
  }, [userLocation, pins.length, optimizedPins.length, hasLoadedProgress]);

  /** Track user location (after consent) - Optimized to prevent blinking */
  useEffect(() => {
    if (showGpsModal) return; // wait for user to enable
    
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const newLoc = { 
          latitude: coords.latitude, 
          longitude: coords.longitude,
          heading: coords.heading // Get device heading if available
        };
        
        // Only update if location changed significantly (> 5 meters)
        if (lastLocationRef.current) {
          const dx = newLoc.latitude - lastLocationRef.current.latitude;
          const dy = newLoc.longitude - lastLocationRef.current.longitude;
          const distance = Math.sqrt(dx * dx + dy * dy) * 111000; // rough meters
          
          if (distance < 5) {
            // Update heading even if position hasn't changed much
            if (coords.heading !== null && coords.heading !== undefined) {
              setUserHeading(coords.heading);
            }
            return; // Don't update location, prevents blinking
          }
        }
        
        lastLocationRef.current = newLoc;
        setUserLocation(newLoc);
        
        // Update heading
        if (coords.heading !== null && coords.heading !== undefined) {
          setUserHeading(coords.heading);
        }
        
        // Throttle view state updates to prevent excessive map movements
        if (locationUpdateThrottle.current) {
          clearTimeout(locationUpdateThrottle.current);
        }
        
        locationUpdateThrottle.current = setTimeout(() => {
          setViewState((v) => ({ 
            ...v, 
            latitude: newLoc.latitude, 
            longitude: newLoc.longitude 
          }));
        }, 1000); // Update view every 1 second max
      },
      (err) => console.error("GPS error:", err),
      { 
        enableHighAccuracy: true, 
        maximumAge: 1000, // Allow 1 second old positions
        timeout: 10000 // Increase timeout to 10 seconds
      }
    );
    
    return () => {
      navigator.geolocation.clearWatch(id);
      if (locationUpdateThrottle.current) {
        clearTimeout(locationUpdateThrottle.current);
      }
    };
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

    const radius = 50; // meters - show preview when within 50m

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

  /** Update step index as user moves */
  useEffect(() => {
    if (!userLocation || steps.length === 0) return;

    let closestIdx = 0;
    let minDist = Infinity;

    steps.forEach((step, idx) => {
      if (!step.maneuver?.location) return;
      const [lng, lat] = step.maneuver.location;
      const dx = lat - userLocation.latitude;
      const dy = lng - userLocation.longitude;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    // Only update if step actually changed to prevent unnecessary rerenders and TTS rapid-fire
    setCurrentStepIndex((prevIdx) => prevIdx === closestIdx ? prevIdx : closestIdx);
  }, [userLocation, steps]);

  /** Mark site as visited - Guest users store in sessionStorage */
  const markSiteAsVisited = async (pin) => {
    if (!pin || !pin._id || visitedSites.has(pin._id)) return;

    try {
      // For guest users, store visited sites in sessionStorage
      const visitedKey = `guest_visited_${itineraryId}`;
      const existingVisited = JSON.parse(sessionStorage.getItem(visitedKey) || "[]");
      
      if (!existingVisited.includes(pin._id)) {
        existingVisited.push(pin._id);
        sessionStorage.setItem(visitedKey, JSON.stringify(existingVisited));
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
    
    // Re-run optimization from current location
    const optimized = optimizeRoute(userLocation, pins, visitedSites);
    setOptimizedPins(optimized);
    
    // Save new optimized order
    const orderKey = `guest_optimized_order_${itineraryId}`;
    const optimizedOrder = optimized.map(pin => pin._id);
    sessionStorage.setItem(orderKey, JSON.stringify(optimizedOrder));
    
    // Reset to first site
    setCurrentPinIndex(0);
    if (optimized.length > 0) {
      const firstPin = optimized[0];
      setSelectedPin(firstPin);
      if (userLocation) {
        buildRoute(userLocation, firstPin);
      }
    }
    
    console.log('✅ Restart: Re-optimized route for guest user');
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

    // Mark as visited in sessionStorage (async, but we don't wait)
    markSiteAsVisited(currentPin);

    // Close the modal first
    setShowFullModal(false);

    // Show confirmation
    alert(`✅ Site "${currentPin.siteName}" marked as visited!`);

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
      
      // Save to sessionStorage
      const visitedKey = `guest_visited_${itineraryId}`;
      sessionStorage.setItem(visitedKey, JSON.stringify(Array.from(updatedVisited)));
    }

    // Get next unvisited site from existing optimized route (don't re-optimize)
    const nextPin = getNextSite(optimizedPins, updatedVisited);

    if (!nextPin) {
      // No more sites left
      console.log('🎉 All sites visited!');
      alert('🎉 All sites visited! Great job!');
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
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      <GpsConsentModal
        isOpen={showGpsModal}
        errorMessage={gpsError}
        onEnable={() => {
          if (gpsPermissionDenied) {
            // If permission was denied, show instructions to enable in settings
            setGpsError(
              "GPS permission was denied. Please enable location access in your browser/device settings, then refresh this page."
            );
            return;
          }
          
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
      
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0">
        <BackHeader title="Guest Itinerary Map" />
      </div>

      {/* Map Container - Takes remaining height */}
      <div className="flex-1 relative overflow-hidden">
        {!showGpsModal && (
          <Map
            {...viewState}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            onMove={(evt) => setViewState(evt.viewState)}
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

        {/* User marker - Modern GPS style */}
        {userLocation && (
          <ModernUserMarker 
            userLocation={userLocation} 
            heading={userHeading}
          />
        )}

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
              setCurrentPinIndex(idx);
              setShowFullModal(false); // Show preview card first
              if (userLocation) buildRoute(userLocation, pin);
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
        {(!showGpsModal && selectedPin && !showFullModal) && (
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
        {(!showGpsModal && selectedPin && showFullModal) && (
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
        <FloatingChatbot />
        
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
