import React, { useState, useEffect } from "react";
import { Marker } from "react-map-gl";

/**
 * Modern User Location Marker - Google Maps Style
 * Features:
 * - Blue dot with white border
 * - Pulse animation
 * - Heading indicator (rotates based on device compass)
 * - Accuracy circle
 */
export default function ModernUserMarker({ userLocation, heading = null }) {
  const [currentHeading, setCurrentHeading] = useState(heading || 0);

  // Listen to device orientation for heading
  useEffect(() => {
    if (heading !== null) {
      setCurrentHeading(heading);
      return;
    }

    // Try to get device orientation (compass heading)
    const handleOrientation = (event) => {
      if (event.webkitCompassHeading) {
        // iOS
        setCurrentHeading(event.webkitCompassHeading);
      } else if (event.alpha !== null) {
        // Android - alpha is the compass heading
        setCurrentHeading(360 - event.alpha);
      }
    };

    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      // Non-iOS or older iOS
      window.addEventListener("deviceorientationabsolute", handleOrientation);
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [heading]);

  if (!userLocation) return null;

  return (
    <Marker
      longitude={userLocation.longitude}
      latitude={userLocation.latitude}
      anchor="center"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring */}
        <div className="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
        
        {/* Accuracy circle */}
        <div className="absolute w-10 h-10 bg-blue-500/10 rounded-full border border-blue-500/30" />
        
        {/* Main blue dot with white border */}
        <div className="relative w-5 h-5 bg-blue-600 rounded-full border-[3px] border-white shadow-lg z-10">
          {/* Heading indicator (directional arrow) */}
          <div
            className="absolute top-1/2 left-1/2 w-0 h-0 transition-transform duration-300"
            style={{
              transform: `translate(-50%, -50%) rotate(${currentHeading}deg)`,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: "8px solid white",
              marginTop: "-6px",
            }}
          />
        </div>
      </div>
    </Marker>
  );
}
