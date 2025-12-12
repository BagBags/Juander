// components/userComponents/TourMap.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useGLTF } from "@react-three/drei";
import Map from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { MAPBOX_TOKEN, INTRAMUROS_BOUNDS } from "./mapConfig";
import { useApi } from "./useApi";
import MapMarkers from "./MapMarkers";
import MapOverlays from "./MapOverlays";
import MapLayers from "./MapLayers";
import { useTranslation } from "react-i18next";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";
import TourMapSearchModal from "./TourMapSearchModal";
import TourMapControlButtons from "./TourMapControlButtons";
import "../../../App.css";
import { useTour } from "../../TourComponents/TourContext";

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
  const isProgrammaticMoveRef = useRef(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [showSearchModal, setShowSearchModal] = useState(false);
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

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Remove non-itinerary TTS announcements
  // No TTS here; voice guidance is exclusive to itinerary maps

  const BOUNDS_EXPANSION = 0.006;
  const MAX_BOUNDS = [
    [
      INTRAMUROS_BOUNDS[0][0] - BOUNDS_EXPANSION,
      INTRAMUROS_BOUNDS[0][1] - BOUNDS_EXPANSION,
    ],
    [
      INTRAMUROS_BOUNDS[1][0] + BOUNDS_EXPANSION,
      INTRAMUROS_BOUNDS[1][1] + BOUNDS_EXPANSION,
    ],
  ];
  const EXIT_UNZOOM_ZOOM = 17.2;

  // ------------------ Fly to pin ------------------
  const flyToPin = (pinData, callback) => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    isProgrammaticMoveRef.current = true;
    map.flyTo({
      center: [pinData.longitude, pinData.latitude],
      zoom: 19.5, // Reduced from 20.2 for better performance
      bearing: 30,
      pitch: 60, // Reduced from 75 for smoother rendering
      duration: 1600,
      speed: 1.2,
      curve: 1.2, // Reduced from 1.5 for more direct path
      essential: true,
      easing: (t) => t * (2 - t), // Ease-out quad for smoother deceleration
    });

    map.once("moveend", () => {
      isProgrammaticMoveRef.current = false;
      callback?.();
    });
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
  const openPin = useCallback((pinData) => {
    if (!pinData) return;

    flyToPin(pinData, () => {
      setSelectedPin(pinData);
    });
  }, []);

  useEffect(() => {
    const url = selectedPin?.glbUrl;
    if (url && typeof url === "string" && url.endsWith(".glb")) {
      try {
        useGLTF.preload(url);
      } catch {}
    }
  }, [selectedPin]);

  useEffect(() => {
    const candidates = [];
    if (pins && pins.length > 0) {
      candidates.push(pins[0]);
      if (pins[1]) candidates.push(pins[1]);
    }
    const urls = candidates
      .map((p) => p?.glbUrl)
      .filter((u) => u && typeof u === "string" && u.endsWith(".glb"));
    urls.forEach((u) => {
      try {
        useGLTF.preload(u);
      } catch {}
    });
  }, [pins]);

  // ------------------ Close card (reset view) ------------------
  const handleCloseCard = () => {
    const pin = selectedPin;
    setSelectedPin(null);
    const map = mapRef.current?.getMap?.();
    if (map && pin) {
      let hadBounds = false;
      try {
        const currentMax =
          typeof map.getMaxBounds === "function" ? map.getMaxBounds() : null;
        if (currentMax) hadBounds = true;
        if (typeof map.setMaxBounds === "function") map.setMaxBounds(null);
      } catch {}

      isProgrammaticMoveRef.current = true;
      map.flyTo({
        center: [pin.longitude, pin.latitude],
        zoom: EXIT_UNZOOM_ZOOM,
        bearing: INITIAL_VIEW.bearing,
        pitch: INITIAL_VIEW.pitch,
        duration: 1600,
        speed: 1.2,
        curve: 1.2,
        essential: true,
        easing: (t) => t * (2 - t),
      });
      map.once("moveend", () => {
        isProgrammaticMoveRef.current = false;
        try {
          if (hadBounds && typeof map.setMaxBounds === "function") {
            map.setMaxBounds(MAX_BOUNDS);
          }
        } catch {}
      });
    }
  };

  return (
    <div
      className="relative w-full"
      style={{
        height: "100dvh",
        overflow: "hidden",
        overscrollBehavior: "none",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <TourMapTourAutostart />

      {/* Map */}
      <Map
        ref={mapRef}
        initialViewState={{ ...INITIAL_VIEW, minZoom: 15.5, maxZoom: 20 }}
        maxBounds={MAX_BOUNDS}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        onMove={(evt) => {
          if (isProgrammaticMoveRef.current) {
            setViewState(evt.viewState);
            return;
          }
          const [minLng, minLat] = INTRAMUROS_BOUNDS[0];
          const [maxLng, maxLat] = INTRAMUROS_BOUNDS[1];
          const prevLng = viewState.longitude;
          const prevLat = viewState.latitude;
          const incomingLng = evt.viewState.longitude;
          const incomingLat = evt.viewState.latitude;

          let nextLng = incomingLng;
          let nextLat = incomingLat;

          const withinLng = prevLng >= minLng && prevLng <= maxLng;
          const withinLat = prevLat >= minLat && prevLat <= maxLat;

          if (withinLng) {
            if (incomingLng > maxLng) nextLng = prevLng;
            if (incomingLng < minLng) nextLng = prevLng;
          } else {
            if (prevLng > maxLng) nextLng = Math.min(prevLng, incomingLng);
            if (prevLng < minLng) nextLng = Math.max(prevLng, incomingLng);
          }

          if (withinLat) {
            if (incomingLat > maxLat) nextLat = prevLat;
            if (incomingLat < minLat) nextLat = prevLat;
          } else {
            if (prevLat > maxLat) nextLat = Math.min(prevLat, incomingLat);
            if (prevLat < minLat) nextLat = Math.max(prevLat, incomingLat);
          }
          const clampedPitch = Math.min(60, Math.max(0, evt.viewState.pitch));
          setViewState({
            ...evt.viewState,
            longitude: nextLng,
            latitude: nextLat,
            pitch: clampedPitch,
          });
        }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        className="w-full h-full translate-y-10 sm:translate-y-12 md:translate-y-14"
        maxZoom={20}
        minZoom={15.5}
        minPitch={0}
        maxPitch={60}
        renderWorldCopies={false}
        onError={(e) => {
          console.error("Map error:", e);
          if (!navigator.onLine) {
            setMapError(
              "Map tiles unavailable offline. Showing cached tiles only."
            );
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

      {/* Control Buttons: Search */}
      <TourMapControlButtons onOpenSearch={() => setShowSearchModal(true)} />

      {/* UI Overlays */}
      <MapOverlays
        selectedPin={selectedPin}
        distance={null}
        onCloseCard={handleCloseCard}
      />

      {/* Search Modal */}
      <TourMapSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        pins={pins}
        onSelectPin={(pin) => openPin(pin)}
      />

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
}

function TourMapTourAutostart() {
  const { startTour, isTourRunning, hasCompletedTour } = useTour();
  const didAutoStartRef = React.useRef(false);
  useEffect(() => {
    if (didAutoStartRef.current) return;
    if (hasCompletedTour === null) return; // wait for status fetch
    const replayFlag = localStorage.getItem("tourMapReplayTutorial") === "true";
    if ((hasCompletedTour === false || replayFlag) && !isTourRunning) {
      didAutoStartRef.current = true;
      if (replayFlag) {
        try { localStorage.removeItem("tourMapReplayTutorial"); } catch {}
      }
      setTimeout(() => {
        startTour();
      }, 600);
    }
  }, [hasCompletedTour, startTour, isTourRunning]);
  return null;
}
