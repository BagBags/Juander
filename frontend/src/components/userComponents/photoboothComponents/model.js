// utils/model.js
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

/**
 * Loads the face landmarks detection model with progress tracking
 * @param {function} onProgress - Callback for progress updates (0-100)
 * @returns {Promise<object>} Loaded face detector model
 */
export async function loadFaceModel(onProgress) {
  let timer;
  
  // Start progress updates if callback provided
  if (onProgress) {
    let progress = 0;
    timer = setInterval(() => {
      progress = progress >= 100 ? 100 : Math.round(progress + Math.random() * 20);
      onProgress(progress);
    }, 200);
  }

  try {
    const detector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      { runtime: "tfjs", maxFaces: 10 }
    );
    
    if (timer) clearInterval(timer);
    if (onProgress) onProgress(100);
    return detector;
  } catch (error) {
    if (timer) clearInterval(timer);
    throw error;
  }
}