// utils/model.js
import * as tf from "@tensorflow/tfjs";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

let modelPromise = null;

/**
 * Loads and warms up the face mesh model with fast settings.
 * Uses caching and progress tracking for user feedback.
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<object>} Loaded face detector
 */
export async function loadFaceModel(onProgress) {
  if (modelPromise) return modelPromise;

  modelPromise = new Promise(async (resolve, reject) => {
    let timer;
    let isDone = false;

    try {
      // Ensure TF is ready (skip setBackend if already set properly)
      const backend = tf.getBackend();
      if (backend !== "webgl") {
        await tf.setBackend("webgl");
        await tf.ready();
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

      const detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          maxFaces: 1,
          refineLandmarks: false,
        }
      );

      // Safe warm-up
      try {
        const dummyInput = tf.zeros([1, 128, 128, 3]);
        await detector.estimateFaces(dummyInput);
        dummyInput.dispose();
      } catch (warmErr) {
        console.warn("Model warm-up skipped due to error:", warmErr.message);
      }

      isDone = true;
      if (timer) clearInterval(timer);
      if (onProgress) onProgress(100);

      resolve(detector);
    } catch (err) {
      isDone = true;
      if (timer) clearInterval(timer);
      reject(err);
    }
  });

  return modelPromise;
}
