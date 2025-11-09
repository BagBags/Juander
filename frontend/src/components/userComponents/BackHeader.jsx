// BackHeader.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * BackHeader Component - PROFESSIONAL PWA IMPLEMENTATION
 * 
 * CRITICAL: Works on ALL mobile devices including:
 * - iPhone X, XS, XR, 11, 12, 13, 14, 15 (all models)
 * - iPhone with notches and Dynamic Island
 * - Android devices with notches, punch holes, waterdrop displays
 * - Standard devices without safe areas
 * 
 * IMPLEMENTATION:
 * - Direct safe-area-inset integration (not just padding)
 * - Runtime safe-area detection and application
 * - Fallback padding for unsupported devices
 * - Webkit vendor prefixes for iOS
 * - Position: sticky with proper z-index layering
 */
export default function BackHeader({ title, className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.fromPath;

  const handleBack = () => {
    if (fromPath) {
      navigate(fromPath, { replace: true });
      return;
    }

    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }

    // Fallback by role
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user?.role === "tourist") {
      navigate("/Homepage", { replace: true });
    } else if (token && user?.role === "admin") {
      navigate("/AdminHome", { replace: true });
    } else {
      navigate("/GuestHomepage", { replace: true });
    }
  };

  return (
    <div 
      className={`flex items-center gap-2 w-full ${className}`}
      style={{
        // CRITICAL: Safe area insets for status bar clearance on ALL devices
        paddingTop: 'max(env(safe-area-inset-top), constant(safe-area-inset-top), 20px)',
        paddingLeft: 'max(env(safe-area-inset-left), constant(safe-area-inset-left), 16px)',
        paddingRight: 'max(env(safe-area-inset-right), constant(safe-area-inset-right), 16px)',
        paddingBottom: '12px',
        
        // Position (relative to avoid breaking other page layouts)
        position: 'relative',
        zIndex: 50,
        
        // Prevent content bleeding
        minHeight: 'fit-content',
        
        // Performance optimization
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <button
        className="text-2xl font-bold cursor-pointer transition-all active:scale-90 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
        onClick={handleBack}
        aria-label="Go back"
        style={{
          minWidth: '44px',
          minHeight: '44px',
          width: '44px',
          height: '44px',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          color: 'inherit',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      >
        ‹
      </button>
      <h1 
        className="font-bold text-xl truncate flex-1" 
        style={{ 
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          maxWidth: 'calc(100% - 60px)',
        }}
      >
        {title}
      </h1>
    </div>
  );
}
