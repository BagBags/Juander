import React from "react";
import { Link } from "react-router-dom";

export default function SideButtons() {
  const icons = [
      {
      url: "icons/tour-map.svg",
      label: "Home",
      to: "/Homepage",
      Device: "All",
    },
    {
      url: "icons/tour-map.svg",
      label: "Tour Map",
      to: "/TourMap",
      Device: "All",
    },
    {
      url: "icons/photobooth.svg",
      label: "Create Itinerary",
      to: "/CreateItinerary",
      Device: "All",
    }, // Adjust if you have a separate route later
    {
      url: "icons/photobooth.svg",
      label: "Photobooth",
      to: "/Photobooth",
      Device: "Mobile",
    },
    {
      url: "icons/photobooth.svg",
      label: "Hotlines",
      to: "/Emergency",
      Device: "Mobile",
    },
    {
      url: "icons/photobooth.svg",
      label: "Profile",
      to: "/Profile",
      Device: "All",
    }, // Placeholder, change if you have a Profile page
    {
      url: "icons/photobooth.svg",
      label: "Trip Archives",
      to: "/TripArchive",
      Device: "All",
    }, // Same here
  ];

  return (
    <div className="fixed right-2 md:right-2 lg:right-8 top-[50%] md:top-[60%] -translate-y-1/2 flex flex-col gap-4 z-50">
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
            key={index}
            className={`${visibilityClass} flex flex-col items-center group`}
          >
            <div className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center shadow-md hover:bg-yellow-500 transition">
              <img
                src={icon.url}
                alt={`icon-${index}`}
                className="w-7 h-7 object-contain"
              />
            </div>
            <span className="text-xs text-white mt-1 group-hover:underline">
              {icon.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
