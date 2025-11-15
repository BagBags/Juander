import React from "react";
import { Play, RotateCcw, X } from "lucide-react";

export default function ResumeItineraryModal({ isOpen, onResume, onRestart, onClose, currentSiteName, showRestart = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white">Continue Your Journey?</h3>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-2">
            Your progress has been restored.
          </p>
          {currentSiteName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">Current site:</p>
              <p className="font-semibold text-gray-900">{currentSiteName}</p>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-2">
            Continue with your progress or restart from the beginning?
          </p>
          <p className="text-xs text-gray-400 mb-6 text-center">
            Your visited sites are preserved
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Resume Button */}
            <button
              onClick={onResume}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition-all shadow-lg"
            >
              <Play className="w-5 h-5" />
              Continue Journey
            </button>

            {/* Restart Button */}
            {showRestart && (
              <button
                onClick={onRestart}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 active:scale-95 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                Restart from Beginning
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
