import React, { useState, useEffect, useRef } from "react";
import { Marker } from "react-map-gl";

/**
 * Modern User Location Marker - Google Maps Style
 * Optimized for fast rotation performance
 * Features:
 * - Blue dot with white border
 * - Pulse animation
 * - Blue light beam as direction indicator (rotates based on device compass)
 * - Accuracy circle
 */
export default function ModernUserMarker({ userLocation, heading = null }) {
  const [currentHeading, setCurrentHeading] = useState(heading || 0);
  const beamRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Listen to device orientation for heading
  useEffect(() => {
    if (heading !== null && heading !== undefined) {
      setCurrentHeading(heading);
      // Directly update DOM for instant rotation
      if (beamRef.current) {
        beamRef.current.style.transform = `rotate(${heading}deg)`;
      }
      return;
    }

    // Try to get device orientation (compass heading)
    const handleOrientation = (event) => {
      const now = Date.now();
      
      // Throttle to max 60fps (16.67ms between updates)
      if (now - lastUpdateRef.current < 16) {
        return;
      }
      
      let newHeading = null;
      
      if (event.webkitCompassHeading !== undefined) {
        // iOS
        newHeading = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Android - alpha is the compass heading
        newHeading = 360 - event.alpha;
      }
      
      if (newHeading !== null && beamRef.current) {
        lastUpdateRef.current = now;
        
        // Cancel any pending animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Use requestAnimationFrame for smooth 60fps updates
        animationFrameRef.current = requestAnimationFrame(() => {
          if (beamRef.current) {
            // Direct DOM manipulation for instant rotation without React re-render
            beamRef.current.style.transform = `rotate(${newHeading}deg)`;
          }
          // Update state less frequently (every 100ms) for other components that might need it
          if (now - lastUpdateRef.current > 100) {
            setCurrentHeading(newHeading);
          }
        });
      }
    };

    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === "granted") {
            window.addEventListener("deviceorientation", handleOrientation, { passive: true });
          }
        })
        .catch(console.error);
    } else {
      // Non-iOS or older iOS
      window.addEventListener("deviceorientationabsolute", handleOrientation, { passive: true });
      window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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
          ref={beamRef}
          className="absolute"
          style={{
            transform: `rotate(${currentHeading}deg)`,
            transformOrigin: "center center",
            willChange: "transform",
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
