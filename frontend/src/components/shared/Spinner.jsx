import React from 'react';

/**
 * Standardized Spinner Component
 * Uses the system's color theme (#f04e37)
 * Consistent across the entire application
 */
export default function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-gray-200 border-t-[#f04e37] rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Full Page Loader with Spinner
 */
export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        {message && (
          <p className="text-gray-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Inline Loader with Spinner
 */
export function InlineLoader({ message = 'Loading...', size = 'md' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Spinner size={size} />
      {message && (
        <p className="text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );
}

/**
 * Button Spinner (for loading buttons)
 */
export function ButtonSpinner({ className = '' }) {
  return (
    <div
      className={`w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
