import React, { useEffect, useState } from "react";
import { FaUser, FaBirthdayCake, FaVenusMars } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import BackHeader from "./BackHeader"; // Adjust path if needed

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
    };

    // Initial load
    loadUser();

    // Listen for changes from Account.jsx
    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const options = [
    { icon: <FaUser />, label: t("account"), to: "/Profile/Account" },
    { icon: <FaBirthdayCake />, label: t("birthday"), to: "/Profile/Birthday" },
    { icon: <FaVenusMars />, label: t("gender"), to: "/Profile/Gender" },
    {
      icon: <GiEarthAsiaOceania />,
      label: t("country"),
      to: "/Profile/Country",
    },
    { icon: <MdLanguage />, label: t("language"), to: "/Profile/Language" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
            src={
              currentUser?.profilePicture || "https://i.pravatar.cc/100?img=68"
            }
            alt="Profile"
            className="w-30 h-30 rounded-full border-4 border-white object-cover mr-6"
          />
          <div>
            <p className="text-base">{t("welcome")}</p>
            <h1 className="text-3xl font-bold leading-tight">
              {currentUser
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : t("guest")}
            </h1>
          </div>
        </div>

        {/* Option Buttons */}
        <div className="mt-4 w-full space-y-2">
          {options.map((opt, index) => (
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
          ))}
        </div>

        {/* Intramuros Illustration */}
        <div className="w-full mt-6 relative">
          <img
            src="your-intramuros-image.png"
            alt="Intramuros"
            className="w-full object-contain"
          />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute bottom-30 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-[#f04e37] text-white font-semibold py-4 rounded-xl shadow-md hover:bg-[#b42c21] transition-colors"
        >
          {t("logout")}
        </button>

        {/* Footer */}
        <p className="mt-80 md:mt-30 text-xs text-center text-[#cf3325] opacity-70">
          ©2025 {t("intramurosAdmin")}
        </p>
      </div>
    </motion.div>
  );
}
