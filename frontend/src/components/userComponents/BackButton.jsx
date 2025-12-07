import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BackHeader({ title, className = "", noMargin = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);

  const plainTitle =
    typeof title === "string"
      ? title
      : title?.props?.children || title || "Back";

  // Prevent scroll ONLY when dragging the header background
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const preventScroll = (e) => {
      // allow tapping inside header (button)
      const isInsideButton = e.target.closest("button");
      if (isInsideButton) return;

      e.preventDefault();
    };

    el.addEventListener("touchstart", preventScroll, { passive: false });
    el.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      el.removeEventListener("touchstart", preventScroll);
      el.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  return (
    <>
      <div
        ref={headerRef}
        className={`fixed inset-x-0 z-50 flex items-center gap-2 ${className}`}
        style={{
          top: "env(safe-area-inset-top)",
          paddingTop: noMargin ? 0 : "clamp(12px, 3vh, 20px)",
          paddingLeft: noMargin ? 0 : "clamp(10px, 4vw, 14px)",
          paddingRight: "clamp(10px, 4vw, 14px)",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "manipulation", // allow taps, block gestures
        }}
      >
        <button
          className="text-2xl font-bold cursor-pointer transition-all active:scale-90 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10"
          onClick={() => {
            const path = location.pathname;

            if (path.startsWith("/GuestItinerary")) {
              navigate("/GuestHomepage", { replace: true });
              return;
            }
            if (path.startsWith("/TouristItinerary")) {
              navigate("/Homepage", { replace: true });
              return;
            }
            if (location.key !== "default") navigate(-1);
            else navigate("/");
          }}
          aria-label="Go back"
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            color: "inherit",
          }}
        >
          ‹
        </button>

        <h1
          className="font-bold text-xl truncate"
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            margin: 0,
            padding: 0,
            color: "inherit",
          }}
        >
          {plainTitle}
        </h1>
      </div>

      {/* Spacer */}
      <div
        style={{
          height: noMargin
            ? `calc(env(safe-area-inset-top) + 44px)`
            : `calc(env(safe-area-inset-top) + clamp(12px, 3vh, 20px) + 44px)`,
        }}
      />
    </>
  );
}
