import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import BackHeader from "../BackHeader";
import { useTranslation } from "react-i18next";

export default function ProfileLayout() {
  const location = useLocation();
  const { t } = useTranslation();

  // Determine dynamic title based on current path
  const getTitle = () => {
    if (location.pathname.endsWith("/GuestLanguage")) return t("language");
    return t("profile");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-sm relative">
      {/* BackHeader pinned to the left */}
      <div 
        className="sticky top-0 z-20 bg-white px-4 flex items-center"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 12px)",
          paddingBottom: "12px",
        }}
      >
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
