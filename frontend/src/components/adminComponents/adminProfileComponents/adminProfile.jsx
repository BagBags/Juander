import React, { useEffect, useState } from "react";
import { FaUser, FaBirthdayCake, FaVenusMars } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function AdminProfile() {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setCurrentAdmin(JSON.parse(stored));
  }, []);

  const options = [
    { icon: <FaUser />, label: "Account", to: "/AdminProfile/Account" },
    {
      icon: <FaBirthdayCake />,
      label: "Birthday",
      to: "/AdminProfile/Birthday",
    },
    { icon: <FaVenusMars />, label: "Gender", to: "/AdminProfile/Gender" },
    {
      icon: <GiEarthAsiaOceania />,
      label: "Country",
      to: "/AdminProfile/Country",
    },
    { icon: <MdLanguage />, label: "Language", to: "/AdminProfile/Language" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
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
              currentAdmin?.profileImage || "https://i.pravatar.cc/100?img=1"
            }
            alt="Admin"
            className="w-30 h-30 rounded-full border-4 border-white object-cover mr-6"
          />
          <div>
            <p className="text-base">Welcome back!</p>
            <h1 className="text-3xl font-bold leading-tight">
              {currentAdmin
                ? `${currentAdmin.firstName} ${currentAdmin.lastName}`
                : "Admin"}
            </h1>
          </div>
        </div>

        {/* Options */}
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="absolute bottom-30 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-[#f04e37] text-white font-semibold py-4 rounded-xl shadow-md hover:bg-[#b42c21] transition-colors"
        >
          Log out
        </button>

        <p className="mt-80 md:mt-30 text-xs text-center text-[#cf3325] opacity-70">
          ©2025 Intramuros Administration
        </p>
      </div>
    </motion.div>
  );
}
