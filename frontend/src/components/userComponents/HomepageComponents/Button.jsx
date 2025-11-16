import React from "react";
import { useTranslation } from "react-i18next";
import { Compass } from "lucide-react";

export default function Button({ navigate }) {
  const { t } = useTranslation();

  const handleClick = () => {
    if (window.innerWidth >= 1024) {
      // Desktop view
      navigate("/TourMap");
    } else {
      // Mobile/Tablet view
      navigate("/TouristItinerary");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="homepage-start-tour-btn fixed bottom-16 lg:fixed lg:bottom-16
    left-1/2 -translate-x-1/2
    bg-white/95 backdrop-blur-md
    text-[#f04e37] font-bold shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-2xl
    w-48 sm:w-52 lg:w-56
    h-14 sm:h-16 lg:h-16
    text-lg sm:text-xl lg:text-xl
    hover:bg-[#f04e37]
    hover:text-white
    hover:shadow-[0_8px_32px_rgba(240,78,55,0.4)]
    hover:-translate-y-0.5
    active:translate-y-0
    focus:outline-none 
    transition-all duration-300 ease-out
    border border-white/50
    flex items-center justify-center gap-2 z-40"
    >
      <Compass className="w-5 h-5" />
      {/* Label for Mobile/Tablet */}
      <span className="block lg:hidden">{t("startTour")}</span>
      {/* Label for Desktop */}
      <span className="hidden lg:block">{t("explore")}</span>
    </button>
  );
}
