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
//   faCheck,
//   faTrash,
// } from "@fortawesome/free-solid-svg-icons";

// // ---------- Axios instance ----------
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE || "/api",
// });
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

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

//   const adminMapRef = useRef(null);
//   const drawRef = useRef(null);

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
//       await axios.delete(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/pins/${id}`);
//       setPins((prev) => prev.filter((pin) => pin._id !== id)); // update local state
//       setSelectedPin(null); // close panel after delete
//       alert("Pin deleted successfully");
//     } catch (error) {
//       console.error("Error deleting pin:", error);
//       alert("Failed to delete pin");
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

//         {/* Card Panel for Pin */}
//         {selectedPin !== null && pins[selectedPin] && (
//           <div className="absolute top-6 left-6 w-[380px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col z-40 border border-gray-100 animate-fade-in">
//             {/* Header */}
//             <div className="flex justify-between items-center p-4 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-blue-50 to-indigo-50">
//               <h2 className="text-lg font-semibold text-gray-800">
//                 Pin Details
//               </h2>
//               <button
//                 onClick={() => setSelectedPin(null)}
//                 className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-5 w-5"
//                   viewBox="0 0 20 20"
//                   fill="currentColor"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//               </button>
//             </div>

//             {/* Scrollable form */}
//             <form
//               onSubmit={(e) => handleFormSubmit(e, selectedPin)}
//               className="flex-1 overflow-y-auto p-5 space-y-5"
//             >
//               {/* Site Name */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Site Name
//                 </label>
//                 <input
//                   type="text"
//                   value={pins[selectedPin].siteName || ""}
//                   onChange={(e) =>
//                     updatePinField(selectedPin, "siteName", e.target.value)
//                   }
//                   className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Enter site name"
//                   required
//                 />
//               </div>

//               {/* Site Description */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Site Description
//                 </label>
//                 <textarea
//                   value={pins[selectedPin].siteDescription || ""}
//                   onChange={(e) =>
//                     updatePinField(
//                       selectedPin,
//                       "siteDescription",
//                       e.target.value
//                     )
//                   }
//                   className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   rows="3"
//                   placeholder="Enter site description"
//                 />
//               </div>

//               {/* Media */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Media URL
//                 </label>
//                 <input
//                   type="text"
//                   value={pins[selectedPin].mediaUrl || ""}
//                   onChange={(e) =>
//                     updatePinField(selectedPin, "mediaUrl", e.target.value)
//                   }
//                   className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   placeholder="https://example.com/media.jpg"
//                 />
//                 <div className="mt-3 flex items-center space-x-2">
//                   <label className="text-sm text-gray-600">Media Type:</label>
//                   <select
//                     className="border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                     value={pins[selectedPin].mediaType || "image"}
//                     onChange={(e) =>
//                       updatePinField(
//                         selectedPin,
//                         "mediaType",
//                         e.target.value || "image"
//                       )
//                     }
//                   >
//                     <option value="image">Image</option>
//                     <option value="video">Video</option>
//                   </select>
//                 </div>
//               </div>

//               {/* Media Preview */}
//               {pins[selectedPin].mediaUrl && (
//                 <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
//                   {pins[selectedPin].mediaType === "video" ? (
//                     <video
//                       src={pins[selectedPin].mediaUrl}
//                       controls
//                       className="w-full h-48 object-cover"
//                     />
//                   ) : (
//                     <img
//                       src={pins[selectedPin].mediaUrl}
//                       alt="Preview"
//                       className="w-full h-48 object-cover"
//                     />
//                   )}
//                 </div>
//               )}

//               {/* AR Link */}
//               <div>
//                 <div className="flex items-center justify-between mb-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     AR Experience
//                   </label>
//                   <label className="flex items-center space-x-2 cursor-pointer">
//                     <div className="relative inline-flex items-center cursor-pointer">
//                       <input
//                         type="checkbox"
//                         className="sr-only peer"
//                         checked={pins[selectedPin].arEnabled || false}
//                         onChange={(e) =>
//                           updatePinField(
//                             selectedPin,
//                             "arEnabled",
//                             e.target.checked
//                           )
//                         }
//                       />
//                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                     </div>
//                     <span className="text-sm text-gray-600">
//                       {pins[selectedPin].arEnabled ? "Enabled" : "Disabled"}
//                     </span>
//                   </label>
//                 </div>

//                 <input
//                   type="text"
//                   value={pins[selectedPin].arLink || ""}
//                   onChange={(e) =>
//                     updatePinField(selectedPin, "arLink", e.target.value)
//                   }
//                   className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   placeholder="https://example.com/ar-link"
//                 />
//                 <p className="text-xs text-gray-500 mt-2">
//                   This link will only be visible to tourists if enabled.
//                 </p>
//               </div>

//               {/* Site Status */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Site Status
//                 </label>
//                 <select
//                   value={pins[selectedPin].status || "active"}
//                   onChange={(e) =>
//                     updatePinField(selectedPin, "status", e.target.value)
//                   }
//                   className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                 >
//                   <option value="active">Active</option>
//                   <option value="inactive">Inactive</option>
//                 </select>
//               </div>

//               {/* Footer buttons */}
//               <div className="pt-4 flex justify-between">
//                 {/* Delete Button */}
//                 <button
//                   type="button"
//                   onClick={() => handleDeletePin(pins[selectedPin]._id)}
//                   className="px-5 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors duration-200 flex items-center shadow-sm hover:shadow-md"
//                 >
//                   <FontAwesomeIcon icon={faTrash} />
//                   Delete
//                 </button>

//                 {/* Save Button */}
//                 <button
//                   type="submit"
//                   className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
//                 >
//                   <FontAwesomeIcon icon={faCheck} />
//                   Save Changes
//                 </button>
//               </div>
//             </form>
//           </div>
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

//           {/* Manual Pin Input */}
//           <div className="bg-white rounded-lg shadow-md p-3 w-60 space-y-2">
//             <h4 className="text-sm font-semibold text-gray-700">
//               Add Pin by Coordinates
//             </h4>
//             <input
//               type="number"
//               step="any"
//               placeholder="Latitude"
//               value={manualCoords.lat}
//               onChange={(e) =>
//                 setManualCoords((prev) => ({ ...prev, lat: e.target.value }))
//               }
//               className="w-full border border-gray-200 rounded-lg p-2 text-sm"
//             />
//             <input
//               type="number"
//               step="any"
//               placeholder="Longitude"
//               value={manualCoords.lng}
//               onChange={(e) =>
//                 setManualCoords((prev) => ({ ...prev, lng: e.target.value }))
//               }
//               className="w-full border border-gray-200 rounded-lg p-2 text-sm"
//             />
//             <button
//               onClick={addPinFromCoords}
//               className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               Add Pin
//             </button>
//           </div>

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

//               {/* Pin Mode Toggle */}
//               <button
//                 onClick={() => setIsAddingPin(!isAddingPin)}
//                 title={isAddingPin ? "Exit Pin Mode" : "Add Pin"}
//                 className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
//                   isAddingPin ? "bg-red-50 text-red-600" : "text-gray-700"
//                 }`}
//               >
//                 <FontAwesomeIcon icon={isAddingPin ? faXmark : faPlus} />
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
