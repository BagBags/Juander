// components/userComponents/SiteCardModelPreview.jsx
import React, { Suspense, Component } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";

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

function Model({ url }) {
  const { scene } = useGLTF(url, true);
  return <primitive object={scene} scale={0.5} rotation={[0, 0, 0]} />;
}

export default function SiteCardModelPreview({ url }) {
  if (!url) {
    return null; // Don't render if no URL
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
