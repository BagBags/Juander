import React from "react";
import { Link, useNavigate } from "react-router-dom";

import GuestItineraryMain from "./GuestItineraryMain";

export default function GuestItinerary() {
  const navigate = useNavigate();

  const icons = [
    {
      url: "icons/tour-map.svg",
      label: "Tour Map",
      to: "/TourMap",
      device: "All",
    },
    {
      url: "icons/chatbot.svg",
      label: "Chatbot",
      to: "/Chatbot",
      device: "Desktop",
    },
    {
      url: "icons/photobooth.svg",
      label: "Profile",
      to: "/GuestProfile",
      device: "All",
    },
    {
      url: "icons/photobooth.svg",
      label: "Photobooth",
      to: "/Photobooth",
      device: "Mobile",
    },
    {
      url: "icons/photobooth.svg",
      label: "Start Tour",
      to: "/GuestItinerary",
      device: "Mobile",
    },
    {
      url: "icons/photobooth.svg",
      label: "Hotlines",
      to: "/Emergency",
      device: "Mobile",
    },
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{
        backgroundColor: "#f04e37",
      }}
    >
      {/* Side Buttons */}
      <div className="fixed right-2 md:right-2 lg:right-8 top-[50%] md:top-[60%] -translate-y-1/2 flex flex-col gap-4 z-50">
        {icons.map((icon, index) => {
          let visibilityClass = "";
          if (icon.device === "Mobile") visibilityClass = "block md:hidden";
          else if (icon.device === "Desktop")
            visibilityClass = "hidden md:block";
          else visibilityClass = "block";

          return (
            <Link
              to={icon.to}
              state={{ from: "/GuestItinerary" }}
              key={index}
              className={`${visibilityClass} flex flex-col items-center group`}
            >
              <div className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center shadow-md hover:bg-yellow-500 transition">
                <img
                  src={icon.url}
                  alt={icon.label}
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

      {/* Main Content */}
      <GuestItineraryMain />
    </div>
  );
}
