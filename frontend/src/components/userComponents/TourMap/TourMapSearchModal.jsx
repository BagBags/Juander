import React, { useEffect, useMemo, useState, useRef } from "react";
import { X, Search as SearchIcon, Tag } from "lucide-react";

// Modern search modal for TourMap: search + category filter
export default function TourMapSearchModal({ isOpen, onClose, pins = [], onSelectPin }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const containerRef = useRef(null);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setCategory("all");
    }
  }, [isOpen]);

  const categories = useMemo(() => {
    const names = new Set(
      (pins || []).map((p) => {
        const cat = p?.category;
        if (!cat) return "";
        return typeof cat === "object" ? (cat.name || "") : String(cat);
      }).filter(Boolean)
    );
    return ["all", ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [pins]);

  const filteredPins = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (pins || []).filter((p) => {
      const name = (p.siteName || p.title || "").toLowerCase();
      const desc = (p.siteDescription || p.description || "").toLowerCase();
      const cat = typeof p.category === "object" ? (p.category?.name || "") : String(p.category || "");
      const matchesQuery = q ? (name.includes(q) || desc.includes(q)) : true;
      const matchesCategory = category === "all" ? true : cat === category;
      const isActive = !p.status || p.status === "active";
      return matchesQuery && matchesCategory && isActive;
    });
  }, [pins, query, category]);

  if (!isOpen) return null;

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL 
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
    : "http://localhost:5000";

  const resolveImage = (pin) => {
    const m = pin?.mediaFiles?.find((mf) => mf.type === "image");
    if (m?.url) {
      return m.url.startsWith("http") ? m.url : `${BACKEND_URL}${m.url}`;
    }
    return pin?.mediaUrl || "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=400&q=80";
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div 
        ref={containerRef}
        className="w-full sm:max-w-2xl sm:mx-6 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Search Sites</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or description"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 border-2 border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none"
            />
          </div>
          <div className="w-40">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white text-gray-900 border-2 border-gray-200 focus:border-[#f04e37] focus:ring-2 focus:ring-[#f04e37]/20 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
          {filteredPins.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No sites match your search.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPins.map((pin) => (
                <button
                  key={pin._id}
                  onClick={() => {
                    // Close modal first, then animate map to pin via onSelectPin
                    onClose?.();
                    // Small delay to let modal close animation complete
                    setTimeout(() => onSelectPin?.(pin), 180);
                  }}
                  className="group text-left bg-white rounded-xl border border-gray-200 hover:border-[#f04e37] hover:shadow-lg transition overflow-hidden"
                >
                  <div className="h-28 bg-gray-100 overflow-hidden">
                    <img src={resolveImage(pin)} alt={pin.siteName || pin.title || 'Site'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{pin.siteName || pin.title}</h3>
                      {pin.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-[#fef2f0] text-[#f04e37]">
                          <Tag className="w-3 h-3" />
                          {typeof pin.category === 'object' ? (pin.category?.name || '') : String(pin.category)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">{pin.siteDescription || pin.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}