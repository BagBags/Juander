import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function BackHeader({ title }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="sticky top-0 z-20 pt-3 sm:pt-4 pb-2 px-3 sm:px-4 flex items-center border-gray-200 bg-white/95 backdrop-blur-sm">
      <button
        className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 cursor-pointer -ml-2"
        onClick={() => {
          if (location.key !== "default") {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
        aria-label="Go back"
      >
        <ChevronLeft 
          size={24} 
          className="text-black sm:w-7 sm:h-7" 
          strokeWidth={2.5}
        />
      </button>
      <h1 className="ml-1 sm:ml-2 font-bold text-lg sm:text-xl md:text-2xl truncate">
        {title || "Back"}
      </h1>
    </div>
  );
}
