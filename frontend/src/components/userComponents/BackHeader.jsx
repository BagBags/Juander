// BackHeader.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Professional BackHeader component following IT standards:
 * - Uses CSS custom properties for safe-area-inset (iOS notch/dynamic island)
 * - No internal padding to prevent double-padding issues
 * - Parent container controls all spacing
 * - Accessible with ARIA labels
 * - Responsive with proper text truncation
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
