import React, { useState, useEffect, useRef, memo } from "react";
import { Marker } from "react-map-gl";
import { Compass } from "lucide-react";

/**
 * Modern User Location Marker - Google Maps Style
 * Optimized for fast rotation performance
 * Features:
 * - Blue dot with white border
 * - Pulse animation
 * - Blue light beam as direction indicator (rotates based on device compass)
 * - Accuracy circle
 * - iOS permission button for compass access
 * 
 * Memoized to prevent unnecessary rerenders when parent updates
 */
const ModernUserMarker = memo(function ModernUserMarker({ userLocation, heading = null }) {
  const [currentHeading, setCurrentHeading] = useState(heading || 0);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const beamRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const animationFrameRef = useRef(null);
  const screenOrientationRef = useRef(0);

  // Request iOS permission
  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === "granted") {
          setPermissionGranted(true);
          setNeedsPermission(false);
        }
      } catch (error) {
        console.error("Error requesting device orientation permission:", error);
      }
    }
  };

  // Track screen orientation for Android
  useEffect(() => {
    const updateScreenOrientation = () => {
      if (window.screen?.orientation?.angle !== undefined) {
        screenOrientationRef.current = window.screen.orientation.angle;
      } else if (window.orientation !== undefined) {
        screenOrientationRef.current = window.orientation;
      }
    };
    
    updateScreenOrientation();
    window.addEventListener("orientationchange", updateScreenOrientation);
    
    return () => {
      window.removeEventListener("orientationchange", updateScreenOrientation);
    };
  }, []);

  // Listen to device orientation for heading
  useEffect(() => {
    // If parent provides heading (from GPS), use that
    if (heading !== null && heading !== undefined && heading >= 0) {
      setCurrentHeading(heading);
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
      
      // iOS: webkitCompassHeading is already a compass heading (0 = North)
      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        newHeading = event.webkitCompassHeading;
      } 
      // Android: Convert alpha to compass heading
      else if (event.alpha !== null && event.alpha !== undefined) {
        // Alpha: 0-360 degrees, where 0 is North when device is flat
        // Need to adjust for screen orientation
        let compassHeading = event.alpha;
        
        // Adjust for screen rotation
        const screenAngle = screenOrientationRef.current || 0;
        
        // Portrait: 0°, Landscape Right: 90°, Landscape Left: -90° or 270°
        if (screenAngle === 90) {
          // Landscape right
          compassHeading = (event.alpha + 90) % 360;
        } else if (screenAngle === -90 || screenAngle === 270) {
          // Landscape left
          compassHeading = (event.alpha - 90 + 360) % 360;
        } else if (screenAngle === 180) {
          // Upside down
          compassHeading = (event.alpha + 180) % 360;
        }
        
        // Convert to compass heading (0 = North, clockwise)
        newHeading = (360 - compassHeading) % 360;
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

    // Check if we need permission (iOS 13+)
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      // iOS - show permission button
      if (!permissionGranted) {
        setNeedsPermission(true);
        return;
      }
      // Permission granted, add listener
      window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    } else {
      // Non-iOS or older iOS - directly add listeners
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
  }, [heading, permissionGranted]);

  if (!userLocation) return null;

  return (
    <>
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
      
      {/* iOS Permission Button - Fixed at bottom */}
      {needsPermission && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <button
            onClick={requestOrientationPermission}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            <Compass className="w-5 h-5" />
            <span className="text-sm font-medium">Enable Compass</span>
          </button>
        </div>
      )}
    </>
  );
});

export default ModernUserMarker;
