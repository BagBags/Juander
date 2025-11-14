import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

export default function Birthday() {
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [year, setYear] = useState("");

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Fetch birthday on mount
  useEffect(() => {
    const fetchBirthday = async () => {
      try {
        const token =
          sessionStorage.getItem("token") || localStorage.getItem("token");

        if (!token) return;

        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.birthday) {
          const d = new Date(data.birthday);
          setMonth(months[d.getMonth()]);
          setDate(d.getDate().toString());
          setYear(d.getFullYear().toString());
        }
      } catch (err) {
        console.error("Error fetching birthday:", err.response?.data || err);
      }
    };

    fetchBirthday();
  }, []);

  const handleSave = async () => {
    try {
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");

      if (!token) {
        alert("Not logged in!");
        return;
      }

      if (!month || !date || !year) {
        alert("Please complete all fields.");
        return;
      }

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/birthday`,
        { month, date, year },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Birthday saved:", data);
      alert("Birthday saved successfully!");
    } catch (err) {
      console.error(
        "Error saving birthday:",
        err.response?.data || err.message
      );
      alert(err.response?.data?.message || "Failed to save birthday.");
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white flex flex-col items-center text-sm relative px-4 md:px-0"
    >
      <div className="w-full max-w-md mt-6 flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-center">
          What's your date of birth?
        </h2>

        <div className="flex justify-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
          >
            <option value="">Month</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Date"
            min="1"
            max="31"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-20 text-center focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
          />

          <input
            type="number"
            placeholder="Year"
            min="1900"
            max={new Date().getFullYear()}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-28 text-center focus:outline-none focus:ring-2 focus:ring-[#cf3325]"
          />
        </div>

        <button
          className="mt-4 bg-[#cf3325] hover:bg-[#b42c21] transition text-white py-3 rounded-xl font-semibold w-full"
          onClick={handleSave}
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
