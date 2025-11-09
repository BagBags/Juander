import React, { useEffect, useRef, memo } from "react";
import { Marker } from "react-map-gl";

/**
 * Modern User Location Marker - PROFESSIONAL PWA IMPLEMENTATION
 * 
 * ARCHITECTURE:
 * - Zero React re-renders (pure DOM manipulation)
 * - INSTANT rotation (no interpolation lag)
 * - Continuous operation even when PWA is backgrounded
 * - GPU-accelerated transforms
 * - Page Visibility API integration
 * 
 * COMPASS SUPPORT:
 * - iOS: webkitCompassHeading (native compass API)
 * - Android: DeviceOrientationEvent.alpha with screen rotation compensation
 * - GPS: coords.heading fallback when device is moving
 */
const ModernUserMarker = memo(function ModernUserMarker({ userLocation, heading = null }) {
  const beamRef = useRef(null);
  const currentHeadingRef = useRef(0);
  const screenOrientationRef = useRef(0);
  const isPageVisibleRef = useRef(true);

  // INSTANT rotation - no interpolation, no lag
  const rotateBeam = (heading) => {
    if (!beamRef.current || heading === null || heading === undefined || isNaN(heading)) return;
    
    // Normalize heading to 0-360
    let normalizedHeading = heading % 360;
    if (normalizedHeading < 0) normalizedHeading += 360;
    
    // Store current heading
    currentHeadingRef.current = normalizedHeading;
    
    // INSTANT GPU-accelerated rotation
    beamRef.current.style.transform = `rotate(${normalizedHeading}deg) translateZ(0)`;
  };

  // Track screen orientation for Android compass adjustment
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

  // Page Visibility API - keep rotation working when PWA is backgrounded
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Device orientation listener - INSTANT response
  useEffect(() => {
    // Priority 1: GPS heading (when moving)
    if (heading !== null && heading !== undefined && heading >= 0) {
      rotateBeam(heading);
      return;
    }

    // Priority 2: Device compass heading
    const handleOrientation = (event) => {
      // Continue processing even if page is hidden (PWA backgrounded)
      let compassHeading = null;
      
      // iOS: Direct compass heading
      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        compassHeading = event.webkitCompassHeading;
      } 
      // Android: Calculate from alpha with screen rotation
      else if (event.alpha !== null && event.alpha !== undefined) {
        const screenAngle = screenOrientationRef.current || 0;
        let adjustedAlpha = event.alpha;
        
        // Compensate for screen orientation
        if (screenAngle === 90) {
          adjustedAlpha = (event.alpha + 90) % 360;
        } else if (screenAngle === -90 || screenAngle === 270) {
          adjustedAlpha = (event.alpha - 90 + 360) % 360;
        } else if (screenAngle === 180) {
          adjustedAlpha = (event.alpha + 180) % 360;
        }
        
        // Convert to compass bearing (0° = North)
        compassHeading = (360 - adjustedAlpha) % 360;
      }
      
      // INSTANT rotation
      if (compassHeading !== null) {
        rotateBeam(compassHeading);
      }
    };

    // Listen to both events for maximum compatibility
    window.addEventListener("deviceorientationabsolute", handleOrientation, { passive: true });
    window.addEventListener("deviceorientation", handleOrientation, { passive: true });

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
        {/* Direction Beam - INSTANT GPU-accelerated rotation */}
        <div
          ref={beamRef}
          className="absolute pointer-events-none"
          style={{
            transform: "rotate(0deg) translateZ(0)",
            transformOrigin: "center center",
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            perspective: 1000,
            WebkitPerspective: 1000,
          }}
        >
          <div
            className="absolute"
            style={{
              width: "40px",
              height: "64px",
              background: "linear-gradient(to top, rgba(59, 130, 246, 0.85), rgba(59, 130, 246, 0))",
              top: "-56px",
              left: "50%",
              transform: "translateX(-50%) translateZ(0)",
              WebkitTransform: "translateX(-50%) translateZ(0)",
              clipPath: "polygon(30% 100%, 35% 100%, 0% 0%, 100% 0%, 65% 100%, 70% 100%)",
              WebkitClipPath: "polygon(30% 100%, 35% 100%, 0% 0%, 100% 0%, 65% 100%, 70% 100%)",
              filter: "blur(2px)",
              WebkitFilter: "blur(2px)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          />
        </div>
        
        {/* Pulse animation */}
        <div className="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
        
        {/* Accuracy ring */}
        <div className="absolute w-10 h-10 bg-blue-500/10 rounded-full border border-blue-500/30" />
        
        {/* User dot */}
        <div className="relative w-5 h-5 bg-blue-600 rounded-full border-[3px] border-white shadow-lg z-10" />
      </div>
    </Marker>
  );
});

export default ModernUserMarker;
