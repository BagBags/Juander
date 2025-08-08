import React, { useState, useRef } from "react";
import Map, { Marker, Popup } from "react-map-gl";
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
  console.log(pins);
  const [maskGeoJson, setMaskGeoJson] = useState(initialMaskFeature);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [isMaskingMode, setIsMaskingMode] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null); // store selected pin index

  const adminMapRef = useRef(null);
  const drawRef = useRef(null);

 const enableMaskEditing = () => {
  const map = adminMapRef.current.getMap();
  if (drawRef.current) map.removeControl(drawRef.current);

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: { polygon: false, trash: false },
    styles: [
      // Polygon fill
      {
        id: "gl-draw-polygon-fill",
        type: "fill",
        paint: {
          "fill-color": "#ff6600",
          "fill-opacity": 0.5,
        },
      },
      // Polygon outline
      {
        id: "gl-draw-polygon-stroke",
        type: "line",
        paint: {
          "line-color": "#ff0000",
          "line-width": 3,
        },
      },
      // ACTIVE vertex points
      {
        id: "gl-draw-polygon-and-line-vertex-halo-active",
        type: "circle",
        paint: {
          "circle-radius": 7,
          "circle-color": "#fff",
        },
      },
      {
        id: "gl-draw-polygon-and-line-vertex-active",
        type: "circle",
        paint: {
          "circle-radius": 5,
          "circle-color": "#ff0000",
        },
      },
    ],
  });

  drawRef.current = draw;
  map.addControl(draw, "top-left");

  // Add mask
  const added = draw.add(maskGeoJson);
  const featureId =
    maskGeoJson.id || (Array.isArray(added) ? added[0] : added);

  // Switch to direct_select so points show immediately
  if (featureId) {
    draw.changeMode("direct_select", { featureId });
  }

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
    setIsMaskingMode(false);
  };

  const savePins = () => {
    alert(`Saved ${pins.length} pin(s)!`);
    setIsAddingPin(false);
  };

  // Add pin when map is clicked
  const handleMapClick = (event) => {
    if (!isAddingPin) return;
    const { lng, lat } = event.lngLat;
    const newPin = {
      latitude: lat,
      longitude: lng,
      title: "",
      mediaUrl: "",
      mediaType: "image",
    };
    setPins((prev) => [...prev, newPin]);
    setSelectedPin(pins.length); // auto-open form for the newly added pin
  };

  // Update pin fields in the form
  const updatePinField = (index, field, value) => {
    setPins((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // Handle form submit
  const handleFormSubmit = (e, index) => {
    e.preventDefault();
    alert(`Pin #${index + 1} saved!`);
    setSelectedPin(null);
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
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPin(index);
              }}
              style={{ fontSize: "24px", cursor: "pointer" }}
            >
              🛠️
            </div>
          </Marker>
        ))}

        {selectedPin !== null && pins[selectedPin] && (
          <Popup
            latitude={pins[selectedPin].latitude}
            longitude={pins[selectedPin].longitude}
            anchor="top"
            closeOnClick={false}
            onClose={() => setSelectedPin(null)}
          >
            <form
              onSubmit={(e) => handleFormSubmit(e, selectedPin)}
              style={{ maxWidth: "200px", fontSize: "14px" }}
            >
              <label>Title:</label>
              <input
                type="text"
                value={pins[selectedPin].title}
                onChange={(e) =>
                  updatePinField(selectedPin, "title", e.target.value)
                }
                style={{ width: "100%", marginBottom: "5px" }}
              />
              <label>Description:</label>
              <input
                type="text"
                value={pins[selectedPin].title}
                onChange={(e) =>
                  updatePinField(selectedPin, "title", e.target.value)
                }
                style={{ width: "100%", marginBottom: "5px" }}
              />
              <label>Media URL:</label>
              <input
                type="text"
                value={pins[selectedPin].mediaUrl}
                onChange={(e) =>
                  updatePinField(selectedPin, "mediaUrl", e.target.value)
                }
                style={{ width: "100%", marginBottom: "5px" }}
              />

              <label>Media Type:</label>
              <select
                value={pins[selectedPin].mediaType}
                onChange={(e) =>
                  updatePinField(selectedPin, "mediaType", e.target.value)
                }
                style={{ width: "100%", marginBottom: "5px" }}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>

              <button
                type="submit"
                style={{
                  background: "green",
                  color: "white",
                  padding: "5px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Save
              </button>
            </form>
          </Popup>
        )}
      </Map>

      {/* Floating Toolbar - Right Side */}
      <div className="absolute top-10 right-4 z-20 flex items-start space-x-3">
        {/* Legend Panel */}
        {showLegend && (
          <div className="bg-white rounded-lg shadow-md w-52 p-4 text-gray-800 animate-fadeIn">
            <h4 className="font-semibold mb-3 text-lg border-b pb-1">
              Map Legend
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <span>🛠️</span> <span>Pin</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>🚌</span> <span>Marker</span>
              </li>
            </ul>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden">
          {/* Legend Button */}
          <button
            onClick={() => setShowLegend((prev) => !prev)}
            className={`p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl ${
              showLegend ? "bg-blue-50 text-blue-600" : "text-gray-700"
            }`}
            title="Map Legend"
          >
            ℹ️
          </button>

          {/* Add Pin Mode */}
          {!isAddingPin ? (
            <button
              onClick={() => setIsAddingPin(true)}
              className={`p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl ${
                isAddingPin ? "bg-gray-300 text-gray-900" : "text-gray-700"
              }`}
              title="Add Pin"
            >
              📍
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsAddingPin(false)}
                className="p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl bg-red-50 text-red-600"
                title="Exit Pin Mode"
              >
                ❌
              </button>
              <button
                onClick={savePins}
                className="p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl bg-green-50 text-green-700"
                title="Save Pins"
              >
                💾
              </button>
            </>
          )}

          {/* Mask Edit Mode */}
          {!isMaskingMode ? (
            <button
              onClick={enableMaskEditing}
              className={`p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl ${
                isMaskingMode ? "bg-gray-300 text-gray-900" : "text-gray-700"
              }`}
              title="Enable Mask Editing"
            >
              🧲
            </button>
          ) : (
            <>
              <button
                onClick={exitMaskEditing}
                className="p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl bg-red text-red-600"
                title="Exit Mask Editing"
              >
                ❌
              </button>
              <button
                onClick={saveMask}
                className="p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl bg-green-50 text-green-700"
                title="Save Mask"
              >
                💾
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-10">
        Tour Map
      </div>
    </div>
  );
}
