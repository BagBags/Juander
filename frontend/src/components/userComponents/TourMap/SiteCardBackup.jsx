// // components/userComponents/SiteCard.jsx
// import React, { Suspense } from "react";
// import { Canvas } from "@react-three/fiber";
// import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";

// const ModelPreview = ({ url }) => {
//   const { scene } = useGLTF(url, true);
//   return <primitive object={scene} scale={0.5} />;
// };

// const SiteCard = ({ pin, onClose, distance }) => (
//   <div
//     className="
//     absolute top-1/2 left-1/2 z-50
//     w-[320px] sm:w-[400px] md:w-[500px] lg:w-[640px]
//     -translate-x-1/2 -translate-y-1/2
//   "
//   >
//     <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg p-4 md:p-6 font-sans">
//       <button
//         onClick={onClose}
//         className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
//       >
//         ✕
//       </button>

//       {/* 3D model preview */}
//       {pin.glbUrl && (
//         <div className="mb-3 w-full h-64 md:h-80 border border-gray-200 rounded-lg">
//           <Canvas>
//             <Suspense fallback={null}>
//               <ambientLight intensity={0.8} />
//               <directionalLight position={[5, 5, 5]} />
//               <Bounds fit clip observe margin={1.2}>
//                 <Center>
//                   <ModelPreview url={pin.glbUrl} />
//                 </Center>
//               </Bounds>
//               <OrbitControls
//                 enableZoom={true}
//                 minPolarAngle={Math.PI / 3}
//                 maxPolarAngle={Math.PI / 2}
//               />
//             </Suspense>
//           </Canvas>
//         </div>
//       )}

//       <h3 className="text-lg md:text-xl font-semibold mb-2">{pin.title}</h3>
//       <p className="text-sm md:text-base leading-snug text-gray-700 mb-3">
//         {pin.description}
//       </p>

//       {/* Existing image/video preview */}
//       {pin.mediaUrl && (
//         <div className="mb-3">
//           {pin.mediaType === "video" ? (
//             <video
//               src={pin.mediaUrl}
//               className="w-full h-40 md:h-56 object-cover rounded-lg border border-gray-200"
//               muted
//               controls
//             />
//           ) : (
//             <img
//               src={pin.mediaUrl}
//               alt={pin.title}
//               className="w-full h-40 md:h-56 object-cover rounded-lg border border-gray-200"
//             />
//           )}
//         </div>
//       )}

//       {pin.arEnabled && pin.arLink && (
//         <a
//           href={pin.arLink}
//           target="_blank"
//           rel="noreferrer"
//           className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm md:text-base font-medium rounded-lg shadow mb-3"
//         >
//           View in AR Mode
//         </a>
//       )}

//       <div className="text-xs md:text-sm font-medium px-3 py-2 rounded-md shadow-sm border border-gray-200 bg-gray-50">
//         Status:{" "}
//         <span
//           className={
//             pin.status === "active" ? "text-green-600" : "text-red-600"
//           }
//         >
//           {pin.status === "active" ? "Active" : "Inactive"}
//         </span>
//       </div>

//       {distance !== null && (
//         <div className="bg-gray-50 text-xs md:text-sm px-3 py-2 mt-3 rounded-md shadow-sm border border-gray-200">
//           🛣️ Distance: {(distance / 1000).toFixed(2)} km
//         </div>
//       )}
//     </div>
//   </div>
// );

// export default SiteCard;
