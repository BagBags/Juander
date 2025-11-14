// GuestProfilePage.jsx
import React, { useEffect } from "react";
import { FaUser, FaBirthdayCake, FaVenusMars } from "react-icons/fa";
import { MdLanguage, MdSettings } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function GuestProfilePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Load guest language preference on mount
  useEffect(() => {
    const savedLang = sessionStorage.getItem("guestLanguage");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  const options = [
    {
      icon: <FaUser />,
      label: t("account"),
      to: "/Profile/Account",
      disabled: true,
    },
    {
      icon: <FaBirthdayCake />,
      label: t("birthday"),
      to: "/Profile/Birthday",
      disabled: true,
    },
    {
      icon: <FaVenusMars />,
      label: t("gender"),
      to: "/Profile/Gender",
      disabled: true,
    },
    {
      icon: <GiEarthAsiaOceania />,
      label: t("country"),
      to: "/Profile/Country",
      disabled: true,
    },
    {
      icon: <MdLanguage />,
      label: t("language"),
      to: "/GuestProfile/GuestLanguage",
      disabled: false,
    },
    {
      icon: <MdSettings />,
      label: t("settings") || "Settings",
      to: "/GuestProfile/GuestSettings",
      disabled: false,
    },
  ];

  const handleLogout = () => {
    // Clear sessionStorage for guest users
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("guest");
    // Also clear any guest-related data
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith("guest_")) {
        sessionStorage.removeItem(key);
      }
    });
    navigate("/"); // Redirect to login/homepage
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen bg-gray-50 flex flex-col items-center text-sm relative px-4 md:px-0"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 16px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f04e37]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Profile Card */}
        <div className="mt-4 w-full bg-gradient-to-br from-[#f04e37] to-[#d9442f] rounded-3xl p-8 flex items-center text-white gap-6 shadow-2xl relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative w-28 h-28 z-10">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-pulse"></div>
            <img
              src={"https://i.pravatar.cc/200?img=12"}
              alt="Guest Profile"
              className="w-full h-full rounded-full border-4 border-white object-cover shadow-2xl relative"
            />
          </div>
          
          <div className="z-10">
            <p className="text-sm text-white/80 mb-1">{t("greetings")}</p>
            <h1 className="text-3xl font-bold leading-tight mb-1">Guest User</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
              <p className="text-xs text-white/80">Exploring Mode</p>
            </div>
          </div>
        </div>

        {/* Option Buttons */}
        <div className="mt-6 w-full space-y-3">
          {options.map((opt, index) =>
            opt.disabled ? (
              <div
                key={index}
                className="flex items-center justify-between px-5 py-4 bg-white/60 rounded-2xl shadow-sm border border-gray-200 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 shadow-sm">
                    <span className="text-xl">{opt.icon}</span>
                  </div>
                  <span className="font-semibold text-gray-400">{opt.label}</span>
                </div>
                <IoChevronForwardSharp className="text-gray-300" />
              </div>
            ) : (
              <Link
                key={index}
                to={opt.to}
                className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 group border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#f04e37] to-[#d9442f] rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-xl">{opt.icon}</span>
                  </div>
                  <span className="font-semibold text-gray-800 group-hover:text-[#f04e37] transition-colors">{opt.label}</span>
                </div>
                <IoChevronForwardSharp className="text-gray-400 group-hover:text-[#f04e37] group-hover:translate-x-1 transition-all" />
              </Link>
            )
          )}
        </div>

        {/* Create an Account Button */}
        <button
          onClick={() => {
            // Clear all sessionStorage when creating an account
            sessionStorage.clear();
            navigate("/");
          }}
          className="mt-8 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200"
        >
          {t("createAccount")}
        </button>

        {/* Footer */}
        <p className="mt-12 mb-8 text-xs text-center text-gray-400">
          © 2025 Intramuros Administration. All rights reserved.
        </p>
      </div>
    </motion.div>
  );
}
