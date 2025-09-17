// components/userComponents/UserMap.jsx
import React, { useState, useEffect, useRef, Suspense } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import BackHeader from "../BackButton";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import PinModel from "../../Map3DPins"; // <-- NEW overlay component

import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  directionsClient,
  createInverseMask,
} from "./mapConfig";

import "../../../App.css";

// --- Axios instance ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Site Info Card ---
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

export default function UserMap() {
  const [viewState, setViewState] = useState({
    latitude: 14.5896,
    longitude: 120.9747,
    zoom: 16,
  });

  const [mask, setMask] = useState(null);
  const [inverseMask, setInverseMask] = useState(null);
  const [pins, setPins] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [distance, setDistance] = useState(null);
  const [route, setRoute] = useState(null);

  const mapRef = useRef(null); // <-- Ref for 3D pins overlay

  // --- Fetch mask once ---
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

  // --- Fetch pins once ---
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

  // --- Watch user location ---
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

  const openPin = async (pin) => {
    setSelectedPin(pin);
    setDistance(null);
    setRoute(null);
    if (!userLocation || !pin) return;

    try {
      const resp = await directionsClient
        .getDirections({
          profile: "walking",
          geometries: "geojson",
          waypoints: [
            { coordinates: [userLocation.longitude, userLocation.latitude] },
            { coordinates: [pin.longitude, pin.latitude] },
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

  return (
    <div className="relative w-full h-screen">
      {/* Map */}
      <Map
        ref={mapRef}
        initialViewState={{ ...viewState, minZoom: 15.5 }}
        maxBounds={INTRAMUROS_BOUNDS}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        className="w-full h-full"
        onClick={() => {
          setSelectedPin(null);
          setDistance(null);
          setRoute(null);
        }}
      >
        {/* User location */}
        {userLocation && (
          <Marker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            anchor="bottom"
          >
            🧍
          </Marker>
        )}

        {/* Inverse mask */}
        {inverseMask && (
          <Source id="inverse-mask" type="geojson" data={inverseMask}>
            <Layer
              id="inverse-fill"
              type="fill"
              paint={{ "fill-color": "#000", "fill-opacity": 0.5 }}
            />
          </Source>
        )}

        {/* Mask border */}
        {mask && (
          <Source id="mask" type="geojson" data={mask}>
            <Layer
              id="mask-border"
              type="line"
              paint={{ "line-color": "#FF0000", "line-width": 2 }}
            />
          </Source>
        )}

        {/* Route */}
        {route && (
          <Source id="route" type="geojson" data={route}>
            <Layer
              id="route-layer"
              type="line"
              paint={{ "line-color": "#ff0000", "line-width": 4 }}
            />
          </Source>
        )}
      </Map>

      {/* 3D pins overlay */}
      {mapRef.current && <PinModel pins={pins} map={mapRef.current.getMap()} />}

      {/* Back Header (overlapping the map) */}
      <div className="absolute top-0 left-0 w-full z-20 p-4">
        <BackHeader title={<span className="text-black">Tour Map</span>} />
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
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20">
          <button className="bg-blue-700 text-white px-5 py-2 rounded-md cursor-pointer shadow-lg">
            Go to next site
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-20">
        Tour Map
      </div>
    </div>
  );
}
