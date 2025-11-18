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
    <div
      className="bg-white flex flex-col text-sm relative"
      style={{
        // Lock layout to viewport to prevent body scroll bounce
        height: '100dvh',
        overflow: 'hidden',
        overscrollBehavior: 'none'
      }}
    >
      <BackHeader title={getTitle()} />

      {/* Centered page content; child handles its own scroll */}
      <div
        className="flex-1 flex justify-center px-4 md:px-0 overflow-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="w-full max-w-md mt-4 flex flex-col h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
