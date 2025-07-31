import React, { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaMars, FaVenus, FaGenderless } from "react-icons/fa";

export default function Gender() {
  const [selected, setSelected] = useState("");

  const options = [
    { label: "Male", icon: <FaMars className="text-blue-600 text-xl" /> },
    { label: "Female", icon: <FaVenus className="text-pink-500 text-xl" /> },
    {
      label: "Other",
      icon: <FaGenderless className="text-purple-500 text-xl" />,
    },
  ];

  return (
    <motion.div
      key="gender"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0"
    >
      <div className="w-full max-w-md mt-6 flex flex-col gap-6">
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-lg font-semibold">Choose Your Gender</h2>
          <p className="text-gray-500 text-sm mt-1">
            Health-related insights and personalized recommendations are built
            based on your gender.
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-4">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSelected(opt.label)}
              className={`flex justify-between items-center border px-4 py-3 rounded-xl shadow-sm transition
                ${
                  selected === opt.label
                    ? "border-[#cf3325] bg-red-50"
                    : "border-gray-300"
                }
              `}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.icon}
            </button>
          ))}
        </div>

        {/* Save Button */}
        <button
          className="mt-6 bg-[#cf3325] hover:bg-[#b42c21] transition text-white py-3 rounded-xl font-semibold w-full"
          onClick={() => {
            console.log("Selected Gender:", selected);
          }}
          disabled={!selected}
        >
          Save
        </button>
      </div>

      <p className="mt-20 text-xs text-center text-[#cf3325] opacity-70">
        ©2025 Intramuros Administration
      </p>
    </motion.div>
  );
}
