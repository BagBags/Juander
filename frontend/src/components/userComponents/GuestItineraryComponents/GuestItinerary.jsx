import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import GuestItineraryMain from "./GuestItineraryMain";
import BackHeader from "../BackButton";
import PullToRefresh from "../../shared/PullToRefresh";

export default function GuestItinerary() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = async () => {
    setRefreshKey((prev) => prev + 1);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

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
      className="min-h-screen bg-[#f04e37] relative overflow-hidden"
      style={{
        overscrollBehavior: "none",
        touchAction: "pan-y",
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <BackHeader
        title={<span className="text-white">Available Itineraries</span>}
        className="text-white"
      />

      {/* Main Content */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="flex flex-col items-center justify-center pt-6 px-4 md:px-0">
          <div className="flex-1 max-w-6xl w-full flex flex-col gap-4">
            <GuestItineraryMain key={refreshKey} />
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}
