// GuestProfilePageBK.jsx - Backup with original design
import React, { useEffect } from "react";
import { FaUser, FaBirthdayCake, FaVenusMars } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function GuestProfilePageBK() {
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
      className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0"
    >
      <div className="w-full max-w-md">
        {/* Profile Card */}
        <div className="mt-4 w-full bg-[#f04e37] rounded-2xl p-6 flex items-center text-white">
          <img
            src={"https://i.pravatar.cc/100?img=12"}
            alt="Guest Profile"
            className="w-30 h-30 rounded-full border-4 border-white object-cover mr-6"
          />
          <div>
            <p className="text-base">{t("greetings")}</p>
            <h1 className="text-3xl font-bold leading-tight">Guest User</h1>
          </div>
        </div>

        {/* Option Buttons */}
        <div className="mt-4 w-full space-y-2">
          {options.map((opt, index) =>
            opt.disabled ? (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-4 bg-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{opt.icon}</span>
                  <span>{opt.label}</span>
                </div>
                <IoChevronForwardSharp />
              </div>
            ) : (
              <Link
                key={index}
                to={opt.to}
                className="flex items-center justify-between px-4 py-4 bg-[#f04e37] rounded-xl text-white hover:bg-[#b42c21] transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{opt.icon}</span>
                  <span>{opt.label}</span>
                </div>
                <IoChevronForwardSharp />
              </Link>
            )
          )}
        </div>

        {/* Intramuros Illustration */}
        <div className="w-full mt-6 relative">
          <img
            src="your-intramuros-image.png"
            alt="Intramuros"
            className="w-full object-contain"
          />
        </div>

        {/* Create an Account Button */}
        <button
          onClick={() => {
            // Clear all sessionStorage when creating an account
            sessionStorage.clear();
            navigate("/");
          }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-[#f04e37] text-white font-semibold py-4 rounded-xl shadow-md hover:bg-[#b42c21] transition-colors"
        >
          {t("createAccount")}
        </button>

        {/* Footer */}
        <p className="mt-80 md:mt-30 text-xs text-center text-[#cf3325] opacity-70">
          ©2025 Intramuros Administration
        </p>
      </div>
    </motion.div>
  );
}
