import React, { useRef, useEffect } from "react";

const Overlays = ({ faces, videoDims, selectedValue, selectedMeta }) => {
  const overlayRef = useRef();
  const faceSizeRef = useRef(null);
  const frameCountRef = useRef(0);
  // const stabilizationThreshold = 5;

  const getSizeConfig = () => ({
    glasses: {
      widthRatio: 1.4,
      heightRatio: 0.35,
      yOffsetRatio: 0.15,
    },
    hat: {
      widthRatio: 1.6,
      heightRatio: 1.2,
      yOffsetRatio: 0.85,
    },
  });

  const getDisplayCoords = (x, y) => {
    if (!overlayRef.current) return { x, y };
    const rect = overlayRef.current.getBoundingClientRect();
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
  }, [videoDims]);

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
        zIndex: 9999, // make sure it's on top
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

        const reference = faceSizeRef.current;
        const config = getSizeConfig();

        // Determine which overlay to use
        const overlayType =
          selectedMeta?.category === "head" ? "hat" : "glasses";
        const { widthRatio, heightRatio, yOffsetRatio } = config[overlayType];

        const overlayWidth = reference.width * widthRatio;
        const overlayHeight = reference.height * heightRatio;

        const widthScale = currentFaceWidth / reference.width;
        const heightScale = currentFaceHeight / reference.height;
        const earScale = earDistance / reference.earDistance;
        const avgScale = (widthScale + heightScale + earScale) / 3;

        const angleRad = Math.atan2(
          rightEye.y - leftEye.y,
          rightEye.x - leftEye.x
        );
        const angleDeg = (angleRad * 180) / Math.PI;

        const center =
          overlayType === "hat"
            ? {
                x: noseTip.x,
                y:
                  forehead.y -
                  overlayHeight *
                    yOffsetRatio *
                    (earDistance / reference.earDistance),
              }
            : {
                x: (leftEye.x + rightEye.x) / 2,
                y: (leftEye.y + rightEye.y) / 2 - overlayHeight * yOffsetRatio,
              };

        let screenCoords = getDisplayCoords(center.x, center.y);
        screenCoords.x = overlayRef.current
          ? overlayRef.current.getBoundingClientRect().width - screenCoords.x
          : screenCoords.x;

        const shouldRenderOverlay =
          selectedMeta?.image &&
          (selectedValue === "all" ||
            selectedMeta?.category === overlayType ||
            selectedMeta?.category === "eyes");

        return (
          <React.Fragment key={idx}>
            {shouldRenderOverlay && (
              <div
                style={{
                  position: "absolute",
                  left: screenCoords.x - (overlayWidth * avgScale) / 2,
                  top: screenCoords.y - (overlayHeight * avgScale) / 2,
                  width: overlayWidth,
                  height: overlayHeight,
                  transform: `rotate(${-angleDeg}deg) scale(${avgScale})`,
                  transformOrigin: "center center",
                  transition: "transform 0.05s linear",
                  zIndex: overlayType === "hat" ? 90 : 100,
                }}
              >
                <img
                  src={selectedMeta.image}
                  alt="overlay"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
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
