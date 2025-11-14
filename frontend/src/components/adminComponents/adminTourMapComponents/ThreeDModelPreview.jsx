// components/adminComponents/ThreeDModelPreview.jsx
import React, { Suspense, Component } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";

// Custom Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('3D model failed to load, skipping render:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return null; // Don't render anything on error
    }
    return this.props.children;
  }
}

// A small wrapper for loading GLB models
function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} rotation={[0, 0, 0]} />;
}

export default function ThreeDModelPreview({ url }) {
  if (!url) {
    return null; // Don't render if no URL
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-64 border rounded-lg mt-3">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} />
            <directionalLight position={[-5, 5, -5]} intensity={0.5} />
            <Center>
              <Model url={url} />
            </Center>
            <OrbitControls />
          </Suspense>
        </Canvas>
      </div>
    </ErrorBoundary>
  );
}
