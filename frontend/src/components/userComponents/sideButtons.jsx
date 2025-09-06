import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SideButtons() {
  const { t } = useTranslation();

  const icons = [
    { url: "icons/Home.svg", label: "home", to: "/Homepage", Device: "All" },
    {
      url: "icons/Tourmap.svg",
      label: "tourMap",
      to: "/TourMap",
      Device: "Mobile",
    },
    {
      url: "icons/Itineraries.svg",
      label: "createItinerary",
      to: "/CreateItinerary",
      Device: "All",
    },
    {
      url: "icons/Photobooth.svg",
      label: "photobooth",
      to: "/Photobooth",
      Device: "Mobile",
    },
    {
      url: "icons/Hotlines.svg",
      label: "hotlines",
      to: "/Emergency",
      Device: "Mobile",
    },
    {
      url: "icons/Profile.svg",
      label: "profile",
      to: "/Profile",
      Device: "All",
    },
    {
      url: "icons/TripArchives.svg",
      label: "tripArchives",
      to: "/TripArchive",
      Device: "All",
    },
  ];

  return (
    <div className="fixed right-2 md:right-2 lg:right-8 top-[50%] md:top-[60%] -translate-y-1/2 flex flex-col gap-6 z-50">
      {icons.map((icon, index) => {
        let visibilityClass = "";

        if (icon.Device === "Mobile") {
          visibilityClass = "block md:hidden";
        } else if (icon.Device === "All") {
          visibilityClass = "block";
        }

        return (
          <Link
            to={icon.to}
            state={{ from: "/Homepage" }}
            key={index}
            className={`${visibilityClass} flex flex-col items-center group`}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-yellow-400 flex items-center justify-center shadow-md hover:bg-yellow-500 transition">
              <img
                src={icon.url}
                alt={`icon-${index}`}
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain"
              />
            </div>
            <span className="text-xs sm:text-sm lg:text-base text-white mt-1 group-hover:underline">
              {t(icon.label)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
