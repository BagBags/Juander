// components/userComponents/SiteCardModelPreview.jsx
import React, { Suspense, Component, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";
import { Rotate3D } from "lucide-react";
import * as THREE from "three";

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
    console.error("3D model loading error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600 text-center">
            3D model preview unavailable
          </p>
          <button
            type="button"
            className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 text-sm shadow-sm hover:bg-gray-50"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onRetry && this.props.onRetry();
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Model({ url, onReady }) {
  const { scene } = useGLTF(url, true, true, (loader) => {
    // Configure loader for better CORS handling
    loader.setCrossOrigin("anonymous");
    loader.setWithCredentials(false);
  });

  if (!scene) {
    // This will be caught by ErrorBoundary if it's a real error
    return null;
  }

  React.useEffect(() => {
    if (scene && onReady) onReady(scene);
  }, [scene, onReady]);

  return <primitive object={scene} scale={0.5} rotation={[0, 0, 0]} />;
}

export default function SiteCardModelPreview({ url }) {
  const [loadError, setLoadError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [slowLoading, setSlowLoading] = useState(false);
  const controlsRef = useRef(null);
  const savedRef = useRef(false);
  const hasMovedRef = useRef(false);
  const sceneRef = useRef(null);
  const savedPoseRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const timeoutRef = useRef(null);
  const slowTimerRef = useRef(null);

  const doRetry = () => {
    try {
      useGLTF.clear(url);
    } catch {}
    setLoadError(false);
    setErrorMessage(null);
    setPreviewKey((k) => k + 1);
  };

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    setErrorMessage(null);
    setSlowLoading(false);
    try {
      if (url && typeof url === "string" && url.endsWith(".glb")) {
        useGLTF.preload(url);
      }
    } catch {}
    try {
      const testCanvas = document.createElement("canvas");
      const testGl =
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      if (!testGl) {
        setErrorMessage("WebGL unavailable on this device");
        setLoadError(true);
      }
    } catch {}
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const conn =
      (typeof navigator !== "undefined" &&
        (navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection)) ||
      null;
    let threshold = 12000;
    const et = conn && conn.effectiveType;
    if (et === "slow-2g" || et === "2g") threshold = 40000;
    else if (et === "3g") threshold = 25000;
    else if (et === "4g") threshold = 12000;
    else if (conn && typeof conn.downlink === "number" && conn.downlink < 1)
      threshold = 25000;
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => {
      if (!sceneRef.current && !loadError) {
        setSlowLoading(true);
      }
    }, threshold);
    (async () => {
      try {
        const res = await fetch(url, {
          method: "HEAD",
          mode: "cors",
          cache: "no-cache",
        });
        if (!res.ok && !cancelled) {
          setErrorMessage(`Model unavailable (${res.status})`);
          setLoadError(true);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("Network or CORS error. Tap Retry.");
          setLoadError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, [url]);

  useEffect(() => {
    savedRef.current = false;
    hasMovedRef.current = false;
    const controls = controlsRef.current;
    if (!controls) return;

    let rafId = 0;
    let stableFrames = 0;
    const prevPos = controls.object.position.clone();
    const prevTarget = controls.target.clone();
    const pos0 = controls.position0
      ? controls.position0.clone()
      : controls.object.position.clone();
    const target0 = controls.target0
      ? controls.target0.clone()
      : controls.target.clone();
    const EPS = 1e-4;

    const tick = () => {
      const pos = controls.object.position;
      const tgt = controls.target;
      const moved =
        pos.distanceTo(prevPos) > EPS || tgt.distanceTo(prevTarget) > EPS;
      const changedFromInitial =
        pos.distanceTo(pos0) > EPS || tgt.distanceTo(target0) > EPS;
      if (moved) {
        stableFrames = 0;
        prevPos.copy(pos);
        prevTarget.copy(tgt);
        hasMovedRef.current = true;
      } else {
        stableFrames++;
        if (
          !savedRef.current &&
          (hasMovedRef.current || changedFromInitial) &&
          stableFrames >= 10
        ) {
          controls.saveState?.();
          savedRef.current = true;
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [url]);

  const animateToSaved = () => {
    const c = controlsRef.current;
    if (!c) return;
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    c.enabled = false;
    let endPos;
    let endTarget;
    if (savedPoseRef?.current) {
      endPos = savedPoseRef.current.pos.clone();
      endTarget = savedPoseRef.current.target.clone();
    } else if (sceneRef.current) {
      const box = new THREE.Box3().setFromObject(sceneRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, size.y, size.z) * 0.5;
      const fov = ((c.object.fov || 50) * Math.PI) / 180;
      const aspect = c.object.aspect || 1;
      const distV = radius / Math.tan(fov / 2);
      const distH = distV / aspect;
      const dist = Math.max(distV, distH) * 1.35;
      const dir = c.object.position.clone().sub(c.target).normalize();
      endTarget = center;
      endPos = center.clone().add(dir.multiplyScalar(dist));
      savedPoseRef.current = { pos: endPos.clone(), target: endTarget.clone() };
    } else {
      endPos = c.object.position.clone();
      endTarget = c.target.clone();
    }
    const startPos = c.object.position.clone();
    const startTarget = c.target.clone();
    const startZoom = c.object.zoom;
    const endZoom = typeof c.zoom0 === "number" ? c.zoom0 : startZoom;
    const duration = 1000;
    const start = performance.now();
    const ease = (t) => t * (2 - t);
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const k = ease(t);
      c.object.position.copy(startPos.clone().lerp(endPos, k));
      c.target.copy(startTarget.clone().lerp(endTarget, k));
      if (!c.object.isPerspectiveCamera) {
        c.object.zoom = startZoom + (endZoom - startZoom) * k;
        c.object.updateProjectionMatrix();
      }
      c.update();
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        c.update?.();
        isAnimatingRef.current = false;
        c.enabled = true;
      }
    };
    requestAnimationFrame(step);
  };

  if (!url) {
    return null; // Don't render if no URL
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
        <div className="text-gray-400 mb-2">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-600 text-center">
          {errorMessage || "3D model preview unavailable"}
        </p>
        <button
          type="button"
          className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 text-sm shadow-sm hover:bg-gray-50"
          onClick={doRetry}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary onRetry={doRetry}>
      <div
        className="relative w-full h-full"
        data-no-pull
        style={{ touchAction: "none" }}
      >
        <button
          type="button"
          aria-label="Reset view"
          onClick={animateToSaved}
          className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-white border border-gray-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5"
        >
          <Rotate3D className="w-4 h-4" />
        </button>
        {/* Loading overlay - shows while model loads inside Canvas */}
        <Suspense
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-10">
              {/* Animated 3D Cube Loader */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-[#f04e37] border-t-transparent rounded-lg animate-spin"></div>
                <div
                  className="absolute inset-2 border-4 border-orange-300 border-b-transparent rounded-lg animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1s",
                  }}
                ></div>
              </div>
              {/* Loading Text */}
              <div className="text-center mt-4">
                <p className="text-base font-semibold text-gray-700 mb-1">
                  Loading 3D Model
                </p>
                <p className="text-sm text-gray-500">Please wait...</p>
                {slowLoading && (
                  <p className="text-xs text-gray-500 mt-2">
                    Slow connection detected. Still loading…
                  </p>
                )}
              </div>
              {/* Progress Dots */}
              <div className="flex gap-2 mt-3">
                <div
                  className="w-2 h-2 bg-[#f04e37] rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#f04e37] rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#f04e37] rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          }
        >
          <Canvas
            key={previewKey}
            dpr={Math.min(
              2,
              (typeof window !== "undefined" && window.devicePixelRatio) || 1
            )}
            gl={{
              antialias: false,
              alpha: true,
              powerPreference: "low-power",
              preserveDrawingBuffer: false,
            }}
            onCreated={({ gl }) => {
              gl.setClearColor("#000000", 0);
              const canvas = gl.domElement;
              const lost = (e) => {
                e.preventDefault();
                setErrorMessage("Graphics context lost. Tap Retry to restore.");
                setLoadError(true);
              };
              const restored = () => {
                setLoadError(false);
                setErrorMessage(null);
                setPreviewKey((k) => k + 1);
              };
              canvas.addEventListener("webglcontextlost", lost, false);
              canvas.addEventListener("webglcontextrestored", restored, false);
            }}
            onError={(error) => {
              setErrorMessage("Rendering error. Tap Retry to try again.");
              setLoadError(true);
            }}
          >
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} />
            <directionalLight position={[-5, 5, -5]} intensity={0.5} />
            <Bounds fit clip observe margin={0.8}>
              <Center>
                <Model
                  url={url}
                  onReady={(s) => {
                    sceneRef.current = s;
                    setSlowLoading(false);
                    if (slowTimerRef.current)
                      clearTimeout(slowTimerRef.current);
                    const c = controlsRef.current;
                    if (!c) return;
                    const box = new THREE.Box3().setFromObject(s);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const radius = Math.max(size.x, size.y, size.z) * 0.5;
                    const fov = ((c.object.fov || 50) * Math.PI) / 180;
                    const aspect = c.object.aspect || 1;
                    const distV = radius / Math.tan(fov / 2);
                    const distH = distV / aspect;
                    const dist = Math.max(distV, distH) * 1.35;
                    const dir = c.object.position
                      .clone()
                      .sub(c.target)
                      .normalize();
                    const target = center;
                    const pos = center.clone().add(dir.multiplyScalar(dist));
                    savedPoseRef.current = { pos, target };
                    c.enabled = false;
                    setTimeout(() => {
                      if (controlsRef.current)
                        controlsRef.current.enabled = true;
                    }, 800);
                  }}
                />
              </Center>
            </Bounds>
            <OrbitControls
              ref={controlsRef}
              enableZoom={true}
              enableRotate={true}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
              makeDefault
              mouseButtons={{
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN,
              }}
              touches={{
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN,
              }}
            />
          </Canvas>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
