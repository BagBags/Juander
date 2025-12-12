import React, { useState, useEffect } from "react";
import {
  Locate,
  MapPin,
  Volume2,
  VolumeX,
  User,
  Car,
  Bike,
  Footprints,
  Info,
} from "lucide-react";
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
  onActivateGps,
  hideRecenterButton = false,
  onOpenItineraryInfo,
}) {
  const { t } = useTranslation();
  const [isTTSEnabled, setIsTTSEnabled] = useState(ttsService.isEnabled);
  const isTTSSupported = ttsService.isSupported();
  const [needsCompassPermission, setNeedsCompassPermission] = useState(false);
  const [compassPermissionGranted, setCompassPermissionGranted] =
    useState(false);

  const handleTTSToggle = () => {
    if (!isTTSSupported) return;
    const newState = ttsService.toggle();
    setIsTTSEnabled(newState);
    if (newState) {
      const msg = t("tts_voiceEnabled") || "Voice guidance enabled";
      ttsService.speak(msg);
      try {
        window.dispatchEvent(new Event("tts-activated"));
      } catch {}
    }
  };

  // Check if compass permission is needed (iOS 13+)
  useEffect(() => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      setNeedsCompassPermission(true);
    }
  }, []);

  // Request compass permission for iOS
  const requestCompassPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
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
      // If GPS not yet active or no userLocation, trigger activation
      if (!userLocation && typeof onActivateGps === "function") {
        try {
          onActivateGps();
        } catch {}
      }
      // Center to user location if available
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
        className={`map-tts-toggle p-3 rounded-full shadow-lg border-2 transition-all duration-200 active:scale-95 ${
          !isTTSSupported
            ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
            : isTTSEnabled
            ? "bg-green-500 hover:bg-green-600 text-white border-green-600 animate-pulse"
            : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
        }`}
        disabled={!isTTSSupported}
        title={
          !isTTSSupported
            ? "Voice guidance not supported on this device"
            : isTTSEnabled
            ? "Disable voice guidance"
            : "Enable voice guidance"
        }
        aria-label={
          !isTTSSupported
            ? "Voice guidance not supported"
            : isTTSEnabled
            ? "Disable voice guidance"
            : "Enable voice guidance"
        }
      >
        {isTTSEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </button>

      {/* GPS / Center Button (visible even before GPS to allow activation) */}
      {!hideRecenterButton && (
        <button
          onClick={handleCenterToUser}
          className={`map-center-btn p-3 rounded-full shadow-lg border-2 transition-all duration-200 active:scale-95 ${
            needsCompassPermission && !compassPermissionGranted
              ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-600 animate-pulse"
              : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
          }`}
          title={
            !userLocation
              ? "Enable GPS and center"
              : needsCompassPermission && !compassPermissionGranted
              ? "Enable compass & center"
              : "Go to my location"
          }
          aria-label={
            !userLocation
              ? "Enable GPS and center"
              : needsCompassPermission && !compassPermissionGranted
              ? "Enable compass and center to location"
              : "Center to my location"
          }
        >
          <Locate className="w-5 h-5" />
        </button>
      )}

      {/* Show Current Destination Button - Always visible */}
      {pins[currentPinIndex] && (
        <button
          onClick={() => {
            setSelectedPin(pins[currentPinIndex]);
            setManuallyDismissed(false); // Reset manual dismiss when user wants to see it
          }}
          className="map-show-destination-btn bg-[#f04e37] hover:bg-[#d9442f] text-white p-3 rounded-full shadow-lg transition-all duration-200 active:scale-95 animate-pulse"
          title="Show current destination"
        >
          <MapPin className="w-5 h-5" />
        </button>
      )}

      {/* Itinerary Info Button */}
      {typeof onOpenItineraryInfo === "function" && (
        <button
          onClick={() => {
            try {
              onOpenItineraryInfo();
            } catch {}
          }}
          className="map-itinerary-info-btn bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-all duration-200 active:scale-95"
          title="Itinerary overview"
          aria-label="Itinerary overview"
        >
          <Info className="w-5 h-5" />
        </button>
      )}

      {/* Transport Mode Toggle and Panel */}
      {enableTransportMode && (
        <div className="relative">
          <button
            onClick={() =>
              setShowTransportPanel && setShowTransportPanel((v) => !v)
            }
            className="map-transport-button bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-all duration-200 active:scale-95"
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
                  setTransportMode && setTransportMode("walking");
                  setShowTransportPanel && setShowTransportPanel(false);
                }}
                className={`flex items-center gap-2 px-2 py-1 rounded-md border text-sm transition ${
                  transportMode === "walking"
                    ? "bg-[#f04e37]/10 text-[#f04e37] border-[#f04e37]"
                    : "text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Footprints className="w-4 h-4" />
                <span>Foot</span>
              </button>

              <button
                onClick={() => {
                  setTransportMode && setTransportMode("cycling");
                  setShowTransportPanel && setShowTransportPanel(false);
                }}
                className={`flex items-center gap-2 px-2 py-1 rounded-md border text-sm transition ${
                  transportMode === "cycling"
                    ? "bg-[#f04e37]/10 text-[#f04e37] border-[#f04e37]"
                    : "text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Bike</span>
              </button>

              <button
                onClick={() => {
                  setTransportMode && setTransportMode("driving");
                  setShowTransportPanel && setShowTransportPanel(false);
                }}
                className={`flex items-center gap-2 px-2 py-1 rounded-md border text-sm transition ${
                  transportMode === "driving"
                    ? "bg-[#f04e37]/10 text-[#f04e37] border-[#f04e37]"
                    : "text-gray-700 border-gray-200 hover:bg-gray-50"
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
