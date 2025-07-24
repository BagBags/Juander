import React, { useRef } from "react";

const Overlays = ({ faces, videoDims, selectedValue, selectedMeta }) => {
  const mirrorX = (x) => videoDims.width - x;
  const faceSizeRef = useRef(null);

  // Size configuration constants
  const SIZE_CONFIG = {
    glasses: {
      width: selectedMeta?.width || 450,
      height: selectedMeta?.height || 150,
      imgScale: "130%",
      verticalOffset: 120,
    },
    hat: {
      width: selectedMeta?.width || 600,
      height: selectedMeta?.height || 550,
      imgScale: "110%",
      verticalOffset: 400, // Reduced from 400 for better positioning
      minOffset: 220, // Minimum offset when zoomed in
      maxOffset: 220, // Maximum offset when zoomed out
    },
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: videoDims.width,
        height: videoDims.height,
        pointerEvents: "none",
        perspective: "1000px",
      }}
    >
      {faces.map((face, idx) => {
        const lm = face.keypoints;
        if (!lm || lm.length < 264) return null;

        const leftEye = lm[33];
        const rightEye = lm[263];
        const noseTip = lm[4];
        const chin = lm[152];
        const forehead = lm[10];

        const anchorX = mirrorX((leftEye.x + rightEye.x) / 2);
        const anchorY = (leftEye.y + rightEye.y) / 2;

        // Face size logic
        const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);

        if (!faceSizeRef.current) {
          faceSizeRef.current = faceHeight;
        }

        const depthRatio = faceHeight / faceSizeRef.current;
        const clampedDepth = Math.max(0.6, Math.min(depthRatio, 2.2));

        const scale = 0.8 + (clampedDepth - 1) * 0.6;
        const translateY = (1 - clampedDepth) * 40; // Reduced from 80 for less vertical movement
        const translateZ = (clampedDepth - 1) * 200;

        // Face tilt calculation
        const angleRad = Math.atan2(
          rightEye.y - leftEye.y,
          rightEye.x - leftEye.x
        );
        const angleDeg = (angleRad * 180) / Math.PI;

        // Dynamic hat positioning that stays consistent during zoom
        const hatVerticalPosition =
          forehead.y - SIZE_CONFIG.hat.verticalOffset + translateY * 0.1; // Reduced vertical movement

        return (
          <React.Fragment key={idx}>
            {/* Glasses/Eyes Overlay */}
            {(selectedValue === "all" || selectedMeta?.category === "eyes") &&
              selectedMeta?.image && (
                <div
                  style={{
                    position: "absolute",
                    left: anchorX - SIZE_CONFIG.glasses.width / 2,
                    top: anchorY - SIZE_CONFIG.glasses.height / 2 + translateY,
                    width: SIZE_CONFIG.glasses.width,
                    height: SIZE_CONFIG.glasses.height,
                    transform: `
                      scale(${scale})
                      rotate(${-angleDeg}deg)
                      translateZ(${translateZ}px)
                    `,
                    transformStyle: "preserve-3d",
                    transformOrigin: "center center",
                    transition: "transform 0.1s cubic-bezier(0.2, 0.8, 0.4, 1)",
                    zIndex: Math.floor(scale * 100),
                    willChange: "transform",
                  }}
                >
                  <img
                    src={selectedMeta.image}
                    alt="overlay"
                    style={{
                      width: SIZE_CONFIG.glasses.imgScale,
                      height: "150%",
                      display: "block",
                      transform: "translateX(-5%)",
                    }}
                  />
                </div>
              )}

            {/* Hat/Head Overlay - with fixed positioning */}
            {(selectedValue === "all" || selectedMeta?.category === "head") &&
              selectedMeta?.image && (
                <div
                  style={{
                    position: "absolute",
                    left: mirrorX(noseTip.x) - SIZE_CONFIG.hat.width / 2,
                    top: hatVerticalPosition, // Using the new dynamic positioning
                    width: SIZE_CONFIG.hat.width,
                    height: SIZE_CONFIG.hat.height,
                    transform: `
                      rotate(${-angleDeg}deg)
                      scale(${scale * 1.08})
                      translateZ(${translateZ * 1.1}px)
                    `,
                    transformStyle: "preserve-3d",
                    transformOrigin: "center bottom",
                    transition:
                      "transform 0.1s cubic-bezier(0.2, 0.8, 0.4, 1), top 0.1s ease-out",
                    zIndex: Math.floor(scale * 90),
                    willChange: "transform",
                  }}
                >
                  <img
                    src={selectedMeta.image}
                    alt="overlay"
                    style={{
                      width: SIZE_CONFIG.hat.imgScale,
                      height: "100%",
                      display: "block",
                      transform: "translateX(-5%)",
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
