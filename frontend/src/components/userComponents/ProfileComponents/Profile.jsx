import React from "react";
import { FaUser, FaBirthdayCake, FaVenusMars } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion"; // 🟢 Import motion
import BackHeader from "./Backheader"; // Adjust path if needed

export default function ProfilePage() {
  const options = [
    { icon: <FaUser />, label: "Account", to: "/Profile/Account" },
    { icon: <FaBirthdayCake />, label: "Birthday", to: "/Profile/Birthday" },
    { icon: <FaVenusMars />, label: "Gender", to: "/Profile/Gender" },
    { icon: <GiEarthAsiaOceania />, label: "Country", to: "/Profile/Country" },
    { icon: <MdLanguage />, label: "Language", to: "/Profile/Language" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }} // ⚡ Fast fade (0.25s)
      className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0"
    >
      <div className="w-full max-w-md">
        {/* Profile Card */}
        <div className="mt-4 w-full bg-[#cf3325] rounded-2xl p-6 flex items-center text-white">
          <img
            src="https://i.pravatar.cc/100?img=68"
            alt="Profile"
            className="w-30 h-30 rounded-full border-4 border-white object-cover mr-6"
          />
          <div>
            <p className="text-base">Mabuhay!</p>
            <h1 className="text-3xl font-bold leading-tight">John Santos</h1>
          </div>
        </div>

        {/* Option Buttons */}
        <div className="mt-4 w-full space-y-2">
          {options.map((opt, index) => (
            <Link
              key={index}
              to={opt.to}
              className="flex items-center justify-between px-4 py-4 bg-[#cf3325] rounded-xl text-white hover:bg-[#b42c21] transition"
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
        <button className="absolute bottom-30 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-[#cf3325] text-white font-semibold py-4 rounded-xl shadow-md">
          Log out
        </button>

        {/* Footer */}
        <p className="mt-80 md:mt-30 text-xs text-center text-[#cf3325] opacity-70">
          ©2025 Intramuros Administration
        </p>
      </div>
    </motion.div>
  );
}
