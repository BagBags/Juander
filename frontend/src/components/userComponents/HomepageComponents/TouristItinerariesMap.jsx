import React, { useState, useEffect } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  X,
  Navigation,
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
} from "lucide-react";

import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  directionsClient,
  createInverseMask,
} from "../TourMap/mapConfig";

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

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  /** Fetch mask */
  useEffect(() => {
    const fetchMask = async () => {
      try {
        const { data } = await axios.get(
          "https://juander.onrender.com/api/mask"
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

  /** Fetch itinerary sites */
  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const res = await axios.get(
          `https://juander.onrender.com/api/itineraries/${itineraryId}`,
          config
        );

        const sites = (res.data.sites || []).filter(
          (s) => s.latitude && s.longitude
        );

        const normalized = sites.map((s) => ({
          ...s,
          siteName: s.siteName || "Site",
          description: s.siteDescription || s.description || "",
          mediaType: s.mediaType || "image",
          mediaUrl: s.mediaUrl || "",
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
        setSelectedPin(withDistances[0]); // show first modal
      }

      buildRoute(userLocation, pins[currentPinIndex]);
    }
  }, [userLocation, pins, currentPinIndex]);

  /** Detect arrival to auto-open modal */
  useEffect(() => {
    if (!userLocation || pins.length === 0) return;

    const radius = 30; // meters
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
      setSelectedPin(pin); // auto-show modal
    }
  }, [userLocation, currentPinIndex, pins]);

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
      {steps.length > 0 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[340px] bg-white rounded-xl shadow-lg p-4 text-sm flex flex-col items-center">
          <h4 className="font-semibold text-gray-800 mb-2">Directions</h4>

          <div className="text-center mb-3">
            <p className="text-base font-medium text-blue-700">
              {steps[currentStepIndex]?.maneuver?.instruction || "Follow route"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>

          {/* ETA + Distance + Arrival */}
          {eta && distance && (
            <div className="flex flex-col items-center text-sm text-gray-700 mb-3">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {Math.round(eta / 60)} min • {(distance / 1000).toFixed(2)} km
              </div>
              {arrivalTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Arrival:{" "}
                  {arrivalTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between w-full">
            <button
              onClick={() =>
                setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
              }
              disabled={currentStepIndex === 0}
              className={`px-3 py-1 rounded-md text-sm font-medium shadow flex items-center gap-1 ${
                currentStepIndex === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Prev
            </button>

            <button
              onClick={() =>
                setCurrentStepIndex((prev) =>
                  Math.min(prev + 1, steps.length - 1)
                )
              }
              disabled={currentStepIndex === steps.length - 1}
              className={`px-3 py-1 rounded-md text-sm font-medium shadow flex items-center gap-1 ${
                currentStepIndex === steps.length - 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Site Modal */}
      {selectedPin && (
        <div className="absolute top-1/2 left-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2">
          <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg p-4 font-sans">
            <button
              onClick={() => setSelectedPin(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold mb-2">
              {selectedPin.siteName}
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              {selectedPin.description}
            </p>

            {selectedPin.mediaUrl && (
              <div className="mb-3">
                {selectedPin.mediaType === "video" ? (
                  <video
                    src={selectedPin.mediaUrl}
                    className="w-full h-40 object-cover rounded-lg border"
                    muted
                    controls
                  />
                ) : (
                  <img
                    src={selectedPin.mediaUrl}
                    alt={selectedPin.siteName}
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                )}
              </div>
            )}

            {selectedPin.arEnabled && selectedPin.arLink && (
              <a
                href={selectedPin.arLink}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg shadow mb-3"
              >
                View in AR Mode
              </a>
            )}

            {selectedPin.status && (
              <div className="text-xs font-medium px-3 py-2 rounded-md border bg-gray-50">
                Status:{" "}
                <span
                  className={
                    selectedPin.status === "active"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {selectedPin.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            )}

            {/* Next Stop */}
            {currentPinIndex < pins.length - 1 && (
              <button
                onClick={goToNextStop}
                className="mt-4 w-full bg-blue-700 text-white px-5 py-2 rounded-md shadow-lg"
              >
                Go to Next Site
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
