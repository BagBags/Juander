import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SideButtons({ userType = "tourist" }) {
  const { t } = useTranslation();

  const allIcons = [
    {
      url: "icons/Tourmap.svg",
      label: "tourMap",
      to: "/TourMap",
      Device: userType === "guest" ? "All" : "Mobile",
      allowedFor: ["tourist", "guest"],
      tourClass: "side-button-map", // Tour target
    },
    {
      url: "icons/Itineraries.svg",
      label: "createItinerary",
      to: "/CreateItinerary",
      Device: "All",
      allowedFor: ["tourist"],
      tourClass: "side-button-itinerary", // Tour target
    },
    {
      url: "icons/Photobooth.svg",
      label: "photobooth",
      to: "/Photobooth",
      Device: "Mobile",
      allowedFor: ["tourist", "guest"],
      tourClass: "side-button-photobooth", // Tour target
    },
    {
      url: "icons/Hotlines.svg",
      label: "hotlines",
      to: "/Emergency",
      Device: "Mobile",
      allowedFor: ["tourist", "guest"],
      tourClass: "side-button-emergency", // Tour target
    },
    {
      url: "icons/Profile.svg",
      label: "profile",
      to: userType === "guest" ? "/GuestProfile" : "/Profile",
      Device: "All",
      allowedFor: ["tourist", "guest"],
      tourClass: "side-button-profile", // Tour target
    },
    {
      url: "icons/TripArchives.svg",
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

        return (
          <Link
            to={icon.to}
            key={index}
            className={`${visibilityClass} ${icon.tourClass || ''} flex flex-col items-center group`}
          >
            <div
              className="w-14 h-14 max-[375px]:w-11 max-[375px]:h-11
                     sm:w-18 sm:h-18 lg:w-18 lg:h-18
                     rounded-full bg-yellow-400 flex items-center justify-center
                     shadow-lg hover:shadow-yellow-300/50 hover:scale-110
                     transition-transform duration-300 ease-out"
            >
              <img
                src={icon.url}
                alt={`icon-${index}`}
                className="w-7 h-7 max-[375px]:w-5 max-[375px]:h-5 sm:w-9 sm:h-9 lg:w-9 lg:h-9 object-contain"
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
