// components/PhotoboothSlider.jsx
import React, { useRef, useEffect } from "react";

export default function PhotoboothSlider({
  repeatedFilters,
  selectedFilterId,
  setSelectedFilterId,
  // videoWidth,
  style,
}) {
  const carouselRef = useRef(null);

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
        height: "70px",
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
          paddingLeft: `calc(50% - 35px)`,
          paddingRight: `calc(50% - 35px)`,
        }}
      >
        {repeatedFilters.map((filter) => (
          <button
            key={filter.id}
            style={{
              flex: "0 0 auto",
              width: "70px",
              height: "70px",
              margin: "0 10px",
              borderRadius: "50%",
              background: `url(${filter.image}) center/cover no-repeat`,
              border:
                filter.id === selectedFilterId
                  ? "3px solid #3498db"
                  : "2px solid #ccc",
              scrollSnapAlign: "center",
              position: "relative",
              cursor: "pointer",
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
            <span
              style={{
                position: "absolute",
                bottom: "5px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "10px",
                color: "#fff",
                background: "rgba(0,0,0,0.5)",
                padding: "2px 5px",
                borderRadius: "4px",
              }}
            >
              {filter.label}
            </span>
          </button>
        ))}
      </div>

      {/* Capture Button (overlay) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          border: "4px solid white",
          pointerEvents: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "white",
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  );
}
