import React, { useState, useEffect, useRef } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Navigation, MapPin, Car, Bike, Footprints, User } from "lucide-react";

import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  directionsClient,
  createInverseMask,
} from "../TourMap/mapConfig";

// Import separated components
import ModernUserMarker from "../TourMap/ModernUserMarker";
import BackHeader from "../BackButton";
import DirectionsPanel from "./DirectionsPanel";
import MapControlButtons from "./MapControlButtons";
import SitePreviewCard from "./SitePreviewCard";
import SiteModalFullScreen from "./SiteModalFullScreen";
import GpsConsentModal from "../../shared/GpsConsentModal";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";

export default function TouristItineraryMap() {
  const { itineraryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [pins, setPins] = useState([]);
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

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Handler to mark site as done (temporary)
  const handleMarkAsDone = (siteId) => {
    setVisitedSites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) {
        newSet.delete(siteId); // Toggle off if already visited
      } else {
        newSet.add(siteId); // Mark as visited
      }
      saveProgress(currentPinIndex, newSet);
      return newSet;
    });
  };

  // Save progress to database
  const saveProgress = async (pinIndex, visited, userPos = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Guest users don't save progress
      
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/itinerary-progress/${itineraryId}`,
        {
          currentPinIndex: pinIndex,
          visitedSites: Array.from(visited),
          lastPosition: userPos || userLocation
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Utility to resolve relative URLs into absolute URLs
  const resolveUrl = (url) => {
    if (!url) return "";
    const BACKEND_URL = "http://localhost:5000";
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
          `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}`}/itineraries/${itineraryId}`,
          config
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
        }));

        setPins(normalized);
      } catch (err) {
        console.error("Error fetching itinerary:", err);
      }
    };

    if (itineraryId) fetchItinerary();
  }, [itineraryId]);

  /** Load saved progress from database */
  useEffect(() => {
    const loadProgress = async () => {
      if (!itineraryId || pins.length === 0) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return; // Guest users don't have saved progress
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/itinerary-progress/${itineraryId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const { currentPinIndex, visitedSites } = response.data;
        
        // Restore progress
        if (currentPinIndex !== undefined && currentPinIndex < pins.length) {
          setCurrentPinIndex(currentPinIndex);
          setSelectedPin(pins[currentPinIndex]);
        }
        
        if (visitedSites && visitedSites.length > 0) {
          setVisitedSites(new Set(visitedSites));
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        // If error, start from beginning
        if (pins.length > 0 && !selectedPin) {
          setSelectedPin(pins[0]);
          setCurrentPinIndex(0);
        }
      }
    };
    
    loadProgress();
  }, [itineraryId, pins]);

  /** Auto-select first pin when pins are loaded (show preview card by default) - only if no saved progress */
  useEffect(() => {
    if (pins.length > 0 && !selectedPin && !manuallyDismissed && currentPinIndex === 0) {
      setSelectedPin(pins[0]);
    }
  }, [pins, selectedPin, manuallyDismissed, currentPinIndex]);

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
        const verb = transportMode === "driving" ? "Drive" : transportMode === "cycling" ? "Bike" : "Walk";
        setSteps([{ // simple instruction for straight line fallback
          maneuver: { instruction: `${verb} directly to ${pin.siteName}`, location: [start.longitude, start.latitude] }
        }]);
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
      // Optimistic ETA update to make mode change feel instant
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

  /** Pick nearest site on load */
  useEffect(() => {
    if (userLocation && pins.length > 0) {
      if (currentPinIndex === 0) {
        const withDistances = pins.map((p, i) => {
          const dx = p.latitude - userLocation.latitude;
          const dy = p.longitude - userLocation.longitude;
          return { ...p, index: i, dist: Math.sqrt(dx * dx + dy * dy) };
        });

        withDistances.sort((a, b) => a.dist - b.dist);
        setCurrentPinIndex(withDistances[0].index);
        // Don't auto-show preview card on initial load
        // Let the proximity detection handle it
      }

      buildRoute(userLocation, pins[currentPinIndex]);
    }
  }, [userLocation, pins, currentPinIndex]);

  /** Detect arrival to auto-show preview card */
  useEffect(() => {
    if (!userLocation || pins.length === 0) return;

    const radius = 50; // meters - show preview when within 50m
    const EARTH_RADIUS = 6371000;

    const pin = pins[currentPinIndex];
    if (!pin) return;

    const dLat = ((pin.latitude - userLocation.latitude) * Math.PI) / 180;
    const dLng = ((pin.longitude - userLocation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userLocation.latitude * Math.PI) / 180) *
        Math.cos((pin.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = EARTH_RADIUS * c;

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
  }, [userLocation, currentPinIndex, pins, manuallyDismissed]);

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

    setCurrentStepIndex(closestIdx);
  }, [userLocation, steps]);

  /** Mark site as visited */
  const markSiteAsVisited = async (pin) => {
    if (!pin || !pin._id || visitedSites.has(pin._id)) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/visited-sites`,
        {
          itineraryId,
          siteId: pin._id,
        },
        config
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
        `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}`}/reviews/site/${siteId}`,
        config
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

  /** Go to next stop - follows itinerary order */
  const goToNextStop = (justVisitedSiteId = null) => {
    if (!userLocation || pins.length === 0) return;

    console.log('🔍 goToNextStop called');
    console.log('Current index:', currentPinIndex);
    console.log('Current visitedSites:', Array.from(visitedSites));
    console.log('Just visited site ID:', justVisitedSiteId);

    // Find next unvisited site in itinerary order (after current index)
    let nextPin = null;
    let nextIndex = -1;

    // First, try to find next unvisited site after current position
    for (let i = currentPinIndex + 1; i < pins.length; i++) {
      const pin = pins[i];
      const isVisited = visitedSites.has(pin._id) || pin._id === justVisitedSiteId;
      if (!isVisited) {
        nextPin = pin;
        nextIndex = i;
        break;
      }
    }

    // If no unvisited sites after current, wrap around and check from beginning
    if (!nextPin) {
      for (let i = 0; i < currentPinIndex; i++) {
        const pin = pins[i];
        const isVisited = visitedSites.has(pin._id) || pin._id === justVisitedSiteId;
        if (!isVisited) {
          nextPin = pin;
          nextIndex = i;
          break;
        }
      }
    }

    if (!nextPin) {
      // No more sites left
      console.log('🎉 All sites visited!');
      alert('🎉 All sites visited! Great job!');
      setSelectedPin(null);
      setRoute(null);
      setSteps([]);
      return;
    }

    console.log('✅ Next site (in order):', nextPin.siteName, 'at index', nextIndex);

    // Update current site to next in order
    setCurrentPinIndex(nextIndex);
    setSelectedPin(nextPin);
    setManuallyDismissed(false); // Reset manual dismissal for new site

    // Save progress to database
    const updatedVisited = new Set(visitedSites);
    if (justVisitedSiteId) {
      updatedVisited.add(justVisitedSiteId);
    }
    saveProgress(nextIndex, updatedVisited);

    if (userLocation) buildRoute(userLocation, nextPin);
  };

  return (
    <div className="w-full h-screen relative">
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
          // Navigate back to homepage without logging out
          navigate("/", { replace: true });
        }}
      />
      
      <div 
        className="absolute top-0 left-0 w-full z-30 pointer-events-auto bg-white/95 backdrop-blur-md shadow-sm"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 16px)",
          paddingBottom: "8px",
          paddingLeft: "16px",
          paddingRight: "16px"
        }}
      >
        <BackHeader title={<span className="text-black">Tourist Itinerary Map</span>} />
      </div>

      <Map
        {...viewState}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onMove={(evt) => setViewState(evt.viewState)}
        maxBounds={INTRAMUROS_BOUNDS}
        attributionControl={false}
        className="w-full h-full"
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

        {/* Site markers */}
        {pins.map((pin, idx) => (
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
            <div className="relative flex flex-col items-center">
              {/* Pin Icon */}
              <MapPin
                className={`w-6 h-6 cursor-pointer ${
                  idx === currentPinIndex
                    ? "text-blue-600 animate-pulse"
                    : "text-red-500"
                }`}
              />
              {/* Number Badge */}
              <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                idx === currentPinIndex
                  ? "bg-blue-600 text-white"
                  : "bg-white text-red-500 border-2 border-red-500"
              }`}>
                {idx + 1}
              </div>
            </div>
          </Marker>
        ))}

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

          {/* Directions Panel */}
          <DirectionsPanel
            steps={steps}
            currentStepIndex={currentStepIndex}
            setCurrentStepIndex={setCurrentStepIndex}
            eta={eta}
            distance={distance}
            arrivalTime={arrivalTime}
            isRouting={isRouting}
            transportMode={transportMode}
          />

          {/* Control Buttons */}
          {!showFullModal && (
            <MapControlButtons
              userLocation={userLocation}
              selectedPin={selectedPin}
              pins={pins}
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
          {selectedPin && !showFullModal && (
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
          {selectedPin && showFullModal && (
            <SiteModalFullScreen
              selectedPin={selectedPin}
              onClose={() => {
                setShowFullModal(false);
                setSelectedPin(null);
              }}
              distance={distance}
              currentPinIndex={currentPinIndex}
              pinsLength={pins.length}
              goToNextStop={goToNextStop}
              siteReviews={siteReviews}
              reviewsLoading={reviewsLoading}
              simulateGoToNextSite={simulateGoToNextSite}
            />
          )}

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
}
