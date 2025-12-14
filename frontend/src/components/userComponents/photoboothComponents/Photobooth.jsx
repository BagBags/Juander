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
  const videoElRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fallbackVideoRef = useRef(null);

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
  const lastInitRef = useRef(0);

  const ensureCanvasDimensions = useCallback(() => {
    const el = document.getElementById("jeeFaceFilterCanvas");
    if (!el) return false;
    try {
      const parent = el.parentElement;
      const rect =
        typeof el.getBoundingClientRect === "function"
          ? el.getBoundingClientRect()
          : null;
      const pRect =
        parent && typeof parent.getBoundingClientRect === "function"
          ? parent.getBoundingClientRect()
          : null;
      const targetW = Math.round(
        (rect && rect.width) || el.clientWidth || (pRect && pRect.width) || 600
      );
      const targetH = Math.round(
        (rect && rect.height) ||
          el.clientHeight ||
          (pRect && pRect.height) ||
          600
      );
      if (!el.width || el.width === 0) el.width = targetW;
      if (!el.height || el.height === 0) el.height = targetH;
      if (!el.style.width) el.style.width = "100%";
      if (!el.style.height) el.style.height = "100%";
    } catch {}
    return true;
  }, []);

  const getSafeCanvasSize = useCallback(() => {
    const el = document.getElementById("jeeFaceFilterCanvas");
    const parent = el?.parentElement || null;
    const rect =
      el && typeof el.getBoundingClientRect === "function"
        ? el.getBoundingClientRect()
        : null;
    const pRect =
      parent && typeof parent.getBoundingClientRect === "function"
        ? parent.getBoundingClientRect()
        : null;
    const w = Math.round(
      (rect && rect.width) ||
        (el ? el.clientWidth : 0) ||
        (pRect && pRect.width) ||
        600
    );
    const h = Math.round(
      (rect && rect.height) ||
        (el ? el.clientHeight : 0) ||
        (pRect && pRect.height) ||
        600
    );
    return { width: w, height: h };
  }, []);

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

  useEffect(() => {
    loadJeeliz().catch(() => {});
  }, [loadJeeliz]);

  // Init Jeeliz
  useEffect(() => {
    if (!canvasRef.current) return;

    let destroyed = false;

    const preflightChooseMode = async () => {
      if (facingMode !== "user") setFacingMode("user");
      return "user";
    };

    preflightChooseMode()
      .then(() => loadJeeliz())
      .then(() => {
        const JZ = window.JEELIZFACEFILTER;
        let JR =
          window.JeelizResizer || window.JEELIZRESIZER || window.JEELIZRESIZER2;
        if (!JZ) return;
        if (!JR) {
          JR = {
            size_canvas: (opts) => {
              try {
                const id = opts && opts.canvasId;
                const el = id ? document.getElementById(id) : null;
                const rect =
                  el && typeof el.getBoundingClientRect === "function"
                    ? el.getBoundingClientRect()
                    : { width: 600, height: 600 };
                const bestVideoSettings = {
                  facingMode,
                  width: { ideal: Math.max(320, Math.round(rect.width)) },
                  height: { ideal: Math.max(240, Math.round(rect.height)) },
                };
                if (opts && typeof opts.callback === "function") {
                  opts.callback(false, bestVideoSettings);
                }
              } catch (e) {
                if (opts && typeof opts.callback === "function") {
                  opts.callback("resizer_missing");
                }
              }
            },
          };
          window.JeelizResizer = JR;
        }
        try {
          if (!JR.__safeWrapped && typeof JR.size_canvas === "function") {
            const origSize = JR.size_canvas.bind(JR);
            JR.size_canvas = (opts) => {
              try {
                const id = opts && opts.canvasId;
                const el = id ? document.getElementById(id) : null;
                if (!el) {
                  if (opts && typeof opts.callback === "function") {
                    opts.callback("canvas_missing");
                  }
                  return;
                }
              } catch {}
              return origSize(opts);
            };
            JR.__safeWrapped = true;
          }
        } catch {}
        try {
          if (!JZ.__renderWrapped && typeof JZ.render_video === "function") {
            const origRender = JZ.render_video.bind(JZ);
            JZ.render_video = () => {
              if (destroyed) return;
              const el = document.getElementById("jeeFaceFilterCanvas");
              if (!el) return;
              ensureCanvasDimensions();
              try {
                return origRender();
              } catch (e) {}
            };
            JZ.__renderWrapped = true;
          }
        } catch (e) {}
        let initAttempts = 0;
        const tryInit = () => {
          if (destroyed) return;
          const canvasEl = document.getElementById("jeeFaceFilterCanvas");
          if (!canvasEl) {
            initAttempts += 1;
            const d = Math.min(500, 100 + initAttempts * 50);
            setTimeout(() => {
              if (!destroyed) tryInit();
            }, d);
            return;
          }
          const rect =
            canvasEl && typeof canvasEl.getBoundingClientRect === "function"
              ? canvasEl.getBoundingClientRect()
              : { width: 0, height: 0 };
          const parentRect =
            canvasEl?.parentElement &&
            typeof canvasEl.parentElement.getBoundingClientRect === "function"
              ? canvasEl.parentElement.getBoundingClientRect()
              : { width: 0, height: 0 };
          const vh = Math.max(
            window.innerHeight || 0,
            document.documentElement.clientHeight || 0
          );
          const vw = Math.max(
            window.innerWidth || 0,
            document.documentElement.clientWidth || 0
          );
          const isVisible = document.visibilityState === "visible";
          const hasSize =
            rect.width > 0 &&
            rect.height > 0 &&
            parentRect &&
            parentRect.width > 0 &&
            parentRect.height > 0 &&
            vh > 0 &&
            vw > 0;
          if (!hasSize || !isVisible) {
            initAttempts += 1;
            const d = Math.min(600, 120 + initAttempts * 60);
            setTimeout(() => {
              if (!destroyed) tryInit();
            }, d);
            return;
          }
          requestAnimationFrame(() => {
            ensureCanvasDimensions();
            const preflight =
              navigator.mediaDevices && navigator.mediaDevices.getUserMedia
                ? navigator.mediaDevices
                    .getUserMedia({ video: { facingMode }, audio: false })
                    .then((s) => {
                      try {
                        s.getTracks().forEach((t) => t.stop());
                      } catch {}
                    })
                    .catch(() => {})
                : Promise.resolve();
            preflight.then(() => {
              JR.size_canvas({
                canvasId: "jeeFaceFilterCanvas",
                callback: function (isError, bestVideoSettings) {
                  if (destroyed) return;
                  if (isError) {
                    console.error("JeelizResizer error: ", isError);
                    return;
                  }
                  try {
                    bestVideoSettings.facingMode = facingMode;
                    bestVideoSettings.flipX = facingMode === "user";
                  } catch (e) {}
                  if (destroyed) return;
                  JZ.init({
                    canvasId: "jeeFaceFilterCanvas",
                    NNCPath:
                      "https://cdn.jsdelivr.net/gh/jeeliz/jeelizFaceFilter@latest/neuralNets/",
                    videoSettings: bestVideoSettings,
                    followZRot: true,
                    onWebcamGet: function () {
                      if (destroyed) return;
                      try {
                        lastInitRef.current = Date.now();
                      } catch {}
                      setJeelizReady(true);
                    },
                    callbackReady: function (errCode, spec) {
                      if (destroyed) return;
                      if (errCode) {
                        console.error("Jeeliz init error:", errCode);
                        try {
                          if (facingMode === "environment") {
                            setFacingMode("user");
                          } else {
                            setFacingMode("environment");
                          }
                          setCameraKey((k) => k + 1);
                        } catch (e) {}
                        return;
                      }
                      setJeelizReady(true);
                      try {
                        videoElRef.current =
                          spec && spec.videoElement ? spec.videoElement : null;
                        mediaStreamRef.current =
                          videoElRef.current && videoElRef.current.srcObject
                            ? videoElRef.current.srcObject
                            : null;
                        const fv = fallbackVideoRef.current;
                        if (fv && mediaStreamRef.current) {
                          try {
                            fv.srcObject = mediaStreamRef.current;
                            fv.muted = true;
                            fv.autoplay = true;
                            fv.playsInline = true;
                            fv.style.transform =
                              facingMode === "user" ? "scaleX(-1)" : "none";
                            const p = fv.play && fv.play();
                            if (p && typeof p.catch === "function") {
                              p.catch(() => {});
                            }
                          } catch (e) {}
                        }
                      } catch (e) {}
                    },
                    callbackTrack: function (ds) {
                      if (destroyed) return;
                      const canvasEl = document.getElementById(
                        "jeeFaceFilterCanvas"
                      );
                      if (!canvasEl) return;
                      try {
                        JZ.render_video();
                      } catch {}
                      detectStateRef.current = ds;
                      const cont = overlayRef.current;
                      const imgEl = overlayImgRef.current;
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      ensureCanvasDimensions();
                      const { width, height } = getSafeCanvasSize();
                      const category = imgEl?.dataset?.category || "general";

                      if (cont && imgEl) {
                        if (category === "frame" || category === "border") {
                          try {
                            cont.style.display = "block";
                            cont.style.position = "absolute";
                            cont.style.left = "0px";
                            cont.style.top = "0px";
                            cont.style.width = `${width}px`;
                            cont.style.height = `${height}px`;
                            cont.style.transform = "none";
                          } catch (e) {}
                          return;
                        }

                        if (ds && ds.detected > 0.5) {
                          try {
                            cont.style.display = "block";
                          } catch (e) {}
                          const s = Math.max(0, Math.min(1, ds.s || 0.3));
                          const centerX = (ds.x + 1) * 0.5 * width;
                          const centerY = (1 - (ds.y + 1) * 0.5) * height;

                          let widthRatio = 1.4;
                          let heightRatio = 0.5;
                          let offsetY = 0;
                          if (category === "head") {
                            widthRatio = 2.2;
                            heightRatio = 2.2;
                            offsetY = 1.7;
                          } else if (category === "eyes") {
                            widthRatio = 3.5;
                            heightRatio = 1.5;
                            offsetY = -0.25;
                          } else if (category === "general") {
                            widthRatio = 0.9;
                            heightRatio = 2.4;
                            offsetY = 0.0;
                          }

                          const frameW = s * width;
                          const overlayW = frameW * widthRatio;
                          const overlayH = frameW * heightRatio;

                          let px = centerX;
                          let py = centerY + offsetY * frameW;
                          const angleRad = ds.rz || 0;
                          const rotateRad =
                            facingMode === "user" ? -angleRad : angleRad;
                          if (category === "head") {
                            const o = offsetY * frameW;
                            const dx = Math.sin(rotateRad) * o;
                            const dy = -Math.cos(rotateRad) * o;
                            px = centerX + dx;
                            py = centerY + dy;
                          }

                          cont.style.position = "absolute";
                          cont.style.left = `${Math.round(
                            px - overlayW / 2
                          )}px`;
                          cont.style.top = `${Math.round(py - overlayH / 2)}px`;
                          cont.style.width = `${Math.round(overlayW)}px`;
                          cont.style.height = `${Math.round(overlayH)}px`;
                          cont.style.transformOrigin = "center center";
                          cont.style.transform = `rotate(${rotateRad}rad)`;
                        } else {
                          try {
                            cont.style.display = "none";
                          } catch (e) {}
                        }
                      }
                    },
                  });
                },
              });
            });
          });
        };
        tryInit();
      })
      .catch((e) => console.error("Failed to load Jeeliz scripts:", e));

    return () => {
      destroyed = true;
      try {
        if (window.JEELIZFACEFILTER && window.JEELIZFACEFILTER.destroy) {
          window.JEELIZFACEFILTER.destroy();
        }
      } catch {}
      try {
        const v = videoElRef.current;
        const s = mediaStreamRef.current || (v && v.srcObject);
        if (s && typeof s.getTracks === "function") {
          s.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch {}
          });
        }
        if (v) {
          try {
            v.pause && v.pause();
          } catch {}
          try {
            v.srcObject = null;
          } catch {}
          try {
            v.removeAttribute("src");
          } catch {}
          try {
            v.load && v.load();
          } catch {}
        }
        try {
          const fv = fallbackVideoRef.current;
          if (fv) {
            try {
              fv.pause && fv.pause();
            } catch {}
            try {
              fv.srcObject = null;
            } catch {}
            try {
              fv.removeAttribute("src");
            } catch {}
            try {
              fv.load && fv.load();
            } catch {}
          }
        } catch {}
      } catch {}
    };
  }, [cameraKey, facingMode]);

  useEffect(() => {
    const hardStop = () => {
      try {
        if (window.JEELIZFACEFILTER && window.JEELIZFACEFILTER.destroy) {
          window.JEELIZFACEFILTER.destroy();
        }
      } catch {}
      try {
        const v = videoElRef.current;
        const s = mediaStreamRef.current || (v && v.srcObject);
        if (s && typeof s.getTracks === "function") {
          s.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch {}
          });
        }
        if (v) {
          try {
            v.pause && v.pause();
          } catch {}
          try {
            v.srcObject = null;
          } catch {}
          try {
            v.removeAttribute("src");
          } catch {}
          try {
            v.load && v.load();
          } catch {}
        }
      } catch {}
      try {
        delete window.JEELIZFACEFILTER;
        delete window.JeelizResizer;
        delete window.JEELIZRESIZER;
        delete window.JEELIZRESIZER2;
      } catch {}
    };
    window.addEventListener("pagehide", hardStop);
    window.addEventListener("beforeunload", hardStop);
    return () => {
      window.removeEventListener("pagehide", hardStop);
      window.removeEventListener("beforeunload", hardStop);
    };
  }, []);

  // Reinitialize camera when returning to the app (fix black camera on resume)
  useEffect(() => {
    const handleVisible = async () => {
      if (document.visibilityState !== "visible" || !jeelizReady) return;
      try {
        const now = Date.now();
        const last = lastInitRef.current || 0;
        if (now - last < 2000) return;
      } catch {}
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        try {
          s.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch {}
          });
        } catch {}
      } catch {}
      try {
        if (window.JEELIZFACEFILTER && window.JEELIZFACEFILTER.destroy) {
          window.JEELIZFACEFILTER.destroy();
        }
      } catch {}
      setJeelizReady(false);
      setCameraKey((k) => k + 1);
    };

    window.addEventListener("visibilitychange", handleVisible);
    return () => {
      window.removeEventListener("visibilitychange", handleVisible);
    };
  }, [jeelizReady]);

  // Toggle camera function
  const toggleCamera = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    try {
      if (window.JEELIZFACEFILTER && window.JEELIZFACEFILTER.destroy) {
        window.JEELIZFACEFILTER.destroy();
      }
    } catch {}
    try {
      const fv = fallbackVideoRef.current;
      if (fv) {
        fv.style.transform = next === "user" ? "scaleX(-1)" : "none";
      }
    } catch {}
    setJeelizReady(false);
    setCameraKey((k) => k + 1);
  }, [facingMode]);

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
    const { width, height } = getSafeCanvasSize();

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
          style={{
            opacity: showPreview ? 0 : 1,
            pointerEvents: showPreview ? "none" : "auto",
          }}
        >
          <video
            ref={fallbackVideoRef}
            className="webcam"
            muted
            playsInline
            autoPlay
            aria-hidden="true"
          />
          <canvas
            ref={canvasRef}
            id="jeeFaceFilterCanvas"
            width="600"
            height="600"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              position: "relative",
              zIndex: 1,
            }}
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
