import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import ttsService from "../utils/textToSpeech";

/**
 * Global TTS Toggle Button - Fixed position across all pages
 * Positioned at bottom-left for easy access
 */
export default function GlobalTTSButton() {
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState(ttsService.isEnabled);

  const handleToggle = () => {
    const newState = ttsService.toggle();
    setIsEnabled(newState);
    // Don't announce activation
  };

  if (!ttsService.isSupported()) {
    return null; // Don't show button if TTS is not supported
  }

  return (
    <button
      onClick={handleToggle}
      className={`fixed bottom-24 left-6 z-[9999] p-4 rounded-full shadow-2xl border-2 transition-all duration-300 active:scale-95 hover:scale-110 ${
        isEnabled
          ? "bg-green-500 hover:bg-green-600 text-white border-green-600 animate-pulse"
          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
      }`}
      title={isEnabled ? "Disable voice guidance (Click)" : "Enable voice guidance (Click)"}
      aria-label={isEnabled ? "Disable voice guidance" : "Enable voice guidance"}
      style={{
        boxShadow: isEnabled 
          ? "0 8px 20px rgba(34, 197, 94, 0.4)" 
          : "0 4px 12px rgba(0, 0, 0, 0.15)"
      }}
    >
      {isEnabled ? (
        <Volume2 className="w-6 h-6" />
      ) : (
        <VolumeX className="w-6 h-6" />
      )}
    </button>
  );
}
