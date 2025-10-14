// components/adminComponents/ThreeDModelPreview.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";

// A small wrapper for loading GLB models
function Model({ url }) {
  const { scene } = useGLTF(url);
  // Rotate to match Blender's coordinate system:
  // Blender: -Y front, X right, Z up
  // Three.js default: Z forward, X right, Y up
  return <primitive object={scene} rotation={[0, 0, 0]} />;
}

export default function ThreeDModelPreview({ url }) {
  return (
    <div className="w-full h-64 border rounded-lg mt-3">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <Center>
          <Model url={url} />
        </Center>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
