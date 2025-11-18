import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import NotificationModal from "../../shared/NotificationModal";
import PullToRefresh from "../../shared/PullToRefresh";

export default function Language() {
  const { t, i18n } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  const languages = [
    { label: "English", code: "gb", lng: "en" },
    { label: "Tagalog", code: "ph", lng: "tl" },
  ];

  const [selected, setSelected] = useState("");
  const [notification, setNotification] = useState({ isOpen: false, title: "", message: "", type: "info" });

  // Fetch saved language from backend
  useEffect(() => {
    const fetchLanguage = async () => {
      try {
        const token =
          sessionStorage.getItem("token") || localStorage.getItem("token");

        if (!token) return;

        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.language) {
          setSelected(data.language); // directly store "en" or "tl"
          i18n.changeLanguage(data.language);
          localStorage.setItem("language", data.language); // sync to localStorage
        }
      } catch (err) {
        console.error("Error fetching language:", err.response?.data || err);
      }
    };

    fetchLanguage();
  }, [i18n]);

  const handleSave = async () => {
    try {
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");

      if (!token) {
        setNotification({ isOpen: true, title: "Authentication Required", message: "Not logged in!", type: "warning" });
        return;
      }

      // Save to backend
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/language`,
        { language: selected }, // 👈 save "en" or "tl"
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Change language immediately in frontend
      i18n.changeLanguage(selected);
      localStorage.setItem("language", selected);

      setNotification({ isOpen: true, title: "Success", message: "Language saved!", type: "success" });
    } catch (err) {
      console.error("Error saving language:", err.response?.data || err);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-full bg-white overflow-hidden"
    >
      <PullToRefresh onRefresh={async () => { setRefreshKey((prev) => prev + 1); await new Promise((r) => setTimeout(r, 1000)); }}>
      {/* Main content */}
      <div className="flex-1 px-6 py-8" key={refreshKey}>
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
      </PullToRefresh>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </motion.div>
  );
}
