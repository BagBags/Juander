export async function detectFaces(model, videoElement) {
  if (!model) {
    // console.log("Face detection: Model not loaded");
    return [];
  }
  if (!videoElement) {
    // console.log("Face detection: Video element not available");
    return [];
  }
  if (videoElement.readyState !== 4) {
    console
      .log
      //   `Face detection: Video not ready (readyState: ${videoElement.readyState})`
      ();
    return [];
  }

  try {
    console.log("Starting face detection...");
    const startTime = performance.now();
    const predictions = await model.estimateFaces(videoElement);
    const duration = performance.now() - startTime;

    console.log(`Face detection completed in ${duration.toFixed(1)}ms`);
    console.log(`Found ${predictions.length} faces`);

    // if (predictions.length > 0) {
    //   console.log("First face details:", {
    //     topLeft: predictions[0].topLeft,
    //     bottomRight: predictions[0].bottomRight,
    //     probability: predictions[0].probability,
    //     landmarks: predictions[0].landmarks
    //       ? predictions[0].landmarks.length
    //       : 0,
    //   });
    // }

    return predictions;
  } catch (error) {
    // console.error("Face detection failed:", error);
    return [];
  }
}

export function setupFaceDetection(model, webcamRef, setFaces) {
  //   console.log("Setting up face detection...");
  let rafId;
  let active = true;

  async function detectLoop() {
    if (!active) {
      //   console.log("Detection loop stopped");
      return;
    }
    if (!model) {
      //   console.log("Waiting for model to load...");
      rafId = requestAnimationFrame(detectLoop);
      return;
    }

    const video = webcamRef.current?.video;
    if (!video) {
      //   console.log("Waiting for video element...");
      rafId = requestAnimationFrame(detectLoop);
      return;
    }
    if (video.readyState !== 4) {
      console
        .log
        // `Waiting for video to be ready (current readyState: ${video.readyState})`
        ();
      rafId = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      const predictions = await detectFaces(model, video);
      setFaces(predictions);

      // Log frame rate periodically
      if (Math.random() < 0.05) {
        // Sample ~5% of frames to avoid spam
        // console.log(`Current detection frame rate: ${getFrameRate()}fps`);
      }
    } catch (error) {
      //   console.error("Detection loop error:", error);
    } finally {
      if (active) {
        rafId = requestAnimationFrame(detectLoop);
      }
    }
  }

  // Frame rate calculation
  //   let lastTime = performance.now();
  //   let frameCount = 0;
  //   let fps = 0;

  //   function getFrameRate() {
  //     frameCount++;
  //     const now = performance.now();
  //     const delta = now - lastTime;

  //     if (delta >= 1000) {
  //       fps = Math.round((frameCount * 1000) / delta);
  //       frameCount = 0;
  //       lastTime = now;
  //     }
  //     return fps;
  //   }

  // Start detection
  const video = webcamRef.current?.video;
  if (video) {
    // console.log(`Video element found, readyState: ${video.readyState}`);
    if (video.readyState >= 3) {
      //   console.log("Video has enough data, starting detection");
      detectLoop();
    } else {
      //   console.log("Waiting for video data to load...");
      const onLoaded = () => {
        // console.log("Video data loaded, starting detection");
        video.removeEventListener("loadeddata", onLoaded);
        detectLoop();
      };
      video.addEventListener("loadeddata", onLoaded);
    }
  } else {
    console.warn("Video element not found in webcamRef");
  }

  return () => {
    // console.log("Cleaning up face detection");
    active = false;
    cancelAnimationFrame(rafId);
  };
}
