// GuestLanguage.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function GuestLanguage() {
  const languages = [
    { name: "English", code: "gb" },
    { name: "Tagalog", code: "ph" },
  ];

  const [selected, setSelected] = useState("");

  // Load saved language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("guestLanguage");
    if (savedLang) {
      setSelected(savedLang);
    }
  }, []);

  const handleSave = () => {
    if (!selected) return;
    localStorage.setItem("guestLanguage", selected);
    alert(`Language set to ${selected}`);
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-[calc(100dvh-4rem)] bg-white"
    >
      {/* Main content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-6">Choose Language</h2>

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
      </div>

      {/* Bottom fixed button */}
      <div className="p-6 border-t bg-white">
        <button
          onClick={handleSave}
          disabled={!selected}
          className={`w-full py-3 rounded-md text-white font-semibold ${
            selected
              ? "bg-[#cf3325]"
              : "bg-[#b42c21] opacity-70 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
