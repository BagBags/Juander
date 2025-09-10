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

import PhotoboothSlider from "./photoboothSlider";
import { baseFilters } from "./basefilter";
import { loadFaceModel } from "./model";
import { setupFaceDetection } from "./facedetect";
import Overlays from "./overlay";
import BackHeader from "../BackButton";
import "../../../Photobooth.css";

const videoDims = {
  width: Math.min(window.innerWidth, 430),
  height: Math.min(window.innerHeight, 932),
};

export default function Photobooth() {
  const webcamRef = useRef(null);
  const sliderRef = useRef(null);
  const [model, setModel] = useState(null);
  const [faces, setFaces] = useState([]);
  const [selectedFilterId, setSelectedFilterId] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [filters, setFilters] = useState([]);

  // ✅ Load filters from backend (fallback to baseFilters)
useEffect(() => {
  const fetchFilters = async () => {
    try {
      const res = await axios.get("/api/photobooth/filters");
      if (res.data && res.data.length > 0) {
        const normalized = res.data.map(f => ({
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

  return (
    <div className="photobooth-container">
      <div className="phone-frame">
        {/* ✅ Back button + refresh */}
        <div className="absolute top-0 left-0 w-full z-20 p-4 flex items-center justify-between">
          <BackHeader />
          <button
            className="refresh-btn"
            onClick={() => window.location.reload()}
          >
            ↻
          </button>
        </div>

        <div className="camera-view">
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
          {selectedMeta && (
            <Overlays
              faces={faces}
              videoDims={videoDims}
              selectedValue={selectedValue}
              selectedMeta={selectedMeta}
            />
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

        {/* ✅ Bottom slider */}
        <div className="bottom-controls">
          <PhotoboothSlider
            ref={sliderRef}
            repeatedFilters={repeatedFilters}
            selectedFilterId={selectedFilterId}
            setSelectedFilterId={setSelectedFilterId}
            videoWidth={videoDims.width}
            onDragStart={handleSliderDragStart}
            onDragEnd={handleSliderDragEnd}
          />
        </div>
      </div>
    </div>
  );
}
