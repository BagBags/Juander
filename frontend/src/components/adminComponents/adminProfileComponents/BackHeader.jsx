import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Admin-specific BackHeader - IDENTICAL to main BackHeader
 * Only difference: uses fallback navigation instead of history-based
 */
export default function BackHeader({ title, fallback = "/AdminProfile", className = "" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(fallback);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
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
  );
}
