// components/userComponents/MapMarkers.jsx
import React from "react";
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

  return pins.map((pin) => {
    const isSelected = selectedPin?._id === pin._id;

    return (
      <Marker
        key={pin._id}
        longitude={pin.longitude}
        latitude={pin.latitude}
        anchor="bottom"
      >
        <div
          className="relative flex items-center justify-center cursor-pointer"
          onClick={() => onPinClick(pin)}
        >
          {/* Facade image */}
          {pin.facadeUrl && (
            <img
              src={pin.facadeUrl}
              alt={pin.siteName}
              className={`object-contain transition-transform duration-700 ease-out ${
                isSelected ? "w-64 h-64 scale-150" : "w-24 h-24 scale-100"
              }`}
            />
          )}

          {/* Pin centered on the facade */}
          <div
            className="absolute top-1/2 left-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md"
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
