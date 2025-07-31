import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import BackHeader from "./Backheader";

export default function ProfileLayout() {
  const location = useLocation();

  // Determine dynamic title based on current path
  const getTitle = () => {
    if (location.pathname.endsWith("/Account")) return "Account";
    if (location.pathname.endsWith("/Birthday")) return "Birthday";
    if (location.pathname.endsWith("/Gender")) return "Gender";
    if (location.pathname.endsWith("/Country")) return "Country";
    if (location.pathname.endsWith("/Language")) return "Language";
    return "Profile";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0">
      <div className="w-full max-w-md">
        {/* Sticky back header (optional: add sticky effect) */}
        <div className="pt-4 z-10 bg-white sticky top-0">
          <BackHeader title={getTitle()} />
        </div>

        {/* Page content */}
        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
