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
      {/* Back Header */}
      <div 
        className="sticky top-0 z-10 bg-[#f04e37]"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 16px)",
          paddingBottom: "8px",
          paddingLeft: "16px",
          paddingRight: "16px"
        }}
      >
        <BackHeader
          title={<span className="text-white">Available Itineraries</span>}
          className="text-white"
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
