// components/adminComponents/AddPinModal.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapPin,
  faKeyboard,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

export default function AddPinModal({
  isAddingPin,
  setIsAddingPin,
  setShowManualAdd,
  setShowAddPinModal,
}) {
  return (
    <div className="absolute top-6 right-24 w-[380px] bg-white rounded-2xl shadow-2xl flex flex-col z-40 border border-gray-100 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-semibold text-gray-800">Add Pin</h2>
        <button
          onClick={() => setShowAddPinModal(false)}
          className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      {/* Add Pin Options */}
      <div className="p-5 space-y-4">
        <button
          onClick={() => setIsAddingPin(!isAddingPin)}
          className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 ${
            isAddingPin
              ? "border-blue-400 bg-blue-50 shadow-md"
              : "border-gray-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:from-blue-50 hover:to-indigo-50"
          }`}
        >
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                isAddingPin ? "bg-blue-100" : "bg-blue-50"
              }`}
            >
              <FontAwesomeIcon
                icon={faMapPin}
                className={isAddingPin ? "text-blue-600" : "text-blue-500"}
              />
            </div>
            <div>
              <h3
                className={`font-medium ${
                  isAddingPin ? "text-blue-700" : "text-gray-800"
                }`}
              >
                {isAddingPin ? "Cancel pin adding" : "Tap to place"}
              </h3>
              <p className="text-sm text-gray-500">
                {isAddingPin 
                  ? "Click again to cancel pin adding mode" 
                  : "Activate pin adding when tapping on the map"
                }
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setShowManualAdd(true);
          }}
          className="w-full p-4 border-2 border-gray-200 rounded-xl text-left bg-gradient-to-r from-green-50/50 to-teal-50/50 hover:from-green-50 hover:to-teal-50 transition-all duration-200"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-3">
              <FontAwesomeIcon icon={faKeyboard} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Manual Add</h3>
              <p className="text-sm text-gray-500">
                Add pin by entering coordinates manually
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
