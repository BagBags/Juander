import React from "react";

const Overlays = ({ faces, videoDims, selectedValue, selectedMeta }) => {
  const mirrorX = (x) => videoDims.width - x;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: videoDims.width,
        height: videoDims.height,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {faces.map((face, idx) => {
        const lm = face.keypoints;
        if (!lm || lm.length < 264) return null;

        // Get key facial landmarks
        const leftEye = lm[33];
        const rightEye = lm[263];
        const forehead = lm[10];
        const chin = lm[152];

        const eyeMidX = (leftEye.x + rightEye.x) / 2;
        const eyeMidY = (leftEye.y + rightEye.y) / 2;

        const faceWidth = Math.hypot(
          rightEye.x - leftEye.x,
          rightEye.y - leftEye.y
        );
        const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);

        const angleRad = Math.atan2(
          rightEye.y - leftEye.y,
          rightEye.x - leftEye.x
        );
        const angleDeg = (angleRad * 180) / Math.PI;

        // Glasses Overlay (around eyes)
        const glassesW = faceWidth * 2;
        const glassesH = faceHeight * 0.4;
        const glassesX = mirrorX(eyeMidX) - glassesW / 2;
        const glassesY = eyeMidY - glassesH / 2;

        // Hat Overlay (above forehead)
        const hatW = faceWidth * 3;
        const hatH = faceHeight * 1.2;
        const hatX = mirrorX(forehead.x) - hatW / 2;
        const hatY = forehead.y - hatH * 0.8;

        return (
          <React.Fragment key={idx}>
            {/* Head Overlay (e.g., Hat) */}
            {(selectedValue === "all" || selectedMeta?.category === "head") &&
              selectedMeta?.image && (
                <img
                  src={selectedMeta.image}
                  alt="head filter"
                  style={{
                    position: "absolute",
                    left: hatX,
                    top: hatY,
                    width: hatW,
                    height: hatH,
                    transform: `rotate(${-angleDeg}deg)`,
                    transformOrigin: "center bottom",
                    pointerEvents: "none",
                  }}
                />
              )}

            {/* Eyes Overlay (e.g., Glasses) */}
            {(selectedValue === "all" || selectedMeta?.category === "eyes") &&
              selectedMeta?.image && (
                <img
                  src={selectedMeta.image}
                  alt="eyes filter"
                  style={{
                    position: "absolute",
                    left: glassesX,
                    top: glassesY,
                    width: glassesW,
                    height: glassesH,
                    transform: `rotate(${-angleDeg}deg)`,
                    transformOrigin: "center center",
                    pointerEvents: "none",
                  }}
                />
              )}

            {/* Full Frame Overlay */}
            {(selectedValue === "all" || selectedMeta?.category === "frame") &&
              selectedMeta?.image && (
                <img
                  src={selectedMeta.image}
                  alt="frame filter"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: videoDims.width,
                    height: videoDims.height,
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                />
              )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Overlays;
