import React, { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function Language() {
  const languages = [
    {
      name: "English",
      code: "gb",
    },
    {
      name: "Tagalog",
      code: "ph",
    },
  ];

  const [selected, setSelected] = useState("");

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }} // start from left
      animate={{ x: 0, opacity: 1 }} // animate to center
      exit={{ x: "100%", opacity: 0 }} // exit to right
      transition={{ duration: 0.4 }}
      className="flex flex-col h-[calc(100dvh-4rem)] bg-white"
    >
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">Step 2 of 4</p>
        <h2 className="text-xl font-semibold mb-2">Choose Language</h2>
        <p className="text-sm text-gray-500 mb-6">
          you want to learn and master it
        </p>

        <div className="grid grid-cols-2 gap-6">
          {languages.map((lang) => (
            <button
              key={lang.name}
              onClick={() => setSelected(lang.name)}
              className={`flex flex-col items-center border rounded-xl px-4 py-4 ${
                selected === lang.name
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <img
                src={`https://flagcdn.com/w80/${lang.code}.png`}
                alt={lang.name}
                className="w-12 h-8 mb-2 rounded"
              />
              <span className="text-sm font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={!selected}
        className={`w-full mt-auto py-3 rounded-md text-white font-semibold ${
          selected ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        Continue
      </button>
    </motion.div>
  );
}
