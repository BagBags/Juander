import React, { useState } from "react";
import { Locate, MapPin, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import ttsService from "../../../utils/textToSpeech";

export default function MapControlButtons({
  userLocation,
  selectedPin,
  pins,
  currentPinIndex,
  setViewState,
  setSelectedPin,
  setManuallyDismissed,
}) {
  const { t } = useTranslation();
  const [isTTSEnabled, setIsTTSEnabled] = useState(ttsService.isEnabled);

  const handleTTSToggle = () => {
    const newState = ttsService.toggle();
    setIsTTSEnabled(newState);
    
    if (newState) {
      setTimeout(() => {
        ttsService.speak(t('tts_voiceEnabled'));
      }, 100);
    }
  };

  return (
    <div className="absolute bottom-55 right-4 z-40 flex flex-col gap-2">
      {/* Voice Guidance Toggle Button */}
      <button
        onClick={handleTTSToggle}
        className={`p-3 rounded-full shadow-lg border-2 transition-all duration-200 active:scale-95 ${
          isTTSEnabled
            ? "bg-green-500 hover:bg-green-600 text-white border-green-600 animate-pulse"
            : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
        }`}
        title={isTTSEnabled ? "Disable voice guidance" : "Enable voice guidance"}
        aria-label={isTTSEnabled ? "Disable voice guidance" : "Enable voice guidance"}
      >
        {isTTSEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </button>

      {/* Recenter to User Location Button */}
      {userLocation && (
        <button
          onClick={() => {
            setViewState({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              zoom: 16,
            });
          }}
          className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-all duration-200 active:scale-95"
          title="Go to my location"
        >
          <Locate className="w-5 h-5" />
        </button>
      )}

      {/* Show Current Destination Button - When preview card is closed */}
      {!selectedPin && pins[currentPinIndex] && (
        <button
          onClick={() => {
            setSelectedPin(pins[currentPinIndex]);
            setManuallyDismissed(false); // Reset manual dismiss when user wants to see it
          }}
          className="bg-[#f04e37] hover:bg-[#d9442f] text-white p-3 rounded-full shadow-lg transition-all duration-200 active:scale-95 animate-pulse"
          title="Show current destination"
        >
          <MapPin className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
