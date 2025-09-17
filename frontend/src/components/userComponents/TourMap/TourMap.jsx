// components/userComponents/TourMap.jsx
import React, {
  useState,
  useEffect,
  useRef,
  Suspense,
  useCallback,
} from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import BackHeader from "../BackButton";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import PinLayer from "../3DPin";
import { Canvas, useThree } from "@react-three/fiber";

import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  directionsClient,
  createInverseMask,
} from "./mapConfig";

import "../../../App.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ------------------ Site Card ------------------
const SiteCard = ({ pin, onClose, distance }) => (
  <div className="absolute top-1/2 left-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2">
    <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg p-4 font-sans">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
      <h3 className="text-lg font-semibold mb-2">{pin.title}</h3>
      <p className="text-sm leading-snug text-gray-700 mb-3">
        {pin.description}
      </p>
      {pin.mediaUrl && (
        <div className="mb-3">
          {pin.mediaType === "video" ? (
            <video
              src={pin.mediaUrl}
              className="w-full h-40 object-cover rounded-lg border border-gray-200"
              muted
              controls
            />
          ) : (
            <img
              src={pin.mediaUrl}
              alt={pin.title}
              className="w-full h-40 object-cover rounded-lg border border-gray-200"
            />
          )}
        </div>
      )}
      {pin.arEnabled && pin.arLink && (
        <a
          href={pin.arLink}
          target="_blank"
          rel="noreferrer"
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg shadow mb-3"
        >
          View in AR Mode
        </a>
      )}
      <div className="text-xs font-medium px-3 py-2 rounded-md shadow-sm border border-gray-200 bg-gray-50">
        Status:{" "}
        <span
          className={
            pin.status === "active" ? "text-green-600" : "text-red-600"
          }
        >
          {pin.status === "active" ? "Active" : "Inactive"}
        </span>
      </div>
      {distance !== null && (
        <div className="bg-gray-50 text-xs px-3 py-2 mt-3 rounded-md shadow-sm border border-gray-200">
          🛣️ Distance: {(distance / 1000).toFixed(2)} km
        </div>
      )}
    </div>
  </div>
);

// ------------------ Camera Controller ------------------
function OrthoCameraController() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!camera || !camera.isOrthographicCamera) return;
    camera.left = -size.width / 2;
    camera.right = size.width / 2;
    camera.top = size.height / 2;
    camera.bottom = -size.height / 2;
    camera.near = -1000;
    camera.far = 1000;
    camera.position.set(0, 0, 500);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

// ------------------ Main ------------------
export default function UserMap() {
  const [viewState, setViewState] = useState({
    latitude: 14.5896,
    longitude: 120.9747,
    zoom: 16,
    pitch: 45,
    bearing: -17,
  });

  const [mask, setMask] = useState(null);
  const [inverseMask, setInverseMask] = useState(null);
  const [pins, setPins] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [distance, setDistance] = useState(null);
  const [route, setRoute] = useState(null);

  const [positions, setPositions] = useState([]);
  const mapRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // ------------------ Fetch mask ------------------
  useEffect(() => {
    const fetchMask = async () => {
      try {
        const { data } = await api.get("/mask");
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

  // ------------------ Fetch pins ------------------
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const { data } = await api.get("/pins");
        const raw = Array.isArray(data) ? data : data?.pins || [];
        const normalized = raw.map((p) => ({
          _id: p._id,
          latitude: p.latitude,
          longitude: p.longitude,
          title: p.siteName || "Site",
          description: p.siteDescription || "",
          mediaType: p.mediaType || "image",
          mediaUrl: p.mediaUrl || "",
          arEnabled: p.arEnabled === true,
          arLink: p.arLink || "",
          status: p.status || "active",
        }));
        setPins(normalized);
      } catch (err) {
        console.error("❌ Error fetching pins:", err);
      }
    };
    fetchPins();
  }, []);

  // ------------------ Update positions ------------------
  useEffect(() => {
    let mounted = true;
    const updatePositions = () => {
      const mapObj = mapRef?.current?.getMap?.();
      if (!mapObj || !pins?.length) {
        if (mounted) setPositions([]);
        return;
      }
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;

      const newPos = pins.map((p) => {
        const { x, y } = mapObj.project([p.longitude, p.latitude]);
        return {
          _id: p._id,
          screenX: x,
          screenY: y,
          x: x - halfW,
          y: -(y - halfH),
          data: p,
        };
      });
      if (mounted) setPositions(newPos);
    };

    const t = setTimeout(updatePositions, 200);
    const onMove = () => updatePositions();
    const onResize = () => updatePositions();

    const mapObj = mapRef?.current?.getMap?.();
    if (mapObj) {
      mapObj.on("move", onMove);
      mapObj.on("zoom", onMove);
    }
    window.addEventListener("resize", onResize);

    return () => {
      mounted = false;
      clearTimeout(t);
      const mapObj2 = mapRef?.current?.getMap?.();
      if (mapObj2) {
        mapObj2.off("move", onMove);
        mapObj2.off("zoom", onMove);
      }
      window.removeEventListener("resize", onResize);
    };
  }, [pins, mapRef]);

  // ------------------ User location ------------------
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setViewState((v) => ({
          ...v,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ------------------ Open pin ------------------
  const openPin = useCallback(
    async (pinData) => {
      setSelectedPin(pinData);
      setDistance(null);
      setRoute(null);
      if (!userLocation || !pinData) return;
      try {
        const resp = await directionsClient
          .getDirections({
            profile: "walking",
            geometries: "geojson",
            waypoints: [
              { coordinates: [userLocation.longitude, userLocation.latitude] },
              { coordinates: [pinData.longitude, pinData.latitude] },
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
    },
    [userLocation]
  );

  // ------------------ Handle map click ------------------
  const handleMapClick = useCallback(
    (evt) => {
      const px = evt?.point?.x;
      const py = evt?.point?.y;
      if (px == null || py == null) {
        setSelectedPin(null);
        setDistance(null);
        setRoute(null);
        return;
      }
      const thresholdPx = 28;
      let nearest = null;
      let bestDist2 = Infinity;
      for (const p of positions) {
        const dx = px - p.screenX;
        const dy = py - p.screenY;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist2) {
          bestDist2 = d2;
          nearest = p;
        }
      }
      if (nearest && Math.sqrt(bestDist2) <= thresholdPx) {
        openPin(nearest.data);
      } else {
        setSelectedPin(null);
        setDistance(null);
        setRoute(null);
      }
    },
    [positions, openPin]
  );

  // ------------------ Handle canvas click ------------------
  const handleCanvasClick = useCallback(
    (event) => {
      // Get the position of the canvas container
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert to map coordinates
      const mapObj = mapRef?.current?.getMap();
      if (!mapObj) return;

      // Check if we clicked on a pin
      const thresholdPx = 28;
      let nearest = null;
      let bestDist2 = Infinity;

      for (const p of positions) {
        const dx = x - p.screenX;
        const dy = y - p.screenY;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist2) {
          bestDist2 = d2;
          nearest = p;
        }
      }

      if (nearest && Math.sqrt(bestDist2) <= thresholdPx) {
        openPin(nearest.data);
      }
    },
    [positions, openPin]
  );

  return (
    <div className="relative w-full h-screen">
      {/* Map at the back (interactive) */}
      <div className="relative w-full h-screen">
        {/* Map always below, interactive */}
        <div className="absolute inset-0 z-10">
          <Map
            ref={mapRef}
            viewState={viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            minZoom={15.5}
            maxBounds={INTRAMUROS_BOUNDS}
            mapboxAccessToken={MAPBOX_TOKEN}
            attributionControl={false}
            onClick={handleMapClick}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            className="w-full h-full"
            dragPan={true}
            dragRotate={true}
            touchZoomRotate={true}
            touchPitch={true}
            doubleClickZoom={true}
          >
            {/* Render map elements */}
            {userLocation && (
              <Marker
                longitude={userLocation.longitude}
                latitude={userLocation.latitude}
              >
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
              </Marker>
            )}

            {mask && (
              <Source type="geojson" data={mask}>
                <Layer
                  id="mask-fill"
                  type="fill"
                  paint={{ "fill-color": "#000", "fill-opacity": 0.4 }}
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

            {pins.map((pin) => (
              <Marker
                key={pin._id}
                longitude={pin.longitude}
                latitude={pin.latitude}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer ${
                    selectedPin?._id === pin._id ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </Marker>
            ))}
          </Map>
        </div>

        {/* 3D pins above map but passing through events */}
        <div
          ref={canvasContainerRef}
          className="absolute inset-0 z-20 pointer-events-none"
          onClick={handleCanvasClick}
        >
          <Canvas
            orthographic
            style={{ width: "100%", height: "100%", pointerEvents: "none" }}
            gl={{ antialias: true }}
          >
            <OrthoCameraController />
            <ambientLight intensity={1} />
            <directionalLight position={[20, 20, 20]} intensity={1.2} />

            <Suspense fallback={null}>
              <PinLayer
                positions={positions}
                selectedPin={selectedPin}
                onPinClick={(pin) => {
                  setSelectedPin(pin);
                }}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* UI overlays (interactive) */}
        <div className="absolute top-0 left-0 w-full z-30 p-4 pointer-events-auto">
          <BackHeader title={<span className="text-black">Tour Map</span>} />
        </div>
      </div>

      {/* Site card */}
      {selectedPin && (
        <SiteCard
          pin={selectedPin}
          distance={distance}
          onClose={() => {
            setSelectedPin(null);
            setDistance(null);
            setRoute(null);
          }}
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
