// components/userComponents/MapOverlays.jsx
import React from "react";
import BackHeader from "../BackButton";
import SiteCard from "./SiteCard";

const MapOverlays = ({ selectedPin, distance, onCloseCard }) => {
  return (
    <>
      {/* Header */}
      <div className="absolute top-0 left-0 w-full z-30 p-4 pointer-events-auto">
        <BackHeader title={<span className="text-black">Tour Map</span>} />
      </div>

      {/* Site card */}
      {selectedPin && (
        <SiteCard
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

      {/* Next site button */}
      {selectedPin && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
          <button className="bg-blue-700 text-white px-5 py-2 rounded-md cursor-pointer shadow-lg">
            Go to next site
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-30 pointer-events-auto">
        Tour Map
      </div>
    </>
  );
};

export default MapOverlays;
