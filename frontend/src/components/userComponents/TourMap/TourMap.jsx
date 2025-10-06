// components/userComponents/TourMap.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import Map from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { MAPBOX_TOKEN, INTRAMUROS_BOUNDS } from "./mapConfig";
import { useApi } from "./useApi";
import { useUserLocation } from "./useUserLocation";
import MapLegend from "./MapLegend";
import MapMarkers from "./MapMarkers";
import MapOverlays from "./MapOverlays";
import MapLayers from "./MapLayers";
import "../../../App.css";

// ✅ Axios instance with auth token
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Centralized initial view state
const INITIAL_VIEW = {
  latitude: 14.591, // Intramuros center
  longitude: 120.9747,
  zoom: 16,
  bearing: 45,
  pitch: 0,
};

export default function UserMap() {
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [selectedPin, setSelectedPin] = useState(null);
  const [distance, setDistance] = useState(null);
  const [route, setRoute] = useState(null);
  const [showLegend, setShowLegend] = useState(false);

  const mapRef = useRef(null);

  // Custom hooks
  const { mask, inverseMask, pins } = useApi(api);
  const userLocation = useUserLocation(setViewState);

  // ------------------ Fly to pin ------------------
  const flyToPin = (pinData, callback) => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    map.flyTo({
      center: [pinData.longitude, pinData.latitude],
      zoom: 20.2,
      bearing: 30,
      pitch: 75,
      speed: 1.2,
      curve: 1.5,
      essential: true,
    });

    map.once("moveend", () => callback?.());
  };

  // ------------------ Handle map clicks ------------------
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const handleMapClick = (e) => {
      if (!pins?.length || !map.getLayer("pins-click-layer")) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["pins-click-layer"],
      });

      if (features.length > 0) {
        const pinId = features[0].properties.id;
        const pin = pins.find((p) => p._id === pinId);
        if (pin) openPin(pin);
      }
    };

    map.on("click", handleMapClick);
    return () => map.off("click", handleMapClick);
  }, [pins]);

  // ------------------ Open pin + fetch route ------------------
  const openPin = useCallback(
    (pinData) => {
      if (!pinData) return;

      flyToPin(pinData, async () => {
        setSelectedPin(pinData);
        setDistance(null);
        setRoute(null);

        if (!userLocation) return;

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
          }
        } catch (err) {
          console.error("❌ Directions fetch error:", err);
        }
      });
    },
    [userLocation]
  );

  // ------------------ Close card (reset view) ------------------
  const handleCloseCard = () => {
    setSelectedPin(null);
    setDistance(null);
    setRoute(null);

    const map = mapRef.current?.getMap?.();
    if (map) {
      map.flyTo({
        center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
        zoom: INITIAL_VIEW.zoom,
        bearing: INITIAL_VIEW.bearing,
        pitch: INITIAL_VIEW.pitch,
        speed: 1.2,
        curve: 1.5,
        essential: true,
      });
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Legend */}
      <MapLegend showLegend={showLegend} setShowLegend={setShowLegend} />

      {/* Map */}
      <Map
        ref={mapRef}
        initialViewState={{ ...INITIAL_VIEW, minZoom: 15.5 }}
        maxBounds={INTRAMUROS_BOUNDS}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        className="w-full h-full"
      >
        {/* User location marker */}
        {userLocation && (
          <MapMarkers.UserLocationMarker userLocation={userLocation} />
        )}

        {/* Tour pins */}
        <MapMarkers.PinMarkers
          pins={pins}
          selectedPin={selectedPin}
          onPinClick={openPin}
        />

        {/* Map Layers */}
        <MapLayers mask={mask} inverseMask={inverseMask} route={route} />
      </Map>

      {/* UI Overlays */}
      <MapOverlays
        selectedPin={selectedPin}
        distance={distance}
        onCloseCard={handleCloseCard}
      />
    </div>
  );
}
