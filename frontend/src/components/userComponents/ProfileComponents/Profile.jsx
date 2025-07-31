import React from "react";
import { FaUser, FaBirthdayCake, FaVenusMars } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { IoChevronForwardSharp } from "react-icons/io5";

export default function ProfilePage() {
  const options = [
    { icon: <FaUser />, label: "Account" },
    { icon: <FaBirthdayCake />, label: "Birthday" },
    { icon: <FaVenusMars />, label: "Gender" },
    { icon: <GiEarthAsiaOceania />, label: "Country" },
    { icon: <MdLanguage />, label: "Language" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center text-sm relative">
      {/* Back + Title */}
      <div className="w-full px-4 pt-4 flex items-center">
        <span className="text-xl font-bold">&lt;</span>
        <h1 className="ml-2 font-bold text-xl">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="mt-4 w-11/12 bg-red-600 rounded-2xl p-4 flex flex-col items-center text-white">
        <img
          src="https://via.placeholder.com/100"
          alt="Profile"
          className="w-20 h-20 rounded-full border-4 border-white object-cover"
        />
        <p className="mt-2 text-sm">Mabuhay!</p>
        <h2 className="text-xl font-bold leading-tight">John Santos</h2>
      </div>

      {/* Option Buttons */}
      <div className="mt-4 w-11/12 space-y-2">
        {options.map((opt, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-4 py-3 bg-red-600 rounded-xl text-white"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{opt.icon}</span>
              <span>{opt.label}</span>
            </div>
            <IoChevronForwardSharp />
          </div>
        ))}
      </div>

      {/* Intramuros Illustration (Static background) */}
      <div className="w-full mt-6 relative">
        <img
          src="your-intramuros-image.png" // replace with your illustration
          alt="Intramuros"
          className="w-full object-contain"
        />
      </div>

      {/* Logout Button */}
      <button className="absolute bottom-20 bg-red-600 text-white font-semibold px-10 py-3 rounded-full shadow-md">
        Log out
      </button>

      {/* Footer */}
      <p className="mt-10 text-xs text-center text-white opacity-70">
        ©2025 Intramuros Administration
      </p>
    </div>
  );
}
