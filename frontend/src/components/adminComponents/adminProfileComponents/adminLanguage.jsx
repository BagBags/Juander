import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import axios from "axios";
import { motion } from "framer-motion";

export default function Language() {
  const languages = [
    { name: "English", code: "en" },
    { name: "Tagalog", code: "tl" },
  ];

  const [selected, setSelected] = useState("");

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
        alert("Not logged in!");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/language`,
        { language: selected }, // now "en" or "tl"
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Language saved!");
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

          <div className="grid grid-cols-2 gap-6">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                className={`flex flex-col items-center border rounded-xl px-4 py-4 ${
                  selected === lang.code
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <img
                  src={`https://flagcdn.com/w80/${
                    lang.code === "en" ? "gb" : "ph"
                  }.png`}
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
            selected ? "bg-[#cf3325]" : "bg-[#b42c21]"
          }`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
