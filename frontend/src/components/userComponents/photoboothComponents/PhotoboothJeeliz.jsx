import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import Webcam from "react-webcam";
import "@tensorflow/tfjs-backend-webgl";
import axios from "axios";
import { Camera, RotateCcw, Download, X } from "lucide-react";

import PhotoboothSlider from "./photoboothSlider";
import { baseFilters } from "./basefilter";
import { loadFaceModel } from "./model";
import { setupFaceDetection } from "./facedetect";
import Overlays from "./overlay";
import "../../../Photobooth.css";

export default function PhotoboothJeeliz() {
  const webcamRef = useRef(null);
  const sliderRef = useRef(null);
  const overlayRef = useRef(null);
  const [model, setModel] = useState(null);
  const [faces, setFaces] = useState([]);
  const [selectedFilterId, setSelectedFilterId] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [filters, setFilters] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState(null);
  const [modelError, setModelError] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cameraKey, setCameraKey] = useState(0); // force remount of webcam when returning

  // Video element reference for actual dimensions
  const [videoElement, setVideoElement] = useState(null);

  // Dynamic video dimensions that adapt to screen size
  const [videoDims, setVideoDims] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Note: videoDims is now set from the actual video stream in handleWebcamLoad
  // We don't use window dimensions anymore because face detection coordinates
  // are in video stream space, not window space

  // ✅ Preload images for better performance
  const preloadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(url);
      img.src = url;
    });
  };

  // ✅ Load filters from backend with optimizations
  useEffect(() => {
    const fetchFilters = async () => {
      setFiltersLoading(true);
      setFiltersError(null);

      try {
        // Start with base filters immediately for instant UI
        setFilters(baseFilters);

        const res = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/photobooth/filters`,
          { timeout: 8000 }
        );

        if (res.data && res.data.length > 0) {
          const BACKEND_URL =
            import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
            "http://localhost:5000";

          const normalized = res.data.map((f) => {
            let imageUrl = f.image || f.imageUrl;

            // Use S3 URL directly
            if (imageUrl && !imageUrl.startsWith("http")) {
              imageUrl = `${BACKEND_URL}${
                imageUrl.startsWith("/") ? "" : "/"
              }${imageUrl}`;
            }

            // Fix URL encoding issues for S3 URLs with special characters
            if (
              imageUrl &&
              imageUrl.includes("s3.ap-southeast-2.amazonaws.com")
            ) {
              try {
                // Properly encode the URL path while preserving the domain
                const url = new URL(imageUrl);
                const pathParts = url.pathname.split("/");
                const encodedPath = pathParts
                  .map((part) => encodeURIComponent(part))
                  .join("/");
                imageUrl = `${url.protocol}//${url.host}${encodedPath}`;
              } catch (urlError) {
                console.warn(
                  "Failed to fix URL encoding for:",
                  imageUrl,
                  urlError
                );
              }
            }

            return {
              ...f,
              label: f.label || f.name,
              value: f.value || f.name.toLowerCase().replace(/\s+/g, "-"),
              image: imageUrl,
              category: f.category || "general",
              id:
                f._id ||
                f.id ||
                f.value ||
                `filter-${Date.now()}-${Math.random()}`,
            };
          });

          const allFilters = [...baseFilters, ...normalized];

          // Preload all filter images in parallel
          const preloadPromises = allFilters.map((f) =>
            preloadImage(f.image).catch((err) => {
              console.warn(`Failed to preload ${f.label}:`, err);
              return null;
            })
          );

          // Wait for images to load (with shorter timeout)
          await Promise.race([
            Promise.allSettled(preloadPromises),
            new Promise((resolve) => setTimeout(resolve, 1500)), // Max 1.5s wait
          ]);

          console.log(
            `✅ Loaded ${allFilters.length} filters (${normalized.length} from backend)`
          );
          setFilters(allFilters);
        } else {
          console.log("No backend filters, using base filters only");
        }
      } catch (err) {
        console.error("Failed to fetch backend filters:", err);
        setFiltersError("Some filters may be unavailable");
        // Keep base filters that were already set
      } finally {
        setFiltersLoading(false);
      }
    };

    fetchFilters();
  }, []);

  const repeatedFilters = useMemo(
    () =>
      filters.map((f, i) => ({
        ...f,
        id: f._id || f.id || f.value || `filter-${i}`,
      })),
    [filters]
  );

  const selectedMeta = repeatedFilters.find((f) => f.id === selectedFilterId);
  const selectedValue = selectedMeta?.value || null;

  // ✅ Load face model
  useEffect(() => {
    console.log("Starting to load face detection model...");
    loadFaceModel()
      .then((loadedModel) => {
        console.log("Face model loaded successfully:", loadedModel);
        setModel(loadedModel);
        setModelError(false);
      })
      .catch((err) => {
        console.error("Failed to load face model:", err);
        console.error("Error details:", err.message);
        setModelError(true);
        // Don't block the app, filters can still work without face tracking
        console.warn(
          "Photobooth will work with limited functionality (no face tracking)"
        );
      });
  }, []);

  // ✅ Face detection loop
  useEffect(() => {
    if (model && webcamReady && webcamRef.current) {
      console.log("Starting face detection loop...");
      const cleanup = setupFaceDetection(
        model,
        webcamRef,
        (faces) => {
          if (!isDragging) {
            setFaces(faces);
            if (faces.length > 0) {
              console.log("Faces detected and set:", faces.length);
            }
          }
        },
        isDragging
      );
      return cleanup;
    }
  }, [model, webcamReady, isDragging]);

  const handleWebcamLoad = useCallback(() => {
    setWebcamReady(true);
    // Store video element reference and update dimensions
    if (webcamRef.current && webcamRef.current.video) {
      const video = webcamRef.current.video;
      setVideoElement(video);

      // Use actual video stream dimensions for face detection coordinates
      const updateVideoDims = () => {
        if (video.videoWidth && video.videoHeight) {
          const dims = {
            width: video.videoWidth,
            height: video.videoHeight,
          };
          setVideoDims(dims);
          console.log("✅ Video stream dimensions updated:", dims);
        } else {
          console.log("⚠️ Video dimensions not ready yet, retrying...");
          // Retry after a short delay
          setTimeout(updateVideoDims, 100);
        }
      };

      // Try multiple times to ensure we get the dimensions
      updateVideoDims();
      video.addEventListener("loadedmetadata", updateVideoDims);
      video.addEventListener("playing", updateVideoDims);

      // Also retry after a delay as fallback
      setTimeout(updateVideoDims, 500);
    }
  }, []);

  const handleSliderDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleSliderDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Capture photo with filter overlay (Snapchat-style)
  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return;

    // Get video element
    const video = webcamRef.current.video;
    if (!video) return;

    // Get actual video stream dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Create canvas with video's actual dimensions to prevent stretching
    const canvas = document.createElement("canvas");
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext("2d");

    // Draw mirrored video at its native resolution
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
    ctx.restore();

    // If filter is selected, draw it on top using the actual displayed overlay
    if (selectedMeta) {
      const overlayContainer = document.querySelector(".overlay-container");

      if (overlayContainer) {
        // Get all overlay images that are currently displayed
        const overlayImages = overlayContainer.querySelectorAll("img");

        // Check if any images are not CORS-ready before proceeding
        const nonCorsImages = Array.from(overlayImages).filter((img) => {
          const corsStatus = img.getAttribute("data-cors-ready");
          return corsStatus !== "true";
        });

        const failedImages = Array.from(overlayImages).filter(
          (img) => img.getAttribute("data-cors-ready") === "failed"
        );

        if (nonCorsImages.length > 0) {
          console.warn(
            "Found non-CORS images, will skip overlay drawing to prevent canvas tainting:",
            nonCorsImages.map((img) => ({
              src: img.src,
              status: img.getAttribute("data-cors-ready"),
            }))
          );
        }

        if (failedImages.length > 0) {
          console.error(
            "Some filter images failed to load completely:",
            failedImages.map((img) => img.src)
          );
        }

        overlayImages.forEach((img) => {
          try {
            // Check if image is CORS-ready for canvas operations
            const corsReady = img.getAttribute("data-cors-ready") === "true";
            if (!corsReady) {
              console.warn("Skipping non-CORS image in canvas:", img.src);
              return; // Skip this image to avoid CORS errors
            }

            const parent = img.parentElement;
            const parentStyle = window.getComputedStyle(parent);
            const position = parentStyle.position;

            // Check if this is a full-screen border/frame (position: fixed)
            if (position === "fixed") {
              // For fixed position borders, draw at full canvas size
              ctx.save();
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              ctx.restore();
            } else {
              // For face-tracking overlays, calculate relative position
              const rect = parent.getBoundingClientRect();
              const cameraRect = document
                .querySelector(".camera-view")
                .getBoundingClientRect();

              // Calculate scale factor between canvas and display
              const scaleX = canvas.width / cameraRect.width;
              const scaleY = canvas.height / cameraRect.height;

              // Calculate position relative to camera and scale to canvas

              const x = (rect.left - cameraRect.left) * scaleX;
              const y = (rect.top - cameraRect.top) * scaleY;
              const width = rect.width * scaleX;
              const height = rect.height * scaleY;

              // Get transform matrix
              const transform = parentStyle.transform;

              ctx.save();

              // Move to the center of where the overlay should be
              ctx.translate(x + width / 2, y + height / 2);

              // Apply rotation if exists
              if (
                transform &&
                transform !== "none" &&
                transform !== "matrix(1, 0, 0, 1, 0, 0)"
              ) {
                const matrix = transform.match(/matrix\(([^)]+)\)/);
                if (matrix) {
                  const values = matrix[1].split(", ").map(parseFloat);
                  const angle = Math.atan2(values[1], values[0]);
                  ctx.rotate(angle);
                }
              }

              // Draw the image (already loaded in DOM)
              ctx.drawImage(img, -width / 2, -height / 2, width, height);
              ctx.restore();
            }
          } catch (err) {
            console.error("Error drawing overlay:", err);
          }
        });
      }
    }

    // Convert to image
    try {
      const finalImage = canvas.toDataURL("image/png");
      setCapturedImage(finalImage);
      setShowPreview(true);
    } catch (error) {
      console.error("Canvas error:", error);
      if (error.name === "SecurityError") {
        // CORS error occurred - create a fallback photo without filter overlay
        console.log(
          "Creating fallback photo without filter overlay due to CORS restrictions"
        );

        try {
          // Create a new clean canvas with just the video
          const fallbackCanvas = document.createElement("canvas");
          fallbackCanvas.width = videoWidth;
          fallbackCanvas.height = videoHeight;
          const fallbackCtx = fallbackCanvas.getContext("2d");

          // Draw only the mirrored video (no overlays)
          fallbackCtx.save();
          fallbackCtx.scale(-1, 1);
          fallbackCtx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
          fallbackCtx.restore();

          const fallbackImage = fallbackCanvas.toDataURL("image/png");
          setCapturedImage(fallbackImage);
          setShowPreview(true);

          // Show user-friendly message
          setTimeout(() => {
            alert(
              "Photo captured successfully! Note: Filter overlay couldn't be included due to technical restrictions, but the filter displays correctly during use."
            );
          }, 100);
        } catch (fallbackError) {
          console.error("Fallback capture also failed:", fallbackError);
          alert(
            "Unable to capture photo. Please try again or contact support."
          );
        }
      } else {
        alert("Unable to capture photo. Please try again.");
      }
    }
  }, [selectedMeta]);

  // Save image to device (prefer OS share sheet to reach Gallery/Photos)
  const saveImage = useCallback(async () => {
    if (!capturedImage) return;
    try {
      const blob = await (await fetch(capturedImage)).blob();
      const filename = `photobooth-${Date.now()}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Photobooth", text: "Juander photo" });
        // Close preview after share
        setShowPreview(false);
        setCapturedImage(null);
        return;
      }

      // Fallback: local download without leaving app context
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setShowPreview(false);
      setCapturedImage(null);
    } catch (err) {
      console.error("Save/share failed:", err);
      alert("Unable to save. Try using the share icon in your browser to save the image.");
    }
  }, [capturedImage]);

  // Re-initialize camera when returning to app (fixes black camera after download/share)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setCameraKey((k) => k + 1); // force Webcam remount
      }
    };
    window.addEventListener("focus", handleVisibility);
    window.addEventListener("pageshow", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleVisibility);
      window.removeEventListener("pageshow", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setShowPreview(false);
    setCapturedImage(null);
  }, []);

  return (
    <div className="photobooth-container">
      <div className="phone-frame">
        {/* ✅ Back button + refresh - Transparent background */}
        <div
          className="absolute top-0 left-0 w-full z-[200]"
          style={{
            paddingTop: "max(env(safe-area-inset-top), 16px)",
            paddingBottom: "12px",
            paddingLeft: "16px",
            paddingRight: "16px",
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
          <Webcam
            ref={webcamRef}
            audio={false}
            className="webcam"
            key={cameraKey}
            width={videoDims.width}
            height={videoDims.height}
            onUserMedia={handleWebcamLoad}
            onUserMediaError={(err) => console.error("Webcam error:", err)}
            videoConstraints={{
              facingMode: "user",
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 30 },
            }}
            screenshotFormat="image/jpeg"
            mirrored={true}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* ✅ Show overlays if filter selected */}
          {selectedMeta && !showPreview && (
            <div className="overlay-container">
              <Overlays
                faces={faces}
                videoDims={videoDims}
                selectedValue={selectedValue}
                selectedMeta={selectedMeta}
              />
            </div>
          )}

          {/* ✅ Loading states */}
          {!model && !modelError && (
            <div className="loading-overlay">
              <div className="spinner" />
              <div className="loading-text">
                Loading face detection model...
              </div>
            </div>
          )}
          {modelError && webcamReady && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-600/90 text-white px-4 py-2 rounded-lg text-sm z-10 max-w-xs text-center">
              Face tracking unavailable. Border filters will still work.
            </div>
          )}
          {!webcamReady && (
            <div className="loading-overlay">
              <div className="loading-text">Initializing camera...</div>
            </div>
          )}
          {filtersLoading && webcamReady && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm z-10">
              Loading filters...
            </div>
          )}
        </div>

        {/* ✅ Bottom slider with integrated capture button */}
        {!showPreview && (
          <div className="bottom-controls">
            <PhotoboothSlider
              ref={sliderRef}
              repeatedFilters={repeatedFilters}
              selectedFilterId={selectedFilterId}
              setSelectedFilterId={setSelectedFilterId}
              onCapture={capturePhoto}
              webcamReady={webcamReady}
              videoWidth={videoDims.width}
              onDragStart={handleSliderDragStart}
              onDragEnd={handleSliderDragEnd}
            />
          </div>
        )}

        {/* ✅ Preview Modal */}
        {showPreview && capturedImage && (
          <div className="preview-modal">
            <div className="preview-header">
              <h2 className="preview-title">Preview</h2>
              <button onClick={retakePhoto} className="preview-close" aria-label="Close preview">
                <X size={28} />
              </button>
            </div>

            <div className="preview-image-wrapper">
              <img src={capturedImage} alt="Captured" className="preview-image" />
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
    </div>
  );
}
