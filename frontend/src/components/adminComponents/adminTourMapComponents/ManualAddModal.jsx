// components/adminComponents/ManualAddModal.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

export default function ManualAddModal({
  manualCoords,
  setManualCoords,
  addPinFromCoords,
  setShowManualAdd,
  setShowAddPinModal,
}) {
  return (
    <div className="absolute top-6 left-6 w-[380px] bg-white rounded-2xl shadow-2xl flex flex-col z-40 border border-gray-100 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-blue-50 to-indigo-50">
        <button
          onClick={() => {
            setShowManualAdd(false);
            setShowAddPinModal(true);
          }}
          className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          title="Back to Add Pin"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          Add Pin by Coordinates
        </h2>
        <button
          onClick={() => {
            setShowManualAdd(false);
            setShowAddPinModal(false);
          }}
          className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      {/* Manual Input Form */}
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={manualCoords.lat}
            onChange={(e) =>
              setManualCoords((prev) => ({ ...prev, lat: e.target.value }))
            }
            className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={manualCoords.lng}
            onChange={(e) =>
              setManualCoords((prev) => ({ ...prev, lng: e.target.value }))
            }
            className="w-full border border-gray-200 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <button
          onClick={() => {
            addPinFromCoords();
            setShowManualAdd(false);
            setShowAddPinModal(false);
          }}
          className="w-full px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Pin
        </button>
      </div>
    </div>
  );
}
