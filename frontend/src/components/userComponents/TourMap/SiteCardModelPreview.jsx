// components/userComponents/SiteCardModelPreview.jsx
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";

function Model({ url }) {
  const { scene } = useGLTF(url, true);
  return <primitive object={scene} scale={0.5} />;
}

export default function SiteCardModelPreview({ url }) {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} />
        <Bounds fit clip observe margin={1.2}>
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
