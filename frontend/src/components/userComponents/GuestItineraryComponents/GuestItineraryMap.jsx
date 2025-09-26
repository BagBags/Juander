import React, { useState, useEffect } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { useParams } from "react-router-dom";

import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  directionsClient,
  createInverseMask,
} from "../TourMap/mapConfig";

export default function GuestItineraryMap() {
  const { itineraryId } = useParams();
  const [pins, setPins] = useState([]);
  const [viewState, setViewState] = useState({
    latitude: 14.5896,
    longitude: 120.9747,
    zoom: 16,
  });
  const [selectedPin, setSelectedPin] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [distance, setDistance] = useState(null);

  // --- Boundary masks ---
  const [mask, setMask] = useState(null);
  const [inverseMask, setInverseMask] = useState(null);

  // --- Fetch mask once ---
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

  // --- Fetch itinerary pins ---
  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const res = await axios.get(
          `https://juander.onrender.com/api/itineraries/guest/${itineraryId}`
        );

        const sites = (res.data.sites || []).filter(
          (s) => s.latitude && s.longitude
        );

        setPins(sites);

        if (sites.length > 0) {
          setSelectedPin(sites[0]);
          setViewState((v) => ({
            ...v,
            latitude: sites[0].latitude,
            longitude: sites[0].longitude,
          }));
        }
      } catch (err) {
        console.error("Error fetching itinerary:", err);
      }
    };

    if (itineraryId) fetchItinerary();
  }, [itineraryId]);

  // --- Watch user location ---
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

  // --- Fetch route from user to current stop ---
  useEffect(() => {
    const fetchRoute = async () => {
      if (!userLocation || !selectedPin) return;

      try {
        const resp = await directionsClient
          .getDirections({
            profile: "walking",
            geometries: "geojson",
            waypoints: [
              { coordinates: [userLocation.longitude, userLocation.latitude] },
              { coordinates: [selectedPin.longitude, selectedPin.latitude] },
            ],
          })
          .send();

        const routeData = resp.body.routes[0];
        setDistance(routeData.distance);
        setRoute({
          type: "Feature",
          geometry: routeData.geometry,
          properties: {},
        });
      } catch (err) {
        console.error("Directions error:", err);
      }
    };

    fetchRoute();
  }, [userLocation, selectedPin]);

  // --- Go to next site ---
  const goToNextStop = () => {
    if (currentIndex < pins.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedPin(pins[nextIndex]);
    }
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
        {/* Greyed out area outside the mask */}
        {inverseMask && (
          <Source id="inverse-mask" type="geojson" data={inverseMask}>
            <Layer
              id="inverse-fill"
              type="fill"
              paint={{ "fill-color": "#000", "fill-opacity": 0.5 }}
            />
          </Source>
        )}

        {/* Red outline border for active area */}
        {mask && (
          <Source id="mask" type="geojson" data={mask}>
            <Layer
              id="mask-border"
              type="line"
              paint={{ "line-color": "#FF0000", "line-width": 2 }}
            />
          </Source>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            anchor="bottom"
          >
            🧍
          </Marker>
        )}

        {/* Itinerary pins */}
        {pins.map((pin, idx) => (
          <Marker
            key={pin._id}
            latitude={pin.latitude}
            longitude={pin.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedPin(pin);
              setCurrentIndex(idx);
            }}
          >
            <div
              className={`w-6 h-6 rounded-full cursor-pointer ${
                idx === currentIndex
                  ? "bg-blue-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
          </Marker>
        ))}

        {/* Route line */}
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

      {/* Floating info */}
      {selectedPin && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-semibold">{selectedPin.siteName}</h3>
          <p className="text-sm text-gray-600">{selectedPin.siteDescription}</p>
          {distance && (
            <p className="text-xs mt-2">🛣️ {(distance / 1000).toFixed(2)} km</p>
          )}
        </div>
      )}

      {/* Next button */}
      {currentIndex < pins.length - 1 && (
        <button
          onClick={goToNextStop}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg"
        >
          Next Destination
        </button>
      )}
    </div>
  );
}
