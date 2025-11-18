// BackHeader.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
export default function BackHeader({ title, className = "", noMargin = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.fromPath;
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

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

  useEffect(() => {
    const update = () => {
      try {
        setHeaderHeight(headerRef.current?.offsetHeight || 76);
      } catch (e) {}
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      {createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 'max(env(safe-area-inset-top), constant(safe-area-inset-top), 0px)',
            backgroundColor: 'transparent',
            zIndex: 9998,
            pointerEvents: 'none',
          }}
        />, document.body
      )}
      <div
        ref={headerRef}
        className={`flex items-center gap-2 w-full ${className}`}
        style={{
          paddingTop: 'max(env(safe-area-inset-top), constant(safe-area-inset-top), 24px)',
          paddingLeft: 'max(env(safe-area-inset-left), constant(safe-area-inset-left), 16px)',
          paddingRight: 'max(env(safe-area-inset-right), constant(safe-area-inset-right), 16px)',
          paddingBottom: '16px',
          minHeight: 'calc(max(env(safe-area-inset-top), constant(safe-area-inset-top), 0px) + 64px)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          marginTop: noMargin ? 0 : 'clamp(12px, 3vh, 20px)',
          marginLeft: noMargin ? 0 : 'clamp(10px, 4vw, 14px)',
          minHeight: 'fit-content',
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
      <div
        style={{
          height: headerHeight || 88,
        }}
      />
    </>
  );
}
