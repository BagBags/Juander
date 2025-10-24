// components/userComponents/TourMap/LazyTourMap.jsx
import React, { Suspense } from "react";
import LazyLoadErrorBoundary from "../../shared/LazyLoadErrorBoundary";

// Lazy-load the main TourMap component with retry logic
const TourMap = React.lazy(() => 
  import("./TourMap").catch(error => {
    console.error('Failed to load TourMap:', error);
    // If offline, throw error to be caught by error boundary
    if (!navigator.onLine) {
      throw new Error('Cannot load map while offline. Please connect to the internet.');
    }
    // Retry once after a short delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        import("./TourMap")
          .then(resolve)
          .catch(reject);
      }, 1000);
    });
  })
);

// Loading component for the map
const MapLoadingFallback = () => (
  <div className="w-full h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading map...</p>
      {!navigator.onLine && (
        <p className="text-sm text-red-600 mt-2">⚠️ You appear to be offline</p>
      )}
    </div>
  </div>
);

export default function LazyTourMap() {
  return (
    <LazyLoadErrorBoundary>
      <Suspense fallback={<MapLoadingFallback />}>
        <TourMap />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
}
