// import React, { useState, useEffect } from "react";
// import Map, { Marker, Source, Layer } from "react-map-gl";
// import "mapbox-gl/dist/mapbox-gl.css";
// import axios from "axios";
// import { useParams } from "react-router-dom";

// import {
//   MAPBOX_TOKEN,
//   INTRAMUROS_BOUNDS,
//   directionsClient,
//   createInverseMask,
// } from "../TourMap/mapConfig";

// export default function TouristItineraryMap() {
//   const { itineraryId } = useParams();
//   const [pins, setPins] = useState([]);
//   const [viewState, setViewState] = useState({
//     latitude: 14.5896,
//     longitude: 120.9747,
//     zoom: 16,
//   });
//   const [selectedPin, setSelectedPin] = useState(null);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [userLocation, setUserLocation] = useState(null);
//   const [route, setRoute] = useState(null);
//   const [distance, setDistance] = useState(null);

//   const [mask, setMask] = useState(null);
//   const [inverseMask, setInverseMask] = useState(null);

//   const token = localStorage.getItem("token");
//   const config = { headers: { Authorization: `Bearer ${token}` } };

//   // --- Fetch mask ---
//   useEffect(() => {
//     const fetchMask = async () => {
//       try {
//         const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/mask`);
//         if (!data?.geometry) return;
//         const feature = {
//           type: "Feature",
//           properties: {},
//           geometry: data.geometry,
//         };
//         setMask(feature);
//         setInverseMask(createInverseMask(feature));
//       } catch (err) {
//         console.error("❌ Error fetching mask:", err);
//       }
//     };
//     fetchMask();
//   }, []);

//   // --- Fetch itinerary pins ---
//   useEffect(() => {
//     const fetchItinerary = async () => {
//       try {
//         const res = await axios.get(
//           `${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}`}/itineraries/${itineraryId}`,
//           config
//         );

//         const sites = (res.data.sites || []).filter(
//           (s) => s.latitude && s.longitude
//         );

//         const normalized = sites.map((s) => ({
//           ...s,
//           siteName: s.siteName || "Site",
//           description: s.siteDescription || s.description || "",
//           mediaType: s.mediaType || "image",
//           mediaUrl: s.mediaUrl || "",
//           arEnabled: s.arEnabled === true,
//           arLink: s.arLink || "",
//           status: s.status || "active",
//         }));

//         setPins(normalized);
//       } catch (err) {
//         console.error("Error fetching itinerary:", err);
//       }
//     };

//     if (itineraryId) fetchItinerary();
//   }, [itineraryId]);

//   // --- Watch user location ---
//   useEffect(() => {
//     const id = navigator.geolocation.watchPosition(
//       ({ coords }) => {
//         const loc = { latitude: coords.latitude, longitude: coords.longitude };
//         setUserLocation(loc);
//         setViewState((v) => ({ ...v, ...loc }));
//       },
//       (err) => console.error("GPS error:", err),
//       { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
//     );
//     return () => navigator.geolocation.clearWatch(id);
//   }, []);

//   // --- Choose nearest site first ---
//   useEffect(() => {
//     if (!userLocation || pins.length === 0) return;

//     const withDistances = pins.map((p) => {
//       const dx = p.latitude - userLocation.latitude;
//       const dy = p.longitude - userLocation.longitude;
//       return { ...p, dist: Math.sqrt(dx * dx + dy * dy) };
//     });

//     withDistances.sort((a, b) => a.dist - b.dist);

//     setPins(withDistances);
//     setSelectedPin(withDistances[0]);
//     setCurrentIndex(0);
//     setViewState((v) => ({
//       ...v,
//       latitude: withDistances[0].latitude,
//       longitude: withDistances[0].longitude,
//     }));
//   }, [userLocation, pins.length]);

//   // --- Fetch route to current site ---
//   useEffect(() => {
//     const fetchRoute = async () => {
//       if (!userLocation || !selectedPin) return;

//       try {
//         const resp = await directionsClient
//           .getDirections({
//             profile: "walking",
//             geometries: "geojson",
//             waypoints: [
//               { coordinates: [userLocation.longitude, userLocation.latitude] },
//               { coordinates: [selectedPin.longitude, selectedPin.latitude] },
//             ],
//           })
//           .send();

//         const routeData = resp.body.routes[0];
//         setDistance(routeData.distance);
//         setRoute({
//           type: "Feature",
//           geometry: routeData.geometry,
//           properties: {},
//         });
//       } catch (err) {
//         console.error("Directions error:", err);
//       }
//     };

//     fetchRoute();
//   }, [userLocation, selectedPin]);

//   // --- Go to next site ---
//   const goToNextStop = () => {
//     if (currentIndex < pins.length - 1) {
//       const nextIndex = currentIndex + 1;
//       setCurrentIndex(nextIndex);
//       setSelectedPin(pins[nextIndex]);
//       setViewState((v) => ({
//         ...v,
//         latitude: pins[nextIndex].latitude,
//         longitude: pins[nextIndex].longitude,
//       }));
//     }
//   };

//   return (
//     <div className="w-full h-screen relative">
//       <Map
//         {...viewState}
//         mapboxAccessToken={MAPBOX_TOKEN}
//         mapStyle="mapbox://styles/mapbox/streets-v11"
//         onMove={(evt) => setViewState(evt.viewState)}
//         maxBounds={INTRAMUROS_BOUNDS}
//         attributionControl={false}
//         className="w-full h-full"
//       >
//         {/* Greyed out area outside the mask */}
//         {inverseMask && (
//           <Source id="inverse-mask" type="geojson" data={inverseMask}>
//             <Layer
//               id="inverse-fill"
//               type="fill"
//               paint={{ "fill-color": "#000", "fill-opacity": 0.5 }}
//             />
//           </Source>
//         )}

//         {/* Red outline border */}
//         {mask && (
//           <Source id="mask" type="geojson" data={mask}>
//             <Layer
//               id="mask-border"
//               type="line"
//               paint={{ "line-color": "#FF0000", "line-width": 2 }}
//             />
//           </Source>
//         )}

//         {/* User marker */}
//         {userLocation && (
//           <Marker
//             latitude={userLocation.latitude}
//             longitude={userLocation.longitude}
//             anchor="bottom"
//           >
//             🧍
//           </Marker>
//         )}

//         {/* Site markers */}
//         {pins.map((pin, idx) => (
//           <Marker
//             key={pin._id}
//             latitude={pin.latitude}
//             longitude={pin.longitude}
//             anchor="bottom"
//             onClick={(e) => {
//               e.originalEvent.stopPropagation();
//               setSelectedPin(pin);
//               setCurrentIndex(idx);
//             }}
//           >
//             <div
//               className={`w-6 h-6 rounded-full cursor-pointer ${
//                 idx === currentIndex
//                   ? "bg-blue-500 animate-pulse"
//                   : "bg-red-500"
//               }`}
//             />
//           </Marker>
//         ))}

//         {/* Route */}
//         {route && (
//           <Source id="route" type="geojson" data={route}>
//             <Layer
//               id="route-line"
//               type="line"
//               paint={{ "line-color": "#1d4ed8", "line-width": 4 }}
//             />
//           </Source>
//         )}
//       </Map>

//       {/* Site Card */}
//       {selectedPin && (
//         <div className="absolute top-1/2 left-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2">
//           <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg p-4 font-sans">
//             <button
//               onClick={() => {
//                 setSelectedPin(null);
//                 setRoute(null);
//                 setDistance(null);
//               }}
//               className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
//             >
//               ✕
//             </button>

//             <h3 className="text-lg font-semibold mb-2">
//               {selectedPin.siteName}
//             </h3>
//             <p className="text-sm text-gray-700 mb-3">
//               {selectedPin.description}
//             </p>

//             {selectedPin.mediaUrl && (
//               <div className="mb-3">
//                 {selectedPin.mediaType === "video" ? (
//                   <video
//                     src={selectedPin.mediaUrl}
//                     className="w-full h-40 object-cover rounded-lg border"
//                     muted
//                     controls
//                   />
//                 ) : (
//                   <img
//                     src={selectedPin.mediaUrl}
//                     alt={selectedPin.siteName}
//                     className="w-full h-40 object-cover rounded-lg border"
//                   />
//                 )}
//               </div>
//             )}

//             {selectedPin.arEnabled && selectedPin.arLink && (
//               <a
//                 href={selectedPin.arLink}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg shadow mb-3"
//               >
//                 View in AR Mode
//               </a>
//             )}

//             {selectedPin.status && (
//               <div className="text-xs font-medium px-3 py-2 rounded-md border bg-gray-50">
//                 Status:{" "}
//                 <span
//                   className={
//                     selectedPin.status === "active"
//                       ? "text-green-600"
//                       : "text-red-600"
//                   }
//                 >
//                   {selectedPin.status === "active" ? "Active" : "Inactive"}
//                 </span>
//               </div>
//             )}

//             {distance !== null && (
//               <div className="bg-gray-50 text-xs px-3 py-2 mt-3 rounded-md border">
//                 🛣️ Distance: {(distance / 1000).toFixed(2)} km
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Next button */}
//       {selectedPin && currentIndex < pins.length - 1 && (
//         <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
//           <button
//             onClick={goToNextStop}
//             className="bg-blue-700 text-white px-5 py-2 rounded-md shadow-lg"
//           >
//             Go to next site
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
