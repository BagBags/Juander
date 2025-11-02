import React, { useEffect, useMemo, useRef } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

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
      className="relative bg-white rounded-2xl shadow-2xl w-[92vw] sm:w-auto max-w-sm md:max-w-md border border-gray-200/60 overflow-visible"
      style={{
        padding: 0,
        ...tooltipProps.style,
        animation: 'fadeIn 0.3s ease-out',
      }}
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={contentId}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Floating persona avatar outside the modal */}
      {avatarSrc && (
        <img
          src={avatarSrc}
          alt="Tour guide"
          aria-hidden="true"
          className="absolute -top-16 sm:-top-24 left-1/2 -translate-x-1/2 h-20 sm:h-24 w-auto drop-shadow-2xl pointer-events-none z-30"
        />
      )}

      {/* Header - Modern minimal with persona */}
      <div className="px-6 pt-6 pb-3 flex items-center justify-between border-b border-gray-100 bg-white/95">
        <h3 id={titleId} className="text-gray-900 font-semibold text-lg tracking-wide">
          {step.title}
        </h3>
        <button
          {...closeProps}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-all duration-200"
          aria-label="Close tour"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100">
        <div 
          className="h-full bg-gradient-to-r from-[#f04e37] to-[#e03d2d] transition-all duration-300 ease-out"
          style={{ width: `${((index + 1) / size) * 100}%` }}
        ></div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        {/* Optional media support */}
        {step.media && (
          <div className="mb-3">
            {typeof step.media === "string" ? (
              <img src={step.media} alt="Tour step media" className="w-full rounded-lg border border-gray-200/60" />
            ) : (
              step.media
            )}
          </div>
        )}
        <p id={contentId} className="text-gray-700 text-sm leading-relaxed">
          {step.content}
        </p>
        <div className="mt-2 text-xs text-gray-500" aria-live="polite">
          Step {index + 1} of {size}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-white flex items-center gap-3">
        {/* Left: dot progress */}
        <div className="flex items-center gap-2">
          {Array.from({ length: size }).map((_, i) => (
            <span
              key={i}
              className={`inline-block h-2 w-2 rounded-full transition-colors duration-200 ${
                i === index
                  ? 'bg-[#f04e37]'
                  : i < index
                    ? 'bg-[#f04e37]/40'
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Middle: back/skip */}
        <div className="ml-auto mr-2 flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-sm transition-all duration-200"
              aria-label="Go to previous step"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          )}
          {!isLastStep && (
            <button
              {...skipProps}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-sm transition-all duration-200"
              aria-label="Skip the tour"
            >
              Skip
            </button>
          )}
        </div>

        {/* Right: primary */}
        <button
          {...primaryProps}
          className="ml-auto flex items-center gap-1.5 px-5 py-1.5 bg-[#f04e37] hover:bg-[#e03d2d] text-white font-semibold text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          aria-label={isLastStep ? "Finish tour" : "Go to next step"}
          ref={primaryRef}
        >
          <span>{isLastStep ? "Get Started" : "Next"}</span>
          {!isLastStep && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}