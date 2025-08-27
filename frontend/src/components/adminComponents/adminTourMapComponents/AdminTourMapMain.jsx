// AdminTourMapMain.jsx
import React, { useState, useRef, useEffect } from "react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import axios from "axios";
import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  initialMaskFeature,
} from "./mapConfig";

// ---------- Axios instance ----------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState(null); // {type: "success"|"error"|"info", message: string}

  const adminMapRef = useRef(null);
  const drawRef = useRef(null);

  // ---------- Helpers ----------
  const notify = (type, message) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 2500);
  };

  // ---------- Load pins + mask on mount ----------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pinsRes, maskRes] = await Promise.all([
          api.get("/pins"),
          api.get("/mask").catch(() => ({ data: null })), // allow no mask yet
        ]);

        // Expecting pins as array of documents
        setPins(
          Array.isArray(pinsRes.data)
            ? pinsRes.data
            : Array.isArray(pinsRes.data?.pins)
            ? pinsRes.data.pins
            : []
        );

        // Accept either a Feature or something like { geometry: {...} }
        const maskData = maskRes?.data;
        if (maskData) {
          if (maskData.type === "Feature") {
            setMaskGeoJson(maskData);
          } else if (maskData.geometry) {
            setMaskGeoJson({
              type: "Feature",
              properties: {},
              geometry: maskData.geometry,
            });
          }
        }
        notify("success", "Map data loaded");
      } catch (err) {
        console.error(err);
        notify("error", "Failed to load pins/mask");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /** ----------------- MASK EDITING ------------------ */
  const enableMaskEditing = () => {
    const map = adminMapRef.current?.getMap?.();
    if (!map) return;

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

    // Add current mask if exists
    if (maskGeoJson?.geometry) {
      const added = draw.add(maskGeoJson);
      const featureId =
        maskGeoJson.id || (Array.isArray(added) ? added[0] : added);
      if (featureId) {
        draw.changeMode("direct_select", { featureId });
      }
    }

    setIsMaskingMode(true);
  };

  const exitMaskEditing = () => {
    const map = adminMapRef.current?.getMap?.();
    if (drawRef.current && map) {
      map.removeControl(drawRef.current);
      drawRef.current = null;
    }
    setIsMaskingMode(false);
  };

  const saveMask = async () => {
    const map = adminMapRef.current?.getMap?.();
    try {
      let featureToSave = maskGeoJson;

      if (drawRef.current && map) {
        const data = drawRef.current.getAll();
        if (data.features.length > 0) {
          featureToSave = data.features[0];
          setMaskGeoJson(featureToSave);
        } else {
          notify("error", "No mask found to save");
          setIsMaskingMode(false);
          return;
        }
      }

      // Accept POSTing either the Feature or just geometry—mirrors our controller example
      await api.post("/mask", {
        // If your backend expects { geometry }, send only geometry
        // geometry: featureToSave.geometry,
        // If it accepts a full GeoJSON Feature:
        ...featureToSave,
      });

      notify("success", "Mask saved");
    } catch (err) {
      console.error(err);
      notify("error", "Failed to save mask");
    } finally {
      setIsMaskingMode(false);
      // Clean up draw control
      const map2 = adminMapRef.current?.getMap?.();
      if (drawRef.current && map2) {
        map2.removeControl(drawRef.current);
        drawRef.current = null;
      }
    }
  };

  /** ----------------- PINS ------------------ */
  const handleMapClick = (event) => {
    if (!isAddingPin) return;
    const { lng, lat } = event.lngLat;
    const newPin = {
      latitude: lat,
      longitude: lng,
      siteName: "",
      siteDescription: "",
      mediaUrl: "",
      mediaType: "image",
      arEnabled: false,
      arLink: "",
      status: "active",
      // _id is absent => new pin
    };
    setPins((prev) => [...prev, newPin]);
    setSelectedPin(pins.length);
  };

  const updatePinField = (index, field, value) => {
    setPins((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleFormSubmit = async (e, index) => {
    e.preventDefault();
    const pin = pins[index];
    try {
      let saved;
      if (pin._id) {
        // Update existing
        const { _id, ...payload } = pin;
        const res = await api.put(`/pins/${_id}`, payload);
        saved = res.data;
      } else {
        // Create new
        const res = await api.post("/pins", pin);
        saved = res.data;
      }

      // Replace pin at index with the saved version (ensures we get _id)
      setPins((prev) => prev.map((p, i) => (i === index ? saved : p)));

      notify("success", `Pin #${index + 1} saved`);
      setSelectedPin(null);
      setIsAddingPin(false);
    } catch (err) {
      console.error(err);
      notify("error", "Failed to save pin");
    }
  };

  const handleDeletePin = async (id) => {
    if (!id) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this pin?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/pins/${id}`);
      setPins((prev) => prev.filter((pin) => pin._id !== id)); // update local state
      setSelectedPin(null); // close panel after delete
      alert("Pin deleted successfully");
    } catch (error) {
      console.error("Error deleting pin:", error);
      alert("Failed to delete pin");
    }
  };

  // Optional: bulk-save any unsaved pins (if you keep the toolbar Save Pins)
  const savePins = async () => {
    try {
      // Save only those without _id (new)
      const newOnes = pins
        .map((p, i) => ({ ...p, __idx: i }))
        .filter((p) => !p._id);

      const savedCopies = [...pins];
      for (const p of newOnes) {
        const { __idx, ...payload } = p;
        const res = await api.post("/pins", payload);
        savedCopies[__idx] = res.data;
      }
      setPins(savedCopies);

      notify("success", `Saved ${newOnes.length} new pin(s)`);
      setIsAddingPin(false);
    } catch (err) {
      console.error(err);
      notify("error", "Failed to save pins");
    }
  };

  return (
    <div className="flex justify-center items-center p-6 bg-gray-100 min-h-screen">
      <div className="relative w-full max-w-6xl h-[80vh] bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Loading/Notif */}
        {loading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[10000] bg-white/90 border border-gray-200 px-3 py-1 rounded shadow">
            Loading…
          </div>
        )}
        {notif && (
          <div
            className={`absolute top-3 left-1/2 -translate-x-1/2 z-[10000] px-3 py-1 rounded shadow border ${
              notif.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : notif.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-gray-50 border-gray-200 text-gray-700"
            }`}
          >
            {notif.message}
          </div>
        )}

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
              key={pin._id || `pin-${index}`}
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
                title={pin.siteName || `Pin #${index + 1}`}
              >
                📍
              </div>
            </Marker>
          ))}
        </Map>

        {/* Card Panel for Pin */}
        {selectedPin !== null && pins[selectedPin] && (
          <div className="absolute top-6 left-6 w-[360px] max-h-[85vh] bg-white rounded-xl shadow-xl flex flex-col z-40">
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b rounded-t-xl bg-gray-50">
              <h2 className="text-base font-semibold">Pin Details</h2>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Scrollable form */}
            <form
              onSubmit={(e) => handleFormSubmit(e, selectedPin)}
              className="flex-1 overflow-y-auto p-4 space-y-4"
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
                  className="w-full border rounded-lg p-2 mt-1 text-sm"
                  placeholder="Enter site name"
                  required
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
                  className="w-full border rounded-lg p-2 mt-1 text-sm"
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
                  className="w-full border rounded-lg p-2 mt-1 text-sm"
                  placeholder="https://example.com/media.jpg"
                />
                <div className="mt-2 flex items-center space-x-2">
                  <label className="text-sm">Type:</label>
                  <select
                    className="border rounded p-1 text-sm"
                    value={pins[selectedPin].mediaType || "image"}
                    onChange={(e) =>
                      updatePinField(
                        selectedPin,
                        "mediaType",
                        e.target.value || "image"
                      )
                    }
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>

              {/* Media Preview */}
              {pins[selectedPin].mediaUrl && (
                <div className="mt-3">
                  {pins[selectedPin].mediaType === "video" ? (
                    <video
                      src={pins[selectedPin].mediaUrl}
                      controls
                      className="w-full h-40 rounded-lg"
                    />
                  ) : (
                    <img
                      src={pins[selectedPin].mediaUrl}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )}
                </div>
              )}

              {/* AR Link */}
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
                  className="w-full border rounded-lg p-2 mt-1 text-sm"
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
                  className="w-full border rounded-lg p-2 mt-1 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {/* Footer buttons */}
              <div className="p-3 flex justify-between bg-gray-50 rounded-b-xl">
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeletePin(pins[selectedPin]._id)}
                  className="px-10 py-3 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                <div className="flex gap-2">
                  {/* Save Button */}
                  <button
                    type="submit"
                    className="px-10 py-3 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Save
                  </button>
                </div>
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
