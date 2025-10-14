// components/userComponents/MapLegend.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfo } from "@fortawesome/free-solid-svg-icons";

const MapLegend = ({ showLegend, setShowLegend }) => {
  return (
    <div className="absolute top-6 right-6 z-40 flex items-end space-x-3">
      {showLegend && (
        <div className="absolute right-full mr-3 top-0 bg-white rounded-lg shadow-md w-52 p-4 text-gray-800 animate-fadeIn">
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

      <div className="flex flex-col items-end space-y-2">
        <div className="bg-white rounded-lg shadow-md flex flex-col overflow-hidden relative">
          <button
            onClick={() => setShowLegend((prev) => !prev)}
            title="Map Legend"
            className={`p-3 w-full text-xl transition-colors hover:bg-gray-100 ${
              showLegend ? "bg-blue-50 text-blue-600" : "text-gray-700"
            }`}
          >
            <FontAwesomeIcon icon={faInfo} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
