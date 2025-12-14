// components/userComponents/SiteCardModelPreview.jsx
import React, { Component, useState, useEffect, useRef } from "react";
import { Rotate3D } from "lucide-react";

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

export default function SiteCardModelPreview({ url }) {
  const [loadError, setLoadError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [slowLoading, setSlowLoading] = useState(false);
  const [mvReady, setMvReady] = useState(false);
  const [mvFailed, setMvFailed] = useState(false);
  const [mvLoading, setMvLoading] = useState(false);
  const savedRef = useRef(false);
  const hasMovedRef = useRef(false);
  const timeoutRef = useRef(null);
  const slowTimerRef = useRef(null);
  const mvRef = useRef(null);
  const UNZOOM_FACTOR = 2.5;
  const INITIAL_RADIUS_M = 3;
  const FORCE_DISTANCE_M = 0;
  const TARGET_COVERAGE = 0.88;
  const initialOrbitRef = useRef(`0deg 90deg ${INITIAL_RADIUS_M}m`);

  useEffect(() => {
    if (window.customElements?.get("model-viewer")) {
      setMvReady(true);
      return;
    }
    const src =
      "https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js";
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
      setMvFailed(true);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mvReady) return;
    const el = mvRef.current;
    if (!el) return;
    setMvLoading(true);
    const onLoad = () => {
      setMvLoading(false);
      try {
        el.setAttribute("camera-target", "auto");
        requestAnimationFrame(() => {
          const got =
            typeof el.getCameraOrbit === "function"
              ? el.getCameraOrbit()
              : null;
          const dims =
            typeof el.getDimensions === "function" ? el.getDimensions() : null;
          const toDeg = (rad) =>
            typeof rad === "number" ? (rad * 180) / Math.PI : 0;
          const thetaDeg = got ? toDeg(got.theta) : 0;
          const phiDeg = got ? toDeg(got.phi) : 90;
          let finalR = INITIAL_RADIUS_M;
          if (
            dims &&
            typeof dims.x === "number" &&
            typeof dims.y === "number" &&
            typeof dims.z === "number"
          ) {
            const radius = Math.max(dims.x, dims.y, dims.z) * 0.5;
            const fovAttr = el.getAttribute("field-of-view") || "35deg";
            const fovDeg = parseFloat(String(fovAttr).replace(/deg/i, ""));
            const fov =
              ((Number.isFinite(fovDeg) ? fovDeg : 35) * Math.PI) / 180;
            const w = el.clientWidth || 1;
            const h = el.clientHeight || 1;
            const aspect = h > 0 ? w / h : 1;
            const distV = radius / Math.tan(fov / 2);
            const distH = distV / aspect;
            const distFit = Math.max(distV, distH);
            finalR = Math.max(INITIAL_RADIUS_M, distFit / TARGET_COVERAGE);
          } else if (got) {
            let r = 0;
            if (typeof got.radius === "number") r = got.radius;
            else if (typeof got.radius === "string") {
              const n = parseFloat(got.radius);
              if (!Number.isNaN(n)) r = n;
            }
            finalR =
              r > 0
                ? Math.max(INITIAL_RADIUS_M, r / TARGET_COVERAGE)
                : INITIAL_RADIUS_M;
          }
          if (FORCE_DISTANCE_M && FORCE_DISTANCE_M > 0) {
            finalR = FORCE_DISTANCE_M;
          }
          const orbitStr = `${Math.round(thetaDeg)}deg ${
            Math.round(phiDeg) || 90
          }deg ${finalR.toFixed(2)}m`;
          el.setAttribute("camera-orbit", orbitStr);
          initialOrbitRef.current = orbitStr;
          const minR = Math.max(finalR * 0.85, INITIAL_RADIUS_M);
          el.setAttribute("min-camera-orbit", `auto auto ${minR.toFixed(2)}m`);
          requestAnimationFrame(() => {
            if (typeof el.jumpCameraToGoal === "function")
              el.jumpCameraToGoal();
          });
        });
      } catch {}
    };
    const onError = (e) => {
      setMvLoading(false);
      const msg = String(e?.detail?.message || e?.message || "");
      if (msg.includes("Mesh is missing primitive index association")) {
        setErrorMessage(
          "Model requires indexed geometry. Please repair the GLB using glTF-Transform (weld)."
        );
        setLoadError(true);
        return;
      }
      setErrorMessage("Model failed to load");
      setLoadError(true);
    };
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [mvReady, url]);

  const doRetry = () => {
    setLoadError(false);
    setErrorMessage(null);
    setMvFailed(false);
    setPreviewKey((k) => k + 1);
  };

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    setErrorMessage(null);
    setSlowLoading(false);
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
      if (!cancelled && mvLoading && !loadError) setSlowLoading(true);
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
  }, [url, mvLoading]);

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

  if (mvReady) {
    return (
      <div
        className="relative w-full h-full"
        data-no-pull
        style={{ touchAction: "none" }}
      >
        {mvLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-10">
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
            <div className="text-center mt-4">
              <p className="text-base font-semibold text-gray-700 mb-1">
                Loading 3D Model
              </p>
              <p className="text-sm text-gray-500">Please wait...</p>
            </div>
          </div>
        )}
        {url ? (
          <model-viewer
            ref={mvRef}
            src={url}
            loading="eager"
            reveal="auto"
            camera-controls
            touch-action="none"
            interaction-policy="always"
            shadow-intensity="1"
            exposure="1"
            shadow-softness="0.9"
            camera-target="auto"
            interpolation-decay="180"
            field-of-view="35deg"
            min-camera-orbit={`auto auto ${(INITIAL_RADIUS_M * 0.8).toFixed(
              2
            )}m`}
            camera-orbit={initialOrbitRef.current}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              background: "transparent",
              willChange: "transform",
            }}
          ></model-viewer>
        ) : null}
        <button
          type="button"
          aria-label="Reset view"
          onClick={() => {
            const el = mvRef.current;
            if (!el) return;
            el.setAttribute("interpolation-decay", "250");
            el.setAttribute("camera-target", "auto");
            const saved = initialOrbitRef.current;
            const parseOrbit = (s) => {
              const m = String(s).match(
                /([-0-9.]+)deg\s+([-0-9.]+)deg\s+([-0-9.]+)m/
              );
              if (!m) return { t: 0, p: 90, r: INITIAL_RADIUS_M };
              return {
                t: parseFloat(m[1]) || 0,
                p: parseFloat(m[2]) || 90,
                r: parseFloat(m[3]) || INITIAL_RADIUS_M,
              };
            };
            const start = (() => {
              const got =
                typeof el.getCameraOrbit === "function"
                  ? el.getCameraOrbit()
                  : null;
              const toDeg = (rad) =>
                typeof rad === "number" ? (rad * 180) / Math.PI : 0;
              if (got)
                return {
                  t: toDeg(got.theta),
                  p: toDeg(got.phi),
                  r:
                    typeof got.radius === "number"
                      ? got.radius
                      : INITIAL_RADIUS_M,
                };
              return parseOrbit(saved);
            })();
            const end = (() => {
              const base = parseOrbit(saved);
              let r = base.r;
              if (FORCE_DISTANCE_M && FORCE_DISTANCE_M > 0)
                r = FORCE_DISTANCE_M;
              const minR = Math.max(r * 0.85, INITIAL_RADIUS_M);
              el.setAttribute(
                "min-camera-orbit",
                `auto auto ${minR.toFixed(2)}m`
              );
              return { t: base.t, p: base.p, r };
            })();
            const ease = (x) =>
              x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
            const dur = 800;
            const t0 = performance.now();
            const step = (now) => {
              const k = Math.min(1, (now - t0) / dur);
              const e = ease(k);
              const tt = start.t + (end.t - start.t) * e;
              const pp = start.p + (end.p - start.p) * e;
              const rr = start.r + (end.r - start.r) * e;
              el.setAttribute(
                "camera-orbit",
                `${tt.toFixed(1)}deg ${pp.toFixed(1)}deg ${rr.toFixed(2)}m`
              );
              if (k < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
            setTimeout(() => {
              const m = mvRef.current;
              if (!m) return;
              m.setAttribute("interpolation-decay", "180");
            }, 600);
          }}
          className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-white border border-gray-200 shadow-sm rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5"
        >
          <Rotate3D className="w-4 h-4" />
        </button>
      </div>
    );
  }
  if (mvFailed) {
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
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-[#f04e37] border-t-transparent rounded-lg animate-spin"></div>
        <div
          className="absolute inset-2 border-4 border-orange-300 border-b-transparent rounded-lg animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1s" }}
        ></div>
      </div>
      <div className="sr-only">Loading 3D model…</div>
    </div>
  );
}
