import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import Webcam from "react-webcam";
import "@tensorflow/tfjs-backend-webgl";
import PhotoboothSlider from "./photoboothSlider";
import { baseFilters } from "./basefilter";
import { loadFaceModel } from "./model";
import { setupFaceDetection } from "./facedetect";
import Overlays from "./overlay";
import BackHeader from "../BackButton"; // ✅ Import your back header
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

  const filterData = useMemo(() => [...baseFilters], []);

  const repeatedFilters = useMemo(
    () =>
      Array(5)
        .fill(filterData)
        .flat()
        .map((f, i) => ({ ...f, id: `${f.id || f.value}-${i}` })),
    [filterData]
  );

  const selectedMeta = repeatedFilters.find((f) => f.id === selectedFilterId);
  const selectedValue = selectedMeta?.value || null;

  useEffect(() => {
    loadFaceModel()
      .then((loadedModel) => {
        setModel(loadedModel);
      })
      .catch(() => {});
  }, []);

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
        {/* ✅ Back button header - matches Profile spacing */}
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

          {selectedMeta && (
            <Overlays
              faces={faces}
              videoDims={videoDims}
              selectedValue={selectedValue}
              selectedMeta={selectedMeta}
            />
          )}

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
