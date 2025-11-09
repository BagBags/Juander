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
  
  // Video element reference for actual dimensions
  const [videoElement, setVideoElement] = useState(null);
  
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
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/photobooth/filters`,
          { timeout: 5000 } // Add timeout
        );
        
        if (res.data && res.data.length > 0) {
          const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000";
          const normalized = res.data.map((f) => {
            // Resolve image URL
            let imageUrl = f.imageUrl || f.image;
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = `${BACKEND_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }
            
            return {
              ...f,
              label: f.label || f.name,
              value: f.value || f.name.toLowerCase().replace(/\s+/g, "-"),
              image: imageUrl,
              // Ensure all required fields exist
              id: f._id || f.id || f.value || `filter-${Date.now()}-${Math.random()}`,
            };
          });
          
          // Combine base filters with backend filters
          const allFilters = [...baseFilters, ...normalized];
          console.log("Loaded filters:", allFilters.length);
          setFilters(allFilters);
        } else {
          console.log("No backend filters, using base filters");
          setFilters(baseFilters);
        }
      } catch (err) {
        console.error("Failed to fetch filters, using baseFilters:", err);
        setFilters(baseFilters);
      }
    };
    
    // Always start with base filters immediately
    setFilters(baseFilters);
    // Then try to load backend filters
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
    // Store video element reference
    if (webcamRef.current && webcamRef.current.video) {
      setVideoElement(webcamRef.current.video);
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
        {/* ✅ Back button */}
        <BackHeader title="Photo Booth" />

        <div className="camera-view" style={{ display: showPreview ? 'none' : 'block' }}>
          <Webcam
            ref={webcamRef}
            audio={false}
            className="webcam"
            onUserMedia={handleWebcamLoad}
            onUserMediaError={(err) => console.error("Webcam error:", err)}
            videoConstraints={{
              facingMode: "user",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }}
            screenshotFormat="image/jpeg"
            mirrored={true}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
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
