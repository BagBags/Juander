// // AdminTourMapMain.jsx
// import React, { useState, useRef, useEffect } from "react";
// import Map, { Marker } from "react-map-gl";
// import "mapbox-gl/dist/mapbox-gl.css";
// import MapboxDraw from "@mapbox/mapbox-gl-draw";
// import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
// import axios from "axios";
// import {
//   MAPBOX_TOKEN,
//   INTRAMUROS_BOUNDS,
//   initialMaskFeature,
// } from "./mapConfig";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faCropSimple,
//   faPlus,
//   faInfo,
//   faXmark,
//   faFloppyDisk,
//   faMapPin,
//   faRotate,
// } from "@fortawesome/free-solid-svg-icons";
// import AdminPinCard from "../adminTourMapComponents/AdminPinCard";
// import AddPinModal from "../adminTourMapComponents/AddPinModal";
// import ManualAddModal from "../adminTourMapComponents/ManualAddModal";

// // ---------- Axios instance ----------
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE || "/api",
// });
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// // 3D Model Preview Component
// const ModelPreview = ({ glbUrl, onClose }) => {
//   const [rotation, setRotation] = useState(0);
//   const containerRef = useRef(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [startX, setStartX] = useState(0);

//   const handleMouseDown = (e) => {
//     setIsDragging(true);
//     setStartX(e.clientX);
//   };

//   const handleMouseMove = (e) => {
//     if (!isDragging) return;
//     const deltaX = e.clientX - startX;
//     setRotation((prev) => (prev + deltaX * 0.5) % 360);
//     setStartX(e.clientX);
//   };

//   const handleMouseUp = () => {
//     setIsDragging(false);
//   };

//   useEffect(() => {
//     const handleGlobalMouseUp = () => {
//       if (isDragging) setIsDragging(false);
//     };

//     window.addEventListener("mouseup", handleGlobalMouseUp);
//     return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
//   }, [isDragging]);

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
//       <div className="bg-white rounded-xl p-4 w-full max-w-2xl">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold">3D Model Preview</h3>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700"
//           >
//             <FontAwesomeIcon icon={faXmark} size="lg" />
//           </button>
//         </div>

//         <div
//           ref={containerRef}
//           className="w-full h-96 bg-gray-100 rounded-lg relative flex items-center justify-center"
//           onMouseDown={handleMouseDown}
//           onMouseMove={handleMouseMove}
//           onMouseUp={handleMouseUp}
//           onMouseLeave={handleMouseUp}
//           style={{ cursor: isDragging ? "grabbing" : "grab" }}
//         >
//           <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
//             <FontAwesomeIcon icon={faRotate} className="mr-2" />
//             Drag to rotate
//           </div>

//           <div className="text-center">
//             <div className="text-5xl mb-2">🧊</div>
//             <p className="text-gray-600">GLB Model Preview</p>
//             <p className="text-sm text-gray-500 mt-2">
//               Rotation: {Math.round(rotation)}°
//             </p>
//             <p className="text-sm text-gray-500 mt-1 break-all">{glbUrl}</p>
//           </div>
//         </div>

//         <div className="mt-4 flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function AdminTourMapMain() {
//   const [viewState, setViewState] = useState({
//     latitude: 40.5896,
//     longitude: 120.9747,
//     zoom: 4,
//     bearing: 45,
//   });

//   const [pins, setPins] = useState([]);
//   const [maskGeoJson, setMaskGeoJson] = useState(initialMaskFeature);

//   const [isAddingPin, setIsAddingPin] = useState(false);
//   const [isMaskingMode, setIsMaskingMode] = useState(false);
//   const [showLegend, setShowLegend] = useState(false);
//   const [selectedPin, setSelectedPin] = useState(null);
//   // For manual pin input
//   const [manualCoords, setManualCoords] = useState({ lat: "", lng: "" });

//   const [loading, setLoading] = useState(false);
//   const [notif, setNotif] = useState(null); // {type: "success"|"error"|"info", message: string}
//   const [showGlbPreview, setShowGlbPreview] = useState(false);
//   const [currentGlbUrl, setCurrentGlbUrl] = useState("");

//   const adminMapRef = useRef(null);
//   const drawRef = useRef(null);
//   const [showAddPinModal, setShowAddPinModal] = useState(false);
//   const [showManualAdd, setShowManualAdd] = useState(false);
//   // ---------- Helpers ----------
//   const notify = (type, message) => {
//     setNotif({ type, message });
//     setTimeout(() => setNotif(null), 2500);
//   };

//   // ---------- Load pins + mask on mount ----------
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const [pinsRes, maskRes] = await Promise.all([
//           api.get("/pins"),
//           api.get("/mask").catch(() => ({ data: null })), // allow no mask yet
//         ]);

//         // Expecting pins as array of documents
//         setPins(
//           Array.isArray(pinsRes.data)
//             ? pinsRes.data
//             : Array.isArray(pinsRes.data?.pins)
//             ? pinsRes.data.pins
//             : []
//         );

//         // Accept either a Feature or something like { geometry: {...} }
//         const maskData = maskRes?.data;
//         if (maskData) {
//           if (maskData.type === "Feature") {
//             setMaskGeoJson(maskData);
//           } else if (maskData.geometry) {
//             setMaskGeoJson({
//               type: "Feature",
//               properties: {},
//               geometry: maskData.geometry,
//             });
//           }
//         }
//         notify("success", "Map data loaded");
//       } catch (err) {
//         console.error(err);
//         notify("error", "Failed to load pins/mask");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   /** ----------------- MASK EDITING ------------------ */
//   const enableMaskEditing = () => {
//     const map = adminMapRef.current?.getMap?.();
//     if (!map) return;

//     if (drawRef.current) map.removeControl(drawRef.current);

//     const draw = new MapboxDraw({
//       displayControlsDefault: false,
//       controls: { polygon: false, trash: false },
//       styles: [
//         {
//           id: "gl-draw-polygon-fill",
//           type: "fill",
//           paint: { "fill-color": "#ff6600", "fill-opacity": 0.5 },
//         },
//         {
//           id: "gl-draw-polygon-stroke",
//           type: "line",
//           paint: { "line-color": "#ff0000", "line-width": 3 },
//         },
//         {
//           id: "gl-draw-polygon-and-line-vertex-halo-active",
//           type: "circle",
//           paint: { "circle-radius": 7, "circle-color": "#fff" },
//         },
//         {
//           id: "gl-draw-polygon-and-line-vertex-active",
//           type: "circle",
//           paint: { "circle-radius": 5, "circle-color": "#ff0000" },
//         },
//       ],
//     });

//     drawRef.current = draw;
//     map.addControl(draw, "top-left");

//     // Add current mask if exists
//     if (maskGeoJson?.geometry) {
//       const added = draw.add(maskGeoJson);
//       const featureId =
//         maskGeoJson.id || (Array.isArray(added) ? added[0] : added);
//       if (featureId) {
//         draw.changeMode("direct_select", { featureId });
//       }
//     }

//     setIsMaskingMode(true);
//   };

//   const exitMaskEditing = () => {
//     const map = adminMapRef.current?.getMap?.();
//     if (drawRef.current && map) {
//       map.removeControl(drawRef.current);
//       drawRef.current = null;
//     }
//     setIsMaskingMode(false);
//   };

//   const saveMask = async () => {
//     const map = adminMapRef.current?.getMap?.();
//     try {
//       let featureToSave = maskGeoJson;

//       if (drawRef.current && map) {
//         const data = drawRef.current.getAll();
//         if (data.features.length > 0) {
//           featureToSave = data.features[0];
//           setMaskGeoJson(featureToSave);
//         } else {
//           notify("error", "No mask found to save");
//           setIsMaskingMode(false);
//           return;
//         }
//       }

//       // Accept POSTing either the Feature or just geometry—mirrors our controller example
//       await api.post("/mask", {
//         geometry: featureToSave.geometry, // ✅ only send geometry
//       });

//       notify("success", "Mask saved");
//     } catch (err) {
//       console.error(err);
//       notify("error", "Failed to save mask");
//     } finally {
//       setIsMaskingMode(false);
//       // Clean up draw control
//       const map2 = adminMapRef.current?.getMap?.();
//       if (drawRef.current && map2) {
//         map2.removeControl(drawRef.current);
//         drawRef.current = null;
//       }
//     }
//   };

//   /** ----------------- PINS ------------------ */
//   const handleMapClick = (event) => {
//     if (!isAddingPin) return;
//     const { lng, lat } = event.lngLat;
//     const newPin = {
//       latitude: lat,
//       longitude: lng,
//       siteName: "",
//       siteDescription: "",
//       mediaUrl: "",
//       mediaType: "image",
//       arEnabled: false,
//       arLink: "",
//       status: "active",
//       // _id is absent => new pin
//     };
//     setPins((prev) => [...prev, newPin]);
//     setSelectedPin(pins.length);
//   };

//   const addPinFromCoords = () => {
//     const lat = parseFloat(manualCoords.lat);
//     const lng = parseFloat(manualCoords.lng);

//     if (isNaN(lat) || isNaN(lng)) {
//       notify("error", "Invalid latitude or longitude");
//       return;
//     }

//     const newPin = {
//       latitude: lat,
//       longitude: lng,
//       siteName: "",
//       siteDescription: "",
//       mediaUrl: "",
//       mediaType: "image",
//       arEnabled: false,
//       arLink: "",
//       status: "active",
//     };

//     setPins((prev) => [...prev, newPin]);
//     setSelectedPin(pins.length); // open form immediately
//     setManualCoords({ lat: "", lng: "" }); // reset
//   };

//   const updatePinField = (index, field, value) => {
//     setPins((prev) =>
//       prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
//     );
//   };

//   const handleFormSubmit = async (e, index) => {
//     e.preventDefault();
//     const pin = pins[index];
//     try {
//       let saved;
//       if (pin._id) {
//         // Update existing
//         const { _id, ...payload } = pin;
//         const res = await api.put(`/pins/${_id}`, payload);
//         saved = res.data;
//       } else {
//         // Create new
//         const res = await api.post("/pins", pin);
//         saved = res.data;
//       }

//       // Replace pin at index with the saved version (ensures we get _id)
//       setPins((prev) => prev.map((p, i) => (i === index ? saved : p)));

//       notify("success", `Pin #${index + 1} saved`);
//       setSelectedPin(null);
//       setIsAddingPin(false);
//     } catch (err) {
//       console.error(err);
//       notify("error", "Failed to save pin");
//     }
//   };

//   const handleDeletePin = async (id) => {
//     if (!id) return;

//     const confirmDelete = window.confirm(
//       "Are you sure you want to delete this pin?"
//     );
//     if (!confirmDelete) return;

//     try {
//       await api.delete(`/pins/${id}`); // ✅ use `api` instance
//       setPins((prev) => prev.filter((pin) => pin._id !== id));
//       setSelectedPin(null);
//       alert("Pin deleted successfully");
//     } catch (error) {
//       console.error("Error deleting pin:", error);
//       alert(
//         error.response?.data?.message || "Failed to delete pin. Unauthorized?"
//       );
//     }
//   };

//   // Handle GLB file upload
//   const handleGlbUpload = async (e, index) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("arModel", file);

//     try {
//       const res = await axios.post(
//         "http://localhost:5000/api/pins/upload-ar",
//         formData,
//         { headers: { "Content-Type": "multipart/form-data" } }
//       );

//       const uploadedUrl = res.data.url;

//       // Update the pin in state
//       setPins((prev) =>
//         prev.map((p, i) => (i === index ? { ...p, glbUrl: uploadedUrl } : p))
//       );

//       notify("success", "3D model uploaded successfully");
//     } catch (err) {
//       console.error("Upload error:", err.response?.data || err);
//       notify("error", err.response?.data?.message || "Upload failed");
//     }
//   };

//   // Preview 3D model
//   const previewGlb = (glbUrl) => {
//     setCurrentGlbUrl(glbUrl);
//     setShowGlbPreview(true);
//   };

//   // Facade image upload
//   const handleFacadeUpload = async (e, pinIndex) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("facade", file);

//     try {
//       const pinId = pins[pinIndex]._id;
//       const res = await api.post(`/pins/${pinId}/upload-facade`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       const updatedPins = [...pins];
//       updatedPins[pinIndex].facadeUrl = res.data.facadeUrl;
//       setPins(updatedPins);
//     } catch (err) {
//       console.error("❌ Facade upload failed:", err);
//     }
//   };

//   // Facade remove
//   const handleRemoveFacade = async (index) => {
//     const pin = pins[index];
//     if (!pin?._id) {
//       // just clear locally for unsaved pins
//       setPins((prev) => {
//         const updated = [...prev];
//         updated[index] = { ...updated[index], facadeUrl: "" };
//         return updated;
//       });
//       return;
//     }

//     try {
//       const res = await api.delete(`/pins/${pin._id}/remove-facade`);
//       setPins((prev) => {
//         const updated = [...prev];
//         updated[index] = { ...updated[index], facadeUrl: "" };
//         return updated;
//       });

//       notify("success", "Facade removed successfully");
//     } catch (err) {
//       console.error("❌ Error removing facade:", err);
//       notify("error", "Failed to remove facade");
//     }
//   };

//   // Optional: bulk-save any unsaved pins (if you keep the toolbar Save Pins)
//   const savePins = async () => {
//     try {
//       // Save only those without _id (new)
//       const newOnes = pins
//         .map((p, i) => ({ ...p, __idx: i }))
//         .filter((p) => !p._id);

//       const savedCopies = [...pins];
//       for (const p of newOnes) {
//         const { __idx, ...payload } = p;
//         const res = await api.post("/pins", payload);
//         savedCopies[__idx] = res.data;
//       }
//       setPins(savedCopies);

//       notify("success", `Saved ${newOnes.length} new pin(s)`);
//       setIsAddingPin(false);
//     } catch (err) {
//       console.error(err);
//       notify("error", "Failed to save pins");
//     }
//   };

//   return (
//     <div className="flex justify-center items-center p-6 bg-gray-100 min-h-screen">
//       <div className="relative w-full h-[90vh] bg-white rounded-2xl shadow-lg overflow-hidden">
//         {/* Loading/Notif */}
//         {loading && (
//           <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[10000] bg-white/90 border border-gray-200 px-3 py-1 rounded shadow">
//             Loading…
//           </div>
//         )}
//         {notif && (
//           <div
//             className={`absolute top-3 left-1/2 -translate-x-1/2 z-[10000] px-3 py-1 rounded shadow border ${
//               notif.type === "success"
//                 ? "bg-green-50 border-green-200 text-green-700"
//                 : notif.type === "error"
//                 ? "bg-red-50 border-red-200 text-red-700"
//                 : "bg-gray-50 border-gray-200 text-gray-700"
//             }`}
//           >
//             {notif.message}
//           </div>
//         )}

//         {/* 3D Model Preview Modal */}
//         {showGlbPreview && (
//           <ModelPreview
//             glbUrl={currentGlbUrl}
//             onClose={() => setShowGlbPreview(false)}
//           />
//         )}

//         {/* Pin Mode Indicator - Always visible when active, not inside modal */}
//         {isAddingPin && (
//           <>
//             {/* Top card: Pin mode active */}
//             <div className="absolute top-3 left-3 z-[10000] bg-blue-100 border border-blue-300 px-3 py-2 rounded-lg shadow-md">
//               <div className="flex items-center">
//                 <FontAwesomeIcon
//                   icon={faMapPin}
//                   className="text-blue-600 mr-2"
//                 />
//                 <span className="text-blue-700 font-medium">
//                   Pin mode active
//                 </span>
//                 <button
//                   onClick={() => setIsAddingPin(false)}
//                   className="ml-3 text-blue-700 hover:text-blue-900"
//                   title="Exit Pin Mode"
//                 >
//                   <FontAwesomeIcon icon={faXmark} />
//                 </button>
//               </div>
//             </div>

//             {/* Bottom card: hint */}
//             <div className="absolute top-16 left-3 z-[10000] bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-md">
//               <p className="text-sm text-gray-700">Tap the map to add a pin</p>
//             </div>
//           </>
//         )}

//         {/* Map */}
//         <Map
//           ref={adminMapRef}
//           initialViewState={{ ...viewState, minZoom: 15.5 }}
//           maxBounds={INTRAMUROS_BOUNDS}
//           mapboxAccessToken={MAPBOX_TOKEN}
//           onMove={(evt) => setViewState(evt.viewState)}
//           onClick={handleMapClick}
//           mapStyle="mapbox://styles/mapbox/streets-v11"
//           style={{ width: "100%", height: "100%" }}
//         >
//           {pins.map((pin, index) => (
//             <Marker
//               key={pin._id || `pin-${index}`}
//               latitude={pin.latitude}
//               longitude={pin.longitude}
//               anchor="bottom"
//             >
//               <div
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setSelectedPin(index);
//                 }}
//                 style={{ fontSize: "24px", cursor: "pointer" }}
//                 title={pin.siteName || `Pin #${index + 1}`}
//               >
//                 📍
//               </div>
//             </Marker>
//           ))}
//         </Map>

//         {selectedPin !== null && pins[selectedPin] && (
//           <AdminPinCard
//             pin={pins[selectedPin]}
//             selectedPinIndex={selectedPin}
//             updatePinField={updatePinField}
//             handleFormSubmit={handleFormSubmit}
//             handleDeletePin={handleDeletePin}
//             handleGlbUpload={handleGlbUpload}
//             previewGlb={previewGlb}
//             handleFacadeUpload={handleFacadeUpload}
//             handleRemoveFacade={handleRemoveFacade}
//             onClose={() => setSelectedPin(null)}
//           />
//         )}

//         {showAddPinModal && (
//           <AddPinModal
//             isAddingPin={isAddingPin}
//             setIsAddingPin={setIsAddingPin}
//             setShowManualAdd={setShowManualAdd}
//             setShowAddPinModal={setShowAddPinModal}
//           />
//         )}

//         {showManualAdd && (
//           <ManualAddModal
//             manualCoords={manualCoords}
//             setManualCoords={setManualCoords}
//             addPinFromCoords={addPinFromCoords}
//             setShowManualAdd={setShowManualAdd}
//             setShowAddPinModal={setShowAddPinModal}
//           />
//         )}

//         {/* Floating Toolbar */}
//         <div className="absolute top-6 right-6 z-[9999] flex items-end space-x-3">
//           {/* Map Legend Panel */}
//           {showLegend && (
//             <div className="absolute right-full mr-3 top-0 bg-white rounded-lg shadow-md w-52 p-4 text-gray-800 animate-fadeIn">
//               <h4 className="font-semibold mb-3 text-lg border-b pb-1">
//                 Map Legend
//               </h4>
//               <ul className="space-y-2 text-sm">
//                 <li className="flex items-center space-x-2">
//                   <span>📍</span> <span>Pin</span>
//                 </li>
//               </ul>
//             </div>
//           )}

//           {/* Toolbar + Save Mask */}
//           <div className="flex flex-col items-end space-y-2">
//             {/* Toolbar Core */}
//             <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden relative z-[9999]">
//               {/* Legend Toggle */}
//               <button
//                 onClick={() => setShowLegend((prev) => !prev)}
//                 title="Map Legend"
//                 className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
//                   showLegend ? "bg-blue-50 text-blue-600" : "text-gray-700"
//                 }`}
//               >
//                 <FontAwesomeIcon icon={faInfo} />
//               </button>

//               {/* Pin Mode Toggle - Now opens modal */}
//               <button
//                 onClick={() => setShowAddPinModal(true)}
//                 title="Add Pin"
//                 className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
//                   isAddingPin ? "bg-blue-50 text-blue-600" : "text-gray-700"
//                 }`}
//               >
//                 <FontAwesomeIcon icon={isAddingPin ? faMapPin : faPlus} />
//               </button>

//               {/* Mask Mode Toggle */}
//               <button
//                 onClick={isMaskingMode ? exitMaskEditing : enableMaskEditing}
//                 title={
//                   isMaskingMode ? "Exit Mask Editing" : "Enable Mask Editing"
//                 }
//                 className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
//                   isMaskingMode ? "bg-red-50 text-red-600" : "text-gray-700"
//                 }`}
//               >
//                 <FontAwesomeIcon
//                   icon={isMaskingMode ? faXmark : faCropSimple}
//                 />
//               </button>
//             </div>

//             {/* Save Mask Button */}
//             {isMaskingMode && (
//               <div className="bg-white rounded-lg shadow-md overflow-hidden relative z-[9999] w-full">
//                 <button
//                   onClick={saveMask}
//                   title="Save Mask"
//                   className="p-3 w-full text-xl transition-colors hover:bg-gray-100 bg-green-50 text-green-700"
//                 >
//                   <FontAwesomeIcon icon={faFloppyDisk} />
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-10">
//           Tour Map
//         </div>
//       </div>
//     </div>
//   );
// }
