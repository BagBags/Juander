import React, { useEffect, useMemo, useRef, useState } from "react";
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
  onBack,
  onNext,
  onClose,
  onSkip,
  external,
}) {
  const containerRef = useRef(null);
  const primaryRef = useRef(null);
  const prevPosRef = useRef(null);
  const [slideStyle, setSlideStyle] = useState({ transform: 'translate(0,0)', transition: 'none' });

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
  const defaultAvatar = useMemo(() => {
    const i = Math.floor(Math.random() * personaImages.length);
    return personaImages[i];
  }, [personaImages]);
  const avatarSrc = step?.avatar || defaultAvatar;

  useEffect(() => {
    if (index === 0) {
      const el = primaryRef.current || containerRef.current;
      if (el && typeof el.focus === "function") {
        requestAnimationFrame(() => {
          try {
            el.focus({ preventScroll: true });
          } catch {
            el.focus();
          }
        });
      }
    }
  }, [index]);

  const animateAnd = (handler) => (e) => {
    handler?.(e);
  };

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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const newRect = el.getBoundingClientRect();
    const prev = prevPosRef.current;
    if (prev) {
      const dx = prev.left - newRect.left;
      const dy = prev.top - newRect.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        setSlideStyle({ transform: `translate(${dx}px, ${dy}px)`, transition: 'none' });
        requestAnimationFrame(() => {
          setSlideStyle({ transform: 'translate(0,0)', transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' });
        });
      } else {
        setSlideStyle({ transform: 'translate(0,0)', transition: 'none' });
      }
      prevPosRef.current = null;
    } else {
      setSlideStyle({ transform: 'translate(0,0)', transition: 'none' });
    }
  }, [index]);

  const performAndSlide = (handler) => (e) => {
    try {
      if (containerRef.current) {
        prevPosRef.current = containerRef.current.getBoundingClientRect();
      }
    } catch {}
    handler?.(e);
  };

  const titleId = `tour-title-${index}`;
  const contentId = `tour-content-${index}`;

  return (
    <div
      {...(external ? {} : tooltipProps)}
      className={"relative bg-white rounded-2xl shadow-2xl border border-gray-200/60 opacity-100"}
      style={{
        padding: 0,
        ...(external ? {} : tooltipProps.style),
        maxHeight: 'calc(100vh - 160px)',
        width: 'auto',
        maxWidth: 'min(450px, calc(100vw - 24px))',
        boxSizing: 'border-box',
        overflow: 'visible',
        zIndex: 10020,
        willChange: 'auto',
      }}
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={contentId}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={slideStyle} className="relative">
        {avatarSrc && (
          <div className="absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2 z-[100000] pointer-events-none">
            <img
              src={avatarSrc}
              alt=""
              aria-hidden="true"
              className="h-20 sm:h-24 w-auto"
              style={{ filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.35))' }}
            />
          </div>
        )}

      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex items-center justify-center border-b border-gray-100 bg-white/95">
        <h3 id={titleId} className="text-gray-900 font-semibold text-base sm:text-lg tracking-wide truncate">
          {step.title}
        </h3>
      </div>

      <div className="h-1 bg-gray-100">
        <div 
          className="h-full bg-gradient-to-r from-[#f04e37] to-[#e03d2d] transition-all duration-300 ease-out"
          style={{ width: `${((index + 1) / size) * 100}%` }}
        ></div>
      </div>

      <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'hidden' }}>
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

      </div>

      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white flex flex-col sm:flex-row items-center gap-3">
        {(!isLastStep) && (
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
        )}

        {/* Bottom row on mobile: buttons */}
        <div className={`flex items-center ${index > 0 || !isLastStep ? 'justify-between sm:ml-auto' : 'justify-center'} w-full sm:w-auto gap-2 order-2 sm:order-2`}>
          {/* Back button */}
          {index > 0 && (
            <button
              {...backProps}
              type="button"
              onClick={(e) => { if (index <= 0) return; (external ? performAndSlide(onBack) : performAndSlide(backProps?.onClick))(e); }}
              onMouseDown={(e) => e.stopPropagation()}
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
              type="button"
              onClick={external ? performAndSlide(onSkip) : performAndSlide(skipProps?.onClick)}
              onMouseDown={(e) => e.stopPropagation()}
              className="px-2 sm:px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200"
              aria-label="Skip the tour"
            >
              Skip
            </button>
          )}
          
          {/* Primary button */}
          <button
            {...(isLastStep ? closeProps : primaryProps)}
            type="button"
            onClick={(e) => { (external ? (isLastStep ? performAndSlide(onClose) : performAndSlide(onNext)) : (isLastStep ? performAndSlide(closeProps?.onClick) : performAndSlide(primaryProps?.onClick)))?.(e); }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex items-center gap-1 sm:gap-1.5 px-4 sm:px-5 py-1.5 bg-[#f04e37] hover:bg-[#e03d2d] text-white font-semibold text-xs sm:text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${index > 0 || !isLastStep ? 'ml-auto' : ''}`}
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