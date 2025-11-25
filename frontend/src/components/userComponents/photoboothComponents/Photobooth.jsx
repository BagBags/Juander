import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { RotateCcw, Download, X, SwitchCamera } from "lucide-react";
import PhotoboothSlider from "./photoboothSlider";
// import { baseFilters } from "./basefilter"; // REMOVED - use only admin-uploaded filters
import "../../../Photobooth.css";
import {
  setPhotoboothRouteActive,
  cancelCameraStop,
  scheduleCameraStop,
  isPhotoboothRouteActive,
} from "../../../utils/cameraLifecycle";
import NotificationModal from "../../shared/NotificationModal";
import { useTour } from "../../TourComponents/TourContext";

export default function Photobooth() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const overlayImgRef = useRef(null);

  const [jeelizReady, setJeelizReady] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const detectStateRef = useRef(null);

  const [filters, setFilters] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [selectedFilterId, setSelectedFilterId] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const preloadedRef = useRef(new Set());
  const [facingMode, setFacingMode] = useState("user"); // "user" = front, "environment" = rear
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // Load filters from backend (keep base filters immediately)
  useEffect(() => {
    let isMounted = true;
    const fetchFilters = async () => {
      setFiltersLoading(true);
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/photobooth/filters`,
          { timeout: 8000 }
        );
        if (!isMounted) return;
        if (res.data && res.data.length > 0) {
          const API_BASE =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
          const ORIGIN = window.location.origin;
          const normalized = res.data.map((f) => {
            let imageUrl = f.image || f.imageUrl;
            let originalUrl = imageUrl;
            if (imageUrl) {
              if (!/^https?:\/\//i.test(imageUrl)) {
                // Backend-relative path -> make absolute against backend host
                const BACKEND_HOST = API_BASE.replace(/\/?api$/, "");
                imageUrl = `${BACKEND_HOST}${
                  imageUrl.startsWith("/") ? "" : "/"
                }${imageUrl}`;
                originalUrl = imageUrl;
              }
              // Fix URL encoding for S3/CloudFront paths (spaces, unicode, etc.)
              try {
                if (
                  /s3\.[^/]+\.amazonaws\.com|cloudfront\.net/i.test(imageUrl)
                ) {
                  const u = new URL(imageUrl);
                  const parts = u.pathname
                    .split("/")
                    .map((p) => encodeURIComponent(decodeURIComponent(p)));
                  const encoded = `${u.protocol}//${u.host}${parts.join("/")}`;
                  imageUrl = encoded;
                  originalUrl = encoded;
                }
              } catch {}
              // If remote and not same-origin, check if we need to proxy
              try {
                const urlObj = new URL(imageUrl);
                const isRemote = urlObj.origin !== ORIGIN;
                // Skip proxy for S3 URLs - they should have CORS configured
                const isS3Url =
                  imageUrl.includes(".s3.") || imageUrl.includes(".s3-");
                if (isRemote && !isS3Url) {
                  const apiOrigin = new URL(API_BASE, window.location.href)
                    .origin;
                  const targetUrl = imageUrl; // absolute remote URL to fetch
                  // If API is on a different origin, use absolute API_BASE; otherwise use same-origin relative path
                  imageUrl =
                    apiOrigin !== ORIGIN
                      ? `${API_BASE}/photobooth/filters/proxy?url=${encodeURIComponent(
                          targetUrl
                        )}`
                      : `/api/photobooth/filters/proxy?url=${encodeURIComponent(
                          targetUrl
                        )}`;
                }
              } catch {}
            }
            // Add cache-busting timestamp to force fresh load
            const cacheBuster = `?t=${Date.now()}`;
            const imageUrlWithCache = imageUrl + cacheBuster;
            const originalUrlWithCache = originalUrl + cacheBuster;

            return {
              ...f,
              label: f.label || f.name,
              value:
                f.value ||
                f.name?.toLowerCase().replace(/\s+/g, "-") ||
                `filter-${Date.now()}`,
              image: imageUrlWithCache,
              originalImage: originalUrlWithCache,
              category: f.category || "general",
              id:
                f._id ||
                f.id ||
                f.value ||
                `filter-${Date.now()}-${Math.random()}`,
            };
          });
          console.log("✅ Loaded filters from backend:", normalized.length);
          console.log(
            "📋 Filter URLs:",
            normalized.map((f) => ({ name: f.label, url: f.image }))
          );
          setFilters(normalized);
        }
      } catch (err) {
        console.error("Failed to load filters:", err);
        setFilters([]); // Empty array if fetch fails
      } finally {
        if (isMounted) setFiltersLoading(false);
      }
    };
    fetchFilters();
    return () => {
      isMounted = false;
    };
  }, []);

  // Mark route active and cancel any pending camera stop when Photobooth mounts
  useEffect(() => {
    setPhotoboothRouteActive(true);
    cancelCameraStop();
    return () => {
      // Mark route inactive when leaving Photobooth
      setPhotoboothRouteActive(false);
    };
  }, []);

  const repeatedFilters = useMemo(
    () =>
      filters.map((f, i) => ({
        ...f,
        id: f.id || f._id || f.value || `filter-${i}`,
      })),
    [filters]
  );

  const selectedMeta = repeatedFilters.find((f) => f.id === selectedFilterId);

  // Prefetch helpers to speed up loading
  const preloadImage = useCallback((url) => {
    if (!url || preloadedRef.current.has(url)) return Promise.resolve();
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Request CORS headers
      img.onload = () => {
        preloadedRef.current.add(url);
        resolve();
      };
      img.onerror = () => resolve();
      img.decoding = "async";
      img.loading = "eager";
      img.src = url;
    });
  }, []);

  // Prefetch first batch after filters load
  useEffect(() => {
    if (!repeatedFilters.length) return;
    const firstBatch = repeatedFilters
      .slice(0, 8)
      .map((f) => f.image)
      .filter(Boolean);
    firstBatch.forEach((u) => preloadImage(u));
  }, [repeatedFilters, preloadImage]);

  // Prefetch neighbors when selection changes
  useEffect(() => {
    if (!selectedMeta || !repeatedFilters.length) return;
    const idx = repeatedFilters.findIndex((f) => f.id === selectedMeta.id);
    const windowSize = 4;
    for (
      let i = Math.max(0, idx - windowSize);
      i <= Math.min(repeatedFilters.length - 1, idx + windowSize);
      i++
    ) {
      preloadImage(repeatedFilters[i].image);
    }
  }, [selectedMeta, repeatedFilters, preloadImage]);

  // Helper to load Jeeliz scripts on demand
  const loadJeeliz = useCallback(() => {
    if (
      window.JEELIZFACEFILTER &&
      (window.JeelizResizer || window.JEELIZRESIZER || window.JEELIZRESIZER2)
    ) {
      return Promise.resolve();
    }
    const faceFilterSrc =
      "https://cdn.jsdelivr.net/gh/jeeliz/jeelizFaceFilter@latest/dist/jeelizFaceFilter.js";
    const resizerSrc =
      "https://cdn.jsdelivr.net/gh/jeeliz/jeelizFaceFilter@latest/helpers/JeelizResizer.js";
    const ensure = (src) =>
      new Promise((resolve, reject) => {
        // If already in DOM
        if (
          [...document.getElementsByTagName("script")].some(
            (s) => s.src === src
          )
        ) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });
    return ensure(faceFilterSrc).then(() => ensure(resizerSrc));
  }, []);

  // Init Jeeliz
  useEffect(() => {
    if (!canvasRef.current) return;

    let destroyed = false;

    loadJeeliz()
      .then(() => {
        const JZ = window.JEELIZFACEFILTER;
        const JR =
          window.JeelizResizer || window.JEELIZRESIZER || window.JEELIZRESIZER2;
        if (!JZ || !JR) return;

        JR.size_canvas({
          canvasId: "jeeFaceFilterCanvas",
          callback: function (isError, bestVideoSettings) {
            if (isError) {
              console.error("JeelizResizer error: ", isError);
              return;
            }
            try {
              // Configure camera based on facing mode
              bestVideoSettings.facingMode = facingMode;
              bestVideoSettings.flipX = facingMode === "user"; // Only flip for front camera
            } catch {}
            JZ.init({
              canvasId: "jeeFaceFilterCanvas",
              NNCPath:
                "https://cdn.jsdelivr.net/gh/jeeliz/jeelizFaceFilter@latest/neuralNets/",
              videoSettings: bestVideoSettings,
              followZRot: true,
              onWebcamGet: function () {
                setJeelizReady(true);
              },
              callbackReady: function (errCode, spec) {
                if (errCode) {
                  console.error("Jeeliz init error:", errCode);
                  return;
                }
                setJeelizReady(true);
              },
              callbackTrack: function (ds) {
                // Ensure the camera video is rendered into the WebGL canvas each frame
                try {
                  JZ.render_video();
                } catch {}
                // Save the latest detect state for overlay/capture
                detectStateRef.current = ds;
                // Update overlay position. Frames/Borders should show even without a face.
                const cont = overlayRef.current;
                const imgEl = overlayImgRef.current;
                const canvas = canvasRef.current;
                const width = canvas?.clientWidth || 0;
                const height = canvas?.clientHeight || 0;
                const category = imgEl?.dataset?.category || "general";

                if (cont && imgEl) {
                  // Always show frame/border overlays fullscreen
                  if (category === "frame" || category === "border") {
                    try {
                      cont.style.display = "block";
                      cont.style.position = "absolute";
                      cont.style.left = "0px";
                      cont.style.top = "0px";
                      cont.style.width = `${width}px`;
                      cont.style.height = `${height}px`;
                      cont.style.transform = "none";
                    } catch {}
                    return; // No face detection required
                  }

                  // For other categories, require a face to position the overlay
                  if (ds && ds.detected > 0.5) {
                    try {
                      cont.style.display = "block";
                    } catch {}
                    const s = Math.max(0, Math.min(1, ds.s || 0.3));
                    const centerX = (ds.x + 1) * 0.5 * width;
                    const centerY = (1 - (ds.y + 1) * 0.5) * height; // flip Y

                    let widthRatio = 1.4;
                    let heightRatio = 0.5;
                    let offsetY = 0;
                    if (category === "head") {
                      // Reduce hat size and keep it above the head
                      widthRatio = 2.2;
                      heightRatio = 2.2;
                      offsetY = -1.5;
                    } else if (category === "eyes") {
                      widthRatio = 3.5;
                      heightRatio = 1.5;
                      offsetY = -0.25;
                    } else if (category === "general") {
                      // Expand general stickers to cover the face area
                      widthRatio = 0.9;
                      heightRatio = 2.4;
                      offsetY = 0.0;
                    }

                    const frameW = s * width; // detection frame side
                    const overlayW = frameW * widthRatio;
                    const overlayH = frameW * heightRatio;

                    const px = centerX;
                    const py = centerY + offsetY * frameW;
                    const angleRad = ds.rz || 0; // rotation around Z

                    cont.style.position = "absolute";
                    cont.style.left = `${Math.round(px - overlayW / 2)}px`;
                    cont.style.top = `${Math.round(py - overlayH / 2)}px`;
                    cont.style.width = `${Math.round(overlayW)}px`;
                    cont.style.height = `${Math.round(overlayH)}px`;
                    cont.style.transformOrigin = "center center";
                    cont.style.transform = `rotate(${-angleRad}rad)`;
                  } else {
                    try {
                      cont.style.display = "none";
                    } catch {}
                  }
                }
              },
            });
          },
        });
      })
      .catch((e) => console.error("Failed to load Jeeliz scripts:", e));

    return () => {
      destroyed = true;
      try {
        if (window.JEELIZFACEFILTER && window.JEELIZFACEFILTER.destroy) {
          window.JEELIZFACEFILTER.destroy();
        }
      } catch {}
      scheduleCameraStop(0);
    };
  }, [cameraKey, facingMode]);

  // Reinitialize camera when returning to the app (fix black camera on resume)
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        try {
          if (window.JEELIZFACEFILTER && window.JEELIZFACEFILTER.destroy) {
            window.JEELIZFACEFILTER.destroy();
          }
        } catch {}
        setJeelizReady(false);
        setCameraKey((k) => k + 1);
      }
    };
    window.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleVisible);
    return () => {
      window.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleVisible);
    };
  }, []);

  // Toggle camera function
  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    // Reinitialize camera with new facing mode
    try {
      if (window.JEELIZFACEFILTER && window.JEELIZFACEFILTER.destroy) {
        window.JEELIZFACEFILTER.destroy();
      }
    } catch {}
    setJeelizReady(false);
    setCameraKey((k) => k + 1);
  }, []);

  const retakePhoto = useCallback(() => {
    setShowPreview(false);
    setCapturedImage(null);
  }, []);

  const saveImage = useCallback(() => {
    if (!capturedImage) return;
    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `photobooth-${Date.now()}.png`;
    link.click();
    setShowPreview(false);
    setCapturedImage(null);
  }, [capturedImage]);

  const capturePhoto = useCallback(async () => {
    const baseCanvas = canvasRef.current; // Jeeliz canvas
    if (!baseCanvas) return;

    const width = baseCanvas.width || baseCanvas.clientWidth;
    const height = baseCanvas.height || baseCanvas.clientHeight;

    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d");

    try {
      // Draw video (already rendered in Jeeliz canvas)
      ctx.drawImage(baseCanvas, 0, 0, width, height);

      // Draw overlay using its current DOM position and transform (more robust at snap time)
      const img = overlayImgRef.current;
      const container = overlayRef.current;
      const isCorsReady =
        img &&
        img.getAttribute &&
        img.getAttribute("data-cors-ready") === "true";
      // Helper to compute position and draw a given image element
      const drawWithContainerTransform = (imageEl) => {
        const contRect = container.getBoundingClientRect();
        const camRect = document
          .querySelector(".camera-view")
          ?.getBoundingClientRect();
        if (camRect) {
          const scaleX = width / camRect.width;
          const scaleY = height / camRect.height;
          const x = (contRect.left - camRect.left) * scaleX;
          const y = (contRect.top - camRect.top) * scaleY;
          const w = contRect.width * scaleX;
          const h = contRect.height * scaleY;

          // Parse rotation from computed style
          const style = window.getComputedStyle(container);
          const tf = style.transform;
          let angle = 0;
          if (tf && tf !== "none") {
            // Could be matrix() or rotate(<rad|deg>)
            const rotateMatch = tf.match(/rotate\(([-\d\.]+)(rad|deg)\)/);
            if (rotateMatch) {
              angle =
                rotateMatch[2] === "deg"
                  ? (parseFloat(rotateMatch[1]) * Math.PI) / 180
                  : parseFloat(rotateMatch[1]);
            } else {
              const m = tf.match(/matrix\(([^)]+)\)/);
              if (m) {
                const vals = m[1].split(",").map((v) => parseFloat(v.trim()));
                if (vals.length >= 4) angle = Math.atan2(vals[1], vals[0]);
              }
            }
          }

          ctx.save();
          ctx.translate(x + w / 2, y + h / 2);
          ctx.rotate(angle);
          ctx.drawImage(imageEl, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      };

      if (img && container && isCorsReady) {
        drawWithContainerTransform(img);
      } else if (img && container) {
        // Try to load a CORS-safe version (proxy only for non-S3 URLs)
        try {
          const currentSrc = img.getAttribute("src") || "";
          const rawUrl = selectedMeta?.originalImage || currentSrc;
          const isS3Url = rawUrl.includes(".s3.") || rawUrl.includes(".s3-");
          const origin = window.location.origin;

          let proxySrc = currentSrc;
          // Only proxy non-S3 URLs since S3 has public-read ACL and CORS configured
          if (!currentSrc.includes("/photobooth/filters/proxy") && !isS3Url) {
            const encoded = encodeURIComponent(rawUrl);
            proxySrc = `${origin}/api/photobooth/filters/proxy?url=${encoded}`;
          } else if (isS3Url) {
            // Use S3 URL directly - it has proper ACL and CORS
            proxySrc = rawUrl;
          }

          const tmpImg = new Image();
          tmpImg.crossOrigin = "anonymous";
          const loaded = await new Promise((resolve, reject) => {
            tmpImg.onload = () => resolve(true);
            tmpImg.onerror = () => reject(new Error("Overlay load failed"));
            tmpImg.src = proxySrc;
          });
          if (loaded) {
            drawWithContainerTransform(tmpImg);
          }
        } catch (loadErr) {
          console.warn("Could not load CORS-safe overlay:", loadErr);
        }
      }

      const png = out.toDataURL("image/png");
      setCapturedImage(png);
      setShowPreview(true);
    } catch (error) {
      console.error("Capture error:", error);
      if (error.name === "SecurityError") {
        try {
          // Create a clean canvas and draw ONLY the Jeeliz base canvas (no overlay)
          const baseCanvas = canvasRef.current;
          const clean = document.createElement("canvas");
          clean.width = width;
          clean.height = height;
          const cctx = clean.getContext("2d");
          cctx.drawImage(baseCanvas, 0, 0, width, height);
          const fallback = clean.toDataURL("image/png");
          setCapturedImage(fallback);
          setShowPreview(true);
          setTimeout(() => {
            setNotification({
              isOpen: true,
              type: "info",
              title: "Photo captured",
              message:
                "Filter overlay couldn't be included due to technical restrictions.",
            });
          }, 50);
        } catch (e2) {
          console.error("Fallback capture failed:", e2);
          setNotification({
            isOpen: true,
            type: "error",
            title: "Capture failed",
            message: "Unable to capture photo. Please try again.",
          });
        }
      } else {
        setNotification({
          isOpen: true,
          type: "error",
          title: "Capture failed",
          message: "Unable to capture photo. Please try again.",
        });
      }
    }
  }, [detectStateRef, selectedMeta]);

  // Prevent page scrolling when Photobooth is active (PWA-friendly)
  useEffect(() => {
    try {
      document.body.classList.add("photobooth-active");
    } catch (_) {}
    return () => {
      try {
        document.body.classList.remove("photobooth-active");
      } catch (_) {}
    };
  }, []);

  return (
    <div className="photobooth-container">
      <PhotoboothTourAutostart ready={jeelizReady} />
      <div className="phone-frame">
        <div
          className="absolute top-0 left-0 w-full z-[200]"
          style={{
            paddingTop: "max(env(safe-area-inset-top), 16px)",
            paddingBottom: "12px",
            paddingLeft: "16px",
            paddingRight: "16px",
            display: showPreview ? "none" : "block",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/40 active:bg-black/50 transition-all duration-200 cursor-pointer"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = "/";
                }
              }}
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-all active:scale-90"
              onClick={toggleCamera}
              title={
                facingMode === "user"
                  ? "Switch to Rear Camera"
                  : "Switch to Front Camera"
              }
              aria-label="Switch camera"
            >
              <SwitchCamera size={20} />
            </button>
            <button
              className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white text-2xl hover:bg-black/40 transition-all active:scale-90"
              onClick={() => window.location.reload()}
              title="Refresh"
              aria-label="Refresh camera"
            >
              ↻
            </button>
          </div>
        </div>

        <div
          className="camera-view"
          style={{ display: showPreview ? "none" : "block" }}
        >
          <canvas
            ref={canvasRef}
            id="jeeFaceFilterCanvas"
            key={cameraKey}
            width="600"
            height="600"
            style={{ width: "100%", height: "100%", display: "block" }}
          />

          {/* Overlay image positioned by Jeeliz detectState */}
          {selectedMeta && (
            <div className="overlay-container">
              <div
                ref={overlayRef}
                style={{ position: "absolute", zIndex: 90, display: "none" }}
              >
                <img
                  ref={overlayImgRef}
                  src={selectedMeta.image}
                  alt="overlay"
                  crossOrigin="anonymous"
                  data-category={selectedMeta?.category || "general"}
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                  onLoad={(e) => {
                    const src = e.currentTarget.getAttribute("src") || "";
                    // Trust our backend proxy path as CORS-ready
                    if (src.includes("/photobooth/filters/proxy")) {
                      e.currentTarget.setAttribute("data-cors-ready", "true");
                      return;
                    }
                    // Fallback: small canvas test
                    try {
                      const testCanvas = document.createElement("canvas");
                      testCanvas.width = 1;
                      testCanvas.height = 1;
                      const tctx = testCanvas.getContext("2d");
                      tctx.drawImage(e.currentTarget, 0, 0, 1, 1);
                      testCanvas.toDataURL();
                      e.currentTarget.setAttribute("data-cors-ready", "true");
                    } catch {
                      e.currentTarget.setAttribute("data-cors-ready", "false");
                    }
                  }}
                  onError={(e) => {
                    // If proxy fails, try original S3 URL for display (capture will skip if not CORS-ready)
                    const currentSrc =
                      e.currentTarget.getAttribute("src") || "";
                    if (
                      selectedMeta?.originalImage &&
                      currentSrc.includes("/photobooth/filters/proxy")
                    ) {
                      e.currentTarget.setAttribute(
                        "src",
                        selectedMeta.originalImage
                      );
                      e.currentTarget.setAttribute("data-cors-ready", "false");
                      return;
                    }
                    // Give up: mark as failed
                    e.currentTarget.setAttribute("data-cors-ready", "failed");
                    e.currentTarget.style.display = "none";
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit:
                      selectedMeta.category === "frame" ||
                      selectedMeta.category === "border"
                        ? "fill"
                        : "contain",
                  }}
                />
              </div>
            </div>
          )}

          {/* Loading states */}
          {!jeelizReady && (
            <div className="loading-overlay">
              <div className="spinner" />
              <div className="loading-text">Initializing camera...</div>
            </div>
          )}
          {filtersLoading && jeelizReady && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm z-10">
              Loading filters...
            </div>
          )}
        </div>

        {/* Bottom slider with capture */}
        {!showPreview && (
          <div className="bottom-controls">
            <PhotoboothSlider
              repeatedFilters={repeatedFilters}
              selectedFilterId={selectedFilterId}
              setSelectedFilterId={setSelectedFilterId}
              onCapture={capturePhoto}
              webcamReady={jeelizReady}
            />
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && capturedImage && (
          <div className="preview-modal">
            <div className="preview-header">
              <h2 className="preview-title">Preview</h2>
              <button
                onClick={retakePhoto}
                className="preview-close"
                aria-label="Close preview"
              >
                <X size={28} />
              </button>
            </div>
            <div className="preview-image-wrapper">
              <img
                src={capturedImage}
                alt="Captured"
                className="preview-image"
              />
            </div>
            <div className="preview-actions">
              <div className="action-bar">
                <button onClick={retakePhoto} className="btn btn-secondary">
                  <RotateCcw size={20} />
                  <span>Retake</span>
                </button>
                <button onClick={saveImage} className="btn btn-primary">
                  <Download size={20} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}

function PhotoboothTourAutostart({ ready }) {
  const { startTour, isTourRunning, hasCompletedTour } = useTour();
  const didAutoStartRef = React.useRef(false);
  useEffect(() => {
    if (didAutoStartRef.current) return;
    if (!hasCompletedTour && ready && !isTourRunning) {
      didAutoStartRef.current = true;
      setTimeout(() => {
        startTour();
      }, 600);
    }
  }, [hasCompletedTour, ready, isTourRunning, startTour]);
  return null;
}
