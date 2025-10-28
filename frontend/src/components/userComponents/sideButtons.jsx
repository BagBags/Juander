import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SideButtons({ userType = "tourist" }) {
  const { t } = useTranslation();

  const allIcons = [
    { url: "icons/Home.svg", label: "home", to: "/Homepage", Device: "All", allowedFor: ["tourist"] },
    {
      url: "icons/Tourmap.svg",
      label: "tourMap",
      to: "/TourMap",
      Device: userType === "guest" ? "All" : "Mobile", // Guests see on all devices, tourists only on mobile
      allowedFor: ["tourist", "guest"],
    },
    {
      url: "icons/Itineraries.svg",
      label: "createItinerary",
      to: "/CreateItinerary",
      Device: "All",
      allowedFor: ["tourist"],
    },
    {
      url: "icons/Photobooth.svg",
      label: "photobooth",
      to: "/Photobooth",
      Device: "Mobile",
      allowedFor: ["tourist", "guest"],
    },
    {
      url: "icons/Hotlines.svg",
      label: "hotlines",
      to: "/Emergency",
      Device: "Mobile",
      allowedFor: ["tourist", "guest"],
    },
    {
      url: "icons/Profile.svg",
      label: "profile",
      to: userType === "guest" ? "/GuestProfile" : "/Profile",
      Device: "All",
      allowedFor: ["tourist", "guest"],
    },
    {
      url: "icons/TripArchives.svg",
      label: "tripArchives",
      to: "/TripArchive",
      Device: "All",
      allowedFor: ["tourist"],
    },
  ];

  // Filter icons based on userType
  const icons = allIcons.filter(icon => icon.allowedFor.includes(userType));

  return (
    <div
      className="fixed top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50
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
            className={`${visibilityClass} flex flex-col items-center group`}
          >
            <div
              className="w-16 h-16 max-[375px]:w-12 max-[375px]:h-12
                     sm:w-20 sm:h-20 lg:w-20 lg:h-20
                     rounded-full bg-yellow-400 flex items-center justify-center
                     shadow-lg hover:shadow-yellow-300/50 hover:scale-110
                     transition-transform duration-300 ease-out"
            >
              <img
                src={icon.url}
                alt={`icon-${index}`}
                className="w-8 h-8 max-[375px]:w-6 max-[375px]:h-6 sm:w-10 sm:h-10 lg:w-10 lg:h-10 object-contain"
              />
            </div>

            <span
              className="text-xs sm:text-sm lg:text-base text-white mt-2 font-semibold
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
