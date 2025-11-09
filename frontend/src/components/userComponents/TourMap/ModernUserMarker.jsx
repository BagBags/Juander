import React, { useEffect, useRef, memo } from "react";
import { Marker } from "react-map-gl";

/**
 * Modern User Location Marker - Google Maps Style
 * PERFORMANCE OPTIMIZED:
 * - Zero React re-renders for rotation
 * - Direct DOM manipulation via CSS transforms
 * - GPU-accelerated with will-change and transform3d
 * - Smooth 60fps rotation with requestAnimationFrame
 * - Instant response to device orientation changes
 * 
 * Features:
 * - Blue dot with white border and pulse animation
 * - Blue light beam direction indicator (rotates with device compass)
 * - Works on iOS (webkitCompassHeading) and Android (alpha + screen rotation)
 * - Accuracy circle visualization
 */
const ModernUserMarker = memo(function ModernUserMarker({ userLocation, heading = null }) {
  const beamRef = useRef(null);
  const rafRef = useRef(null);
  const lastHeadingRef = useRef(0);
  const screenOrientationRef = useRef(0);
  const smoothHeadingRef = useRef(0);
  const targetHeadingRef = useRef(0);

  // Smooth interpolation for heading changes
  const smoothRotate = () => {
    if (!beamRef.current) return;
    
    const diff = targetHeadingRef.current - smoothHeadingRef.current;
    
    // Normalize to shortest rotation path (-180 to 180)
    let normalizedDiff = ((diff + 180) % 360) - 180;
    if (normalizedDiff < -180) normalizedDiff += 360;
    
    // Smooth interpolation (adjust 0.3 for faster/slower response)
    smoothHeadingRef.current += normalizedDiff * 0.3;
    
    // Normalize to 0-360
    if (smoothHeadingRef.current < 0) smoothHeadingRef.current += 360;
    if (smoothHeadingRef.current >= 360) smoothHeadingRef.current -= 360;
    
    // Apply rotation with GPU acceleration
    beamRef.current.style.transform = `rotate(${smoothHeadingRef.current}deg) translateZ(0)`;
    
    // Continue animation loop
    rafRef.current = requestAnimationFrame(smoothRotate);
  };

  // Update target heading (no re-render, just update ref)
  const updateHeading = (newHeading) => {
    if (newHeading !== null && newHeading !== undefined && !isNaN(newHeading)) {
      targetHeadingRef.current = newHeading;
      lastHeadingRef.current = Date.now();
    }
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

  // Start smooth rotation animation loop
  useEffect(() => {
    // Initialize smooth heading
    smoothHeadingRef.current = heading || 0;
    targetHeadingRef.current = heading || 0;
    
    // Start animation loop
    rafRef.current = requestAnimationFrame(smoothRotate);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Listen to device orientation for compass heading
  useEffect(() => {
    // If parent provides GPS heading, use it
    if (heading !== null && heading !== undefined && heading >= 0) {
      updateHeading(heading);
      return;
    }

    // Device orientation handler - OPTIMIZED for instant response
    const handleOrientation = (event) => {
      let newHeading = null;
      
      // iOS: webkitCompassHeading (0° = North, already calibrated)
      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        newHeading = event.webkitCompassHeading;
      } 
      // Android: alpha (needs screen rotation adjustment)
      else if (event.alpha !== null && event.alpha !== undefined) {
        const screenAngle = screenOrientationRef.current || 0;
        let adjustedAlpha = event.alpha;
        
        // Adjust for screen orientation
        switch (screenAngle) {
          case 90:  // Landscape right
            adjustedAlpha = (event.alpha + 90) % 360;
            break;
          case -90: // Landscape left
          case 270:
            adjustedAlpha = (event.alpha - 90 + 360) % 360;
            break;
          case 180: // Upside down
            adjustedAlpha = (event.alpha + 180) % 360;
            break;
          default: // Portrait (0°)
            adjustedAlpha = event.alpha;
        }
        
        // Convert to compass heading (0° = North, clockwise)
        newHeading = (360 - adjustedAlpha) % 360;
      }
      
      // Update heading (no re-render, just ref update)
      if (newHeading !== null) {
        updateHeading(newHeading);
      }
    };

    // Add event listeners (no permission check here, handled by MapControlButtons)
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
        {/* Blue light beam - GPU accelerated rotation */}
        <div
          ref={beamRef}
          className="absolute"
          style={{
            transform: "rotate(0deg) translateZ(0)",
            transformOrigin: "center center",
            willChange: "transform",
            backfaceVisibility: "hidden",
            perspective: 1000,
          }}
        >
          {/* Trapezoid beam shape */}
          <div
            className="absolute"
            style={{
              width: "40px",
              height: "64px",
              background: "linear-gradient(to top, rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 0))",
              top: "-56px",
              left: "50%",
              transform: "translateX(-50%) translateZ(0)",
              clipPath: "polygon(30% 100%, 35% 100%, 0% 0%, 100% 0%, 65% 100%, 70% 100%)",
              filter: "blur(2px)",
              backfaceVisibility: "hidden",
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
});

export default ModernUserMarker;
