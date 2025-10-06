// // components/userComponents/TourMap.jsx
// import React, { useState, useEffect, useRef, useCallback } from "react";
// import Map, { Marker, Source, Layer } from "react-map-gl";
// import BackHeader from "../BackButton";
// import "mapbox-gl/dist/mapbox-gl.css";
// import axios from "axios";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faInfo } from "@fortawesome/free-solid-svg-icons";
// import { MAPBOX_TOKEN, INTRAMUROS_BOUNDS } from "./mapConfig";
// import SiteCard from "./SiteCard";
// import { useApi } from "./useApi";
// import { useUserLocation } from "./useUserLocation";

// import "../../../App.css";

// // ✅ Axios instance with token
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE || "/api",
// });
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// export default function UserMap() {
//   const [viewState, setViewState] = useState({
//     latitude: 40.5896,
//     longitude: 120.9747,
//     zoom: 4,
//     bearing: 45,
//   });

//   const [selectedPin, setSelectedPin] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [route, setRoute] = useState(null);
//   const [showLegend, setShowLegend] = useState(false);

//   const mapRef = useRef(null);

//   // Custom hooks
//   const { mask, inverseMask, pins } = useApi(api);
//   const userLocation = useUserLocation(setViewState);

//   // ------------------ Fly to pin helper ------------------
//   const flyToPin = (pinData, callback) => {
//     const map = mapRef.current?.getMap?.();
//     if (!map) return;
//     map.flyTo({
//       center: [pinData.longitude, pinData.latitude],
//       zoom: 20.2, // 🔥 closer zoom
//       bearing: 30,
//       pitch: 75, // heavy tilt for street-view-like effect
//       speed: 1.2,
//       curve: 1.5,
//       essential: true,
//     });

//     map.once("moveend", () => callback?.());
//   };

//   // ------------------ Handle map clicks ------------------
//   useEffect(() => {
//     const map = mapRef.current?.getMap?.();
//     if (!map) return;

//     const handleMapClick = (e) => {
//       if (!pins?.length || !map.getLayer("pins-click-layer")) return;

//       const features = map.queryRenderedFeatures(e.point, {
//         layers: ["pins-click-layer"],
//       });

//       if (features.length > 0) {
//         const pinId = features[0].properties.id;
//         const pin = pins.find((p) => p._id === pinId);
//         if (pin) openPin(pin);
//       }
//     };

//     map.on("click", handleMapClick);
//     return () => map.off("click", handleMapClick);
//   }, [pins]);

//   // ------------------ Open pin + fetch route ------------------
//   const openPin = useCallback(
//     (pinData) => {
//       if (!pinData) return;

//       flyToPin(pinData, async () => {
//         setSelectedPin(pinData);
//         setDistance(null);
//         setRoute(null);

//         if (!userLocation) return;

//         try {
//           const url =
//             `https://api.mapbox.com/directions/v5/mapbox/walking/` +
//             `${userLocation.longitude},${userLocation.latitude};` +
//             `${pinData.longitude},${pinData.latitude}` +
//             `?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

//           const resp = await fetch(url);
//           const data = await resp.json();

//           if (data.routes?.length) {
//             const routeData = data.routes[0];
//             setDistance(routeData.distance);
//             setRoute({
//               type: "Feature",
//               geometry: routeData.geometry,
//               properties: {},
//             });
//           }
//         } catch (err) {
//           console.error("❌ Directions fetch error:", err);
//         }
//       });
//     },
//     [userLocation]
//   );

//   // ------------------ Close card ------------------
//   const handleCloseCard = () => {
//     setSelectedPin(null);
//     setDistance(null);
//     setRoute(null);

//     // Reset map view back to default zoom, center, and remove tilt
//     setViewState((prev) => ({
//       ...prev, // keep bearing if you want
//       latitude: 40.5896,
//       longitude: 120.9747,
//       bearing: 45,
//       zoom: 4,
//       pitch: 0, // remove tilt
//     }));
//   };

//   return (
//     <div className="relative w-full h-screen">
//       {/* Legend Button */}
//       {/* Toolbar */}
//       <div className="absolute top-6 right-6 z-[9999] flex items-end space-x-3">
//         {showLegend && (
//           <div className="absolute right-full mr-3 top-0 bg-white rounded-lg shadow-md w-52 p-4 text-gray-800 animate-fadeIn">
//             <h4 className="font-semibold mb-3 text-lg border-b pb-1">
//               Map Legend
//             </h4>
//             <ul className="space-y-2 text-sm">
//               <li className="flex items-center space-x-2">
//                 <span className="w-4 h-4 rounded-full bg-red-600 border border-white shadow-sm"></span>
//                 <span>Active Site</span>
//               </li>
//               <li className="flex items-center space-x-2">
//                 <span className="w-4 h-4 rounded-full bg-blue-600 border border-white shadow-sm"></span>
//                 <span>Disabled Site</span>
//               </li>
//             </ul>
//           </div>
//         )}

//         <div className="flex flex-col items-end space-y-2">
//           <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden relative z-[9999]">
//             <button
//               onClick={() => setShowLegend((prev) => !prev)}
//               title="Map Legend"
//               className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
//                 showLegend ? "bg-blue-50 text-blue-600" : "text-gray-700"
//               }`}
//             >
//               <FontAwesomeIcon icon={faInfo} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Map */}
//       <Map
//         ref={mapRef}
//         {...viewState}
//         onMove={(evt) => setViewState(evt.viewState)}
//         minZoom={15.5}
//         maxBounds={INTRAMUROS_BOUNDS}
//         mapboxAccessToken={MAPBOX_TOKEN}
//         attributionControl={false}
//         mapStyle="mapbox://styles/mapbox/streets-v11"
//         className="w-full h-full"
//       >
//         {/* User location marker */}
//         {userLocation && (
//           <Marker
//             longitude={userLocation.longitude}
//             latitude={userLocation.latitude}
//           >
//             <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
//           </Marker>
//         )}

//         {/* Tour pins with facade image */}
//         {pins &&
//           pins.map((pin) => {
//             const isSelected = selectedPin?._id === pin._id;

//             return (
//               <Marker
//                 key={pin._id}
//                 longitude={pin.longitude}
//                 latitude={pin.latitude}
//                 anchor="bottom"
//               >
//                 <div
//                   className="relative flex items-center justify-center cursor-pointer"
//                   onClick={() => openPin(pin)}
//                 >
//                   {/* Facade image */}
//                   {pin.facadeUrl && (
//                     <img
//                       src={pin.facadeUrl}
//                       alt={pin.siteName}
//                       className={`object-contain transition-transform duration-700 ease-out ${
//                         isSelected
//                           ? "w-64 h-64 scale-150"
//                           : "w-24 h-24 scale-100"
//                       }`}
//                     />
//                   )}

//                   {/* Pin centered on the facade */}
//                   <div
//                     className="absolute top-1/2 left-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md"
//                     style={{
//                       transform: "translate(-50%, -50%)",
//                       backgroundColor:
//                         pin.status === "inactive" ? "#3b82f6" : "#dc2626", // Blue if disabled, red if active
//                     }}
//                     title={pin.siteName}
//                   ></div>
//                 </div>
//               </Marker>
//             );
//           })}

//         {/* Mask */}
//         {mask && (
//           <Source type="geojson" data={mask}>
//             <Layer
//               id="mask-fill"
//               type="fill"
//               paint={{ "fill-color": "#000", "fill-opacity": 0 }}
//             />
//           </Source>
//         )}
//         {inverseMask && (
//           <Source type="geojson" data={inverseMask}>
//             <Layer
//               id="inverse-mask-fill"
//               type="fill"
//               paint={{ "fill-color": "#000", "fill-opacity": 0.7 }}
//             />
//           </Source>
//         )}

//         {/* Route */}
//         {route && (
//           <Source type="geojson" data={route}>
//             <Layer
//               id="route-line"
//               type="line"
//               layout={{ "line-join": "round", "line-cap": "round" }}
//               paint={{
//                 "line-color": "#3b9ddd",
//                 "line-width": 4,
//                 "line-opacity": 0.8,
//               }}
//             />
//           </Source>
//         )}
//       </Map>

//       {/* UI overlays */}
//       <div className="absolute top-0 left-0 w-full z-30 p-4 pointer-events-auto">
//         <BackHeader title={<span className="text-black">Tour Map</span>} />
//       </div>

//       {/* Site card */}
//       {selectedPin && (
//         <SiteCard
//           pin={{
//             ...selectedPin,
//             imageUrl: `${import.meta.env.VITE_API_BASE}/uploads/${
//               selectedPin.image
//             }`,
//           }}
//           distance={distance}
//           onClose={handleCloseCard}
//         />
//       )}

//       {/* Next site button */}
//       {selectedPin && (
//         <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
//           <button className="bg-blue-700 text-white px-5 py-2 rounded-md cursor-pointer shadow-lg">
//             Go to next site
//           </button>
//         </div>
//       )}

//       {/* Footer */}
//       <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-30 pointer-events-auto">
//         Tour Map
//       </div>
//     </div>
//   );
// }
