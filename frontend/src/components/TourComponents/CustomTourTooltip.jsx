import React from "react";
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
  return (
    <div
      {...tooltipProps}
      className="bg-white rounded-xl shadow-2xl max-w-sm border border-gray-200/50 backdrop-blur-sm overflow-hidden"
      style={{
        padding: 0,
        ...tooltipProps.style,
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-[#f04e37] via-[#e03d2d] to-[#d02d1d] px-6 py-4 flex justify-between items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
        <h3 className="text-white font-semibold text-base tracking-wide relative z-10">{step.title}</h3>
        <button
          {...closeProps}
          className="text-white/90 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition-all duration-200 relative z-10"
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
        <p className="text-gray-600 text-sm leading-relaxed">{step.content}</p>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50/50 flex justify-between items-center gap-3">
        {/* Progress Indicator */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: size }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index 
                  ? 'w-6 bg-[#f04e37]' 
                  : i < index 
                    ? 'w-1.5 bg-[#f04e37]/40' 
                    : 'w-1.5 bg-gray-300'
              }`}
            ></div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-sm transition-all duration-200"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          )}

          {!isLastStep && (
            <button
              {...skipProps}
              className="px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm transition-all duration-200"
            >
              Skip
            </button>
          )}

          <button
            {...primaryProps}
            className="flex items-center gap-1.5 px-5 py-1.5 bg-gradient-to-r from-[#f04e37] to-[#e03d2d] hover:from-[#e03d2d] hover:to-[#d02d1d] text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            <span>{isLastStep ? "Get Started" : "Next"}</span>
            {!isLastStep && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}