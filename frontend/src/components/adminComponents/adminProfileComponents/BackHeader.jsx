import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Admin-specific BackHeader - IDENTICAL to main BackHeader
 * Only difference: uses fallback navigation instead of history-based
 */
export default function BackHeader({ title, fallback = "/AdminProfile", className = "", noMargin = false }) {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const handleBack = () => {
    navigate(fallback);
  };

  useEffect(() => {
    const update = () => {
      try {
        setHeaderHeight(headerRef.current?.offsetHeight || 64);
      } catch (e) {}
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      <div
        ref={headerRef}
        className={`flex items-center gap-2 ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          paddingTop: 'max(env(safe-area-inset-top), 24px)',
          paddingBottom: '16px',
          minHeight: 'calc(max(env(safe-area-inset-top), 0px) + 64px)',
          paddingLeft: '16px',
          paddingRight: '16px',
          marginTop: noMargin ? 0 : 'clamp(12px, 3vh, 20px)',
          marginLeft: noMargin ? 0 : 'clamp(10px, 4vw, 14px)'
        }}
      >
        <button
          className="text-2xl font-bold cursor-pointer transition-all active:scale-90 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
          onClick={handleBack}
          aria-label="Go back"
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            color: 'inherit'
          }}
        >
          ‹
        </button>
        <h1 className="font-bold text-xl truncate" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
          {title}
        </h1>
      </div>
      <div style={{ height: headerHeight || 88 }} />
    </>
  );
}
