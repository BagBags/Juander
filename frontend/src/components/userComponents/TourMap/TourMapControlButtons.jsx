import React from "react";
import { Search, Info } from "lucide-react";

export default function TourMapControlButtons({
  onOpenSearch,
  showLegend,
  setShowLegend,
}) {
  return (
    <div className="absolute top-24 right-4 md:top-24 z-40 flex flex-col gap-2 items-end">
      {/* Search Button */}
      <button
        onClick={onOpenSearch}
        className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-all active:scale-95"
        title="Search Sites"
        aria-label="Search Sites"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Legend Button */}
      <button
        onClick={() => setShowLegend?.((v) => !v)}
        className={`p-3 rounded-full shadow-lg border transition-all active:scale-95 ${
          showLegend ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        }`}
        title="Map Legend"
        aria-label="Map Legend"
      >
        <Info className="w-5 h-5" />
      </button>
    </div>
  );
}