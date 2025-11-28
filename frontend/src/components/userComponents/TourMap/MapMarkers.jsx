// components/userComponents/MapMarkers.jsx
import React from "react";
import { motion } from "framer-motion";
import { Marker } from "react-map-gl";

// User Location Marker
export const UserLocationMarker = ({ userLocation }) => (
  <Marker longitude={userLocation.longitude} latitude={userLocation.latitude}>
    <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
  </Marker>
);

// Pin Markers Component
export const PinMarkers = ({ pins, selectedPin, onPinClick }) => {
  if (!pins) return null;

  return pins.map((pin, idx) => {
    const isSelected = selectedPin?._id === pin._id;

    return (
      <Marker
        key={pin._id}
        longitude={pin.longitude}
        latitude={pin.latitude}
        anchor="bottom"
      >
        <div
          className={`relative flex items-center justify-center cursor-pointer ${idx === 0 ? 'map-first-pin' : ''}`}
          onClick={() => onPinClick(pin)}
        >
          {/* Facade image */}
          {pin.facadeUrl && (
            <div className="relative w-24 h-24 md:w-28 md:h-28">
              <motion.img
                src={pin.facadeUrl}
                alt={pin.siteName}
                initial={false}
                animate={{ scale: isSelected ? 1.22 : 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 22, mass: 0.7 }}
                style={{ transformOrigin: "bottom center", willChange: "transform" }}
                className="absolute inset-0 object-contain pointer-events-none select-none"
              />
            </div>
          )}

          {/* Pin centered on the facade */}
          <div
            className="absolute top-1/2 left-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md opacity-60"
            style={{
              transform: "translate(-50%, -50%)",
              backgroundColor:
                pin.status === "inactive" ? "#3b82f6" : "#dc2626",
            }}
            title={pin.siteName}
          ></div>
        </div>
      </Marker>
    );
  });
};

// Default export for convenience
const MapMarkers = {
  UserLocationMarker,
  PinMarkers,
};

export default MapMarkers;
