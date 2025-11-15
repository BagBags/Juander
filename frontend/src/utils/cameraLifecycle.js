// Simple camera lifecycle manager for Photobooth
// - Schedules camera shutdown after a delay when leaving the page or app
// - Cancels shutdown if user returns within the grace period
// - Provides a best-effort stop for Jeeliz and any MediaStreams

let stopTimerId = null;
let photoboothRouteActive = false;

export function setPhotoboothRouteActive(active) {
  photoboothRouteActive = !!active;
}

export function scheduleCameraStop(delayMs = 10000) {
  try {
    if (stopTimerId) clearTimeout(stopTimerId);
  } catch {}
  stopTimerId = setTimeout(() => {
    stopTimerId = null;
    try {
      // Stop Jeeliz camera if present
      if (window.JEELIZFACEFILTER && window.JEELIZFACEFILTER.destroy) {
        window.JEELIZFACEFILTER.destroy();
      }
    } catch {}

    // Best-effort: stop any media streams attached to <video> elements
    try {
      const videos = document.querySelectorAll('video');
      videos.forEach((v) => {
        const stream = v.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach((t) => {
            try { t.stop(); } catch {}
          });
        }
      });
    } catch {}
  }, Math.max(0, Number(delayMs) || 0));
}

export function cancelCameraStop() {
  try {
    if (stopTimerId) {
      clearTimeout(stopTimerId);
      stopTimerId = null;
    }
  } catch {}
}

export function isPhotoboothRouteActive() {
  return photoboothRouteActive;
}