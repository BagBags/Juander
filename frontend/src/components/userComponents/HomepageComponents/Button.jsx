import React from "react";
import { useTranslation } from "react-i18next";

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
      className="fixed bottom-16 lg:fixed lg:bottom-16
    left-1/2 -translate-x-1/2
    bg-white text-black font-semibold shadow-md rounded-2xl
    w-40 sm:w-44 lg:w-52
    h-12 sm:h-14 lg:h-14
    text-sm sm:text-base lg:text-lg
    hover:bg-gray-100 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-300 
    transition-all duration-200 ease-in-out z-40"
    >
      {/* Label for Mobile/Tablet */}
      <span className="block lg:hidden">{t("startTour")}</span>
      {/* Label for Desktop */}
      <span className="hidden lg:block">{t("explore")}</span>
    </button>
  );
}
