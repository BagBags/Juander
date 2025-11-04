import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MediaCarousel = ({ mediaFiles = [], className = "" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef(null);

  // Handle empty or invalid mediaFiles
  if (!mediaFiles || mediaFiles.length === 0) {
    return null;
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === mediaFiles.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? mediaFiles.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Handle touch events for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(0); // Reset touch end
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 30; // Reduced threshold for easier swiping
    const isRightSwipe = distance < -30;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }

    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Auto-play for videos
  useEffect(() => {
    const videoElements = carouselRef.current?.querySelectorAll("video");
    if (videoElements) {
      videoElements.forEach((video, index) => {
        if (index === currentIndex) {
          video.play().catch(() => {
            // Ignore autoplay errors
          });
        } else {
          video.pause();
        }
      });
    }
  }, [currentIndex]);

  return (
    <div className={`relative mx-auto ${className}`} style={{ maxWidth: '500px' }}>
      {/* Main Carousel Container */}
      <div
        ref={carouselRef}
        className="relative w-full h-64 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y pinch-zoom' }}
      >
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {mediaFiles.map((media, index) => (
            <div
              key={index}
              className="min-w-full h-full flex items-center justify-center bg-black"
            >
              {media.type === "video" ? (
                <video
                  src={media.url}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  muted
                  crossOrigin="anonymous"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <img
                  src={media.url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-contain"
                  draggable="false"
                />
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Hidden on mobile, visible on desktop */}
        {mediaFiles.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 z-10"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Slide Counter */}
        {mediaFiles.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
            {currentIndex + 1} / {mediaFiles.length}
          </div>
        )}
      </div>

      {/* Dots Indicator */}
      {mediaFiles.length > 1 && (
        <div className="flex justify-center gap-2 mt-3 mb-4">
          {mediaFiles.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-blue-600 w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
