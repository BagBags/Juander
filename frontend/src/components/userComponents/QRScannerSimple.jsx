import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

const QRScannerSimple = ({ onScanSuccess, onClose }) => {
  const webcamRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [scannedUrl, setScannedUrl] = useState(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    // Cleanup: stop scanning when component unmounts
    return () => {
      stopScanning();
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
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        console.log("QR Code detected:", code.data);
        setScannedUrl(code.data);
        stopScanning();
        
        // Call success callback
        if (onScanSuccess) {
          onScanSuccess(code.data);
        }
      }
    }
  };

  const handleWebcamError = (err) => {
    console.error("Webcam error:", err);
    setError("Failed to access camera. Please ensure camera permissions are granted.");
    stopScanning();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#f04e37] to-[#d9442f] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-6 h-6 text-white" />
          <h2 className="text-lg font-bold text-white">Scan QR Code for AR</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close scanner"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-2">Camera Error</h3>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    startScanning();
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
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-900 mb-2">QR Code Scanned!</h3>
              <p className="text-sm text-green-700 mb-4 break-all">{scannedUrl}</p>
              <p className="text-xs text-green-600">Redirecting to AR experience...</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md relative">
            {/* Loading indicator */}
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50 rounded-xl">
                <div className="text-center p-8">
                  <div className="w-16 h-16 border-4 border-[#f04e37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white text-lg font-bold mb-2">Starting Camera</p>
                  <p className="text-white/80 text-sm">Please allow camera access...</p>
                </div>
              </div>
            )}
            
            {/* Camera View */}
            <div className="relative rounded-xl overflow-hidden border-4 border-white shadow-2xl">
              <Webcam
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
                className="w-full h-auto"
                style={{ width: '100%', height: 'auto' }}
              />
              
              {/* Scanning Overlay */}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner decorations */}
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-[#f04e37]"></div>
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-[#f04e37]"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-[#f04e37]"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-[#f04e37]"></div>
                  
                  {/* Center scanning box */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-white/50 rounded-lg"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-6 text-center">
              <p className="text-white text-sm mb-2 font-medium">
                Position the QR code within the frame
              </p>
              <p className="text-white/70 text-xs">
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
