// utils/model.js
import * as tf from "@tensorflow/tfjs";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

let modelPromise = null;
let cachedDetector = null;

/**
 * Loads and warms up the face mesh model with fast settings.
 * Uses caching and progress tracking for user feedback.
 * Optimized for quick loading and efficient memory usage.
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<object>} Loaded face detector
 */
export async function loadFaceModel(onProgress) {
  // Return cached detector if available
  if (cachedDetector) {
    if (onProgress) onProgress(100);
    return Promise.resolve(cachedDetector);
  }
  
  if (modelPromise) return modelPromise;

  // eslint-disable-next-line no-async-promise-executor
  modelPromise = new Promise(async (resolve, reject) => {
    let timer;
    let isDone = false;

    try {
      // Ensure TF is ready with WebGL backend for best performance
      const backend = tf.getBackend();
      if (backend !== "webgl") {
        try {
          await tf.setBackend("webgl");
          await tf.ready();
        } catch (err) {
          console.warn("WebGL not available, falling back to CPU:", err);
          await tf.setBackend("cpu");
          await tf.ready();
        }
      }

      if (onProgress) onProgress(0);

      // Progress simulation
      let progress = 0;
      if (onProgress) {
        timer = setInterval(() => {
          if (isDone) return;
          progress += 10 + Math.random() * 10;
          if (progress >= 95) progress = 95;
          onProgress(Math.floor(progress));
        }, 100);
      }

      // Load model with optimized settings
      const detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          maxFaces: 1,
          refineLandmarks: false,
          shouldLoadIrisModel: false, // Skip iris for faster loading
        }
      );

      // Warm-up with smaller dummy input for faster initialization
      try {
        const dummyInput = tf.zeros([1, 64, 64, 3]);
        await detector.estimateFaces(dummyInput);
        dummyInput.dispose();
      } catch (warmErr) {
        console.warn("Model warm-up skipped:", warmErr.message);
      }

      isDone = true;
      if (timer) clearInterval(timer);
      if (onProgress) onProgress(100);

      // Cache the detector
      cachedDetector = detector;
      resolve(detector);
    } catch (err) {
      isDone = true;
      if (timer) clearInterval(timer);
      reject(err);
    }
  });

  return modelPromise;
}
