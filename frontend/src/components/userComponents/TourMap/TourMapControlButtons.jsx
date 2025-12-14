import React from "react";
import { Search } from "lucide-react";

export default function TourMapControlButtons({ onOpenSearch }) {
  return (
    <div
      className="fixed left-4 z-[10050] flex flex-col gap-2 items-start"
      style={{
        top: "calc(env(safe-area-inset-top) + 16px)",
        touchAction: "none",
        overscrollBehavior: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Search Button */}
      <button
        onClick={onOpenSearch}
        className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-all active:scale-95 map-search-btn-left"
        title="Search Sites"
        aria-label="Search Sites"
      >
        <Search className="w-5 h-5" />
      </button>
    </div>
  );
}
