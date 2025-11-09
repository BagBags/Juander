// BackHeader.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Professional BackHeader Component - PWA Optimized
 * 
 * RESPONSIVE DESIGN:
 * - Safe area insets for all iOS devices (iPhone X+, notches, Dynamic Island)
 * - Proper spacing below status bar (time, battery, signal)
 * - Works on all Android devices with notches/punch holes
 * - Minimum padding fallback for devices without safe areas
 * 
 * ACCESSIBILITY:
 * - ARIA labels for screen readers
 * - Proper touch targets (44x44px minimum)
 * - High contrast text with shadows
 * 
 * PERFORMANCE:
 * - Zero layout shifts
 * - GPU-accelerated animations
 * - Optimized for 60fps interactions
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
        // Status bar safe area - ensures header is BELOW status bar
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 1rem)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 1rem)',
        paddingBottom: '0.75rem',
        // Prevent content from being cut off
        minHeight: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)',
        // Ensure proper z-index
        position: 'relative',
        zIndex: 50,
        // Smooth rendering
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      <button
        className="text-2xl font-bold cursor-pointer transition-all active:scale-90 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
        onClick={handleBack}
        aria-label="Go back"
        style={{
          // Minimum touch target size (44x44px for accessibility)
          minWidth: '44px',
          minHeight: '44px',
          width: '44px',
          height: '44px',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          color: 'inherit',
          // GPU acceleration
          transform: 'translateZ(0)',
        }}
      >
        ‹
      </button>
      <h1 
        className="font-bold text-xl truncate flex-1" 
        style={{ 
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          // Prevent text overflow
          maxWidth: 'calc(100% - 60px)',
        }}
      >
        {title}
      </h1>
    </div>
  );
}
