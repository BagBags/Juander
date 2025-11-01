import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaMars, FaVenus, FaGenderless } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function Gender() {
  const { t } = useTranslation();

  const [selected, setSelected] = useState(""); // store key: "male", "female", "other"
  const [message, setMessage] = useState("");

  // Gender options with keys and icons
  const options = [
    { key: "male", icon: <FaMars className="text-blue-600 text-xl" /> },
    { key: "female", icon: <FaVenus className="text-pink-500 text-xl" /> },
    {
      key: "other",
      icon: <FaGenderless className="text-purple-500 text-xl" />,
    },
  ];

  // Fetch gender on mount
  useEffect(() => {
    const fetchGender = async () => {
      try {
        const token =
          sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) return;

        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.gender) {
          // convert "Male" => "male", "Female" => "female", "Other" => "other"
          setSelected(data.gender.toLowerCase());
        }
      } catch (err) {
        console.error("Error fetching gender:", err.response?.data || err);
      }
    };

    fetchGender();
  }, []);

  const handleSave = async () => {
    try {
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        setMessage(t("notLoggedIn"));
        return;
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/gender`,
        { gender: selected.charAt(0).toUpperCase() + selected.slice(1) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(t("genderSavedSuccess"));
      console.log("Updated User:", res.data);
    } catch (err) {
      console.error("Error saving gender:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || t("genderSaveFailed"));
    }
  };

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
        <div className="text-center">
          <h2 className="text-lg font-semibold">{t("genderQuestion")}</h2>
        </div>

        <div className="flex flex-col gap-4">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              className={`flex justify-between items-center border px-4 py-3 rounded-xl shadow-sm transition
                ${
                  selected === opt.key
                    ? "border-[#cf3325] bg-red-50"
                    : "border-gray-300"
                }
              `}
            >
              <span className="font-medium">{t(opt.key)}</span>
              {opt.icon}
            </button>
          ))}
        </div>

        <button
          className="mt-6 bg-[#cf3325] hover:bg-[#b42c21] transition text-white py-3 rounded-xl font-semibold w-full"
          onClick={handleSave}
          disabled={!selected}
        >
          {t("save")}
        </button>

        {message && (
          <p className="text-center text-sm text-gray-600 mt-2">{message}</p>
        )}
      </div>
    </motion.div>
  );
}
