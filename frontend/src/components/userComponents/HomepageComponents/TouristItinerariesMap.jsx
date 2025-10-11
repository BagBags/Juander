import React, { useState, useEffect } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Navigation, MapPin } from "lucide-react";

import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  directionsClient,
  createInverseMask,
} from "../TourMap/mapConfig";

// Import separated components
import DirectionsPanel from "./DirectionsPanel";
import MapControlButtons from "./MapControlButtons";
import SitePreviewCard from "./SitePreviewCard";
import SiteModalFullScreen from "./SiteModalFullScreen";

export default function TouristItineraryMap() {
  const { itineraryId } = useParams();

  const [pins, setPins] = useState([]);
  const [viewState, setViewState] = useState({
    latitude: 14.5896,
    longitude: 120.9747,
    zoom: 16,
  });
  const [userLocation, setUserLocation] = useState(null);

  // Routing
  const [route, setRoute] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null); // seconds
  const [arrivalTime, setArrivalTime] = useState(null); // clock time
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Map bounds
  const [mask, setMask] = useState(null);
  const [inverseMask, setInverseMask] = useState(null);

  // Site modals
  const [selectedPin, setSelectedPin] = useState(null);
  const [currentPinIndex, setCurrentPinIndex] = useState(0);
  const [showFullModal, setShowFullModal] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [manuallyDismissed, setManuallyDismissed] = useState(false);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Utility to resolve relative URLs into absolute URLs
  const resolveUrl = (url) => {
    if (!url) return "";
    const BACKEND_URL = "http://localhost:5000";
    return url.startsWith("http")
      ? url
      : `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  /** Fetch mask */
  useEffect(() => {
    const fetchMask = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/mask");
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
          `http://localhost:5000/api/itineraries/${itineraryId}`,
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
          glbUrl: resolveUrl(s.glbUrl),
          arEnabled: s.arEnabled === true,
          arLink: s.arLink || "",
          status: s.status || "active",
        }));

        setPins(normalized);
      } catch (err) {
        console.error("Error fetching itinerary:", err);
      }
    };

    if (itineraryId) fetchItinerary();
  }, [itineraryId]);

  /** Track user location */
  useEffect(() => {
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
  }, []);

  /** Build route from user → current pin */
  const buildRoute = async (start, pin) => {
    if (!start || !pin) return;

    try {
      const resp = await directionsClient
        .getDirections({
          profile: "walking",
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
    } catch (err) {
      console.error("Directions error:", err);
    }
  };

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

  /** Go to next stop */
  /** Go to nearest next stop */
  const goToNextStop = () => {
    if (!userLocation || pins.length === 0) return;

    // Find nearest site that is NOT the current one
    const remainingPins = pins.filter((_, i) => i !== currentPinIndex);

    if (remainingPins.length === 0) {
      // No more sites left
      setSelectedPin(null);
      setRoute(null);
      setSteps([]);
      return;
    }

    // Compute nearest site by Haversine formula
    const EARTH_RADIUS = 6371000;
    const distances = remainingPins.map((p, idx) => {
      const dLat = ((p.latitude - userLocation.latitude) * Math.PI) / 180;
      const dLng = ((p.longitude - userLocation.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((userLocation.latitude * Math.PI) / 180) *
          Math.cos((p.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { pin: p, distance: EARTH_RADIUS * c };
    });

    distances.sort((a, b) => a.distance - b.distance);
    const nearestPin = distances[0].pin;
    const nearestIndex = pins.findIndex((p) => p._id === nearestPin._id);

    // Update current site to nearest
    setCurrentPinIndex(nearestIndex);
    setSelectedPin(nearestPin);

    if (userLocation) buildRoute(userLocation, nearestPin);
  };

  return (
    <div className="w-full h-screen relative">
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

      {/* Directions Panel */}
      <DirectionsPanel
        steps={steps}
        currentStepIndex={currentStepIndex}
        setCurrentStepIndex={setCurrentStepIndex}
        eta={eta}
        distance={distance}
        arrivalTime={arrivalTime}
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
        />
      )}
    </div>
  );
}
