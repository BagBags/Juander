import React, { Suspense } from "react";

// Lazy-load the full map
const UserMap = React.lazy(() => import("./TourMap"));

export default function LazyUserMap() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading map…</div>}>
      <UserMap />
    </Suspense>
  );
}
