// components/userComponents/TourMap/LazyTourMap.jsx
import React, { Suspense } from "react";

// Lazy-load the main TourMap component
const TourMap = React.lazy(() => import("./TourMap"));

// Loading component for the map
const MapLoadingFallback = () => (
  <div className="w-full h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading map...</p>
    </div>
  </div>
);

export default function LazyTourMap() {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <TourMap />
    </Suspense>
  );
}
