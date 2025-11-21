// components/userComponents/SiteCardModelPreview.jsx
import React, { Suspense, Component, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";

// Custom Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D model loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 text-center">3D model preview unavailable</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Model({ url }) {
  try {
    const { scene } = useGLTF(url, true, true, (loader) => {
      // Configure loader for better CORS handling
      loader.setCrossOrigin('anonymous');
      loader.setWithCredentials(false);
    });
    
    if (!scene) {
      throw new Error('Model scene is empty');
    }
    
    return <primitive object={scene} scale={0.5} rotation={[0, 0, 0]} />;
  } catch (error) {
    console.error('Error loading GLB model:', error);
    throw error;
  }
}

export default function SiteCardModelPreview({ url }) {
  const [loadError, setLoadError] = useState(false);

  if (!url) {
    return null; // Don't render if no URL
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 text-center">Unable to load 3D model</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full">
        {/* Loading overlay - shows while model loads inside Canvas */}
        <Suspense 
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-10">
              {/* Animated 3D Cube Loader */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-[#f04e37] border-t-transparent rounded-lg animate-spin"></div>
                <div className="absolute inset-2 border-4 border-orange-300 border-b-transparent rounded-lg animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
              </div>
              {/* Loading Text */}
              <div className="text-center mt-4">
                <p className="text-base font-semibold text-gray-700 mb-1">Loading 3D Model</p>
                <p className="text-sm text-gray-500">Please wait...</p>
              </div>
              {/* Progress Dots */}
              <div className="flex gap-2 mt-3">
                <div className="w-2 h-2 bg-[#f04e37] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#f04e37] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#f04e37] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          }
        >
          <Canvas
            onCreated={({ gl }) => {
              gl.setClearColor('#f9fafb', 1);
            }}
            onError={(error) => {
              console.error('Canvas error:', error);
              setLoadError(true);
            }}
          >
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
          </Canvas>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
