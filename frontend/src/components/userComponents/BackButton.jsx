import React from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Standardized BackHeader component - EXACTLY matches Profile page design
 * - Uses React Portal to render at document root, isolated from parent CSS
 * - Single angle quotation mark ‹ with gap-2 spacing
 * - Button wrapper with hover effect
 * - White background with bottom border
 * - Identical to Profile page BackHeader
 */
export default function BackHeader({ title }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract plain text from title if it's wrapped in React elements
  const plainTitle = typeof title === 'string' ? title : 
                     (title?.props?.children || title || "Back");

  const headerContent = (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] bg-white border-b border-gray-200"
      style={{
        height: '56px',
        paddingLeft: '16px',
        paddingRight: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto'
      }}
    >
      <button
        className="text-2xl font-bold cursor-pointer transition-all active:scale-90 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/10"
        onClick={() => {
          if (location.key !== "default") {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
        aria-label="Go back"
        style={{
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          color: 'inherit'
        }}
      >
        ‹
      </button>
      <h1 
        className="font-bold text-xl truncate"
        style={{
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          margin: 0,
          padding: 0
        }}
      >
        {plainTitle}
      </h1>
    </div>
  );

  // Render using Portal to document body to avoid parent CSS interference
  return createPortal(headerContent, document.body);
}
