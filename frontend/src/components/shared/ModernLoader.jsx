import React, { useState, useEffect } from 'react';

/**
 * Modern Loader with Logo and Progress Bar
 * Displays logo with simple progress bar for loading state
 */
export default function ModernLoader({ progress = 0 }) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    // Smooth progress animation
    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        if (prev >= progress) return progress;
        return Math.min(prev + 2, progress);
      });
    }, 20);

    return () => clearInterval(interval);
  }, [progress]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 px-4">
        {/* Logo - No opacity changes */}
        <div>
          <img 
            src="/icons/logo.png" 
            alt="Juander Logo" 
            className="w-32 h-32 object-contain"
          />
        </div>

        {/* Loading Text */}
        <p className="text-gray-800 text-lg font-light tracking-wide">
          Loading Juander
          <span className="inline-block ml-1">
            <span className="animate-pulse" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '200ms' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '400ms' }}>.</span>
          </span>
        </p>

        {/* Progress Bar with Percentage */}
        <div className="w-64 relative">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-[#f04e37] to-orange-500 rounded-full transition-all duration-300 ease-out shadow-lg"
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          <p className="text-gray-600 text-xs font-medium text-center mt-2">{Math.round(displayProgress)}%</p>
        </div>
      </div>
    </div>
  );
}
