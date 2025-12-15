import React, { useRef, useState, useEffect } from "react";
import * as jsqrModule from "jsqr";
import Webcam from "react-webcam";
import { AlertCircle } from "lucide-react";
import BackHeader from "./BackButton";
import {
  cancelCameraStop,
  scheduleCameraStop,
  waitForCameraRelease,
} from "../../utils/cameraLifecycle";

const QRScannerSimple = ({ onScanSuccess, onClose }) => {
  const webcamRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [scannedUrl, setScannedUrl] = useState(null);
  const scanIntervalRef = useRef(null);
  const [cameraRetryKey, setCameraRetryKey] = useState(0);
  const jsQRRef = useRef(null);

  // Load jsQR dynamically when component mounts
  useEffect(() => {
    import("jsqr")
      .then((module) => {
        jsQRRef.current = module.default || module;
      })
      .catch((err) => {
        console.error("Failed to load jsQR library:", err);
        setError("Failed to load QR scanner library. Please refresh the page.");
      });
  }, []);

  useEffect(() => {

    try {
      const tracked = window.__JUANDER_TRACKED_STREAMS;
      if (tracked && typeof tracked.forEach === "function") {
        tracked.forEach((s) => {
          try {
            if (s && typeof s.getTracks === "function") {
              s.getTracks().forEach((t) => {
                try {
                  t.stop();
                } catch {}
              });
            }
          } catch {}
        });
        try {
          tracked.clear?.();
        } catch {}
      }
    } catch {}
    try {
      const vs = Array.from(document.querySelectorAll("video"));
      const thisVideo = webcamRef.current?.video || null;
      vs.forEach((v) => {
        if (thisVideo && v === thisVideo) return;
        try {
          const s = v.srcObject;
          if (s && typeof s.getTracks === "function") {
            s.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch {}
            });
          }
        } catch {}
        try {
          v.pause();
        } catch {}
        try {
          v.srcObject = null;
        } catch {}
        try {
          v.removeAttribute("src");
        } catch {}
        try {
          v.load();
        } catch {}
      });
    } catch {}
  }, []);

  useEffect(() => {
    // Cancel any pending global camera stop when the scanner is mounted
    cancelCameraStop();

    return () => {
      stopScanning();
      try {
        const v = webcamRef.current?.video;
        const s = webcamRef.current?.stream || v?.srcObject;
        if (s && typeof s.getTracks === "function") {
          s.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch (e) {
              void e;
            }
          });
        }
        if (v) {
          try {
            v.pause();
          } catch (e) {
            void e;
          }
          try {
            v.srcObject = null;
          } catch (e) {
            void e;
          }
          try {
            v.removeAttribute("src");
          } catch (e) {
            void e;
          }
          try {
            v.load();
          } catch (e) {
            void e;
          }
        }
      } catch (e) {
        void e;
      }
      // Gracefully stop camera a moment after unmount
      scheduleCameraStop(1000);
    };
  }, []);

  const handleCameraReady = () => {
    console.log("Camera is ready");
    setCameraReady(true);
    startScanning();
  };

  const startScanning = () => {
    setScanning(true);
    // Scan every 500ms
    scanIntervalRef.current = setInterval(() => {
      captureAndScan();
    }, 500);
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
  };

  const captureAndScan = () => {
    if (webcamRef.current && webcamRef.current.video) {
      const video = webcamRef.current.video;

      // Check if video is ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      // Create canvas to capture frame
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Scan for QR code
      if (!jsQRRef.current) return;

      const scan = jsqrModule.jsQR || jsqrModule.default;
      if (typeof scan !== "function") return;
      const code = scan(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        console.log("QR Code detected:", code.data);
        setScannedUrl(code.data);
        stopScanning();

        try {
          const v = webcamRef.current?.video;
          const s = webcamRef.current?.stream || v?.srcObject;
          if (s && typeof s.getTracks === "function") {
            s.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch (e) {
                void e;
              }
            });
          }
          if (v) {
            try {
              v.pause();
            } catch {}
            try {
              v.srcObject = null;
            } catch {}
            try {
              v.removeAttribute("src");
            } catch {}
            try {
              v.load();
            } catch {}
          }
        } catch {}

        // Call success callback after ensuring camera has fully shut down.
        if (onScanSuccess) {
          waitForCameraRelease().then(() => {
            onScanSuccess(code.data);
          });
        }
      }
    }
  };

  const handleWebcamError = (err) => {
    console.error("Webcam error:", err);
    setError(
      "Failed to access camera. Please ensure camera permissions are granted."
    );
    stopScanning();
  };

  const preflightCameraAccess = async () => {
    try {
      // Attempt to trigger permission prompt proactively
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      // Immediately release the stream; the permission state should persist
      try {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {
            void e;
          }
        });
      } catch {}
      return true;
    } catch (e) {
      console.warn("Preflight camera access failed:", e?.name || e);
      return false;
    }
  };

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        preflightCameraAccess().finally(() => {
          setCameraRetryKey((k) => k + 1);
        });
      } else {
        stopScanning();
        try {
          const v = webcamRef.current?.video;
          const s = webcamRef.current?.stream || v?.srcObject;
          if (s && typeof s.getTracks === "function") {
            s.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch (e) {
                void e;
              }
            });
          }
          if (v) {
            try {
              v.pause();
            } catch {}
            try {
              v.srcObject = null;
            } catch {}
            try {
              v.removeAttribute("src");
            } catch {}
            try {
              v.load();
            } catch {}
          }
        } catch {}
      }
    };
    const onFocus = () => {
      preflightCameraAccess().finally(() => {
        setCameraRetryKey((k) => k + 1);
      });
    };
    const onPageShow = () => {
      preflightCameraAccess().finally(() => {
        setCameraRetryKey((k) => k + 1);
      });
    };
    const onPageHide = () => {
      stopScanning();
      try {
        const v = webcamRef.current?.video;
        const s = webcamRef.current?.stream || v?.srcObject;
        if (s && typeof s.getTracks === "function") {
          s.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch (e) {
              void e;
            }
          });
        }
        if (v) {
          try {
            v.pause();
          } catch {}
          try {
            v.srcObject = null;
          } catch {}
          try {
            v.removeAttribute("src");
          } catch {}
          try {
            v.load();
          } catch {}
        }
      } catch {}
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return (
    <div
      className="min-h-screen h-[100dvh] bg-gray-900 flex flex-col overflow-hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="fixed inset-x-0"
        style={{
          top: 0,
          height: "env(safe-area-inset-top)",
          backgroundColor: "white",
          zIndex: 49,
        }}
      />
      <BackHeader
        title="Scan QR"
        className="bg-white text-gray-900 shadow-sm"
        onBack={() => {
          try {
            stopScanning();
            const v = webcamRef.current?.video;
            const s = webcamRef.current?.stream || v?.srcObject;
            if (s && typeof s.getTracks === "function") {
              s.getTracks().forEach((t) => {
                try {
                  t.stop();
                } catch (e) {
                  void e;
                }
              });
            }
            if (v) {
              try {
                v.pause();
              } catch {}
              try {
                v.srcObject = null;
              } catch {}
              try {
                v.removeAttribute("src");
              } catch {}
              try {
                v.load();
              } catch {}
            }
          } catch {}
          if (onClose) onClose();
        }}
      />

      {/* Scanner Area */}
      <div className="flex-1 min-h-0 relative p-0">
        {error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  Camera Error
                </h3>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <button
                  onClick={async () => {
                    setError(null);
                    setCameraReady(false);
                    stopScanning();
                    cancelCameraStop();
                    await preflightCameraAccess();
                    try {
                      const v = webcamRef.current?.video;
                      const s = webcamRef.current?.stream || v?.srcObject;
                      if (s && typeof s.getTracks === "function") {
                        s.getTracks().forEach((t) => {
                          try {
                            t.stop();
                          } catch (e) {
                            void e;
                          }
                        });
                      }
                      if (v) {
                        try {
                          v.pause();
                        } catch {}
                        try {
                          v.srcObject = null;
                        } catch {}
                        try {
                          v.removeAttribute("src");
                        } catch {}
                        try {
                          v.load();
                        } catch {}
                      }
                    } catch {}
                    setCameraRetryKey((k) => k + 1);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : scannedUrl ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-900 mb-2">
                QR Code Scanned!
              </h3>
              <p className="text-sm text-green-700 mb-4 break-all">
                {scannedUrl}
              </p>
              <p className="text-xs text-green-600">
                Redirecting to AR experience...
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full">
            {/* Loading indicator */}
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
                <div className="text-center p-4 md:p-8">
                  <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-[#f04e37] border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4"></div>
                  <p className="text-white text-base md:text-lg font-bold mb-1 md:mb-2">
                    Starting Camera
                  </p>
                  <p className="text-white/80 text-xs md:text-sm">
                    Please allow camera access...
                  </p>
                </div>
              </div>
            )}

            {/* Camera View */}
            <div className="relative w-full h-full">
              <Webcam
                key={cameraRetryKey}
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: "environment", // Use back camera
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                }}
                onUserMedia={handleCameraReady}
                onUserMediaError={handleWebcamError}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ width: "100%", height: "100%" }}
              />

              {/* Scanning Overlay */}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner decorations */}
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 w-8 h-8 md:w-12 md:h-12 border-t-2 border-l-2 md:border-t-4 md:border-l-4 border-[#f04e37]"></div>
                  <div className="absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-12 md:h-12 border-t-2 border-r-2 md:border-t-4 md:border-r-4 border-[#f04e37]"></div>
                  <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 w-8 h-8 md:w-12 md:h-12 border-b-2 border-l-2 md:border-b-4 md:border-l-4 border-[#f04e37]"></div>
                  <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-8 h-8 md:w-12 md:h-12 border-b-2 border-r-2 md:border-b-4 md:border-r-4 border-[#f04e37]"></div>

                  {/* Center scanning box */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 md:w-64 md:h-64 border-2 border-white/50 rounded-lg"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center px-2">
              <p className="text-white text-xs md:text-sm mb-1 md:mb-2 font-medium">
                Position the QR code within the frame
              </p>
              <p className="text-white/70 text-[10px] md:text-xs">
                The scanner will automatically detect and process the code
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScannerSimple;
