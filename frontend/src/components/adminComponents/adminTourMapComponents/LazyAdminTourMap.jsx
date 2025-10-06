import React, { Suspense } from "react";

// Lazy-load AdminTourMapMain
const AdminTourMapMain = React.lazy(() => import("./AdminTourMapMain"));

const MapLoadingFallback = () => (
  <div className="w-full h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading admin map...</p>
    </div>
  </div>
);

export default function LazyAdminTourMap() {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <AdminTourMapMain />
    </Suspense>
  );
}
