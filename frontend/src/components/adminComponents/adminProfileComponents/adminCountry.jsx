import React, { useState, useEffect } from "react";
import { countries } from "countries-list";
import { motion } from "framer-motion";
import axios from "axios";

export default function CountrySelector() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
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
          setSelected(res.data.country);
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

  const countryArray = Object.entries(countries)
    .map(([code, info]) => ({
      name: info.name,
      code: code,
    }))
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    if (!selected) {
      alert("Please select a country before saving.");
      return;
    }

    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
      alert("You are not logged in.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/country`,
        { country: selected },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Country saved successfully!");
    } catch (error) {
      console.error("Error saving country:", error.response?.data || error);
      alert(error.response?.data?.message || "Failed to save country");
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
          Change Country
        </h2>
        <input
          type="text"
          placeholder="Search"
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
            onClick={() => setSelected(c.name)}
            className={`w-full flex items-center justify-between py-3 border-b ${
              selected === c.name ? "bg-red-50" : ""
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
            {selected === c.name && (
              <span className="text-[#cf3325] font-medium">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Sticky Footer */}
      <div className="pb-7 pt-3 text-center text-sm text-gray-500 border-t shrink-0 flex flex-col items-center gap-2">
        <div>
          Selected Country:{" "}
          {selected ? (
            <span className="inline-flex items-center gap-2 font-medium text-black">
              <img
                src={`https://flagcdn.com/w40/${countryArray
                  .find((c) => c.name === selected)
                  ?.code.toLowerCase()}.png`}
                alt={`${selected} flag`}
                className="w-6 h-4 object-cover rounded-sm"
              />
              {selected}
            </span>
          ) : (
            <span className="font-medium text-black">None</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-2 px-6 py-2 rounded-lg bg-[#cf3325] text-white font-medium hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </motion.div>
  );
}
