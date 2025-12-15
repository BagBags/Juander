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
import useMapLayers from "./useMapLayers";

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
  const mapRef = useRef(null);
  const isProgrammaticMoveRef = useRef(false);
  const [mapKey, setMapKey] = useState(0);
  const recreateMap = useCallback(() => setMapKey(k => k + 1), []);

  // Recreate map when its WebGL context is lost (Safari/iOS frequently)
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    const canvas = map?.getCanvas?.();
    if (!canvas) return;
    const handleLost = () => requestAnimationFrame(recreateMap);
    canvas.addEventListener('webglcontextlost', handleLost, { passive: true });
    return () => canvas.removeEventListener('webglcontextlost', handleLost);
  }, [mapKey, recreateMap]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Custom hooks
  const { mask, inverseMask, pins } = useApi(api);
  useMapLayers(mapRef, pins, selectedPin);

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

    // Immediately block interactions
    setIsAnimating(true);
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
      // Release interaction lock when map finished moving
      setIsAnimating(false);
    });
  };

  // ------------------ Open pin ------------------
  const openPin = useCallback((pinData) => {
    if (!pinData) return;

    flyToPin(pinData, () => {
      setSelectedPin(pinData);
    });
  }, []);

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
  }, [pins, openPin]);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const activeCountRef = { current: 0 };
    const beginAnim = () => {
      activeCountRef.current += 1;
      setIsAnimating(true);
    };
    const endAnim = () => {
      activeCountRef.current = Math.max(0, activeCountRef.current - 1);
      if (activeCountRef.current === 0) {
        setIsAnimating(false);
      }
    };

    map.on("zoomstart", beginAnim);
    map.on("zoomend", endAnim);
    map.on("movestart", beginAnim);
    map.on("moveend", endAnim);
    map.on("rotatestart", beginAnim);
    map.on("rotateend", endAnim);

    return () => {
      map.off("zoomstart", beginAnim);
      map.off("zoomend", endAnim);
      map.off("movestart", beginAnim);
      map.off("moveend", endAnim);
      map.off("rotatestart", beginAnim);
      map.off("rotateend", endAnim);
    };
  }, []);

  // Global lock of pointer events as fallback
  useEffect(() => {
    if (isAnimating) {
      const prevBodyPe = document.body.style.pointerEvents;
      const prevHtmlPe = document.documentElement.style.pointerEvents;
      document.body.style.pointerEvents = "none";
      document.documentElement.style.pointerEvents = "none";
      return () => {
        document.body.style.pointerEvents = prevBodyPe || "";
        document.documentElement.style.pointerEvents = prevHtmlPe || "";
      };
    }
    return undefined;
  }, [isAnimating]);

  useEffect(() => {
    const list = pins || [];
    const candidates = [];
    if (list.length > 0) candidates.push(list[0]);
    if (list[1]) candidates.push(list[1]);
    const links = [];
    candidates
      .map((p) => p?.glbUrl)
      .filter((u) => u && typeof u === "string" && u.endsWith(".glb"))
      .forEach((u) => {
        try {
          const l = document.createElement("link");
          l.rel = "prefetch";
          l.href = u;
          l.crossOrigin = "anonymous";
          document.head.appendChild(l);
          links.push(l);
        } catch {
          null;
        }
      });
    return () => {
      links.forEach((l) => {
        try {
          document.head.removeChild(l);
        } catch {
          null;
        }
      });
    };
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
      } catch {
        null;
      }

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
        } catch {
          null;
        }
      });
    }
  };

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const refreshMap = () => {
      try {
        if (!map.isStyleLoaded()) {
          map.setStyle("mapbox://styles/mapbox/streets-v11");
        }
        map.resize();
        map.triggerRepaint?.();

        requestAnimationFrame(() => {
          try {
            const canvas = map.getCanvas?.();
            const gl = canvas?.getContext?.('webgl') || canvas?.getContext?.('experimental-webgl');
            const contextLost = gl && typeof gl.isContextLost === "function" && gl.isContextLost();
            if (contextLost || !map.areTilesLoaded()) {
              recreateMap();
            }
          } catch {
            recreateMap();
          }
        });
      } catch {
        recreateMap();
      }
    };

    window.addEventListener("focus", refreshMap);
    window.addEventListener("pageshow", refreshMap);
    document.addEventListener("visibilitychange", refreshMap);

    return () => {
      window.removeEventListener("focus", refreshMap);
      window.removeEventListener("pageshow", refreshMap);
      document.removeEventListener("visibilitychange", refreshMap);
    };
  }, [recreateMap]);

  return (
    <div
      className="relative w-full"
      style={{
        height: "100dvh",
        minHeight: "100svh",
        overflow: "hidden",
        overscrollBehavior: "none",
      }}
    >
      <TourMapTourAutostart />

      {/* Map */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      >
        <Map
          key={mapKey}
          ref={mapRef}
          initialViewState={{ ...INITIAL_VIEW, minZoom: 15.5, maxZoom: 20 }}
          maxBounds={MAX_BOUNDS}
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={false}
          fadeDuration={0}
          style={{
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            willChange: "transform",
          }}
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
          className="w-full h-full"
          maxZoom={20}
          minZoom={15.5}
          minPitch={0}
          maxPitch={60}
          renderWorldCopies={false}
          onError={(e) => {
            console.error("Map error:", e);
          }}
        >
          <MapMarkers.PinMarkers
            pins={pins}
            selectedPin={selectedPin}
            onPinClick={openPin}
          />

          <MapLayers
            mask={mask}
            inverseMask={inverseMask}
            route={null}
            animating={isAnimating}
          />
        </Map>
      </div>

      {/* Control Buttons: Search */}
      {!showSearchModal && !selectedPin && (
        <TourMapControlButtons onOpenSearch={() => setShowSearchModal(true)} />
      )}

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

      {/* Input blocker during animations */}
      {isAnimating && (
        <div
          className="fixed inset-0 z-[20000]"
          style={{ touchAction: "none", pointerEvents: "auto" }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onPointerMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}
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
        try {
          localStorage.removeItem("tourMapReplayTutorial");
        } catch {
          null;
        }
      }
      setTimeout(() => {
        startTour();
      }, 600);
    }
  }, [hasCompletedTour, startTour, isTourRunning]);
  return null;
}
