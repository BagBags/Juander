import React, { useState, useEffect } from "react";
import { Locate, MapPin, Volume2, VolumeX, User, Car, Bike, Footprints } from "lucide-react";
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
  enableTransportMode = false,
  showTransportPanel,
  setShowTransportPanel,
  transportMode,
  setTransportMode,
}) {
  const { t } = useTranslation();
  const [isTTSEnabled, setIsTTSEnabled] = useState(ttsService.isEnabled);
  const [needsCompassPermission, setNeedsCompassPermission] = useState(false);
  const [compassPermissionGranted, setCompassPermissionGranted] = useState(false);

  const handleTTSToggle = () => {
    const newState = ttsService.toggle();
    setIsTTSEnabled(newState);
    // Don't announce activation
  };

  // Check if compass permission is needed (iOS 13+)
  useEffect(() => {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      setNeedsCompassPermission(true);
    }
  }, []);

  // Request compass permission for iOS
  const requestCompassPermission = async () => {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === "granted") {
          setCompassPermissionGranted(true);
          setNeedsCompassPermission(false);
          // After permission, center to user location
          if (userLocation) {
            setViewState({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              zoom: 16,
            });
          }
        }
      } catch (error) {
        console.error("Error requesting compass permission:", error);
      }
    }
  };

  // Handle GPS center button click
  const handleCenterToUser = async () => {
    // If iOS needs permission and hasn't granted it yet
    if (needsCompassPermission && !compassPermissionGranted) {
      await requestCompassPermission();
    } else {
      // Just center to user location
      if (userLocation) {
        setViewState({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          zoom: 16,
        });
      }
    }
  };

  return (
    <div className="absolute top-24 right-4 md:top-24 z-40 flex flex-col gap-2 items-end">
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

      {/* Recenter to User Location Button with Compass Permission */}
      {userLocation && (
        <button
          onClick={handleCenterToUser}
          className={`p-3 rounded-full shadow-lg border-2 transition-all duration-200 active:scale-95 ${
            needsCompassPermission && !compassPermissionGranted
              ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-600 animate-pulse"
              : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
          }`}
          title={needsCompassPermission && !compassPermissionGranted ? "Enable compass & center" : "Go to my location"}
          aria-label={needsCompassPermission && !compassPermissionGranted ? "Enable compass and center to location" : "Center to my location"}
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

      {/* Transport Mode Toggle and Panel */}
      {enableTransportMode && (
        <div className="relative">
          <button
            onClick={() => setShowTransportPanel && setShowTransportPanel((v) => !v)}
            className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-all duration-200 active:scale-95"
            title="Transport mode"
            aria-label="Transport mode"
          >
            <User className="w-5 h-5" />
          </button>

          {/* Slide-out panel positioned to the left of the circle */}
          {showTransportPanel && (
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md shadow-xl rounded-xl p-2 border border-gray-200 flex items-center gap-2">
              <button
                onClick={() => { 
                  setTransportMode && setTransportMode('walking'); 
                  setShowTransportPanel && setShowTransportPanel(false);
                }}
                className={`flex items-center gap-2 px-2 py-1 rounded-md border text-sm transition ${
                  transportMode === 'walking' ? 'bg-[#f04e37]/10 text-[#f04e37] border-[#f04e37]' : 'text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Footprints className="w-4 h-4" />
                <span>Foot</span>
              </button>

              <button
                onClick={() => { 
                  setTransportMode && setTransportMode('cycling'); 
                  setShowTransportPanel && setShowTransportPanel(false);
                }}
                className={`flex items-center gap-2 px-2 py-1 rounded-md border text-sm transition ${
                  transportMode === 'cycling' ? 'bg-[#f04e37]/10 text-[#f04e37] border-[#f04e37]' : 'text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Bike</span>
              </button>

              <button
                onClick={() => { 
                  setTransportMode && setTransportMode('driving'); 
                  setShowTransportPanel && setShowTransportPanel(false);
                }}
                className={`flex items-center gap-2 px-2 py-1 rounded-md border text-sm transition ${
                  transportMode === 'driving' ? 'bg-[#f04e37]/10 text-[#f04e37] border-[#f04e37]' : 'text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Car</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
