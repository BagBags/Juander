export async function detectFaces(models, videoElement) {
  if (!models || !models.faceMesh) {
    return [];
  }
  if (!videoElement) {
    return [];
  }
  if (videoElement.readyState !== 4) {
    return [];
  }

  try {
    // Use BlazeFace for detection first (more reliable)
    if (models.blazeface) {
      const blazeDetections = await models.blazeface.estimateFaces(videoElement, false);
      
      if (blazeDetections.length > 0) {
        // If BlazeFace found faces, use FaceMesh for landmarks
        const predictions = await models.faceMesh.estimateFaces(videoElement, {
          flipHorizontal: false
        });
        
        if (predictions.length > 0) {
          return predictions;
        }
        
        // If FaceMesh fails but BlazeFace succeeded, create fake landmarks from BlazeFace
        console.log("BlazeFace detected", blazeDetections.length, "faces, creating landmarks");
        return blazeDetections.map(face => ({
          keypoints: createKeypointsFromBoundingBox(face),
          box: face.topLeft ? {
            xMin: face.topLeft[0],
            yMin: face.topLeft[1],
            xMax: face.bottomRight[0],
            yMax: face.bottomRight[1],
            width: face.bottomRight[0] - face.topLeft[0],
            height: face.bottomRight[1] - face.topLeft[1]
          } : null
        }));
      }
    }
    
    // Fallback to FaceMesh only
    const predictions = await models.faceMesh.estimateFaces(videoElement, {
      flipHorizontal: false
    });
    
    return predictions;
  } catch (error) {
    console.error("Face detection error:", error);
    return [];
  }
}

// Helper to create 468 keypoints from bounding box (MediaPipeFaceMesh format)
function createKeypointsFromBoundingBox(face) {
  if (!face.topLeft || !face.bottomRight) return [];
  
  const [x1, y1] = face.topLeft;
  const [x2, y2] = face.bottomRight;
  const width = x2 - x1;
  const height = y2 - y1;
  const centerX = x1 + width / 2;
  const centerY = y1 + height / 2;
  
  // Create 468 keypoints array (MediaPipeFaceMesh standard)
  const keypoints = new Array(468);
  
  // Fill with dummy points (centered)
  for (let i = 0; i < 468; i++) {
    keypoints[i] = { x: centerX, y: centerY, z: 0 };
  }
  
  // Set key landmark points that overlay.jsx uses
  keypoints[4] = { x: centerX, y: centerY + height * 0.1, z: 0 }; // noseTip
  keypoints[10] = { x: centerX, y: y1, z: 0 }; // forehead
  keypoints[33] = { x: centerX - width * 0.2, y: centerY - height * 0.1, z: 0 }; // leftEye
  keypoints[152] = { x: centerX, y: y2, z: 0 }; // chin
  keypoints[234] = { x: x1, y: centerY, z: 0 }; // rightEar
  keypoints[263] = { x: centerX + width * 0.2, y: centerY - height * 0.1, z: 0 }; // rightEye
  keypoints[454] = { x: x2, y: centerY, z: 0 }; // leftEar
  
  return keypoints;
}

export function setupFaceDetection(model, webcamRef, setFaces) {
  let rafId;
  let active = true;
  let lastDetectionTime = 0;
  const DETECTION_INTERVAL = 150; // Run detection every 150ms (6.7fps) for better performance

  async function detectLoop() {
    if (!active) return;
    
    const now = performance.now();
    const timeSinceLastDetection = now - lastDetectionTime;
    
    // Skip detection if not enough time has passed
    if (timeSinceLastDetection < DETECTION_INTERVAL) {
      rafId = requestAnimationFrame(detectLoop);
      return;
    }
    
    if (!model) {
      rafId = requestAnimationFrame(detectLoop);
      return;
    }

    const video = webcamRef.current?.video;
    if (!video) {
      rafId = requestAnimationFrame(detectLoop);
      return;
    }
    if (video.readyState !== 4) {
      rafId = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      lastDetectionTime = now;
      const predictions = await detectFaces(model, video);
      setFaces(predictions);
      
      // Performance monitoring (only log occasionally)
      if (Math.random() < 0.01) { // 1% of the time
        const detectionTime = performance.now() - now;
        if (detectionTime > 50) {
          console.warn(`Slow face detection: ${detectionTime.toFixed(1)}ms`);
        }
      }
    } catch (error) {
      console.error("Detection loop error:", error);
    } finally {
      if (active) {
        rafId = requestAnimationFrame(detectLoop);
      }
    }
  }

  // Start detection
  const video = webcamRef.current?.video;
  if (video) {
    if (video.readyState >= 3) {
      detectLoop();
    } else {
      const onLoaded = () => {
        video.removeEventListener("loadeddata", onLoaded);
        detectLoop();
      };
      video.addEventListener("loadeddata", onLoaded);
    }
  }

  return () => {
    active = false;
    cancelAnimationFrame(rafId);
  };
}
