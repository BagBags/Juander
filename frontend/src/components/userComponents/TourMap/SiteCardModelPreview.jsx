// components/userComponents/SiteCardModelPreview.jsx
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";

function Model({ url }) {
  const { scene } = useGLTF(url, true);
  // Rotate to match Blender export: -Y front, X right, Z up
  return <primitive object={scene} scale={0.5} rotation={[0, 0, 0]} />;
}

export default function SiteCardModelPreview({ url }) {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <Bounds fit clip observe margin={0.8}>
          <Center>
            <Model url={url} />
          </Center>
        </Bounds>
        <OrbitControls
          enableZoom={true}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Suspense>
    </Canvas>
  );
}
