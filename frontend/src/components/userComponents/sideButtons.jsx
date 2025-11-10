import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SideButtons({ userType = "tourist" }) {
  const { t } = useTranslation();

  const allIcons = [
    {
      url: "icons/SideIcons/TourMap.png",
      label: "tourMap",
      to: "/TourMap",
      Device: userType === "guest" ? "All" : "Mobile",
      allowedFor: ["tourist", "guest"],
      tourClass: "side-button-map", // Tour target
    },
    {
      url: "icons/SideIcons/Itineraries.png",
      label: "createItinerary",
      to: "/CreateItinerary",
      Device: "All",
      allowedFor: ["tourist"],
      tourClass: "side-button-itinerary", // Tour target
    },
    {
      url: "icons/SideIcons/Photobooth.png",
      label: "photobooth",
      to: "/Photobooth",
      Device: "Mobile",
      allowedFor: ["tourist", "guest"],
      tourClass: "side-button-photobooth", // Tour target
    },
    {
      url: "icons/SideIcons/Hotlines.png",
      label: "hotlines",
      to: "/Emergency",
      Device: "Mobile",
      allowedFor: ["tourist", "guest"],
      tourClass: "side-button-emergency", // Tour target
    },
    {
      url: "icons/SideIcons/Profile.png",
      label: "profile",
      to: userType === "guest" ? "/GuestProfile" : "/Profile",
      Device: "All",
      allowedFor: ["tourist", "guest"],
      tourClass: "side-button-profile", // Tour target
    },
    {
      url: "icons/SideIcons/Archive.png",
      label: "tripArchives",
      to: "/TripArchive",
      Device: "All",
      allowedFor: ["tourist"],
      tourClass: "side-button-archives", // Tour target
    },
  ];

  // Filter icons based on userType
  const icons = allIcons.filter(icon => icon.allowedFor.includes(userType));

  return (
    <div
      className="fixed top-1/2 -translate-y-1/2 flex flex-col gap-5 z-50
                right-2 max-[375px]:right-1"
    >
      {icons.map((icon, index) => {
        let visibilityClass = "";
        if (icon.Device === "Mobile") visibilityClass = "block md:hidden";
        else visibilityClass = "block";

        // Determine if this icon should be enlarged (all except hotlines and profile)
        const shouldEnlarge = icon.label !== "hotlines" && icon.label !== "profile";
        const buttonSize = shouldEnlarge 
          ? "w-16 h-16 max-[375px]:w-13 max-[375px]:h-13 sm:w-20 sm:h-20 lg:w-20 lg:h-20"
          : "w-14 h-14 max-[375px]:w-11 max-[375px]:h-11 sm:w-18 sm:h-18 lg:w-18 lg:h-18";
        const iconSize = shouldEnlarge
          ? "w-9 h-9 max-[375px]:w-7 max-[375px]:h-7 sm:w-11 sm:h-11 lg:w-11 lg:h-11"
          : "w-7 h-7 max-[375px]:w-5 max-[375px]:h-5 sm:w-9 sm:h-9 lg:w-9 lg:h-9";

        return (
          <Link
            to={icon.to}
            key={index}
            className={`${visibilityClass} ${icon.tourClass || ''} flex flex-col items-center group`}
          >
            <div
              className={`${buttonSize}
                     rounded-full bg-yellow-400 flex items-center justify-center
                     shadow-lg hover:shadow-yellow-300/50 hover:scale-110
                     transition-transform duration-300 ease-out`}
            >
              <img
                src={icon.url}
                alt={`icon-${index}`}
                className={`${iconSize} object-contain`}
              />
            </div>

            <span
              className="text-[11px] sm:text-xs lg:text-sm text-white mt-1.5 font-semibold
                     opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)' }}
            >
              {t(icon.label)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
