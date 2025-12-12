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
  } catch (e) {
    void e;
  }
  stopTimerId = setTimeout(() => {
    stopTimerId = null;
    try {
      if (window.JEELIZFACEFILTER && window.JEELIZFACEFILTER.destroy) {
        window.JEELIZFACEFILTER.destroy();
      }
    } catch (e) {
      void e;
    }

    // Best-effort: stop and fully release any media streams attached to <video> elements
    try {
      const videos = document.querySelectorAll("video");
      videos.forEach((v) => {
        const stream = v.srcObject;
        if (stream && typeof stream.getTracks === "function") {
          stream.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch (e) {
              void e;
            }
          });
          try {
            v.pause();
            v.srcObject = null;
            v.removeAttribute("src");
            v.load();
          } catch (e) {
            void e;
          }
        }
      });
    } catch (e) {
      void e;
    }

    // Additionally stop any tracked streams (including off-DOM video elements)
    try {
      const tracked = window.__JUANDER_TRACKED_STREAMS;
      if (tracked && typeof tracked.forEach === "function") {
        tracked.forEach((s) => {
          try {
            if (s && typeof s.getTracks === "function") {
              s.getTracks().forEach((t) => {
                try {
                  t.stop();
                } catch (e) {
                  void e;
                }
              });
            }
          } catch (e) {
            void e;
          }
        });
        if (typeof tracked.clear === "function") tracked.clear();
      }
    } catch (e) {
      void e;
    }
  }, Math.max(0, Number(delayMs) || 0));
}

export function cancelCameraStop() {
  try {
    if (stopTimerId) {
      clearTimeout(stopTimerId);
      stopTimerId = null;
    }
  } catch (e) {
    void e;
  }
}

export function isPhotoboothRouteActive() {
  return photoboothRouteActive;
}
