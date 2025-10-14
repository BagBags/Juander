// GuestLanguage.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function GuestLanguage() {
  const { t, i18n } = useTranslation();

  const languages = [
    { label: "English", code: "gb", lng: "en" },
    { label: "Tagalog", code: "ph", lng: "tl" },
  ];

  const [selected, setSelected] = useState("");

  // Load saved language on mount from sessionStorage
  useEffect(() => {
    const savedLang = sessionStorage.getItem("guestLanguage");
    if (savedLang) {
      setSelected(savedLang);
      i18n.changeLanguage(savedLang);
    } else {
      // Default to current i18n language
      setSelected(i18n.language);
    }
  }, [i18n]);

  const handleSave = () => {
    if (!selected) return;
    // Use sessionStorage for guest users
    sessionStorage.setItem("guestLanguage", selected);
    // Change language immediately in frontend using i18n
    i18n.changeLanguage(selected);
    alert(`Language set to ${selected === "en" ? "English" : "Tagalog"}`);
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
          <h2 className="text-xl font-semibold mb-6">{t("chooseLanguage")}</h2>

          <div className="grid grid-cols-2 gap-6">
            {languages.map((lang) => (
              <button
                key={lang.lng}
                onClick={() => setSelected(lang.lng)}
                className={`flex flex-col items-center border rounded-xl px-4 py-4 ${
                  selected === lang.lng
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <img
                  src={`https://flagcdn.com/w80/${lang.code}.png`}
                  alt={lang.label}
                  className="w-12 h-8 mb-2 rounded"
                />
                <span className="text-sm font-medium">{lang.label}</span>
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
            selected ? "bg-[#cf3325]" : "bg-[#b42c21]"
          }`}
        >
          {t("continue")}
        </button>
      </div>
    </motion.div>
  );
}
