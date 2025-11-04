import React, { useState, useEffect, useRef } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Navigation, MapPin, WifiOff } from "lucide-react";
import { guestApi } from "../../../utils/offlineAwareApi";

import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  directionsClient,
  createInverseMask,
} from "../TourMap/mapConfig";

// Import separated components
import BackHeader from "../BackButton";
import DirectionsPanel from "../HomepageComponents/DirectionsPanel";
import MapControlButtons from "../HomepageComponents/MapControlButtons";
import SitePreviewCard from "../HomepageComponents/SitePreviewCard";
import SiteModalFullScreen from "../HomepageComponents/SiteModalFullScreen";
import GpsConsentModal from "../../shared/GpsConsentModal";

export default function GuestItineraryMap() {
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
  const [showGpsModal, setShowGpsModal] = useState(true);
  const [gpsError, setGpsError] = useState("");
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
        }));

        setPins(normalized);
      } catch (err) {
        console.error("Error fetching itinerary:", err);
      }
    };

    if (itineraryId) fetchItinerary();
  }, [itineraryId]);

  /** Track user location (after consent) */
  useEffect(() => {
    if (showGpsModal) return; // wait for user to enable
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const loc = { latitude: coords.latitude, longitude: coords.longitude };
        setUserLocation(loc);
        setViewState((v) => ({ ...v, ...loc }));
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
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

    if (userLocation) buildRoute(userLocation, nextPin);
  };

  return (
    <div className="w-full h-screen relative">
      <GpsConsentModal
        isOpen={showGpsModal}
        errorMessage={gpsError}
        onEnable={() => {
          if (navigator?.geolocation) {
            navigator.geolocation.getCurrentPosition(
              () => {
                setGpsError("");
                setShowGpsModal(false);
              },
              (err) => {
                setGpsError(
                  "We couldn’t access your location. Please enable GPS in device settings or use Tour Map features from the homepage."
                );
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
          navigate("/");
        }}
      />
      {/* Back Header */}
      <div 
        className="absolute top-0 left-0 w-full z-30 pointer-events-auto bg-white/95 backdrop-blur-md shadow-sm"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 16px)",
          paddingBottom: "8px",
          paddingLeft: "16px",
          paddingRight: "16px"
        }}
      >
        <BackHeader title={<span className="text-black">Guest Itinerary Map</span>} />
      </div>

      {!showGpsModal && (
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

        {/* User marker */}
        {userLocation && (
          <Marker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            anchor="bottom"
          >
            <Navigation className="text-blue-600 w-6 h-6" />
          </Marker>
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
            <MapPin
              className={`w-6 h-6 cursor-pointer ${
                idx === currentPinIndex
                  ? "text-blue-600 animate-pulse"
                  : "text-red-500"
              }`}
            />
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
          pinsLength={pins.length}
          goToNextStop={goToNextStop}
          siteReviews={siteReviews}
          reviewsLoading={reviewsLoading}
          simulateGoToNextSite={simulateGoToNextSite}
        />
      )}
    </div>
  );
}
