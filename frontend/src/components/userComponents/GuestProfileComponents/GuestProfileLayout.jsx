import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import BackHeader from "../BackButton";
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
    <div
      className="min-h-screen bg-white flex flex-col relative"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "100dvh",
        overflow: "hidden",
        overscrollBehavior: "none"
      }}
    >
      <BackHeader title={getTitle()}  />

      {/* Centered page content */}
      <div
        className="flex-1 flex justify-center px-4 md:px-0 overflow-y-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", WebkitOverflowScrolling: "touch" }}
      >
        <div className="w-full max-w-md mt-4 flex flex-col h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
