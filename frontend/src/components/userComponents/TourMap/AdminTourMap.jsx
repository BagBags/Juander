import React, { useState, useRef } from "react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  initialMaskFeature,
} from "./mapConfig";

export default function AdminMap() {
  const [viewState, setViewState] = useState({
    latitude: 14.5896,
    longitude: 120.9747,
    zoom: 16,
  });
  const [pins, setPins] = useState([]);
  const [maskGeoJson, setMaskGeoJson] = useState(initialMaskFeature);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [isMaskingMode, setIsMaskingMode] = useState(false);

  const adminMapRef = useRef(null);
  const drawRef = useRef(null);

  const enableMaskEditing = () => {
    const map = adminMapRef.current.getMap();
    if (drawRef.current) map.removeControl(drawRef.current);

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: false, trash: false },
      styles: [
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          paint: {
            "fill-color": "#ff6600",
            "fill-opacity": 0.5, // darker mask
          },
        },
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          paint: {
            "line-color": "#ff0000",
            "line-width": 3,
          },
        },
      ],
    });

    drawRef.current = draw;
    map.addControl(draw, "top-left");
    draw.add(maskGeoJson);
    setIsMaskingMode(true);
  };

  const exitMaskEditing = () => {
    const map = adminMapRef.current.getMap();
    if (drawRef.current) {
      map.removeControl(drawRef.current);
      drawRef.current = null;
    }
    setIsMaskingMode(false);
  };

  const saveMask = () => {
    if (drawRef.current) {
      const data = drawRef.current.getAll();
      if (data.features.length > 0) {
        const newMask = data.features[0];
        setMaskGeoJson(newMask);
        alert("Mask saved!");
      } else {
        alert("No mask found.");
      }
    }
  };

  const handleMapClick = (event) => {
    if (!isAddingPin) return;
    const { lng, lat } = event.lngLat;
    setPins((prev) => [
      ...prev,
      { latitude: lat, longitude: lng, title: "New Pin" },
    ]);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Map */}
      <Map
        ref={adminMapRef}
        initialViewState={{ ...viewState, minZoom: 15.5 }}
        maxBounds={INTRAMUROS_BOUNDS}
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: "100%", height: "100%" }}
      >
        {pins.map((pin, index) => (
          <Marker
            key={index}
            latitude={pin.latitude}
            longitude={pin.longitude}
            anchor="bottom"
          >
            🛠️
          </Marker>
        ))}
      </Map>

      {/* Sidebar Tools */}
      <div className="absolute top-0 left-0 m-4 p-4 bg-white shadow-lg rounded-lg space-y-3 w-64 z-10">
        <h2 className="text-lg font-bold text-gray-800">🗺️ Admin Map</h2>

        <button
          onClick={() => setIsAddingPin((prev) => !prev)}
          className={`w-full px-4 py-2 rounded-lg transition ${
            isAddingPin
              ? "bg-yellow-600 text-white"
              : "bg-gray-600 text-white hover:bg-gray-700"
          }`}
        >
          📍 {isAddingPin ? "Adding Pin Mode (Click map)" : "Add Pin"}
        </button>

        {!isMaskingMode ? (
          <button
            onClick={enableMaskEditing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🧲 Enable Mask Editing
          </button>
        ) : (
          <button
            onClick={exitMaskEditing}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            ❌ Exit Masking Mode
          </button>
        )}

        <button
          onClick={saveMask}
          disabled={!isMaskingMode}
          className={`w-full px-4 py-2 rounded-lg transition ${
            isMaskingMode
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
        >
          💾 Save Mask
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-10">
        Tour Map
      </div>
    </div>
  );
}
