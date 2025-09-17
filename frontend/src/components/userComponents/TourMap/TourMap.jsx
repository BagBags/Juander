// components/userComponents/TourMap.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import BackHeader from "../BackButton";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

import { MAPBOX_TOKEN, INTRAMUROS_BOUNDS } from "./mapConfig";
import SiteCard from "./SiteCard";
import { useApi } from "./useApi";
import { useUserLocation } from "./useUserLocation";
// import useMapLayers from "./useMapLayers";

import "../../../App.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function UserMap() {
  const [viewState, setViewState] = useState({
    latitude: 40.5896,
    longitude: 120.9747,
    zoom: 4,
    bearing: 45,
  });

  const [selectedPin, setSelectedPin] = useState(null);
  const [distance, setDistance] = useState(null);
  const [route, setRoute] = useState(null);

  const mapRef = useRef(null);

  // Custom hooks
  const { mask, inverseMask, pins } = useApi(api);
  const userLocation = useUserLocation(setViewState);

  // ✅ Add 3D pins (layered pins)
  // useMapLayers(mapRef, pins, selectedPin);

  // ✅ Handle pin clicks safely
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const handleMapClick = (e) => {
      if (!pins?.length) return;

      // Only query if the click layer exists
      if (!map.getLayer("pins-click-layer")) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["pins-click-layer"],
      });

      if (features.length > 0) {
        const feature = features[0];
        const pinId = feature.properties.id;
        const pin = pins.find((p) => p._id === pinId);
        if (pin) openPin(pin);
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [pins]);

  // ------------------ Open pin ------------------
  const openPin = useCallback(
    async (pinData) => {
      setSelectedPin(pinData);
      setDistance(null);
      setRoute(null);

      if (!userLocation || !pinData) return;

      try {
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/walking/` +
          `${userLocation.longitude},${userLocation.latitude};` +
          `${pinData.longitude},${pinData.latitude}` +
          `?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

        const resp = await fetch(url);
        const data = await resp.json();

        if (data.routes?.length) {
          const routeData = data.routes[0];
          setDistance(routeData.distance);
          setRoute({
            type: "Feature",
            geometry: routeData.geometry,
            properties: {},
          });
        } else {
          console.warn("No routes found:", data);
        }
      } catch (err) {
        console.error("❌ Directions fetch error:", err);
      }
    },
    [userLocation]
  );

  const handleCloseCard = () => {
    setSelectedPin(null);
    setDistance(null);
    setRoute(null);
  };

  return (
    <div className="relative w-full h-screen">
      {/* Map at the back */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        minZoom={15.5}
        maxBounds={INTRAMUROS_BOUNDS}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        className="w-full h-full"
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
          >
            <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
          </Marker>
        )}

        {/* ✅ Render tour pins */}
        {pins &&
          pins.map((pin) => (
            <Marker
              key={pin._id}
              longitude={pin.longitude}
              latitude={pin.latitude}
              anchor="bottom"
            >
              <div
                onClick={() => openPin(pin)}
                className="cursor-pointer w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-md"
                title={pin.name}
              ></div>
            </Marker>
          ))}

        {/* Mask layers */}
        {mask && (
          <Source type="geojson" data={mask}>
            <Layer
              id="mask-fill"
              type="fill"
              paint={{ "fill-color": "#000", "fill-opacity": 0 }}
            />
          </Source>
        )}

        {inverseMask && (
          <Source type="geojson" data={inverseMask}>
            <Layer
              id="inverse-mask-fill"
              type="fill"
              paint={{ "fill-color": "#000", "fill-opacity": 0.7 }}
            />
          </Source>
        )}

        {/* Route layer */}
        {route && (
          <Source type="geojson" data={route}>
            <Layer
              id="route-line"
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{
                "line-color": "#3b9ddd",
                "line-width": 4,
                "line-opacity": 0.8,
              }}
            />
          </Source>
        )}
      </Map>

      {/* UI overlays */}
      <div className="absolute top-0 left-0 w-full z-30 p-4 pointer-events-auto">
        <BackHeader title={<span className="text-black">Tour Map</span>} />
      </div>

      {/* Site card */}
      {selectedPin && (
        <SiteCard
          pin={selectedPin}
          distance={distance}
          onClose={handleCloseCard}
        />
      )}

      {/* Next site button */}
      {selectedPin && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
          <button className="bg-blue-700 text-white px-5 py-2 rounded-md cursor-pointer shadow-lg">
            Go to next site
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-30 pointer-events-auto">
        Tour Map
      </div>
    </div>
  );
}
