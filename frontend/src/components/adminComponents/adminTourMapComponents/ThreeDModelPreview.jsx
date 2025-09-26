// components/adminComponents/ThreeDModelPreview.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";

// A small wrapper for loading GLB models
function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function ThreeDModelPreview({ url }) {
  return (
    <div className="w-full h-64 border rounded-lg mt-3">
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Center>
          <Model url={url} />
        </Center>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
