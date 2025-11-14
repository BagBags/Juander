import React, { useEffect, useMemo, useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function CustomTourTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  skipProps,
  isLastStep,
  size,
}) {
  const containerRef = useRef(null);
  const primaryRef = useRef(null);

  // Randomize persona avatar from public/juan/Juan1-4 unless step provides one
  const personaImages = useMemo(
    () => [
      "/juan/Juan1.png",
      "/juan/Juan2.png",
      "/juan/Juan3.png",
      "/juan/Juan4.png",
    ],
    []
  );
  const avatarSrc = useMemo(() => {
    if (step?.avatar) return step.avatar; // allow override per step
    const i = Math.floor(Math.random() * personaImages.length);
    return personaImages[i];
  }, [index, step?.avatar, personaImages]);

  // Focus management: focus primary action or container on mount
  useEffect(() => {
    const next = primaryRef.current;
    if (next && typeof next.focus === "function") {
      next.focus();
    } else if (containerRef.current && typeof containerRef.current.focus === "function") {
      containerRef.current.focus();
    }
  }, [index]);

  const handleKeyDown = (e) => {
    // Basic keyboard controls inside the modal tooltip
    if (e.key === "Escape") {
      closeProps?.onClick?.(e);
    }
    if (e.key === "ArrowRight") {
      primaryProps?.onClick?.(e);
    }
    if (e.key === "ArrowLeft") {
      backProps?.onClick?.(e);
    }
  };

  const titleId = `tour-title-${index}`;
  const contentId = `tour-content-${index}`;

  return (
    <div
      {...tooltipProps}
      className="relative bg-white rounded-2xl shadow-2xl w-[90vw] sm:w-[400px] md:w-[450px] max-w-[calc(100vw-32px)] border border-gray-200/60"
      style={{
        padding: 0,
        ...tooltipProps.style,
        animation: 'fadeIn 0.3s ease-out',
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'visible',
      }}
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={contentId}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Floating persona avatar - half body outside modal */}
      {avatarSrc && (
        <div className="absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <img
            src={avatarSrc}
            alt="Tour guide"
            aria-hidden="true"
            className="h-20 sm:h-24 w-auto drop-shadow-2xl"
          />
        </div>
      )}

      {/* Header - Modern minimal with persona */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex items-center justify-center border-b border-gray-100 bg-white/95">
        <h3 id={titleId} className="text-gray-900 font-semibold text-base sm:text-lg tracking-wide truncate">
          {step.title}
        </h3>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100">
        <div 
          className="h-full bg-gradient-to-r from-[#f04e37] to-[#e03d2d] transition-all duration-300 ease-out"
          style={{ width: `${((index + 1) / size) * 100}%` }}
        ></div>
      </div>

      {/* Scrollable content wrapper */}
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-5">
        {/* Optional media support */}
        {step.media && (
          <div className="mb-3">
            {typeof step.media === "string" ? (
              <img src={step.media} alt="Tour step media" className="w-full rounded-lg border border-gray-200/60 max-h-48 object-cover" />
            ) : (
              step.media
            )}
          </div>
        )}
        <p id={contentId} className="text-gray-700 text-sm leading-relaxed">
          {step.content}
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white flex flex-col sm:flex-row items-center gap-3">
        {/* Top row on mobile: dot progress */}
        <div className="flex items-center gap-1.5 sm:gap-2 order-1 sm:order-1">
          {Array.from({ length: size }).map((_, i) => (
            <span
              key={i}
              className={`inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-colors duration-200 ${
                i === index
                  ? 'bg-[#f04e37]'
                  : i < index
                    ? 'bg-[#f04e37]/40'
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Bottom row on mobile: buttons */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 order-2 sm:order-2 sm:ml-auto">
          {/* Back button */}
          {index > 0 && (
            <button
              {...backProps}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200"
              aria-label="Go to previous step"
            >
              <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          
          {/* Skip button */}
          {!isLastStep && (
            <button
              {...skipProps}
              className="px-2 sm:px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200"
              aria-label="Skip the tour"
            >
              Skip
            </button>
          )}
          
          {/* Primary button */}
          <button
            {...primaryProps}
            className="flex items-center gap-1 sm:gap-1.5 px-4 sm:px-5 py-1.5 bg-[#f04e37] hover:bg-[#e03d2d] text-white font-semibold text-xs sm:text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ml-auto"
            aria-label={isLastStep ? "Finish tour" : "Go to next step"}
            ref={primaryRef}
          >
            <span>{isLastStep ? "Get Started" : "Next"}</span>
            {!isLastStep && <ChevronRight size={14} className="sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}