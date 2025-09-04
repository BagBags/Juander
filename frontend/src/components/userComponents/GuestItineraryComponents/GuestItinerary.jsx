import React from "react";
import { Link, useNavigate } from "react-router-dom";

import GuestItineraryMain from "./GuestItineraryMain";
import BackHeader from "../BackButton";

export default function GuestItinerary() {
  const navigate = useNavigate();

  const icons = [
    {
      url: "icons/Tourmap.svg",
      label: "Tour Map",
      to: "/TourMap",
      device: "All",
    },
    {
      url: "icons/Profile.svg",
      label: "Profile",
      to: "/GuestProfile",
      device: "All",
    },
    // Mobile-only
    {
      url: "icons/Photobooth.svg",
      label: "Photobooth",
      to: "/Photobooth",
      device: "Mobile",
    },

    {
      url: "icons/Hotlines.svg",
      label: "Hotlines",
      to: "/Emergency",
      device: "Mobile",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f04e37] relative">
      {/* Side Buttons */}
      <div className="fixed right-2 md:right-2 lg:right-8 top-[50%] md:top-[60%] -translate-y-1/2 flex flex-col gap-6 z-50">
        {icons.map((icon, index) => {
          let visibilityClass = "";
          if (icon.device === "Mobile") {
            visibilityClass = "block md:hidden";
          } else if (icon.device === "Desktop") {
            visibilityClass = "hidden md:block";
          } else {
            visibilityClass = "block";
          }

          return (
            <Link
              to={icon.to}
              state={{ from: "/GuestItinerary" }}
              key={index}
              className={`${visibilityClass} flex flex-col items-center group`}
            >
              {/* ✅ Bigger circles w/ responsive sizes */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-yellow-400 flex items-center justify-center shadow-md hover:bg-yellow-500 transition">
                {/* ✅ Icons also scale with circle */}
                <img
                  src={icon.url}
                  alt={icon.label}
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain"
                />
              </div>
              <span className="text-xs sm:text-sm lg:text-base text-white mt-1 group-hover:underline">
                {icon.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Back Header */}
      <div className="sticky top-0 z-10 bg-[#f04e37] p-4">
        <BackHeader
          title={<span className="text-white">Available Itineraries</span>}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center pt-6 px-4 md:px-0">
        <div className="flex-1 max-w-6xl w-full flex flex-col gap-4">
          <GuestItineraryMain />
        </div>
      </div>
    </div>
  );
}
