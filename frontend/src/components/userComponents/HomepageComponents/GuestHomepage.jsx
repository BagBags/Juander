import React from "react";
import LogoHeader from "./logoHeader";
import { Link, useNavigate } from "react-router-dom";
import FloatingChatbot from "../ChatbotComponents/FloatingChatbot";

export default function GuestHomepage() {
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
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 lg:px-10 relative"
      style={{
        backgroundImage: "url('/JuanderBGWeb.svg')",
        backgroundColor: "#f04e37",
      }}
    >
      {/* Logo Header */}
      <div className="w-full mt-10 flex justify-center px-4">
        <LogoHeader />
      </div>

      {/* Title */}
      <div className="mt-22 sm:mt-26 text-center relative z-10">
        <h3 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white">
          Welcome To Intramuros!
        </h3>
      </div>

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
              state={{ from: "/GuestHomepage" }}
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

      {/* Explore Button (Mobile Only) */}
      <button
        onClick={() => navigate("/GuestItinerary")}
        className="absolute bottom-10 lg:top-[83%] lg:bottom-auto 
        left-1/2 -translate-x-1/2
        bg-white text-black font-semibold shadow-md rounded-lg sm:rounded-xl lg:rounded-2xl 
        w-40 sm:w-40 lg:w-52 
        h-12 sm:h-12 lg:h-14 
        text-sm sm:text-base lg:text-lg 
        hover:bg-yellow-500 focus:outline-none transition duration-200
        block md:hidden"
      >
        Explore
      </button>

      {/* Sign Up to Explore Button (Desktop Only) */}
      <button
        onClick={() => navigate("/login")}
        className="absolute bottom-10 lg:top-[83%] lg:bottom-auto 
        left-1/2 -translate-x-1/2
        bg-white text-black font-semibold shadow-md rounded-lg sm:rounded-xl lg:rounded-2xl 
        w-40 sm:w-40 lg:w-52 
        h-12 sm:h-12 lg:h-14 
        text-sm sm:text-base lg:text-lg 
        hover:bg-yellow-500 focus:outline-none transition duration-200
        hidden md:block"
      >
        Sign up to Explore
      </button>

      {/* Floating Chatbot (Juan Mascot) */}
      <FloatingChatbot />
    </div>
  );
}
