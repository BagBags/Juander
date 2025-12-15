import React, { useMemo, useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackHeader from "./BackButton";

export default function ARExperiencePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const url = useMemo(() => {
    try {
      const s = new URLSearchParams(location.search);
      const u = s.get("url");
      return u || null;
    } catch {
      return null;
    }
  }, [location.search]);

  const [iframeSrc, setIframeSrc] = useState(null);

  useEffect(() => {
    (async () => {
      // Ensure that any active media streams are stopped, freeing camera resources.
      try {
        const videos = document.querySelectorAll("video");
        videos.forEach((v) => {
          const s = v.srcObject;
          if (s && typeof s.getTracks === "function") {
            s.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch {}
            });
          }
          try {
            v.pause();
            v.srcObject = null;
            v.removeAttribute("src");
            v.load();
          } catch {}
        });
      } catch {}

      // Defer iframe mount slightly so the browser finalises context destruction.
      try {
        setIframeSrc(url);
      } catch {}
    })();
    const id = setTimeout(() => {
      try {
        setIframeSrc(url);
      } catch {}
    }, 450);
    return () => clearTimeout(id);
  }, [url]);

  useEffect(() => {
    return () => {
      try {
        const el = iframeRef.current;
        if (el) {
          el.src = "about:blank";
          el.remove();
        }
      } catch {}
    };
  }, []);

  if (!url) {
    try {
      navigate(-1);
    } catch {}
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black z-[10000]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        height: "100svh",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
        touchAction: "pan-y pinch-zoom",
      }}
    >
      <div
        className="fixed inset-x-0"
        style={{
          top: 0,
          height: "env(safe-area-inset-top)",
          backgroundColor: "white",
          zIndex: 9999,
        }}
      />
      <BackHeader
        title="AR Experience"
        className="bg-white text-gray-900 shadow-sm"
      />
      <iframe
        ref={iframeRef}
        id="arloopa-frame"
        src={iframeSrc}
        title="AR Experience"
        className="absolute inset-0 w-full h-full border-0"
        scrolling="no"
        allow="camera; microphone; accelerometer; gyroscope; magnetometer; xr-spatial-tracking; geolocation; clipboard-write; web-share; autoplay; picture-in-picture; display-capture; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-presentation allow-top-navigation-by-user-activation"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
