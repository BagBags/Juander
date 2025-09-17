import React, { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";

function PinModelInstance({ gltf, position = [0, 0, 0], scale = 1 }) {
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf]);
  return (
    <primitive
      object={cloned}
      position={position}
      scale={[scale, scale, scale]}
    />
  );
}

export default function PinLayer({
  positions = [],
  selectedPin = null,
  onPinClick,
}) {
  const modelDefault = useGLTF("/3DModels/Pin1.glb");
  const modelSelected = useGLTF("/3DModels/Pin2.glb");

  const defaultScale = 100;
  const selectedScale = 120;

  return (
    <Suspense fallback={null}>
      {positions.map((p) => {
        const isSelected = selectedPin && selectedPin._id === p.data._id;
        const model = isSelected ? modelSelected : modelDefault;
        const scale = isSelected ? selectedScale : defaultScale;

        return (
          <group
            key={p._id}
            position={[p.x, p.y, 10]}
            onPointerDown={(e) => {
              e.stopPropagation();
              onPinClick?.(p.data);
            }}
            // ✅ re-enable interaction just for pins
            pointerEvents="auto"
          >
            <PinModelInstance gltf={model} scale={scale} />
          </group>
        );
      })}
    </Suspense>
  );
}
