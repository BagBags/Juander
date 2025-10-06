// // components/Map3DPins.jsx
// import React, { Suspense, useEffect, useState, useMemo } from "react";
// import { Canvas } from "@react-three/fiber";
// import { useGLTF, OrbitControls } from "@react-three/drei";
// import * as THREE from "three";

// // Load 3D model component
// function PinModel({ position, scale = 1 }) {
//   const { scene } = useGLTF("/3DModels/Pin2.glb");

//   // Clone the scene to avoid issues with multiple instances
//   const clonedScene = useMemo(() => scene.clone(), [scene]);

//   return (
//     <primitive
//       object={clonedScene}
//       scale={scale}
//       position={position}
//       rotation={[0, 0, 0]}
//     />
//   );
// }

// // Main component
// export default function Map3DPins({ pins, map }) {
//   const [positions, setPositions] = useState([]);
//   const [mapReady, setMapReady] = useState(false);

//   useEffect(() => {
//     if (!map || !map.loaded()) return;

//     const updatePositions = () => {
//       try {
//         const canvas = map.getCanvas();
//         const canvasWidth = canvas.offsetWidth;
//         const canvasHeight = canvas.offsetHeight;

//         const newPositions = pins.map((pin) => {
//           // Convert lat/lng to pixel coordinates
//           const point = map.project([pin.longitude, pin.latitude]);

//           // Convert to Three.js coordinates (center-based, y inverted)
//           const x = point.x - canvasWidth / 2;
//           const y = -(point.y - canvasHeight / 2);
//           const z = 0;

//           return { x, y, z, id: pin._id };
//         });

//         setPositions(newPositions);
//         setMapReady(true);
//       } catch (error) {
//         console.error("Error updating pin positions:", error);
//       }
//     };

//     // Initial update
//     updatePositions();

//     // Set up event listeners
//     map.on("render", updatePositions);
//     map.on("move", updatePositions);
//     map.on("zoom", updatePositions);

//     // Cleanup
//     return () => {
//       map.off("render", updatePositions);
//       map.off("move", updatePositions);
//       map.off("zoom", updatePositions);
//     };
//   }, [map, pins]);

//   if (!mapReady || positions.length === 0) {
//     return null;
//   }

//   return (
//     <div
//       style={{
//         position: "absolute",
//         top: 0,
//         left: 0,
//         width: "100%",
//         height: "100%",
//         pointerEvents: "none",
//         zIndex: 10,
//       }}
//     >
//       <Canvas
//         orthographic
//         camera={{
//           position: [0, 0, 100],
//           zoom: 1,
//           left: -window.innerWidth / 2,
//           right: window.innerWidth / 2,
//           top: window.innerHeight / 2,
//           bottom: -window.innerHeight / 2,
//           near: 0.1,
//           far: 1000,
//         }}
//         style={{
//           width: "100%",
//           height: "100%",
//           background: "transparent",
//         }}
//       >
//         <ambientLight intensity={0.8} />
//         <directionalLight position={[10, 10, 5]} intensity={1} />

//         <Suspense fallback={null}>
//           {positions.map((pos) => (
//             <PinModel
//               key={pos.id}
//               position={[pos.x, pos.y, pos.z]}
//               scale={15} // Adjust scale as needed
//             />
//           ))}
//         </Suspense>

//         {/* Optional: Add controls for debugging */}
//         {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
//       </Canvas>
//     </div>
//   );
// }
