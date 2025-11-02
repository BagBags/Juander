// components/userComponents/MapOverlays.jsx
import React from "react";
import BackHeader from "../BackHeader";
import SiteCard from "./SiteCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfo } from "@fortawesome/free-solid-svg-icons";

const MapOverlays = ({ selectedPin, distance, onCloseCard, showLegend, setShowLegend }) => {
  return (
    <>
      {/* Header with Legend Button */}
      <div 
        className="absolute top-0 left-0 w-full z-30 pointer-events-auto bg-white/95 backdrop-blur-md shadow-md"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 16px)",
          paddingBottom: "8px",
          paddingLeft: "16px",
          paddingRight: "16px"
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <BackHeader title={<span className="text-black">Tour Map</span>} className="flex-1" />
          
          {/* Legend Button - aligned to the right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Legend button clicked, current state:', showLegend);
              setShowLegend((prev) => !prev);
            }}
            title="Map Legend"
            aria-label="Toggle map legend"
            className={`p-2.5 rounded-lg shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              showLegend ? "bg-blue-50 text-blue-600" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FontAwesomeIcon icon={faInfo} className="text-lg" />
          </button>
        </div>
      </div>
      
      {/* Legend Panel */}
      {showLegend && (
        <div className="absolute top-20 right-4 z-40 bg-white rounded-lg shadow-lg w-52 p-4 text-gray-800 animate-fadeIn pointer-events-auto">
          <h4 className="font-semibold mb-3 text-lg border-b pb-1">
            Map Legend
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-red-600 border border-white shadow-sm"></span>
              <span>Active Site</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-blue-600 border border-white shadow-sm"></span>
              <span>Disabled Site</span>
            </li>
          </ul>
        </div>
      )}

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
      <div className="absolute bottom-0 w-full bg-orange-600 text-white text-center py-2 font-bold z-30 pointer-events-auto" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}>
        Tour Map
      </div>
    </>
  );
};

export default MapOverlays;
