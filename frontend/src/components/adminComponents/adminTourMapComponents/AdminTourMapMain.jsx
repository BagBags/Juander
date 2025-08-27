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

export default function AdminTourMapMain() {
  const [viewState, setViewState] = useState({
    latitude: 14.5896,
    longitude: 120.9747,
    zoom: 16,
  });
  const [pins, setPins] = useState([]);
  const [maskGeoJson, setMaskGeoJson] = useState(initialMaskFeature);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [isMaskingMode, setIsMaskingMode] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);

  const adminMapRef = useRef(null);
  const drawRef = useRef(null);

  /** ----------------- MASK EDITING ------------------ */
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
          paint: { "fill-color": "#ff6600", "fill-opacity": 0.5 },
        },
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          paint: { "line-color": "#ff0000", "line-width": 3 },
        },
        {
          id: "gl-draw-polygon-and-line-vertex-halo-active",
          type: "circle",
          paint: { "circle-radius": 7, "circle-color": "#fff" },
        },
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          paint: { "circle-radius": 5, "circle-color": "#ff0000" },
        },
      ],
    });

    drawRef.current = draw;
    map.addControl(draw, "top-left");

    const added = draw.add(maskGeoJson);
    const featureId =
      maskGeoJson.id || (Array.isArray(added) ? added[0] : added);

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
        setMaskGeoJson(data.features[0]);
        alert("Mask saved!");
      } else {
        alert("No mask found.");
      }
    }
    setIsMaskingMode(false);
  };

  /** ----------------- PINS ------------------ */
  const handleMapClick = (event) => {
    if (!isAddingPin) return;
    const { lng, lat } = event.lngLat;
    const newPin = {
      latitude: lat,
      longitude: lng,
      title: "",
      description: "",
      mediaUrl: "",
      mediaType: "image",
    };
    setPins((prev) => [...prev, newPin]);
    setSelectedPin(pins.length);
  };

  const updatePinField = (index, field, value) => {
    setPins((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleFormSubmit = (e, index) => {
    e.preventDefault();
    alert(`Pin #${index + 1} saved!`);
    setSelectedPin(null);
  };

  const savePins = () => {
    alert(`Saved ${pins.length} pin(s)!`);
    setIsAddingPin(false);
  };

  return (
    <div className="flex justify-center items-center p-6 bg-gray-100 min-h-screen">
      <div className="relative w-full max-w-6xl h-[80vh] bg-white rounded-2xl shadow-lg overflow-hidden">
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
                📍
              </div>
            </Marker>
          ))}
        </Map>

        {/* Card Panel for Pin */}
        {selectedPin !== null && pins[selectedPin] && (
          <div className="absolute top-10 left-10 w-[500px] bg-white rounded-xl shadow-2xl p-6 z-50">
            <h2 className="text-2xl font-semibold mb-6">Pin Details</h2>
            <form
              onSubmit={(e) => handleFormSubmit(e, selectedPin)}
              className="space-y-5"
            >
              {/* Site Name */}
              <div>
                <label className="block text-sm font-medium">Site Name</label>
                <input
                  type="text"
                  value={pins[selectedPin].siteName || ""}
                  onChange={(e) =>
                    updatePinField(selectedPin, "siteName", e.target.value)
                  }
                  className="w-full border rounded-lg p-3 mt-1"
                  placeholder="Enter site name"
                />
              </div>

              {/* Site Description */}
              <div>
                <label className="block text-sm font-medium">
                  Site Description
                </label>
                <textarea
                  value={pins[selectedPin].siteDescription || ""}
                  onChange={(e) =>
                    updatePinField(
                      selectedPin,
                      "siteDescription",
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 mt-1"
                  rows="3"
                  placeholder="Enter site description"
                />
              </div>

              {/* Media */}
              <div>
                <label className="block text-sm font-medium">Media</label>
                <input
                  type="text"
                  value={pins[selectedPin].mediaUrl || ""}
                  onChange={(e) =>
                    updatePinField(selectedPin, "mediaUrl", e.target.value)
                  }
                  className="w-full border rounded-lg p-3 mt-1"
                  placeholder="https://example.com/media.jpg"
                />
              </div>

              {/* Media Preview */}
              {pins[selectedPin].mediaUrl && (
                <div className="mt-3">
                  {pins[selectedPin].mediaType === "video" ? (
                    <video
                      src={pins[selectedPin].mediaUrl}
                      controls
                      className="w-full h-56 rounded-lg"
                    />
                  ) : (
                    <img
                      src={pins[selectedPin].mediaUrl}
                      alt="Preview"
                      className="w-full h-56 object-cover rounded-lg"
                    />
                  )}
                </div>
              )}

              {/* AR Link + Enable/Disable */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">AR Link</label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={pins[selectedPin].arEnabled || false}
                      onChange={(e) =>
                        updatePinField(
                          selectedPin,
                          "arEnabled",
                          e.target.checked
                        )
                      }
                    />
                    <span className="text-sm">
                      {pins[selectedPin].arEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                </div>

                <input
                  type="text"
                  value={pins[selectedPin].arLink || ""}
                  onChange={(e) =>
                    updatePinField(selectedPin, "arLink", e.target.value)
                  }
                  className="w-full border rounded-lg p-3 mt-1"
                  placeholder="https://example.com/ar-link"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This link will only be visible to tourists if enabled.
                </p>
              </div>

              {/* Site Status */}
              <div>
                <label className="block text-sm font-medium">Site Status</label>
                <select
                  value={pins[selectedPin].status || "active"}
                  onChange={(e) =>
                    updatePinField(selectedPin, "status", e.target.value)
                  }
                  className="w-full border rounded-lg p-3 mt-1"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => setSelectedPin(null)}
                  className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Floating Toolbar */}
        <div className="absolute top-6 right-6 z-[9999] flex items-start space-x-3">
          {showLegend && (
            <div className="bg-white rounded-lg shadow-md w-52 p-4 text-gray-800 animate-fadeIn">
              <h4 className="font-semibold mb-3 text-lg border-b pb-1">
                Map Legend
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <span>📍</span> <span>Pin</span>
                </li>
              </ul>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden relative z-[9999]">
            <button
              onClick={() => setShowLegend((prev) => !prev)}
              className={`p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl ${
                showLegend ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}
              title="Map Legend"
            >
              ℹ️
            </button>

            {!isAddingPin ? (
              <button
                onClick={() => setIsAddingPin(true)}
                className="p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl text-gray-700"
                title="Add Pin"
              >
                ➕
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

            {!isMaskingMode ? (
              <button
                onClick={enableMaskEditing}
                className="p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl text-gray-700"
                title="Enable Mask Editing"
              >
                🧲
              </button>
            ) : (
              <>
                <button
                  onClick={exitMaskEditing}
                  className="p-3 transition-colors duration-200 hover:bg-gray-100 w-full text-xl bg-red-50 text-red-600"
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

        <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-10">
          Tour Map
        </div>
      </div>
    </div>
  );
}
