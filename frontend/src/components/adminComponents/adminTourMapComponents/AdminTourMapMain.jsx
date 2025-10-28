// AdminTourMapMain.jsx
import React, { useState, useRef, useEffect, Suspense } from "react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import {
  MAPBOX_TOKEN,
  INTRAMUROS_BOUNDS,
  initialMaskFeature,
} from "./mapConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCropSimple,
  faPlus,
  faInfo,
  faXmark,
  faFloppyDisk,
  faMapPin,
  faLock,
  faHandPaper,
} from "@fortawesome/free-solid-svg-icons";

// ---------- Lazy-loaded components ----------
const AdminPinCard = React.lazy(() =>
  import("../adminTourMapComponents/AdminPinCard")
);
const AddPinModal = React.lazy(() =>
  import("../adminTourMapComponents/AddPinModal")
);
const ManualAddModal = React.lazy(() =>
  import("../adminTourMapComponents/ManualAddModal")
);
const ThreeDModelPreview = React.lazy(() =>
  import("../adminTourMapComponents/ThreeDModelPreview")
);

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
    latitude: 40.5896,
    longitude: 120.9747,
    zoom: 4,
    bearing: 45,
  });

  const [pins, setPins] = useState([]);
  const [maskGeoJson, setMaskGeoJson] = useState(initialMaskFeature);
  const [originalPinData, setOriginalPinData] = useState(null); // Store original pin data

  const [isAddingPin, setIsAddingPin] = useState(false);
  const [isMaskingMode, setIsMaskingMode] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [manualCoords, setManualCoords] = useState({ lat: "", lng: "" });
  const [draggablePinIndex, setDraggablePinIndex] = useState(null);

  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState(null);

  const [showGlbPreview, setShowGlbPreview] = useState(false);
  const [currentGlbUrl, setCurrentGlbUrl] = useState("");

  const adminMapRef = useRef(null);
  const drawRef = useRef(null);
  const [showAddPinModal, setShowAddPinModal] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);

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
          api.get("/mask").catch(() => ({ data: null })),
        ]);

        setPins(
          Array.isArray(pinsRes.data)
            ? pinsRes.data
            : Array.isArray(pinsRes.data?.pins)
            ? pinsRes.data.pins
            : []
        );

        const maskData = maskRes?.data;
        if (maskData) {
          if (maskData.type === "Feature") setMaskGeoJson(maskData);
          else if (maskData.geometry)
            setMaskGeoJson({
              type: "Feature",
              properties: {},
              geometry: maskData.geometry,
            });
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

  // ---------- Mask Editing ----------
  const enableMaskEditing = async () => {
    const map = adminMapRef.current?.getMap?.();
    if (!map) return;

    if (!drawRef.current) {
      const { default: MapboxDraw } = await import("@mapbox/mapbox-gl-draw");
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

      if (maskGeoJson?.geometry) {
        const added = draw.add(maskGeoJson);
        const featureId =
          maskGeoJson.id || (Array.isArray(added) ? added[0] : added);
        if (featureId) draw.changeMode("direct_select", { featureId });
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

      await api.post("/mask", { geometry: featureToSave.geometry });
      notify("success", "Mask saved");
    } catch (err) {
      console.error(err);
      notify("error", "Failed to save mask");
    } finally {
      exitMaskEditing();
    }
  };

  // ---------- Pin handling ----------
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
    };
    setPins((prev) => [...prev, newPin]);
    openPinCard(pins.length);
  };

  const addPinFromCoords = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    if (isNaN(lat) || isNaN(lng))
      return notify("error", "Invalid latitude or longitude");
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
    };
    setPins((prev) => [...prev, newPin]);
    openPinCard(pins.length);
    setManualCoords({ lat: "", lng: "" });
  };

  const updatePinField = (index, field, value) =>
    setPins((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );

  // Open pin card and save original data
  const openPinCard = (index) => {
    setSelectedPin(index);
    setOriginalPinData({ ...pins[index] }); // Deep copy of original pin data
  };

  // Close pin card and revert changes if not saved
  const closePinCard = () => {
    if (originalPinData && selectedPin !== null) {
      // Revert to original data
      setPins((prev) =>
        prev.map((p, i) => (i === selectedPin ? originalPinData : p))
      );
    }
    setSelectedPin(null);
    setOriginalPinData(null);
    setIsAddingPin(false);
  };

  const handleFormSubmit = async (e, index) => {
    e.preventDefault();
    const pin = pins[index];
    try {
      let saved;
      if (pin._id) {
        const { _id, ...payload } = pin;
        const res = await api.put(`/pins/${_id}`, payload);
        saved = res.data;
      } else {
        const res = await api.post("/pins", pin);
        saved = res.data;
      }
      setPins((prev) => prev.map((p, i) => (i === index ? saved : p)));
      notify("success", `Pin #${index + 1} saved`);
      setSelectedPin(null);
      setOriginalPinData(null); // Clear original data after successful save
      setIsAddingPin(false);
    } catch (err) {
      console.error(err);
      notify("error", "Failed to save pin");
    }
  };

  const handleDeletePin = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this pin?")) return;
    try {
      await api.delete(`/pins/${id}`);
      setPins((prev) => prev.filter((pin) => pin._id !== id));
      setSelectedPin(null);
      notify("success", "Pin deleted successfully");
    } catch (err) {
      console.error(err);
      notify("error", "Failed to delete pin");
    }
  };

  const handleGlbUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("arModel", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/pins/upload-ar",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const uploadedUrl = res.data.url;
      setPins((prev) =>
        prev.map((p, i) => (i === index ? { ...p, glbUrl: uploadedUrl } : p))
      );
      notify("success", "3D model uploaded (click Save Changes to apply)");
    } catch (err) {
      console.error(err);
      notify("error", err.response?.data?.message || "Upload failed");
    }
  };

  const previewGlb = (glbUrl) => {
    setCurrentGlbUrl(glbUrl);
    setShowGlbPreview(true);
  };

  const handleFacadeUpload = async (e, pinIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("facade", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/pins/upload-facade-temp",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const uploadedUrl = res.data.url;
      setPins((prev) =>
        prev.map((p, i) => (i === pinIndex ? { ...p, facadeUrl: uploadedUrl } : p))
      );
      notify("success", "Facade image uploaded (click Save Changes to apply)");
    } catch (err) {
      console.error(err);
      notify("error", "Facade upload failed");
    }
  };

  const handleRemoveFacade = (index) => {
    setPins((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], facadeUrl: "" };
      return updated;
    });
    notify("success", "Facade removed (click Save Changes to apply)");
  };

  const handleRemoveGlb = (index) => {
    setPins((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], glbUrl: "" };
      return updated;
    });
    notify("success", "3D model removed (click Save Changes to apply)");
  };

  const handleMediaUpload = async (e, index) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validate file sizes (50MB limit per file)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(", ");
      notify("error", `File(s) too large: ${fileNames}. Maximum size is 50MB per file.`);
      return;
    }
    
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("mediaFiles", file);
    });

    try {
      notify("info", "Uploading files...");
      const res = await axios.post(
        "http://localhost:5000/api/pins/upload-media",
        formData,
        { 
          headers: { "Content-Type": "multipart/form-data" },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      const uploadedFiles = res.data.files;
      
      setPins((prev) =>
        prev.map((p, i) => {
          if (i === index) {
            const existingFiles = p.mediaFiles || [];
            return { ...p, mediaFiles: [...existingFiles, ...uploadedFiles] };
          }
          return p;
        })
      );
      notify("success", `${uploadedFiles.length} file(s) uploaded (click Save Changes to apply)`);
    } catch (err) {
      console.error(err);
      notify("error", err.response?.data?.message || "Media upload failed");
    }
  };

  const handleRemoveMedia = (pinIndex, mediaIndex) => {
    setPins((prev) => {
      const updated = [...prev];
      const mediaFiles = [...(updated[pinIndex].mediaFiles || [])];
      mediaFiles.splice(mediaIndex, 1);
      updated[pinIndex] = { ...updated[pinIndex], mediaFiles };
      return updated;
    });
    notify("success", "Media removed (click Save Changes to apply)");
  };

  return (
    <div className="flex justify-center items-center p-6 bg-gray-100 min-h-screen">
      <div className="relative w-full h-[90vh] bg-white rounded-2xl shadow-lg overflow-hidden">
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
        {/* 3D Model Preview */}
        {showGlbPreview && (
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
                Loading 3D preview…
              </div>
            }
          >
            <ThreeDModelPreview url={currentGlbUrl} />
          </Suspense>
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
              draggable={draggablePinIndex === index}
              onDragEnd={async (event) => {
                const { lng, lat } = event.lngLat;

                // Update local state immediately
                updatePinField(index, "latitude", lat);
                updatePinField(index, "longitude", lng);

                // Update database if pin exists
                if (pin._id) {
                  try {
                    await api.put(`/pins/${pin._id}`, {
                      ...pin,
                      latitude: lat,
                      longitude: lng,
                    });
                    notify("success", "Pin position updated");
                  } catch (err) {
                    console.error(err);
                    notify("error", "Failed to update pin position");
                  }
                }
              }}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openPinCard(index);
                }}
                className={`absolute top-1/2 left-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md`}
                style={{
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  backgroundColor:
                    pin.status === "inactive" ? "#3b82f6" : "#dc2626", // blue if inactive, red if active
                }}
                title={pin.siteName || `Pin #${index + 1}`}
              ></div>
            </Marker>
          ))}
        </Map>

        {/* Pin Card - Hidden when moving pin */}
        {selectedPin !== null && pins[selectedPin] && draggablePinIndex !== selectedPin && (
          <Suspense
            fallback={
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                Loading pin card…
              </div>
            }
          >
            <AdminPinCard
              pin={pins[selectedPin]}
              selectedPinIndex={selectedPin}
              updatePinField={updatePinField}
              handleFormSubmit={handleFormSubmit}
              handleDeletePin={handleDeletePin}
              handleGlbUpload={handleGlbUpload}
              previewGlb={previewGlb}
              handleRemoveGlb={handleRemoveGlb}
              handleFacadeUpload={handleFacadeUpload}
              handleRemoveFacade={handleRemoveFacade}
              handleMediaUpload={handleMediaUpload}
              handleRemoveMedia={handleRemoveMedia}
              onClose={closePinCard}
            />
          </Suspense>
        )}

        {/* Add Pin Modal */}
        {showAddPinModal && (
          <Suspense
            fallback={
              <div className="fixed inset-0 flex items-center justify-center z-50">
                Loading…
              </div>
            }
          >
            <AddPinModal
              isAddingPin={isAddingPin}
              setIsAddingPin={setIsAddingPin}
              setShowManualAdd={setShowManualAdd}
              setShowAddPinModal={setShowAddPinModal}
            />
          </Suspense>
        )}

        {/* Manual Add Modal */}
        {showManualAdd && (
          <Suspense
            fallback={
              <div className="fixed inset-0 flex items-center justify-center z-50">
                Loading…
              </div>
            }
          >
            <ManualAddModal
              manualCoords={manualCoords}
              setManualCoords={setManualCoords}
              addPinFromCoords={addPinFromCoords}
              setShowManualAdd={setShowManualAdd}
              setShowAddPinModal={setShowAddPinModal}
            />
          </Suspense>
        )}

        {/* Toolbar */}
        <div className="absolute top-6 right-6 z-[9999] flex items-end space-x-3">
          {showLegend && (
            <div className="absolute right-full mr-3 top-0 bg-white rounded-lg shadow-md w-52 p-4 text-gray-800 animate-fadeIn">
              <h4 className="font-semibold mb-3 text-lg border-b pb-1">
                Map Legend
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-red-600 border border-white shadow-sm"></span>
                  <span>Active Site</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600 border border-white shadow-sm"></span>
                  <span>Disabled Site</span>
                </li>
              </ul>
            </div>
          )}

          <div className="flex flex-col items-end space-y-2">
            <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden relative z-[9999]">
              <button
                onClick={() => setShowLegend((prev) => !prev)}
                title="Map Legend"
                className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
                  showLegend ? "bg-blue-50 text-blue-600" : "text-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={faInfo} />
              </button>
              <button
                onClick={() => setShowAddPinModal(true)}
                title="Add Pin"
                className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
                  isAddingPin ? "bg-blue-50 text-blue-600" : "text-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={isAddingPin ? faMapPin : faPlus} />
              </button>
              <button
                onClick={isMaskingMode ? exitMaskEditing : enableMaskEditing}
                title={
                  isMaskingMode ? "Exit Mask Editing" : "Enable Mask Editing"
                }
                className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
                  isMaskingMode ? "bg-red-50 text-red-600" : "text-gray-700"
                }`}
              >
                <FontAwesomeIcon
                  icon={isMaskingMode ? faXmark : faCropSimple}
                />
              </button>
            </div>

            {isMaskingMode && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden relative z-[9999] w-full">
                <button
                  onClick={saveMask}
                  title="Save Mask"
                  className="p-3 w-full text-xl transition-colors hover:bg-gray-100 bg-green-50 text-green-700"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} />
                </button>
              </div>
            )}

            {/* Move / Lock Pin */}
            {selectedPin !== null && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden relative z-[9999] w-full">
                <button
                  onClick={() =>
                    setDraggablePinIndex(
                      draggablePinIndex === selectedPin ? null : selectedPin
                    )
                  }
                  title={
                    draggablePinIndex === selectedPin ? "Lock Pin" : "Move Pin"
                  }
                  className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
                    draggablePinIndex === selectedPin
                      ? "bg-yellow-50 text-yellow-600"
                      : "text-gray-700"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={
                      draggablePinIndex === selectedPin ? faLock : faHandPaper
                    }
                  />
                </button>
              </div>
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
