// components/adminComponents/ThreeDModelPreview.jsx
import React, { Suspense, Component, useEffect, useState } from "react";
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

  const [mvReady, setMvReady] = useState(false);
  useEffect(() => {
    const src = "https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js";
    if (window.customElements && window.customElements.get("model-viewer")) {
      setMvReady(true);
      return;
    }
    let script = document.querySelector(`script[src="${src}"]`);
    if (script) {
      if (script.dataset.loaded === "true") {
        setMvReady(true);
      } else {
        script.addEventListener("load", () => setMvReady(true), { once: true });
      }
      return;
    }
    script = document.createElement("script");
    script.type = "module";
    script.src = src;
    script.onload = () => {
      script.dataset.loaded = "true";
      setMvReady(true);
    };
    script.onerror = () => {
      setMvReady(false);
    };
    document.head.appendChild(script);
  }, []);

  return (
    <ErrorBoundary>
      <div className="w-full h-64 border rounded-lg mt-3">
        {mvReady ? (
          <model-viewer
            src={url}
            camera-controls
            interaction-prompt="none"
            touch-action="none"
            style={{ width: "100%", height: "100%", background: "#e5e7eb" }}
            exposure="1"
            shadow-intensity="1"
            ar-modes="webxr scene-viewer quick-look"
          />
        ) : (
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }} onCreated={({gl})=>gl.setClearColor('#e5e7eb',1)}>
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
        )}
      </div>
    </ErrorBoundary>
  );
}
