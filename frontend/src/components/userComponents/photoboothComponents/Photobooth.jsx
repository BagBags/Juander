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
import BackHeader from "../BackButton";
import "../../../Photobooth.css";

export default function Photobooth() {
  const webcamRef = useRef(null);
  const sliderRef = useRef(null);
  const overlayRef = useRef(null);
  const [model, setModel] = useState(null);
  const [faces, setFaces] = useState([]);
  const [selectedFilterId, setSelectedFilterId] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [filters, setFilters] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Dynamic video dimensions that adapt to screen size
  const [videoDims, setVideoDims] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // ✅ Handle window resize for responsive border assets
  useEffect(() => {
    const handleResize = () => {
      setVideoDims({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // ✅ Load filters from backend (fallback to baseFilters)
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await axios.get("/api/photobooth/filters");
        if (res.data && res.data.length > 0) {
          const normalized = res.data.map((f) => ({
            ...f,
            label: f.label || f.name, // ensure label exists
            value: f.value || f.name.toLowerCase().replace(/\s+/g, "-"),
          }));
          setFilters([...baseFilters, ...normalized]);
        } else {
          setFilters(baseFilters);
        }
      } catch (err) {
        console.error("Failed to fetch filters, using baseFilters:", err);
        setFilters(baseFilters);
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
    loadFaceModel()
      .then((loadedModel) => {
        setModel(loadedModel);
      })
      .catch((err) => console.error("Failed to load face model:", err));
  }, []);

  // ✅ Face detection loop
  useEffect(() => {
    if (model && webcamReady && webcamRef.current) {
      const cleanup = setupFaceDetection(
        model,
        webcamRef,
        (faces) => {
          if (!isDragging) {
            setFaces(faces);
          }
        },
        isDragging
      );
      return cleanup;
    }
  }, [model, webcamReady, isDragging]);

  const handleWebcamLoad = useCallback(() => {
    setWebcamReady(true);
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

    // Create canvas with actual viewport dimensions
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    // Get video element
    const video = webcamRef.current.video;
    if (!video) return;

    // Draw mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // If filter is selected, draw it on top using the actual displayed overlay
    if (selectedMeta) {
      const overlayContainer = document.querySelector(".overlay-container");
      
      if (overlayContainer) {
        // Get all overlay images that are currently displayed
        const overlayImages = overlayContainer.querySelectorAll("img");
        
        overlayImages.forEach((img) => {
          try {
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
              const cameraRect = document.querySelector(".camera-view").getBoundingClientRect();
              
              // Calculate position relative to camera
              const x = rect.left - cameraRect.left;
              const y = rect.top - cameraRect.top;
              const width = rect.width;
              const height = rect.height;
              
              // Get transform matrix
              const transform = parentStyle.transform;
              
              ctx.save();
              
              // Move to the center of where the overlay should be
              ctx.translate(x + width / 2, y + height / 2);
              
              // Apply rotation if exists
              if (transform && transform !== "none" && transform !== "matrix(1, 0, 0, 1, 0, 0)") {
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
      alert("Unable to capture photo. Please try again.");
    }
  }, [selectedMeta]);

  // Save image to device
  const saveImage = useCallback(() => {
    if (!capturedImage) return;

    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `photobooth-${Date.now()}.png`;
    link.click();

    // Close preview
    setShowPreview(false);
    setCapturedImage(null);
  }, [capturedImage]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setShowPreview(false);
    setCapturedImage(null);
  }, []);

  return (
    <div className="photobooth-container">
      <div className="phone-frame">
        {/* ✅ Back button + refresh */}
        <div className="absolute top-0 left-0 w-full z-[200] bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm">
          <div className="p-4 flex items-center justify-between">
            <BackHeader />
            <button
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xl hover:bg-white/30 transition-all shadow-lg"
              onClick={() => window.location.reload()}
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>

        <div className="camera-view" style={{ display: showPreview ? 'none' : 'block' }}>
          <Webcam
            ref={webcamRef}
            audio={false}
            width={videoDims.width}
            height={videoDims.height}
            className="webcam"
            onUserMedia={handleWebcamLoad}
            onUserMediaError={(err) => console.error("Webcam error:", err)}
            videoConstraints={{
              width: videoDims.width,
              height: videoDims.height,
              facingMode: "user",
              frameRate: 15,
            }}
            screenshotFormat="image/jpeg"
            mirrored={true}
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
          {!model && (
            <div className="loading-overlay">
              <div className="spinner" />
              <div className="loading-text">
                Loading face detection model...
              </div>
            </div>
          )}
          {!webcamReady && (
            <div className="loading-overlay">
              <div className="loading-text">Initializing camera...</div>
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
          <div className="absolute inset-0 bg-black z-50 flex flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <h2 className="text-white text-lg font-semibold">Preview</h2>
              <button
                onClick={retakePhoto}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            {/* Preview Image - Full height */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-6 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex gap-3 max-w-md mx-auto">
                <button
                  onClick={retakePhoto}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-4 rounded-xl hover:bg-gray-700 transition-all active:scale-95"
                >
                  <RotateCcw size={20} />
                  <span className="font-medium">Retake</span>
                </button>
                <button
                  onClick={saveImage}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-4 rounded-xl hover:bg-red-600 transition-all active:scale-95 shadow-lg"
                >
                  <Download size={20} />
                  <span className="font-medium">Save</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
