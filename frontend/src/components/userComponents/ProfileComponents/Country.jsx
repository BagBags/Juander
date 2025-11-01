import React, { useState, useEffect } from "react";
import { countries } from "countries-list";
import { motion } from "framer-motion";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function CountrySelector() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(""); // store country code
  const [loading, setLoading] = useState(false);

  // Fetch current user's country on mount
  useEffect(() => {
    document.body.style.overflow = "hidden";

    const fetchUserCountry = async () => {
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.country) {
          // store country code instead of name for consistency
          const found = Object.entries(countries).find(
            ([, info]) => info.name === res.data.country
          );
          if (found) setSelected(found[0]); // country code
        }
      } catch (err) {
        console.error("Error fetching user:", err.response?.data || err);
      }
    };

    fetchUserCountry();

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Filtered country list
  const countryArray = Object.entries(countries)
    .map(([code, info]) => ({ code, name: info.name }))
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    if (!selected) {
      alert(
        t("selectCountryFirst") || "Please select a country before saving."
      );
      return;
    }

    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
      alert(t("notLoggedIn") || "You are not logged in.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/country`,
        { country: countries[selected].name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(t("countrySavedSuccess") || "Country saved successfully!");
    } catch (error) {
      console.error("Error saving country:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          t("countrySaveFailed") ||
          "Failed to save country"
      );
    } finally {
      setLoading(false);
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
      {/* Header and Search */}
      <div className="p-4 shrink-0">
        <h2 className="text-center text-lg font-semibold mb-4">
          {t("changeCountry") || "Change Country"}
        </h2>
        <input
          type="text"
          placeholder={t("search") || "Search"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
        />
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-4">
        {countryArray.map((c) => (
          <button
            key={c.code}
            onClick={() => setSelected(c.code)}
            className={`w-full flex items-center justify-between py-3 border-b transition ${
              selected === c.code
                ? "bg-red-50 border-[#cf3325]"
                : "border-gray-200"
            }`}
          >
            <span className="flex items-center gap-3">
              <img
                src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                alt={`${c.name} flag`}
                className="w-6 h-4 object-cover rounded-sm"
              />
              <span>{c.name}</span>
            </span>
            {selected === c.code && (
              <span className="text-[#cf3325] font-medium">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Sticky Footer */}
      <div className="pb-7 pt-3 text-center text-sm text-gray-500 border-t shrink-0 flex flex-col items-center gap-2">
        <div>
          {t("selectedCountry") || "Selected Country"}:{" "}
          {selected ? (
            <span className="inline-flex items-center gap-2 font-medium text-black">
              <img
                src={`https://flagcdn.com/w40/${selected.toLowerCase()}.png`}
                alt={`${countries[selected].name} flag`}
                className="w-6 h-4 object-cover rounded-sm"
              />
              {countries[selected].name}
            </span>
          ) : (
            <span className="font-medium text-black">
              {t("none") || "None"}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-2 px-6 py-2 rounded-lg bg-[#cf3325] text-white font-medium hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? t("saving") || "Saving..." : t("save") || "Save"}
        </button>
      </div>
    </motion.div>
  );
}
