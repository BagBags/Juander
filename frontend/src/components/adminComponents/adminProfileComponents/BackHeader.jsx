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
        className={`flex items-center gap-2 bg-white ${className}`}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          paddingTop: '24px',
          paddingBottom: '16px',
          minHeight: '64px',
          paddingLeft: '0',
          paddingRight: '0',
          marginTop: 0,
          marginLeft: 0,
          marginBottom: '16px'
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
    </>
  );
}
