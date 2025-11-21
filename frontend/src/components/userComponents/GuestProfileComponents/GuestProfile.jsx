// GuestProfilePage.jsx
import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaBirthdayCake,
  FaVenusMars,
  FaUserCircle,
  FaTiktok,
} from "react-icons/fa";
import { MdLanguage, MdSettings } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp } from "react-icons/io5";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaXTwitter } from "react-icons/fa6";
import PullToRefresh from "../../shared/PullToRefresh";
import { useTour } from "../../TourComponents/TourContext";
import { getGuestProfileTourStatus } from "../../../utils/tourApi";

export default function GuestProfilePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  // Load guest language preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("guestLanguage");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  const handleRefresh = async () => {
    setRefreshKey((prev) => prev + 1);
    const savedLang = localStorage.getItem("guestLanguage");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

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
      label: t("Settings") || "Settings",
      to: "/GuestProfile/GuestSettings",
      disabled: false,
    },
  ];

  const handleLogout = () => {
    // Clear localStorage for guest users
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("guest");
    localStorage.removeItem("guestLanguage");
    localStorage.removeItem("guestHideFortSantiagoModal");
    localStorage.removeItem("guestReplayTutorial");
    // Also clear any guest-related data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("guest_")) {
        localStorage.removeItem(key);
      }
    });
    // Clear sessionStorage as well
    sessionStorage.clear();
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

      <PullToRefresh onRefresh={handleRefresh}>
      <GuestProfileTourAutostart />
      <div className="w-full max-w-md relative z-10" key={refreshKey}>
        {/* Profile Card */}
        <div className="mt-4 w-full bg-gradient-to-br from-[#f04e37] to-[#d9442f] rounded-3xl p-8 flex items-center text-white gap-6 shadow-2xl relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative w-28 h-28 z-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-pulse"></div>
            <div className="w-full h-full rounded-full border-4 border-white flex items-center justify-center shadow-2xl relative">
              <FaUserCircle className="w-20 h-20 text-white" />
            </div>
          </div>

          <div className="z-10">
            <p className="text-sm text-white/80 mb-1">{t("greetings")}</p>
            <h1 className="text-3xl font-bold leading-tight mb-1">
              Guest User
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <FaUser className="text-xs text-white" />
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
                  <span className="font-semibold text-gray-400">
                    {opt.label}
                  </span>
                </div>
                <IoChevronForwardSharp className="text-gray-300" />
              </div>
            ) : (
              <Link
                key={index}
                to={opt.to}
                className={`flex items-center justify-between px-5 py-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 group border border-gray-100 ${
                  opt.to.endsWith('/GuestLanguage') ? 'guest-option-language' :
                  opt.to.endsWith('/GuestSettings') ? 'guest-option-settings' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#f04e37] to-[#d9442f] rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-xl">{opt.icon}</span>
                  </div>
                  <span className="font-semibold text-gray-800 group-hover:text-[#f04e37] transition-colors">
                    {opt.label}
                  </span>
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
          className="mt-8 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 guest-create-account-btn"
        >
          {t("createAccount")}
        </button>

        {/* Social Media Icons */}
        <div className="mt-12 mb-4 flex items-center justify-center gap-4">
          <a
            href="https://www.facebook.com/share/17YomjzorW/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a
            href="https://www.instagram.com/intramurosph?igsh=MXUwb3o0YTBkN3cycw=="
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://www.tiktok.com/@intramurosph?_r=1&_t=ZS-91HcteutvZR"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="TikTok"
          >
            <FaTiktok className="w-5 h-5" />
          </a>
          <a
            href="https://youtube.com/@intramurosadministration?si=NxzDejo3UOFWI6x3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="YouTube"
          >
            <Youtube className="w-5 h-5" />
          </a>
          <a
            href="https://www.linkedin.com/company/intramuros-administration/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </a>
          <a
            href="https://x.com/intramuros?s=21"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="X"
          >
            <FaXTwitter className="w-5 h-5" />
          </a>
        </div>

        {/* Footer */}
        <p className="mb-8 text-xs text-center text-gray-400">
          © {new Date().getFullYear()} {t("intramurosAdmin")}. Developed by UST
          College of Information and Computing Sciences.
        </p>
      </div>
      </PullToRefresh>
    </motion.div>
  );
}

function GuestProfileTourAutostart() {
  const { startTour, isTourRunning } = useTour();
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (started) return;
    const flag = localStorage.getItem("guestProfileTourForceStart") === "true";
    if (flag && !isTourRunning) {
      setStarted(true);
      setTimeout(() => { startTour(); }, 500);
    }
  }, [startTour, isTourRunning, started]);
  return null;
}
