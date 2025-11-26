import React, { useState, useEffect } from "react";
import { getAge } from "../../../utils/age";
import { motion } from "framer-motion";
import axios from "axios";

export default function Birthday() {
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [year, setYear] = useState("");
  const [parentalConsent, setParentalConsent] = useState(false);
  const [message, setMessage] = useState("");

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

  // Calculate max days in selected month (handles leap years)
  const getDaysInMonth = (monthShort, year) => {
    if (!monthShort) return 31;
    const monthIndex = months.indexOf(monthShort);
    if (monthIndex === -1) return 31;
    
    // Use provided year or current year for leap year calculation
    const yearToUse = year || new Date().getFullYear();
    return new Date(yearToUse, monthIndex + 1, 0).getDate();
  };

  // Fetch birthday on mount
  useEffect(() => {
    const fetchBirthday = async () => {
      try {
        const token =
          sessionStorage.getItem("token") || localStorage.getItem("token");

        if (!token) return;

        const { data } = await axios.get(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
          }/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

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
        setMessage("You are not logged in. Please login first.");
        return;
      }

      if (!month || !date || !year) {
        setMessage("Please complete all fields.");
        return;
      }

      // Validate date is valid for selected month
      const maxDays = getDaysInMonth(month, year);
      const dateNum = parseInt(date, 10);
      if (dateNum < 1 || dateNum > maxDays) {
        setMessage(`Invalid date. ${month} only has ${maxDays} days.`);
        return;
      }

      const age = getAge(year, months.indexOf(month), parseInt(date,10));
      if (age < 13) {
        setMessage("Users must be at least 13 years old.");
        return;
      }
      if (age < 18 && !parentalConsent) {
        setMessage("Parental consent required for users 13-17.");
        return;
      }

      const { data } = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
        }/auth/birthday`,
        { month, date, year, parentalConsent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Birthday saved:", data);
      setMessage("Birthday saved successfully!");
    } catch (err) {
      console.error(
        "Error saving birthday:",
        err.response?.data || err.message
      );
      setMessage(err.response?.data?.message || "Failed to save birthday.");
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
            max={month ? getDaysInMonth(month, year) : 31}
            value={date}
            onChange={(e) => {
              const value = e.target.value;
              const maxDays = month ? getDaysInMonth(month, year) : 31;
              // Only allow values within valid range
              if (value === "" || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= maxDays)) {
                setDate(value);
              }
            }}
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
        <label className="flex items-start gap-2 text-sm mt-2">
          <input
            type="checkbox"
            checked={parentalConsent}
            onChange={(e)=>setParentalConsent(e.target.checked)}
            className="mt-1 w-4 h-4 text-[#cf3325] border-gray-300 rounded focus:ring-[#cf3325] focus:ring-2"
          />
          <span>Parental consent (for 13-17&nbsp;yrs)</span>
        </label>

        <button
          className="mt-4 bg-[#cf3325] hover:bg-[#b42c21] transition text-white py-3 rounded-xl font-semibold w-full"
          onClick={handleSave}
        >
          Save
        </button>

        {message && (
          <p className="text-center text-sm text-gray-600 mt-2">{message}</p>
        )}
      </div>
      
    </motion.div>
  );
}
