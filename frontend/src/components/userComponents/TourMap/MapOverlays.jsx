// components/userComponents/MapOverlays.jsx
import React from "react";
import { AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import SiteCard from "./SiteCard";
import { useNavigate, useLocation } from "react-router-dom";

const MapOverlays = ({ selectedPin, distance, onCloseCard }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const backHeader = (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-white border-b border-gray-200"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 16px)",
        paddingBottom: "8px",
        paddingLeft: "16px",
        paddingRight: "16px",
        pointerEvents: "auto",
      }}
    >
      <div className="flex items-center gap-2">
        <button
          className="text-2xl font-bold cursor-pointer transition-all active:scale-90 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/10"
          onClick={() => {
            if (location.key !== "default") {
              navigate(-1);
            } else {
              navigate("/");
            }
          }}
          aria-label="Go back"
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            color: "inherit",
          }}
        >
          ‹
        </button>
        <h1
          className="font-bold text-xl truncate"
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            margin: 0,
            padding: 0,
          }}
        >
          Tour Map
        </h1>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "max(env(safe-area-inset-top), 0px)",
            backgroundColor: "#0f1115",
            zIndex: 9998,
            pointerEvents: "none",
          }}
        />,
        document.body
      )}
      {/* Back Header - Rendered via Portal */}
      {/* Bottom safe-area overlay for iOS home indicator */}
      {createPortal(
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            height: "calc(env(safe-area-inset-bottom, 0px) + 32px)",
            backgroundColor: "white",
            zIndex: 9998,
            pointerEvents: "none",
          }}
        />,
        document.body
      )}
      {createPortal(backHeader, document.body)}

      {/* Site card */}
      <AnimatePresence>
        {selectedPin && (
          <SiteCard
            key={selectedPin._id}
            pin={{
              ...selectedPin,
              imageUrl: `${import.meta.env.VITE_API_BASE}/uploads/${
                selectedPin.image
              }`,
            }}
            distance={distance}
            onClose={onCloseCard}
          />
        )}
      </AnimatePresence>

      {/* Intentionally removed transient "Go to next site" button to avoid flash under modal */}
    </>
  );
};

export default MapOverlays;
