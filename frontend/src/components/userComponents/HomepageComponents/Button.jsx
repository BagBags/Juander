import React from "react";
import { useTranslation } from "react-i18next";
import { Compass } from "lucide-react";

export default function Button({ navigate }) {
  const { t } = useTranslation();

  const isRealPhone = () => {
    const ua = navigator.userAgent.toLowerCase();
    const uaMobile =
      navigator.userAgentData?.mobile ?? /android|iphone|ipad|ipod/.test(ua);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    const touchPoints = navigator.maxTouchPoints || 0;
    return !!uaMobile && coarse && noHover && touchPoints > 0;
  };
  const isPhone = isRealPhone();

  const handleClick = () => {
    if (isPhone) {
      navigate("/TouristItinerary");
    } else {
      navigate("/TourMap");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="homepage-start-tour-btn fixed bottom-16 lg:fixed lg:bottom-16
    left-1/2 -translate-x-1/2
    bg-white/95 backdrop-blur-md
    text-[#f04e37] font-bold shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-2xl
    px-6 min-w-[12rem] sm:min-w-[13rem] lg:min-w-[18rem]
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
    flex items-center justify-center gap-3 z-40"
    >
      <Compass className="w-5 h-5" />
      <span
        className={isPhone ? "leading-tight" : "whitespace-nowrap leading-none"}
      >
        {isPhone ? t("startTour") : t("explore")}
      </span>
    </button>
  );
}
