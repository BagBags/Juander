import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Standardized BackHeader component - matches Profile page design
 * Should be wrapped in a container with safe-area padding
 */
export default function BackHeader({ title }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract plain text from title if it's wrapped in React elements
  const plainTitle = typeof title === 'string' ? title : 
                     (title?.props?.children || title || "Back");

  return (
    <div className="flex items-center gap-2">
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
}
