import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import BackHeader from "../BackHeader";
import { useTranslation } from "react-i18next";

export default function ProfileLayout() {
  const location = useLocation();
  const { t } = useTranslation();

  const getTitle = () => {
    if (location.pathname.endsWith("/Account")) return t("account");
    if (location.pathname.endsWith("/Birthday")) return t("birthday");
    if (location.pathname.endsWith("/Gender")) return t("gender");
    if (location.pathname.endsWith("/Country")) return t("country");
    if (location.pathname.endsWith("/Language")) return t("language");
    if (location.pathname.endsWith("/Settings")) return "Settings";
    return t("profile");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-sm relative">
      {/* BackHeader with safe-area support */}
      <div 
        className="sticky top-0 z-20 bg-white border-b border-gray-200"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 16px)",
          paddingBottom: "8px",
          paddingLeft: "16px",
          paddingRight: "16px"
        }}
      >
        <BackHeader title={getTitle()} />
      </div>

      {/* Centered page content */}
      <div className="flex-1 flex justify-center px-4 md:px-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="w-full max-w-md mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
