import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import axios from "axios";
import { motion } from "framer-motion";
import NotificationModal from "../../shared/NotificationModal";

export default function Language() {
  const languages = [
    { name: "English", code: "en" },
  ];

  const [selected, setSelected] = useState("en");
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  // Fetch language on mount
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
          setSelected(data.language); // this is "en" or "tl"
        }
      } catch (err) {
        console.error("Error fetching language:", err.response?.data || err);
      }
    };

    fetchLanguage();
  }, []);

  const handleSave = async () => {
    try {
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");

      if (!token) {
        setNotification({ isOpen: true, type: 'error', title: 'Not Logged In', message: 'Please log in to save language preference.' });
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/language`,
        { language: selected }, // now "en" or "tl"
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotification({ isOpen: true, type: 'success', title: 'Success', message: 'Language preference saved successfully!' });
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
      className="flex flex-col h-[calc(100dvh-4rem)] bg-white"
    >
      {/* Main content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-6">Choose Language</h2>

          <div className="flex justify-center">
            {languages.map((lang) => (
              <div
                key={lang.code}
                className="flex flex-col items-center border border-blue-500 bg-blue-50 rounded-xl px-8 py-6 max-w-xs"
              >
                <img
                  src={`https://flagcdn.com/w80/gb.png`}
                  alt={lang.name}
                  className="w-16 h-12 mb-3 rounded"
                />
                <span className="text-base font-semibold">{lang.name}</span>
                <span className="text-xs text-gray-500 mt-1">Admin Language</span>
              </div>
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
          Continue
        </button>
      </div>
      
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </motion.div>
  );
}
