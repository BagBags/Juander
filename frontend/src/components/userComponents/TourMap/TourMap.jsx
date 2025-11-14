// components/userComponents/TourMap.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import Map from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { MAPBOX_TOKEN, INTRAMUROS_BOUNDS } from "./mapConfig";
import { useApi } from "./useApi";
import MapMarkers from "./MapMarkers";
import MapOverlays from "./MapOverlays";
import MapLayers from "./MapLayers";
import ttsService from "../../../utils/textToSpeech";
import { useTranslation } from "react-i18next";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import "../../../App.css";

// ✅ Axios instance with auth token
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Centralized initial view state
const INITIAL_VIEW = {
  latitude: 14.591, // Intramuros center
  longitude: 120.9747, // Intramuros center
  zoom: 16,
  bearing: 45,
  pitch: 0,
};

export default function TourMap() {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [showLegend, setShowLegend] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Custom hooks
  const { mask, inverseMask, pins } = useApi(api);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setMapError(null);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Announce page load
  useEffect(() => {
    ttsService.speak(t('tts_tourMapLoaded'));
  }, [t]);

  // ------------------ Fly to pin ------------------
  const flyToPin = (pinData, callback) => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    map.flyTo({
      center: [pinData.longitude, pinData.latitude],
      zoom: 19.5, // Reduced from 20.2 for better performance
      bearing: 30,
      pitch: 60, // Reduced from 75 for smoother rendering
      speed: 1.8, // Increased from 1.2 for faster, smoother animation
      curve: 1.2, // Reduced from 1.5 for more direct path
      essential: true,
      easing: (t) => t * (2 - t), // Ease-out quad for smoother deceleration
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

  // ------------------ Open pin ------------------
  const openPin = useCallback(
    (pinData) => {
      if (!pinData) return;

      flyToPin(pinData, () => {
        setSelectedPin(pinData);
      });
    },
    []
  );

  // ------------------ Close card (reset view) ------------------
  const handleCloseCard = () => {
    setSelectedPin(null);

    const map = mapRef.current?.getMap?.();
    if (map) {
      map.flyTo({
        center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
        zoom: INITIAL_VIEW.zoom,
        bearing: INITIAL_VIEW.bearing,
        pitch: INITIAL_VIEW.pitch,
        speed: 1.8, // Faster animation to reduce lag
        curve: 1.2, // More direct path
        essential: true,
        easing: (t) => t * (2 - t), // Smooth ease-out
      });
    }
  };

  return (
    <div className="relative w-full h-screen" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Offline Map Warning */}
      {!isOnline && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">Offline Mode - Showing cached map tiles</span>
        </div>
      )}

      {/* Map */}
      <Map
        ref={mapRef}
        initialViewState={{ ...INITIAL_VIEW, minZoom: 15.5, maxZoom: 20 }}
        maxBounds={INTRAMUROS_BOUNDS}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        onMove={(evt) => {
          // Clamp longitude and latitude to bounds with padding for web view
          const [minLng, minLat] = INTRAMUROS_BOUNDS[0];
          const [maxLng, maxLat] = INTRAMUROS_BOUNDS[1];
          
          // Add tighter padding for web view (wider screens)
          const isWideScreen = window.innerWidth > 768;
          const padding = isWideScreen ? 0.001 : 0; // Tighter bounds for desktop
          
          const clampedLng = Math.max(minLng + padding, Math.min(maxLng - padding, evt.viewState.longitude));
          const clampedLat = Math.max(minLat + padding, Math.min(maxLat - padding, evt.viewState.latitude));
          
          // Restrict pitch to prevent showing white background (max 60 degrees)
          const clampedPitch = Math.min(60, Math.max(0, evt.viewState.pitch));
          
          setViewState({
            ...evt.viewState,
            longitude: clampedLng,
            latitude: clampedLat,
            pitch: clampedPitch,
          });
        }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        className="w-full h-full"
        maxZoom={20}
        minZoom={15.5}
        minPitch={0}
        maxPitch={60}
        renderWorldCopies={false}
        onError={(e) => {
          console.error('Map error:', e);
          if (!navigator.onLine) {
            setMapError('Map tiles unavailable offline. Showing cached tiles only.');
          }
        }}
      >
        {/* Tour pins */}
        <MapMarkers.PinMarkers
          pins={pins}
          selectedPin={selectedPin}
          onPinClick={openPin}
        />

        {/* Map Layers */}
        <MapLayers mask={mask} inverseMask={inverseMask} route={null} />
      </Map>

      {/* UI Overlays */}
      <MapOverlays
        selectedPin={selectedPin}
        distance={null}
        onCloseCard={handleCloseCard}
        showLegend={showLegend}
        setShowLegend={setShowLegend}
      />

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
}
