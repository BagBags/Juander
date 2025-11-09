// utils/model.js
import * as tf from "@tensorflow/tfjs";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as blazeface from "@tensorflow-models/blazeface";

let modelPromise = null;
let cachedDetector = null;
let cachedBlazeFace = null;

/**
 * Loads BlazeFace + FaceMesh models
 * BlazeFace is more reliable for detection, FaceMesh provides detailed landmarks
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<object>} Loaded models
 */
export async function loadFaceModel(onProgress) {
  // Return cached models if available
  if (cachedDetector && cachedBlazeFace) {
    if (onProgress) onProgress(100);
    return Promise.resolve({ faceMesh: cachedDetector, blazeface: cachedBlazeFace });
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

      // Load BlazeFace first (faster and more reliable)
      console.log("Loading BlazeFace model...");
      const blazefaceModel = await blazeface.load();
      console.log("BlazeFace loaded successfully");
      cachedBlazeFace = blazefaceModel;

      // Load FaceMesh for detailed landmarks
      console.log("Creating FaceMesh detector...");
      const detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          maxFaces: 2,
          refineLandmarks: false,
          shouldLoadIrisModel: false,
        }
      );
      console.log("FaceMesh loaded successfully");

      isDone = true;
      if (timer) clearInterval(timer);
      if (onProgress) onProgress(100);

      // Cache both models
      cachedDetector = detector;
      resolve({ faceMesh: detector, blazeface: blazefaceModel });
    } catch (err) {
      isDone = true;
      if (timer) clearInterval(timer);
      reject(err);
    }
  });

  return modelPromise;
}
