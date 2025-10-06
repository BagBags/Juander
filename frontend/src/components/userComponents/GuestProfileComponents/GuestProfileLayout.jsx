import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import BackHeader from "../BackHeader";

export default function ProfileLayout() {
  const location = useLocation();

  // Determine dynamic title based on current path
  const getTitle = () => {
    if (location.pathname.endsWith("/GuestLanguage")) return "GuestLanguage";
    return "GuestProfile";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-sm relative">
      {/* BackHeader pinned to the left */}
      <div className="sticky top-0 z-20 bg-white px-4 py-3 flex items-center">
        <BackHeader title={getTitle()} />
      </div>

      {/* Centered page content */}
      <div className="flex-1 flex justify-center px-4 md:px-0">
        <div className="w-full max-w-md mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
