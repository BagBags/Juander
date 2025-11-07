import React from "react";
import { Trophy, RotateCcw, X, CheckCircle } from "lucide-react";

export default function ItineraryCompletionModal({ isOpen, onRestart, onClose, itineraryName, totalSites }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <Trophy className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            Congratulations!
          </h3>
          <p className="text-white/90 text-sm">
            You've completed this itinerary
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-gray-900">{itineraryName}</p>
            </div>
            <p className="text-sm text-gray-600">
              {totalSites} {totalSites === 1 ? 'site' : 'sites'} visited
            </p>
          </div>

          <p className="text-gray-600 mb-2 text-center">
            Would you like to explore these sites again?
          </p>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Your progress will be saved
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Restart Button */}
            <button
              onClick={onRestart}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Go to First Site
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
