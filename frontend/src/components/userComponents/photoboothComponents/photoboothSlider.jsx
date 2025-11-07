// components/PhotoboothSlider.jsx
import React, { useRef, useEffect, useState } from "react";
import { Camera } from "lucide-react";

export default function PhotoboothSlider({
  repeatedFilters,
  selectedFilterId,
  setSelectedFilterId,
  onCapture,
  webcamReady,
  style,
}) {
  const carouselRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const filterSize = isMobile ? 60 : 70;
  const captureSize = isMobile ? 70 : 80;

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const middleIndex = Math.floor(repeatedFilters.length / 2);
    const button = carousel.children[middleIndex];

    if (button) {
      const scrollLeft =
        button.offsetLeft - (carousel.offsetWidth - button.offsetWidth) / 2;
      carousel.scrollTo({ left: scrollLeft, behavior: "smooth" });
      setSelectedFilterId(repeatedFilters[middleIndex].id);
    }
  }, [repeatedFilters]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollLeft = carousel.scrollLeft;
        const centerX = scrollLeft + carousel.offsetWidth / 2;
        let closestId = null;
        let minDist = Infinity;
        Array.from(carousel.children).forEach((btn, i) => {
          const btnCenter = btn.offsetLeft + btn.offsetWidth / 2;
          const dist = Math.abs(centerX - btnCenter);
          if (dist < minDist) {
            minDist = dist;
            closestId = repeatedFilters[i].id;
          }
        });
        if (closestId && closestId !== selectedFilterId) {
          setSelectedFilterId(closestId);
        }
        const closestButton =
          carousel.children[
            repeatedFilters.findIndex((f) => f.id === closestId)
          ];
        if (closestButton) {
          const scrollLeft =
            closestButton.offsetLeft -
            (carousel.offsetWidth - closestButton.offsetWidth) / 2;
          carousel.scrollTo({ left: scrollLeft, behavior: "smooth" });
        }
      }, 150);
    };

    carousel.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timeoutId);
      carousel.removeEventListener("scroll", handleScroll);
    };
  }, [repeatedFilters, selectedFilterId]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: `${filterSize + 20}px`,
        display: "flex",
        alignItems: "center",
        ...style,
      }}
    >
      <div
        ref={carouselRef}
        style={{
          width: "100%",
          overflowX: "scroll",
          display: "flex",
          padding: "10px 0",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          scrollbarWidth: "none",
          height: "100%",
          alignItems: "center",
          paddingLeft: `calc(50% - ${filterSize / 2}px)`,
          paddingRight: `calc(50% - ${filterSize / 2}px)`,
        }}
        className="hide-scrollbar"
      >
        {repeatedFilters.map((filter) => (
          <button
            key={filter.id}
            style={{
              flex: "0 0 auto",
              width: `${filterSize}px`,
              height: `${filterSize}px`,
              margin: isMobile ? "0 6px" : "0 10px",
              borderRadius: "50%",
              border:
                filter.id === selectedFilterId
                  ? "3px solid #f04e37"
                  : "2px solid #ccc",
              scrollSnapAlign: "center",
              position: "relative",
              cursor: "pointer",
              overflow: "hidden",
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onClick={() => {
              setSelectedFilterId(filter.id);
              const button =
                carouselRef.current.children[
                  repeatedFilters.findIndex((f) => f.id === filter.id)
                ];
              const scrollLeft =
                button.offsetLeft -
                (carouselRef.current.offsetWidth - button.offsetWidth) / 2;
              carouselRef.current.scrollTo({
                left: scrollLeft,
                behavior: "smooth",
              });
            }}
            title={filter.label}
          >
            {/* Filter preview image */}
            <img
              src={filter.image}
              alt={filter.label}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
              }}
            />
            
            {/* Label overlay */}
            <span
              style={{
                position: "absolute",
                bottom: isMobile ? "3px" : "5px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: isMobile ? "8px" : "10px",
                color: "#fff",
                background: "rgba(0,0,0,0.7)",
                padding: isMobile ? "1px 3px" : "2px 5px",
                borderRadius: "4px",
                whiteSpace: "nowrap",
                maxWidth: isMobile ? "50px" : "60px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {filter.label}
            </span>
          </button>
        ))}
      </div>

      {/* Capture Button (center overlay) - Snapchat style */}
      <button
        onClick={onCapture}
        disabled={!webcamReady}
        className="absolute left-1/2 -translate-x-1/2 rounded-full border-4 border-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
        style={{
          pointerEvents: "auto",
          background: "transparent",
          width: `${captureSize}px`,
          height: `${captureSize}px`,
        }}
      >
        {/* Inner ring for depth */}
        <div className="absolute inset-1 rounded-full border-2 border-white/50"></div>
      </button>
    </div>
  );
}
