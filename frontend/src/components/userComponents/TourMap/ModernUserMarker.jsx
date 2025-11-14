import React, { useState, useEffect } from "react";
import { Marker } from "react-map-gl";

/**
 * Modern User Location Marker - Google Maps Style
 * Features:
 * - Blue dot with white border
 * - Pulse animation
 * - Blue light beam as direction indicator (rotates based on device compass)
 * - Accuracy circle
 */
export default function ModernUserMarker({ userLocation, heading = null }) {
  const [currentHeading, setCurrentHeading] = useState(heading || 0);

  // Listen to device orientation for heading
  useEffect(() => {
    if (heading !== null && heading !== undefined) {
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
      <div className="relative flex items-center justify-center w-16 h-16">
        {/* Blue light beam (direction indicator) - rotates with heading */}
        <div
          className="absolute transition-transform duration-100 ease-linear"
          style={{
            transform: `rotate(${currentHeading}deg)`,
            transformOrigin: "center center",
          }}
        >
          {/* Trapezoid shape with flat bottom and gradient spread top */}
          <div
            className="absolute"
            style={{
              width: "40px",
              height: "64px",
              background: "linear-gradient(to top, rgba(59, 130, 246, 0.75), rgba(59, 130, 246, 0))",
              top: "-56px",
              left: "50%",
              transform: "translateX(-50%)",
              clipPath: "polygon(30% 100%, 35% 100%, 0% 0%, 100% 0%, 65% 100%, 70% 100%)",
              filter: "blur(2px)",
            }}
          />
        </div>
        
        {/* Outer pulse ring */}
        <div className="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
        
        {/* Accuracy circle */}
        <div className="absolute w-10 h-10 bg-blue-500/10 rounded-full border border-blue-500/30" />
        
        {/* Main blue dot with white border */}
        <div className="relative w-5 h-5 bg-blue-600 rounded-full border-[3px] border-white shadow-lg z-10" />
      </div>
    </Marker>
  );
}
