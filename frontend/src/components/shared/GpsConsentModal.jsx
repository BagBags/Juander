import React from 'react';
import { Navigation, Home } from 'lucide-react';

const GpsConsentModal = ({ isOpen, onEnable, onDecline, errorMessage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6 bg-[#f04e37] text-white flex items-center gap-3">
          <Navigation className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">Enable GPS for Guidance</h2>
            <p className="text-sm text-white/90">To use the itinerary map, we need your location.</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            We use your location for turn-by-turn directions, nearby detection, and centering the map. Your location is only used to guide your tour.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-gray-800">
            This map requires GPS to function. If your GPS isn’t working or you prefer not to use it, you can explore with Tour Map features from the homepage.
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            onClick={onEnable}
            className="w-full bg-[#f04e37] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#d43e2a] transition"
          >
            Enable GPS
          </button>

          <button
            onClick={onDecline}
            className="w-full mt-2 bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
            type="button"
          >
            <Home className="w-5 h-5" /> Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default GpsConsentModal;