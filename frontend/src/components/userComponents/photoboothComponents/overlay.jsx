import React, { useRef, useEffect } from "react";

const Overlays = ({ faces, videoDims, selectedValue, selectedMeta }) => {
  const overlayRef = useRef();
  const faceSizeRef = useRef(null);
  const frameCountRef = useRef(0);
  const smoothedPositionRef = useRef(null);
  const smoothedAngleRef = useRef(null);
  const smoothedScaleRef = useRef(null);
  const smoothingFactor = 0.7; // High responsiveness for real-time feel
  const angleSmoothingFactor = 0.8; // Very responsive rotation
  const scaleSmoothingFactor = 0.6; // Smooth size changes

  const getSizeConfig = () => ({
    eyes: {
      widthRatio: 1.4,      // Width relative to face width
      heightRatio: 0.35,    // Height relative to face height
      anchorPoint: 'eyes',  // Anchor to eyes
    },
    head: {
      widthRatio: 2.2,      // Slightly larger for better coverage
      heightRatio: 1.3,     // Proportional height
      anchorPoint: 'top',   // Anchor to top of head
      verticalOffset: -0.4, // Position above forehead (negative = up)
    },
    frame: {
      useFullScreen: true,  // Special flag for full screen frames
      widthRatio: 1.0,
      heightRatio: 1.0,
      anchorPoint: 'center',
      maintainAspectRatio: true, // Maintain original aspect ratio
    },
    border: {
      useFullScreen: true,  // Border assets cover full screen
      widthRatio: 1.0,
      heightRatio: 1.0,
      anchorPoint: 'center',
      maintainAspectRatio: false, // Stretch to fit screen
    },
    general: {
      widthRatio: 1.2,
      heightRatio: 0.4,
      anchorPoint: 'eyes',
    },
  });

  const getDisplayCoords = (x, y) => {
    if (!overlayRef.current) return { x, y };
    const rect = overlayRef.current.getBoundingClientRect();
    
    // Use actual container dimensions, not videoDims
    // This ensures coordinates work on any screen size
    const scaleX = rect.width / videoDims.width;
    const scaleY = rect.height / videoDims.height;
    
    return {
      x: x * scaleX,
      y: y * scaleY,
    };
  };

  useEffect(() => {
    faceSizeRef.current = null;
    frameCountRef.current = 0;
    smoothedPositionRef.current = null;
    smoothedAngleRef.current = null;
    smoothedScaleRef.current = null;
  }, [videoDims]);

  // Smooth position changes for stable overlay
  const smoothPosition = (newPos) => {
    if (!smoothedPositionRef.current) {
      smoothedPositionRef.current = newPos;
      return newPos;
    }
    
    const smoothed = {
      x: smoothedPositionRef.current.x + (newPos.x - smoothedPositionRef.current.x) * smoothingFactor,
      y: smoothedPositionRef.current.y + (newPos.y - smoothedPositionRef.current.y) * smoothingFactor,
    };
    
    smoothedPositionRef.current = smoothed;
    return smoothed;
  };

  // Smooth angle changes for stable rotation
  const smoothAngle = (newAngle) => {
    if (smoothedAngleRef.current === null) {
      smoothedAngleRef.current = newAngle;
      return newAngle;
    }
    
    // Handle angle wrapping (e.g., -180 to 180 transition)
    let diff = newAngle - smoothedAngleRef.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    const smoothed = smoothedAngleRef.current + diff * angleSmoothingFactor;
    smoothedAngleRef.current = smoothed;
    return smoothed;
  };

  // Smooth scale changes for stable sizing
  const smoothScale = (newScale) => {
    if (!smoothedScaleRef.current) {
      smoothedScaleRef.current = { width: newScale.width, height: newScale.height };
      return newScale;
    }
    
    const smoothed = {
      width: smoothedScaleRef.current.width + (newScale.width - smoothedScaleRef.current.width) * scaleSmoothingFactor,
      height: smoothedScaleRef.current.height + (newScale.height - smoothedScaleRef.current.height) * scaleSmoothingFactor,
    };
    
    smoothedScaleRef.current = smoothed;
    return smoothed;
  };


  return (
    <div
      ref={overlayRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      {faces.map((face, idx) => {
        const lm = face.keypoints;
        if (!lm || lm.length < 264) {
          return null;
        }

        const leftEye = lm[33];
        const rightEye = lm[263];
        const noseTip = lm[4];
        const chin = lm[152];
        const forehead = lm[10];
        const leftEar = lm[454];
        const rightEar = lm[234];

        const currentFaceWidth = Math.hypot(
          rightEye.x - leftEye.x,
          rightEye.y - leftEye.y
        );
        const currentFaceHeight = Math.hypot(
          chin.x - forehead.x,
          chin.y - forehead.y
        );
        const earDistance = Math.hypot(
          rightEar.x - leftEar.x,
          rightEar.y - leftEar.y
        );

        // Initialize reference dimensions early for consistent overlay scaling
        if (!faceSizeRef.current) {
          faceSizeRef.current = {
            width: currentFaceWidth,
            height: currentFaceHeight,
            earDistance,
            landmarks: {
              leftEye: { ...leftEye },
              rightEye: { ...rightEye },
              noseTip: { ...noseTip },
              forehead: { ...forehead },
            },
          };
        }

        const config = getSizeConfig();

        // Determine category - use the actual category from selectedMeta
        const category = selectedMeta?.category || "general";
        const categoryConfig = config[category] || config.general;
        const { widthRatio, heightRatio, useFullScreen, anchorPoint, verticalOffset, maintainAspectRatio } = categoryConfig;

        // Calculate overlay dimensions based on CURRENT face size (not reference)
        let overlayWidth, overlayHeight, avgScale;
        
        if (useFullScreen && (category === "frame" || category === "border")) {
          // Use video dimensions for full screen coverage
          overlayWidth = videoDims.width;
          overlayHeight = videoDims.height;
          avgScale = 1; // No scaling for full screen frames/borders
        } else {
          // Use CURRENT face dimensions for responsive sizing
          const rawWidth = currentFaceWidth * widthRatio;
          const rawHeight = currentFaceHeight * heightRatio;
          
          // Apply smooth scaling for fluid size changes
          const smoothedSize = smoothScale({ width: rawWidth, height: rawHeight });
          overlayWidth = smoothedSize.width;
          overlayHeight = smoothedSize.height;
          avgScale = 1; // No additional scaling - size is already correct
        }

        const angleRad = Math.atan2(
          rightEye.y - leftEye.y,
          rightEye.x - leftEye.x
        );
        const rawAngleDeg = (angleRad * 180) / Math.PI;
        
        // Apply smoothing to rotation for stable tracking
        const angleDeg = smoothAngle(rawAngleDeg);

        // Calculate center position based on anchor point (Snapchat-style)
        let rawCenter;
        
        if (useFullScreen && (category === "frame" || category === "border")) {
          // Position at screen center for full-screen frames/borders
          rawCenter = {
            x: videoDims.width / 2,
            y: videoDims.height / 2,
          };
        } else if (anchorPoint === 'top' || category === "head") {
          // Position above forehead for hats - Snapchat style
          const eyeCenterX = (leftEye.x + rightEye.x) / 2;
          const eyeCenterY = (leftEye.y + rightEye.y) / 2;
          
          // Calculate the perpendicular offset from eye center to forehead
          const faceHeight = Math.abs(chin.y - forehead.y);
          const offsetAmount = faceHeight * (verticalOffset || -0.4);
          
          // Apply offset perpendicular to face angle
          const offsetX = -Math.sin(angleRad) * offsetAmount;
          const offsetY = Math.cos(angleRad) * offsetAmount;
          
          rawCenter = {
            x: eyeCenterX + offsetX,
            y: eyeCenterY + offsetY,
          };
        } else if (anchorPoint === 'eyes' || category === "eyes") {
          // Position precisely between eyes for glasses
          rawCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2,
          };
        } else if (category === "frame") {
          // Position centered on entire face for regular frames
          rawCenter = {
            x: noseTip.x,
            y: (forehead.y + chin.y) / 2,
          };
        } else {
          // General category - center on face
          rawCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2,
          };
        }

        // Apply smoothing for stable positioning (skip for full-screen frames/borders)
        const center = (useFullScreen && (category === "frame" || category === "border")) ? rawCenter : smoothPosition(rawCenter);

        let screenCoords = getDisplayCoords(center.x, center.y);
        screenCoords.x = overlayRef.current
          ? overlayRef.current.getBoundingClientRect().width - screenCoords.x
          : screenCoords.x;

        const shouldRenderOverlay = selectedMeta?.image;

        // Set z-index based on category
        const getZIndex = (cat) => {
          if (cat === "border" || cat === "frame") return 80; // Borders/Frames behind everything
          if (cat === "head") return 90; // Hats in middle
          return 100; // Eyes and general on top
        };

        return (
          <React.Fragment key={idx}>
            {shouldRenderOverlay && (
              <div
                style={
                  useFullScreen && (category === "frame" || category === "border")
                    ? {
                        // Full screen frame/border - fixed position, no rotation
                        position: "fixed",
                        left: 0,
                        top: 0,
                        width: "100vw",
                        height: "100vh",
                        transform: "none",
                        zIndex: getZIndex(category),
                      }
                    : {
                        // Normal overlay - follows face
                        position: "absolute",
                        left: screenCoords.x - (overlayWidth * avgScale) / 2,
                        top: screenCoords.y - (overlayHeight * avgScale) / 2,
                        width: overlayWidth,
                        height: overlayHeight,
                        transform: `rotate(${-angleDeg}deg) scale(${avgScale})`,
                        transformOrigin: "center center",
                        transition: "none", // Remove transition for real-time feel
                        zIndex: getZIndex(category),
                      }
                }
              >
                <img
                  src={selectedMeta.image}
                  alt="overlay"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error("Failed to load filter image:", selectedMeta.image);
                    // Try loading without CORS as fallback
                    if (e.target.crossOrigin) {
                      console.log("Retrying without CORS...");
                      e.target.crossOrigin = null;
                      e.target.src = selectedMeta.image;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: (category === "border" || category === "frame") ? "fill" : "contain",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Overlays;
